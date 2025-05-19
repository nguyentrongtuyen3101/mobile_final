import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SanPhamService from '../../services/sanphamservice';
import baseurl from '../../baseurl';

// Định nghĩa kiểu cho props (nếu có)
interface Props { }

// Định nghĩa kiểu cho item trong section
interface Item {
  id: number; // Thêm id
  title: string;
  subtitle: string;
  price: string;
  image: any;
}

interface LoaiSanPham {
  id: number;
  tenLoai: string;
  donVi: string;
  duongDanAnh: string;
}

interface Product {
  id: number;
  tenSanPham: string;
  moTa: string;
  giaTien: number;
  duongDanAnh: string;
  soLuong: number;
  donVi: string;
}

const App: React.FC<Props> = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<LoaiSanPham[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryItems, setCategoryItems] = useState<Record<number, Item[]>>({});

  // Lấy danh mục và sản phẩm
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const loaiSanPhamList = await SanPhamService.getAllLoaiSanPham();
        const firstThreeCategories = loaiSanPhamList.slice(0, 3); // Lấy 3 danh mục đầu tiên

        // Lấy sản phẩm cho từng danh mục (tối đa 5 sản phẩm)
        const itemsMap: Record<number, Item[]> = {};
        for (const category of firstThreeCategories) {
          const products = await SanPhamService.getSanPhamByIdLoai(category.id);
          const limitedProducts = products.slice(0, 5); // Giới hạn 5 sản phẩm
          itemsMap[category.id] = limitedProducts.map(product => ({
            id: product.id,
            title: product.tenSanPham,
            subtitle: `${product.soLuong} ${product.donVi}`,
            price: `$${product.giaTien}`,
            image: { uri: `${baseurl}${product.duongDanAnh}` },
          }));
        }

        setCategories(firstThreeCategories);
        setCategoryItems(itemsMap);
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hàm xử lý khi nhấn vào sản phẩm để lấy chi tiết và chuyển hướng
  const handleProductPress = async (item: Item) => {
    try {
      const productDetail = await SanPhamService.getSanPhamById(item.id);
      router.push({
        pathname: "/productdetail",
        params: {
          id: productDetail.id.toString(), // Truyền id để trang chi tiết có thể lấy lại nếu cần
          title: productDetail.tenSanPham,
          price: `$${productDetail.giaTien}`,
          image: `${baseurl}${productDetail.duongDanAnh}`, // Truyền URL ảnh
          subtitle: `${productDetail.soLuong} ${productDetail.donVi}`,
          description: productDetail.moTa, // Thêm mô tả nếu cần
        },
      });
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
      alert('Không thể lấy chi tiết sản phẩm. Vui lòng thử lại sau.');
    }
  };

  const renderSection = (title: string, items: Item[], idLoai: number) => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/category",
                params: {
                  title,
                  idLoai: idLoai.toString(),
                },
              })
            }
          >
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={styles.cardContainer}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => handleProductPress(item)} // Gọi hàm lấy chi tiết sản phẩm
              >
                <View style={styles.imageFrame}>
                  <Image source={item.image} style={styles.cardImage} />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <FontAwesome5 name="carrot" size={40} color="orange" />
        </View>
        <Text style={styles.textHeader}>Store Groceries</Text>
      </View>

      {/* Sections */}
      {categories.map((category) => (
        renderSection(category.tenLoai, categoryItems[category.id] || [], category.id)
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  textHeader: {
    fontSize: 20, // Kích thước chữ của tiêu đề
    fontWeight: "bold", // Chữ in đậm
  },
  section: {
    marginBottom: 20, // Khoảng cách dưới của mỗi section
  },
  sectionHeader: {
    flexDirection: "row", // Sắp xếp theo hàng ngang
    justifyContent: "space-between", // Căn đều hai bên
    alignItems: "center", // Căn giữa theo chiều dọc
    paddingHorizontal: 16, // Khoảng cách hai bên trái-phải
    marginBottom: 10, // Khoảng cách dưới của tiêu đề section
  },
  sectionTitle: {
    fontSize: 18, // Kích thước chữ tiêu đề section
    fontWeight: "bold", // Chữ in đậm
  },
  sectionLink: {
    color: "#006241", // Màu chữ của liên kết "See all"
    fontSize: 16, // Kích thước chữ liên kết
  },
  cardContainer: {
    flexDirection: "row", // Sắp xếp các card theo hàng ngang
    paddingHorizontal: 16, // Khoảng cách hai bên trái-phả
  },
  card: {
    width: 150, // Chiều rộng của card sản phẩm
    backgroundColor: "#FFFBD1", // Màu nền trắng
    borderRadius: 10, // Bo góc card
    marginRight: 10, // Khoảng cách bên phải giữa các card
    alignItems: "center", // Căn giữa nội dung trong card
    borderWidth: 1, // Độ dày viền
    borderColor: "#000", // Màu viền
    shadowColor: "#000", // Màu bóng
    shadowOffset: { width: 0, height: 2 }, // Độ lệch bóng
    shadowOpacity: 0.1, // Độ mờ bóng
    shadowRadius: 4, // Bán kính bóng
    elevation: 3, // Độ cao bóng (dành cho Android)
    borderBottomWidth:3,
    borderRightWidth:3,
  },
  imageFrame: {
    width: 120, // Chiều rộng cố định của khung ảnh
    height: 100, // Chiều cao cố định của khung ảnh
    borderWidth: 1, // Độ dày viền khung ảnh
    borderColor: "#000", // Màu viền khung ảnh
    borderRadius: 5, // Bo góc khung ảnh
    overflow: "hidden", // Ẩn phần ảnh thừa ra ngoài khung
    marginTop: 10, // Khoảng cách trên của khung ảnh
  },
  cardImage: {
    width: "100%", // Chiều rộng ảnh chiếm toàn bộ khung
    height: "100%", // Chiều cao ảnh chiếm toàn bộ khung
    resizeMode: "cover", // Chế độ hiển thị ảnh: lấp đầy khung, giữ tỷ lệ và cắt nếu cần
  },
  cardTitle: {
    fontSize: 20, // Kích thước chữ tiêu đề sản phẩm
    fontWeight: "bold", // Chữ in đậm
    marginTop: 5, // Khoảng cách trên của tiêu đề
  },
  cardSubtitle: {
    fontSize: 12, // Kích thước chữ phụ đề
    color: "gray", // Màu chữ xám
  },
  cardFooter: {
    flexDirection: "row", // Sắp xếp nội dung footer theo hàng ngang
    justifyContent: "space-between", // Căn đều hai bên
    alignItems: "center", // Căn giữa theo chiều dọc
    marginTop: 10, // Khoảng cách trên của footer
    width: "100%", // Chiều rộng toàn bộ card
  },
  cardPrice: {
    fontSize: 16, // Kích thước chữ giá sản phẩm
    fontWeight: "bold", // Chữ in đậm
    color: "#333", // Màu chữ
    marginBottom: 10, // Khoảng cách dưới
    marginLeft: 10, // Khoảng cách bên trái
  },
  container: { 
    flex: 1, // Chiếm toàn bộ không gian
    backgroundColor: '#EC870E', // Màu nền trắng
    padding: 16 // Khoảng cách bên trong
  },
  header: { 
    justifyContent: 'space-between', // Căn đều hai bên
    alignItems: 'center', // Căn giữa theo chiều dọc
    marginBottom: 16 // Khoảng cách dưới của header
  },
});

export default App;