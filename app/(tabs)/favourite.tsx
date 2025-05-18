
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../contexts/CartContext';
import { useUser } from '../contexts/UserContext';
import { useFavourites, FavouriteItem } from '../contexts/FavouriteContext';
import { showyeuthich, xoayeuthich, addToCart } from '../../services/muasamservice'; // Thêm import addToCart
import baseurl from '../../baseurl';

interface CartItem {
  id: number;
  title: string;
  subtitle: string;
  price: string;
  image: any;
  quantity: number;
}

interface FavouriteItemProps {
  item: FavouriteItem;
  onRemove: (id: number) => void;
  onToggleCheckbox: (id: number) => void;
  onImagePress: (sanPhamId: number) => void;
  checked: boolean;
}

const FavouriteItemComponent: React.FC<FavouriteItemProps> = ({ item, onRemove, onToggleCheckbox, onImagePress, checked }) => {
  return (
    <View style={styles.cartItem}>
      <TouchableOpacity
        onPress={() => onToggleCheckbox(item.id)}
        style={styles.checkboxContainer}
        accessible={true}
        accessibilityLabel="Chọn sản phẩm"
        accessibilityHint="Chạm hai lần để chọn hoặc bỏ chọn sản phẩm này"
      >
        <FontAwesome
          name={checked ? 'check-square-o' : 'square-o'}
          size={24}
          color={checked ? '#53B175' : '#B3B3B3'}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onImagePress(item.sanPhamId)}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} />
        </View>
      </TouchableOpacity>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.title}</Text>
        <Text style={styles.itemDetailsText}>{item.subtitle}</Text>
      </View>
      <View style={styles.closeprice}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onRemove(item.id)}
          accessible={true}
          accessibilityLabel="Xóa sản phẩm"
          accessibilityHint="Chạm hai lần để xóa sản phẩm này khỏi yêu thích"
        >
          <FontAwesome name="close" size={24} color="#B3B3B3" />
        </TouchableOpacity>
        <Text style={styles.price}>{item.price}</Text>
      </View>
    </View>
  );
};

