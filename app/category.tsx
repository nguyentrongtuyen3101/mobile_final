import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useCart } from './contexts/CartContext';
import { useUser } from './contexts/UserContext';
import SanPhamService from '../services/sanphamservice';
import { addToCart } from '../services/muasamservice';
import baseurl from '../baseurl';

interface Product {
  id: number;
  tenSanPham: string;
  moTa: string;
  giaTien: number;
  duongDanAnh: string;
  soLuong: number;
  donVi: string;
}

const PRODUCTS_PER_PAGE = 6; // 6 sản phẩm mỗi trang

const CategoryScreen = () => {
  const { title, idLoai } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart: addToCartContext } = useCart();
  const { user } = useUser();

  const categoryTitle: string = title ? decodeURIComponent(title as string) : 'Sản phẩm';
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);

  const fetchProducts = async () => {
    try {
      if (!idLoai) {
        console.error('Thiếu tham số idLoai');
        return;
      }
      const id = parseInt(idLoai as string);
      const data: Product[] = await SanPhamService.getSanPhamByIdLoai(id);
      setProducts(data);
    } catch (error: any) {
      console.error('Lỗi khi lấy sản phẩm:', error.message);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [idLoai]);

  // Lọc sản phẩm theo tìm kiếm
  const filteredProducts = products.filter((product) =>
    product.tenSanPham.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  // Lấy sản phẩm cho trang hiện tại
  const getCurrentPageProducts = () => {
    const startIndex = currentPage * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  };

  // Xử lý khi vuốt để chuyển trang
  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const page = Math.floor(contentOffset.x / layoutMeasurement.width);
    setCurrentPage(page);
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async (product: Product) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      router.push('/login');
      return;
    }

    const request = {
      sanPhamId: product.id,
      soLuong: 1,
    };

    try {
      const success = await addToCart(request);
      if (success) {
        const productData = {
          id: product.id,
          title: product.tenSanPham,
          subtitle: `${product.soLuong} ${product.donVi}`,
          price: `$${product.giaTien}`,
          image: { uri: `${baseurl}${product.duongDanAnh}` },
          quantity: 1,
        };
        addToCartContext(productData);
        alert('Đã thêm sản phẩm vào giỏ hàng!');
      } else {
        throw new Error('Không thể thêm vào giỏ hàng');
      }
    } catch (err: any) {
      console.error('Lỗi khi thêm vào giỏ hàng:', err.message);
      alert(`Lỗi khi thêm vào giỏ hàng: ${err.message}`);
    }
  };

  // Render sản phẩm
  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => {
        console.log('Chuyển đến chi tiết sản phẩm với ID:', item.id);
        router.push({
          pathname: '/productdetail',
          params: { id: item.id },
        });
      }}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: `${baseurl}${item.duongDanAnh}` }} style={styles.image} />
      </View>
      <Text style={styles.name}>{item.tenSanPham}</Text>
      <Text style={styles.size}>{item.soLuong} {item.donVi}</Text>
      <View style={styles.footer}>
        <Text style={styles.price}>${item.giaTien}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
          <FontAwesome name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render chấm phân trang
  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalPages }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            currentPage === index ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      ))}
    </View>
  );

  // Render mỗi trang
  const renderPage = ({ item }: { item: Product[] }) => (
    <View style={styles.pageContainer}>
      <FlatList
        data={item}
        keyExtractor={(product) => product.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={renderProduct}
        scrollEnabled={false} // Tắt cuộn trong FlatList con
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.titleicon}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.header}>{categoryTitle}</Text>
        <TouchableOpacity onPress={() => router.push('/mycart')}>
          <AntDesign name="right" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <AntDesign name="search1" size={20} color="gray" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setCurrentPage(0); // Reset về trang đầu khi tìm kiếm
          }}
        />
      </View>

      {filteredProducts.length > 0 ? (
        <>
          <FlatList
            ref={flatListRef}
            data={Array.from({ length: totalPages }).map((_, index) =>
              filteredProducts.slice(
                index * PRODUCTS_PER_PAGE,
                (index + 1) * PRODUCTS_PER_PAGE
              )
            )}
            keyExtractor={(_, index) => `page-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            renderItem={renderPage}
          />
          {renderPaginationDots()}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy sản phẩm.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EC870E',
    padding: 10,
  },
  titleicon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBD1',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#367517',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  pageContainer: {
    width: Dimensions.get('window').width - 20, // Chiều rộng bằng màn hình trừ padding
    paddingHorizontal: 5,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFBD1',
    borderRadius: 10,
    padding: 10,
    margin: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth:1,
    borderColor:'#000',
    borderBottomWidth:3,
    borderRightWidth:3,
  },
  imageContainer: {
    width: 145,
    height: 130,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#367517',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    color: '#333',
  },
  size: {
    fontSize: 14,
    color: 'gray',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#367517',
  },
  addButton: {
    backgroundColor: '#367517',
    padding: 8,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#367517',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
});

export default CategoryScreen; 