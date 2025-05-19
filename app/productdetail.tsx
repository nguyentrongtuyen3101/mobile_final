import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useCart } from './contexts/CartContext';
import { useFavourites, FavouriteItem } from './contexts/FavouriteContext';
import { useUser } from './contexts/UserContext';
import SanPhamService from '../services/sanphamservice';
import { addToCart, themyeuthich, xoayeuthich, checkFavourite } from '../services/muasamservice'; // Thêm checkFavourite và xoayeuthich
import baseurl from '../baseurl';

interface Product {
  id: number;
  loai: string;
  tenSanPham: string;
  moTa: string;
  giaTien: number;
  duongDanAnh: string;
  soLuong: number;
}

const ProductPage: React.FC = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { addToCart: addToCartContext } = useCart();
  const { addToFavourites, removeFromFavourites, favouriteItems } = useFavourites();
  const { user } = useUser();

  const productId = Array.isArray(params.id) ? Number(params.id[0]) : Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProductAndCheckFavourite = async () => {
      if (!productId) {
        setError('Không tìm thấy ID sản phẩm');
        setLoading(false);
        return;
      }

      try {
        // Lấy thông tin sản phẩm
        const data: Product = await SanPhamService.getSanPhamById(productId);
        setProduct(data);

        // Kiểm tra trạng thái yêu thích nếu người dùng đã đăng nhập
        if (user) {
          const isFavourite = await checkFavourite(productId);
          setLiked(isFavourite);
        } else {
          // Nếu chưa đăng nhập, kiểm tra dựa trên context (giải pháp dự phòng)
          setLiked(favouriteItems.some((item) => item.title === data.tenSanPham));
        }
      } catch (err: any) {
        setError(`Lỗi khi lấy thông tin sản phẩm: ${err.message}`);
        console.error('Chi tiết lỗi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndCheckFavourite();
  }, [productId, user, favouriteItems]);

  const handleLikePress = async () => {
    if (!product || !user) {
      Alert.alert('Cảnh báo', 'Vui lòng đăng nhập để thực hiện thao tác này!');
      router.push('/login');
      return;
    }

    const request = {
      sanPhamId: product.id,
    };

    try {
      if (liked) {
        // Tìm ID của sản phẩm trong danh sách yêu thích từ context hoặc gọi API để lấy
        const favouriteItem = favouriteItems.find((item) => item.sanPhamId === product.id);
        if (!favouriteItem) {
          throw new Error('Không tìm thấy sản phẩm trong danh sách yêu thích');
        }

        // Gọi API để xóa khỏi danh sách yêu thích trên server
        const success = await xoayeuthich(favouriteItem.id);
        if (success) {
          // Xóa khỏi context
          removeFromFavourites(product.tenSanPham);
          setLiked(false);
          Alert.alert('Thành công', 'Đã xóa khỏi danh sách yêu thích!');
        } else {
          throw new Error('Không thể xóa khỏi danh sách yêu thích trên server');
        }
      } else {
        // Thêm vào danh sách yêu thích
        const response = await themyeuthich(request);
        if (response) {
          const productData: FavouriteItem = {
            id: response.id || product.id, // Sử dụng id từ response hoặc product.id làm fallback
            sanPhamId: product.id,
            title: product.tenSanPham,
            subtitle: `${product.soLuong} items`,
            price: `$${product.giaTien}`,
            image: { uri: `${baseurl}${product.duongDanAnh}` },
          };
          addToFavourites(productData);
          setLiked(true);
          Alert.alert('Thành công', 'Đã thêm vào danh sách yêu thích!');
        } else {
          throw new Error('Không thể thêm vào yêu thích');
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi xử lý yêu thích:', err.message);
      Alert.alert('Lỗi', `Không thể xử lý yêu thích: ${err.message}`);
    }
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToBasket = async () => {
    if (!product) return;

    if (!user) {
      Alert.alert('Cảnh báo', 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      router.push('/login');
      return;
    }

    const request = {
      sanPhamId: product.id,
      soLuong: quantity,
    };

    try {
      const success = await addToCart(request);
      if (success) {
        const productData = {
          id: product.id,
          sanPhamId: product.id, // Thêm sanPhamId để khớp với kiểu CartItem
          title: product.tenSanPham,
          subtitle: `${product.soLuong} items`,
          price: `$${product.giaTien}`,
          image: { uri: `${baseurl}${product.duongDanAnh}` },
          quantity,
        };
        addToCartContext(productData);
        Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng!');
        router.push('/mycart');
      } else {
        throw new Error('Không thể thêm vào giỏ hàng');
      }
    } catch (err: any) {
      console.error('Lỗi khi thêm vào giỏ hàng:', err.message);
      Alert.alert('Lỗi', `Lỗi khi thêm vào giỏ hàng: ${err.message}`);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || 'Không tìm thấy sản phẩm'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.productTitle}>Product</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Feather name="upload" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `${baseurl}${product.duongDanAnh}` }}
            style={styles.productImage}
            onError={() => console.log('Lỗi tải hình ảnh')}
          />
        </View>

        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <View>
              <Text style={styles.productTitle}>{product.tenSanPham}</Text>
              <Text style={styles.productSubtitle}>{product.soLuong} items</Text>
            </View>
            <TouchableOpacity onPress={handleLikePress}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={24}
                color={liked ? 'red' : 'gray'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.productPriceContainer}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={handleDecreaseQuantity}>
                <Text style={styles.quantityButton}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity onPress={handleIncreaseQuantity}>
                <Text style={styles.quantityButton}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.productPrice}>${product.giaTien}</Text>
          </View>
        </View>

        <View style={styles.productDetails}>
          <View style={[styles.detailSection, styles.detailCard]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Product Detail</Text>
            </View>
            <Text style={styles.detailText}>{product.moTa || 'Không có mô tả.'}</Text>
          </View>

          <View style={[styles.detailSection, styles.detailCard]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Nutritions</Text>
            </View>
            <Text style={styles.detailText}>100gr</Text>
          </View>

          <View style={[styles.detailSection, styles.detailCard]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Review</Text>
            </View>
            <View style={styles.reviewStars}>
              {[...Array(5)].map((_, i) => (
                <FontAwesome key={i} name="star" size={20} color="#FFD700" />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.addToBasketContainer}>
        <TouchableOpacity style={styles.addToBasketButton} onPress={handleAddToBasket}>
          <Text style={styles.addToBasketText}>Add To Basket</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#000', flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#EC870E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  productInfo: {
    padding: 16,
    backgroundColor: '#FCE0A6',
    borderRadius: 20,
    marginHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 20,
  },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  productSubtitle: { color: '#6B7280', fontSize: 16, marginTop: 4 },
  productPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  quantityButton: { fontSize: 24, color: '#00676B', fontWeight: 'bold' },
  quantityText: {
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 8,
    color: '#333',
  },
  productPrice: { fontSize: 24, fontWeight: 'bold', color: '#00676B' },
  productDetails: { padding: 16, flexDirection: 'column' },
  detailSection: {
    flexDirection: 'column',
    padding: 16,
    marginVertical: 5,
    minHeight: 100,
    marginHorizontal: 5,
  },
  detailCard: {
    backgroundColor: '#FCE0A6',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  detailSubtitle: { color: '#6B7280', fontSize: 14 },
  detailText: { color: '#6B7280', marginTop: 10, fontSize: 14 },
  reviewStars: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  addToBasketContainer: {
    padding: 16,
    backgroundColor: '#EC870E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderColor: '#000',
  },
  addToBasketButton: {
    backgroundColor: '#00676B',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    borderColor: '#000',
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  addToBasketText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  loadingText: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 20 },
  errorText: { fontSize: 16, color: '#FF0000', textAlign: 'center', marginTop: 20 },
});

export default ProductPage;