const FavouriteScreen = () => {
  const { user } = useUser();
  const { addToCart: addToCartContext } = useCart(); // Đổi tên để tránh xung đột
  const { favouriteItems: contextItems, addToFavourites } = useFavourites();
  const [favouriteItems, setFavouriteItems] = useState<FavouriteItem[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmDeleteSelected, setShowConfirmDeleteSelected] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: showConfirmDelete || showConfirmDeleteSelected ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(blurAnim, {
        toValue: showConfirmDelete || showConfirmDeleteSelected ? 0.3 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showConfirmDelete, showConfirmDeleteSelected]);

  useEffect(() => {
    const fetchFavouriteItems = async () => {
      if (!user) {
        console.log('Người dùng chưa đăng nhập, không thể lấy danh sách yêu thích');
        return;
      }
      try {
        const items = await showyeuthich();
        if (items) {
          const mappedItems: FavouriteItem[] = items.map((item) => ({
            id: item.id,
            sanPhamId: item.sanPhamId || item.id,
            title: item.tenSanPham || 'Unnamed Product',
            subtitle: '1 item',
            price: `$${item.giaTien || 0}`,
            image: { uri: item.duongDanAnh ? `${baseurl}${item.duongDanAnh}` : '' },
          }));
          setFavouriteItems(mappedItems);
          mappedItems.forEach((item) => {
            if (!contextItems.some((ctxItem) => ctxItem.id === item.id)) {
              addToFavourites(item);
            }
          });
        } else {
          console.log('Không thể lấy danh sách yêu thích, items trả về null');
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách yêu thích:', error);
      }
    };
    fetchFavouriteItems();
  }, [user, contextItems]);

  useEffect(() => {
    if (contextItems.length > 0) {
      setFavouriteItems((prev) => {
        const updatedItems = [...contextItems];
        return updatedItems;
      });
    }
  }, [contextItems]);

  const handleRemoveItem = async (id: number) => {
    setSelectedItemId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (selectedItemId !== null) {
      const success = await xoayeuthich(selectedItemId);
      if (success) {
        setFavouriteItems((prevItems) => prevItems.filter((item) => item.id !== selectedItemId));
        setCheckedItems((prev) => {
          const newChecked = new Set(prev);
          newChecked.delete(selectedItemId);
          return newChecked;
        });
        Alert.alert('Thành công', 'Xóa sản phẩm khỏi yêu thích thành công!');
      } else {
        Alert.alert('Lỗi', 'Không thể xóa sản phẩm khỏi yêu thích');
      }
      setShowConfirmDelete(false);
      setSelectedItemId(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDelete(false);
    setShowConfirmDeleteSelected(false);
    setSelectedItemId(null);
  };

  const handleToggleCheckbox = (id: number) => {
    setCheckedItems((prev) => {
      const newChecked = new Set(prev);
      if (newChecked.has(id)) {
        newChecked.delete(id);
      } else {
        newChecked.add(id);
      }
      return newChecked;
    });
  };

  const handleToggleAllCheckboxes = () => {
    if (checkedItems.size === favouriteItems.length) {
      setCheckedItems(new Set());
    } else {
      setCheckedItems(new Set(favouriteItems.map((item) => item.id)));
    }
  };

  const handleDeleteSelectedItems = () => {
    if (checkedItems.size === 0) return;
    setShowConfirmDeleteSelected(true);
  };

  const confirmDeleteSelected = async () => {
    const deletePromises = Array.from(checkedItems).map((id) => xoayeuthich(id));
    const results = await Promise.all(deletePromises);

    if (results.every((success) => success)) {
      setFavouriteItems((prevItems) => prevItems.filter((item) => !checkedItems.has(item.id)));
      setCheckedItems(new Set());
      Alert.alert('Thành công', 'Đã xóa tất cả sản phẩm được chọn!');
    } else {
      Alert.alert('Lỗi', 'Không thể xóa một số sản phẩm, vui lòng thử lại.');
    }
    setShowConfirmDeleteSelected(false);
  };

  const handleAddSelectedToCart = async () => {
    if (checkedItems.size === 0) {
      Alert.alert('Cảnh báo', 'Vui lòng chọn ít nhất một sản phẩm!');
      return;
    }

    if (!user) {
      Alert.alert('Cảnh báo', 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      router.push('/login');
      return;
    }

    const selectedItems = favouriteItems.filter((item) => checkedItems.has(item.id));
    
    try {
      const addPromises = selectedItems.map(async (item) => {
        const request = {
          sanPhamId: item.sanPhamId, // Đảm bảo sanPhamId tồn tại
          soLuong: 1, // Số lượng mặc định là 1
        };

        const success = await addToCart(request); // Gọi API để thêm vào DB
        if (success) {
          const cartItem: CartItem = {
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            price: item.price,
            image: item.image,
            quantity: 1,
          };
          addToCartContext(cartItem); // Cập nhật context
        }
        return success;
      });

      const results = await Promise.all(addPromises);

      if (results.every((success) => success)) {
        Alert.alert('Thành công', `${checkedItems.size} sản phẩm đã được thêm vào giỏ hàng!`);
        router.push('/mycart');
      } else {
        Alert.alert('Lỗi', 'Không thể thêm một số sản phẩm vào giỏ hàng, vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng.');
    }
  };

  const handleImagePress = (sanPhamId: number) => {
    if (!sanPhamId) {
      console.log('sanPhamId không hợp lệ, sử dụng id tạm thời:', favouriteItems.find((item) => item.id === item.id)?.id);
      router.push({ pathname: '/productdetail', params: { id: favouriteItems.find((item) => item.id === item.id)?.id || 0 } });
    } else {
      router.push({ pathname: '/productdetail', params: { id: sanPhamId } });
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.myCart, { opacity: blurAnim }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleToggleAllCheckboxes}
            style={styles.selectAllContainer}
            accessible={true}
            accessibilityLabel="Chọn tất cả"
            accessibilityHint="Chạm hai lần để chọn hoặc bỏ chọn tất cả sản phẩm"
          >
            <FontAwesome
              name={checkedItems.size === favouriteItems.length && favouriteItems.length > 0 ? 'check-square-o' : 'square-o'}
              size={24}
              color={checkedItems.size === favouriteItems.length && favouriteItems.length > 0 ? '#53B175' : '#B3B3B3'}
            />
            <Text style={styles.selectAllText}>Select All</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Favourite</Text>
          <View style={styles.headerSpacer} />
        </View>
        {favouriteItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>You have no favourite items</Text>
          </View>
        ) : (
          <ScrollView style={styles.cartItems} contentContainerStyle={{ paddingBottom: 150 }}>
            {favouriteItems.map((item) => (
              <FavouriteItemComponent
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onToggleCheckbox={handleToggleCheckbox}
                onImagePress={handleImagePress}
                checked={checkedItems.has(item.id)}
              />
            ))}
          </ScrollView>
        )}
        {favouriteItems.length > 0 && (
          <View style={styles.checkoutContainer}>
            {checkedItems.size > 0 && (
              <TouchableOpacity
                style={styles.deleteSelectedButton}
                onPress={handleDeleteSelectedItems}
                accessible={true}
                accessibilityLabel="Xóa sản phẩm được chọn"
                accessibilityHint="Chạm hai lần để xóa tất cả sản phẩm được chọn"
              >
                <Text style={styles.deleteSelectedButtonText}>Delete Selected</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleAddSelectedToCart}
              accessible={true}
              accessibilityLabel="Thêm vào giỏ hàng"
              accessibilityHint="Chạm hai lần để thêm các sản phẩm được chọn vào giỏ hàng"
            >
              <Text style={styles.checkoutButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      <Modal transparent={true} visible={showConfirmDelete} animationType="fade" onRequestClose={cancelDelete}>
        <TouchableWithoutFeedback onPress={cancelDelete}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>Are you sure you want to remove this item?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmDelete}
                  accessible={true}
                  accessibilityLabel="Xác nhận xóa"
                  accessibilityHint="Chạm hai lần để xác nhận xóa"
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cancelDelete}
                  accessible={true}
                  accessibilityLabel="Hủy xóa"
                  accessibilityHint="Chạm hai lần để hủy xóa"
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        transparent={true}
        visible={showConfirmDeleteSelected}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableWithoutFeedback onPress={cancelDelete}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalText}>Are you sure you want to remove selected items?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmDeleteSelected}
                  accessible={true}
                  accessibilityLabel="Xác nhận xóa các sản phẩm"
                  accessibilityHint="Chạm hai lần để xác nhận xóa các sản phẩm được chọn"
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={cancelDelete}
                  accessible={true}
                  accessibilityLabel="Hủy xóa"
                  accessibilityHint="Chạm hai lần để hủy xóa"
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EC870E' },
  myCart: { flex: 1 },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#945305',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  selectAllContainer: { flexDirection: 'row', alignItems: 'center', zIndex: 100 },
  selectAllText: { fontSize: 16, marginLeft: 8, color: '#00676B' },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerSpacer: { width: 100 },
  cartItems: { padding: 16 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FEEBD0',
  },
  checkboxContainer: { marginRight: 12 },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemDetails: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  itemDetailsText: { color: 'gray', marginBottom: 8 },
  closeprice: { flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: 80, marginRight: 12 },
  deleteButton: { padding: 8 },
  price: { fontSize: 16, fontWeight: 'bold' },
  checkoutContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: '#008080',
    padding: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  deleteSelectedButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#ff4444',
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  deleteSelectedButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  checkoutButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#006241',
    borderRadius: 25,
    alignItems: 'center',
    maxWidth: 350,
  },
  checkoutButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' },
  modalText: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, width: '45%', alignItems: 'center' },
  confirmButton: { backgroundColor: '#ff4444' },
  cancelButton: { backgroundColor: '#ccc' },
  modalButtonText: { color: 'white', fontSize: 16 },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  emptyCartText: { fontSize: 18, color: '#6B7280' },
});

export default FavouriteScreen;
