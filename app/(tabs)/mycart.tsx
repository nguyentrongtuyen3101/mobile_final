import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  Modal,
} from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../contexts/CartContext';
import { useUser } from '../contexts/UserContext';
import { getCartItems, removeFromCart ,CartItem} from '../../services/muasamservice';
import { addOrder, findDiscount, Order, OrderDetail, Discount } from '../../services/orderService';
import { showAccount } from '../../services/authService';

// Định nghĩa kiểu cho CartItem


// Định nghĩa kiểu cho thông tin khách hàng
interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

// Định nghĩa props cho CartItem component
interface CartItemProps {
  item: CartItem;
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, newQuantity: number) => void;
  onToggleCheckbox: (id: number) => void;
  checked: boolean;
}

const CartItemComponent: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity, onToggleCheckbox, checked }) => {
  const price = parseFloat(item.price.replace('$', '')) * item.quantity;

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
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} />
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.title}</Text>
        <Text style={styles.itemDetailsText}>{item.subtitle}</Text>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            accessible={true}
            accessibilityLabel="Giảm số lượng"
            accessibilityHint="Chạm để giảm số lượng sản phẩm"
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
            accessible={true}
            accessibilityLabel="Tăng số lượng"
            accessibilityHint="Chạm để tăng số lượng sản phẩm"
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.closeprice}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onRemove(item.id)}
          accessible={true}
          accessibilityLabel="Xóa sản phẩm"
          accessibilityHint="Chạm hai lần để xóa sản phẩm này khỏi giỏ hàng"
        >
          <FontAwesome name="close" size={24} color="#B3B3B3" />
        </TouchableOpacity>
        <Text style={styles.price}>${price.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const App = () => {
  const { cartItems, setCartItems } = useCart();
  const { user } = useUser();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmDeleteSelected, setShowConfirmDeleteSelected] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const blurAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  // State cho thông tin khách hàng
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
  });

  const [recipientInfo, setRecipientInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
  });

  const [deliveryMethod, setDeliveryMethod] = useState('Standard Delivery');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [showError, setShowError] = useState(false);
  const [discountId, setDiscountId] = useState<number | undefined>(undefined);
  const [originalTotalCost, setOriginalTotalCost] = useState(0);

  // Tính tổng tiền
  const totalCost = cartItems
    .filter((item) => checkedItems.has(item.id))
    .reduce((total, item) => {
      const price = parseFloat(item.price.replace('$', '')) * item.quantity;
      return total + price;
    }, 0) - discount;

  // Cập nhật originalTotalCost
  useEffect(() => {
    const original = cartItems
      .filter((item) => checkedItems.has(item.id))
      .reduce((total, item) => {
        const price = parseFloat(item.price.replace('$', '')) * item.quantity;
        return total + price;
      }, 0);
    setOriginalTotalCost(original);
  }, [cartItems, checkedItems]);

  // Lấy thông tin tài khoản
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await showAccount();
        if (userInfo) {
          setCustomerInfo({
            name: userInfo.hoten,
            phone: userInfo.sdt,
            address: userInfo.diachi,
          });
          setRecipientInfo({
            name: userInfo.hoten,
            phone: userInfo.sdt,
            address: userInfo.diachi,
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin tài khoản:', error);
        Alert.alert('Lỗi', 'Không thể lấy thông tin tài khoản');
      }
    };

    fetchUserInfo();
  }, []);

  // Animation cho checkout
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: showCheckout ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(blurAnim, {
        toValue: showCheckout ? 0.3 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [showCheckout]);

  // Lấy giỏ hàng
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!user) {
        console.log('Người dùng chưa đăng nhập, không thể lấy giỏ hàng');
        return;
      }

      const items = await getCartItems();
      if (items) {
        setCartItems(items);
      } else {
        console.log('Không thể lấy giỏ hàng, items trả về null');
      }
    };

    fetchCartItems();
  }, [user, setCartItems]);

  const handleUpdateQuantity = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = async (id: number) => {
    setSelectedItemId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (selectedItemId !== null) {
      const success = await removeFromCart(selectedItemId);
      if (success) {
        setCartItems((prevItems) => prevItems.filter((item) => item.id !== selectedItemId));
        setCheckedItems((prev) => {
          const newChecked = new Set(prev);
          newChecked.delete(selectedItemId);
          return newChecked;
        });
        Alert.alert('Thành công', 'Xóa sản phẩm khỏi giỏ hàng thành công!');
      } else {
        Alert.alert('Lỗi', 'Không thể xóa sản phẩm khỏi giỏ hàng');
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
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(id)) {
      newCheckedItems.delete(id);
    } else {
      newCheckedItems.add(id);
    }
    setCheckedItems(newCheckedItems);
  };

  const handleToggleAllCheckboxes = () => {
    if (checkedItems.size === cartItems.length) {
      setCheckedItems(new Set());
    } else {
      const allIds = new Set(cartItems.map((item) => item.id));
      setCheckedItems(allIds);
    }
  };

  const handleDeleteSelectedItems = () => {
    if (checkedItems.size === 0) return;
    setShowConfirmDeleteSelected(true);
  };

  const confirmDeleteSelected = async () => {
    const deletePromises = Array.from(checkedItems).map((id) => removeFromCart(id));
    const results = await Promise.all(deletePromises);

    if (results.every((success) => success)) {
      setCartItems((prevItems) => prevItems.filter((item) => !checkedItems.has(item.id)));
      setCheckedItems(new Set());
      Alert.alert('Thành công', 'Đã xóa tất cả sản phẩm được chọn!');
    } else {
      Alert.alert('Lỗi', 'Không thể xóa một số sản phẩm, vui lòng thử lại.');
    }
    setShowConfirmDeleteSelected(false);
  };

  const applyPromoCode = async () => {
    if (!promoCode) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      const discountData: Discount = await findDiscount(promoCode);
      if (discountData && discountData.giaTien > 0) {
        setDiscount(discountData.giaTien);
        setDiscountId(discountData.id);
        Alert.alert('Thành công', `Mã giảm giá ${promoCode} đã được áp dụng! Giảm ${discountData.giaTien}$`);
      } else {
        setDiscount(0);
        setDiscountId(undefined);
        Alert.alert('Lỗi', 'Mã giảm giá không hợp lệ hoặc không có giá trị giảm');
      }
    } catch (error) {
      console.error('Lỗi khi áp dụng mã giảm giá:', error);
      setDiscount(0);
      setDiscountId(undefined);
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể áp dụng mã giảm giá');
    }
  };

  const handlePayment = async () => {
  if (checkedItems.size === 0) {
    Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
    return;
  }
  if (!recipientInfo.name || !recipientInfo.phone || !recipientInfo.address) {
    Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin người nhận.');
    return;
  }

  try {
    const order: Order = {
      idAccount: user?.id ? parseInt(user.id) : undefined,
      idDiscount: discountId,
      hoTen: recipientInfo.name,
      sdt: recipientInfo.phone,
      diachigiaohang: recipientInfo.address,
      phuongthucthanhtoan: paymentMethod === 'Cash' ? true : false,
      tongtien: totalCost,
      status: 0,
    };

    const orderDetails: OrderDetail[] = cartItems
      .filter((item) => checkedItems.has(item.id))
      .map((item) => {
        const price = parseFloat(item.price.replace('$', ''));
        if (isNaN(price)) {
          throw new Error(`Giá sản phẩm không hợp lệ cho sản phẩm ID: ${item.sanPhamId}`);
        }
        return {
          idOrder: undefined,
          idSanpham: item.sanPhamId, // Sử dụng sanPhamId
          soluong: item.quantity,
          giatien: price,
          tongtiensanpham: price * item.quantity,
        };
      });

    if (orderDetails.length === 0) {
      Alert.alert('Lỗi', 'Không có chi tiết đơn hàng để gửi.');
      return;
    }

    console.log('Order:', order);
    console.log('OrderDetails:', orderDetails);

    await addOrder({ order, orderDetails });

    const deletePromises = Array.from(checkedItems).map((id) => removeFromCart(id));
    await Promise.all(deletePromises);

    setCartItems((prevItems) => prevItems.filter((item) => !checkedItems.has(item.id)));
    setCheckedItems(new Set());
    setPaymentStatus('success');
    setShowCheckout(false);

    router.push('/orderaccept');
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    setPaymentStatus('failed');
    setShowError(true);
    Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể tạo đơn hàng');
  }
};
  const handleTryAgain = () => {
    setShowError(false);
    setPaymentStatus('pending');
  };

  const handleRecipientInputChange = (field: keyof CustomerInfo, value: string) => {
    setRecipientInfo((prev) => ({ ...prev, [field]: value }));
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
              name={checkedItems.size === cartItems.length && cartItems.length > 0 ? 'check-square-o' : 'square-o'}
              size={24}
              color={checkedItems.size === cartItems.length && cartItems.length > 0 ? '#53B175' : '#B3B3B3'}
            />
            <Text style={styles.selectAllText}>Select All</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>My Cart</Text>
          <View style={styles.headerSpacer} />
        </View>
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.cartItems}
            contentContainerStyle={{ paddingBottom: 150 }}
          >
            {cartItems.map((item) => (
              <CartItemComponent
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onToggleCheckbox={handleToggleCheckbox}
                checked={checkedItems.has(item.id)}
              />
            ))}
          </ScrollView>
        )}
        {cartItems.length > 0 && (
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
              onPress={() => setShowCheckout(true)}
              accessible={true}
              accessibilityLabel="Đi đến thanh toán"
              accessibilityHint="Chạm hai lần để tiến hành thanh toán"
            >
              <Text style={styles.checkoutButtonText}>Go to Checkout</Text>
              <View style={styles.checkoutPrice}>
                <Text style={styles.checkoutPriceText}>${totalCost.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* Popup xác nhận xóa một sản phẩm */}
      <Modal
        transparent={true}
        visible={showConfirmDelete}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
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

      {/* Popup xác nhận xóa các sản phẩm được chọn */}
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

      {/* Checkout Modal */}
      {showCheckout && (
        <TouchableWithoutFeedback
          onPress={(event) => {
            if (event.target === event.currentTarget) {
              setShowCheckout(false);
            }
          }}
        >
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.headerText}>Checkout</Text>
              </View>

              <ScrollView style={styles.content}>
                <View style={styles.row}>
                  <Text style={styles.label}>Recipient Name</Text>
                  <TextInput
                    style={styles.input}
                    value={recipientInfo.name}
                    onChangeText={(text) => handleRecipientInputChange('name', text)}
                    placeholder="Enter recipient name"
                    accessible={true}
                    accessibilityLabel="Enter recipient name"
                    accessibilityHint="Enter the recipient's name"
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={recipientInfo.phone}
                    onChangeText={(text) => handleRecipientInputChange('phone', text)}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    accessible={true}
                    accessibilityLabel="Enter phone number"
                    accessibilityHint="Enter the recipient's phone number"
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={styles.input}
                    value={recipientInfo.address}
                    onChangeText={(text) => handleRecipientInputChange('address', text)}
                    placeholder="Enter address"
                    accessible={true}
                    accessibilityLabel="Enter address"
                    accessibilityHint="Enter the recipient's address"
                  />
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Payment</Text>
                  <TouchableOpacity
                    style={styles.rowEnd}
                    onPress={() => setPaymentMethod(paymentMethod === 'Cash' ? 'PayPal' : 'Cash')}
                    accessible={true}
                    accessibilityLabel="Change payment method"
                    accessibilityHint="Double tap to switch between Cash and PayPal"
                  >
                    <Text style={styles.value}>{paymentMethod}</Text>
                    <FontAwesome name="angle-right" size={20} color="gray" />
                  </TouchableOpacity>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Promo Code</Text>
                  <View style={styles.rowEnd}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginRight: 10 }]}
                      placeholder="Enter code (e.g., vaftheme)"
                      value={promoCode}
                      onChangeText={setPromoCode}
                      accessible={true}
                      accessibilityLabel="Enter promo code"
                      accessibilityHint="Enter promo code and apply"
                    />
                    <TouchableOpacity
                      onPress={applyPromoCode}
                      accessible={true}
                      accessibilityLabel="Apply promo code"
                      accessibilityHint="Double tap to apply the entered promo code"
                    >
                      <Text style={styles.applyText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Total Cost</Text>
                  <View style={styles.costContainer}>
                    {discount > 0 ? (
                      <>
                        <Text style={[styles.cost, { textDecorationLine: 'line-through', color: '#999' }]}>
                          ${originalTotalCost.toFixed(2)}
                        </Text>
                        <Text style={[styles.cost, { color: '#53B175' }]}>${totalCost.toFixed(2)}</Text>
                      </>
                    ) : (
                      <Text style={styles.cost}>${totalCost.toFixed(2)}</Text>
                    )}
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.button}
                onPress={handlePayment}
                accessible={true}
                accessibilityLabel="Place order"
                accessibilityHint="Double tap to place the order"
              >
                <Text style={styles.buttonText}>Place Order</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      )}

      {/* Error Modal */}
      {showError && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.closeIconContainer}
              onPress={() => router.push('/(tabs)')}
              accessible={true}
              accessibilityLabel="Close error"
              accessibilityHint="Double tap to return to home"
            >
              <AntDesign name="close" size={24} color="#1F2937" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/images/order-failed.png')}
                style={styles.imageIcon}
              />
            </View>
            <Text style={styles.title}>Oops! Order Failed</Text>
            <Text style={styles.subtitle}>Something went terribly wrong</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={handleTryAgain}
              accessible={true}
              accessibilityLabel="Try again"
              accessibilityHint="Double tap to try placing the order again"
            >
              <Text style={styles.buttonText}>Please Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              accessible={true}
              accessibilityLabel="Back to home"
              accessibilityHint="Double tap to return to home"
            >
              <Text style={styles.linkText}>Back to home</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Container chính của màn hình
  container: {
    flex: 1, // Chiếm toàn bộ không gian
    backgroundColor: '#EC870E', // Màu nền cam
  },

  // Phần hiển thị giỏ hàng với hiệu ứng mờ khi mở modal
  myCart: {
    flex: 1, // Chiếm toàn bộ không gian còn lại
  },

  // Header của màn hình giỏ hàng
  header: {
    padding: 16, // Khoảng cách bên trong
    borderBottomWidth: 1, // Độ dày viền dưới
    borderBottomColor: '#945305', // Màu viền dưới (màu nâu đậm)
    flexDirection: 'row', // Sắp xếp theo hàng ngang
    alignItems: 'center', // Căn giữa theo chiều dọc
    justifyContent: 'space-between', // Căn đều hai bên
    position: 'relative', // Để căn giữa tiêu đề
  },

  // Container của nút "Select All"
  selectAllContainer: {
    flexDirection: 'row', // Sắp xếp ngang
    alignItems: 'center', // Căn giữa theo chiều dọc
    zIndex: 100, // Đảm bảo hiển thị trên cùng
  },

  // Văn bản "Select All"
  selectAllText: {
    fontSize: 16, // Kích thước chữ
    marginLeft: 8, // Khoảng cách từ biểu tượng checkbox
    color: '#333', // Màu chữ xám đậm
  },

  // Tiêu đề "My Cart" ở header
  headerText: {
    fontSize: 30, // Kích thước chữ lớn
    fontWeight: 'bold', // Chữ đậm
    position: 'absolute', // Đặt vị trí tuyệt đối để canh giữa
    left: 0, // Bắt đầu từ lề trái
    right: 0, // Kéo dài đến lề phải
    textAlign: 'center', // Căn giữa văn bản
  },

  // Khoảng cách giả để cân đối header
  headerSpacer: {
    width: 100, // Chiều rộng để tạo không gian trống
  },

  // Danh sách các mục trong giỏ hàng
  cartItems: {
    padding: 16, // Khoảng cách bên trong
  },

  // Mỗi mục sản phẩm trong giỏ hàng
  cartItem: {
    flexDirection: 'row', // Sắp xếp các thành phần theo hàng ngang
    alignItems: 'center', // Căn giữa theo chiều dọc
    justifyContent: 'space-between', // Căn đều các phần tử
    paddingVertical: 12, // Khoảng cách dọc
    paddingHorizontal: 16, // Khoảng cách ngang
    borderBottomWidth: 1, // Độ dày viền dưới
    borderBottomColor: '#e0e0e0', // Màu viền dưới (xám nhạt)
    shadowColor: '#000', // Màu bóng
    shadowOffset: { width: 0, height: 2 }, // Độ lệch bóng
    shadowOpacity: 0.1, // Độ mờ bóng
    shadowRadius: 4, // Bán kính bóng
    elevation: 3, // Độ nâng (cho Android)
    borderWidth: 1, // Độ dày viền
    borderColor: '#e0e0e0', // Màu viền (xám nhạt)
    borderRadius: 8, // Bo góc
    marginBottom: 8, // Khoảng cách dưới
    backgroundColor: '#FEEBD0', // Màu nền (màu cam nhạt)
  },

  // Container của checkbox
  checkboxContainer: {
    marginRight: 12, // Khoảng cách từ hình ảnh sản phẩm
  },

  // Container của hình ảnh sản phẩm
  imageContainer: {
    width: 64, // Chiều rộng
    height: 64, // Chiều cao
    borderRadius: 8, // Bo góc
    borderWidth: 1, // Độ dày viền
    borderColor: '#e0e0e0', // Màu viền (xám nhạt)
    overflow: 'hidden', // Ẩn phần hình ảnh tràn ra ngoài
    shadowColor: '#000', // Màu bóng
    shadowOffset: { width: 0, height: 2 }, // Độ lệch bóng
    shadowOpacity: 0.2, // Độ mờ bóng
    shadowRadius: 4, // Bán kính bóng
    elevation: 3, // Độ nâng (cho Android)
    marginRight: 12, // Khoảng cách từ chi tiết sản phẩm
  },

  // Hình ảnh sản phẩm
  image: {
    width: '100%', // Chiếm toàn bộ chiều rộng container
    height: '100%', // Chiếm toàn bộ chiều cao container
    resizeMode: 'cover', // Hình ảnh được cắt để vừa khung
  },

  // Container chi tiết sản phẩm
  itemDetails: {
    flex: 1, // Chiếm toàn bộ không gian còn lại
    marginRight: 12, // Khoảng cách từ phần giá
  },

  // Tên sản phẩm
  itemName: {
    fontSize: 16, // Kích thước chữ
    fontWeight: 'bold', // Chữ đậm
    marginBottom: 4, // Khoảng cách dưới
  },

  // Mô tả sản phẩm
  itemDetailsText: {
    color: 'gray', // Màu chữ xám
    marginBottom: 8, // Khoảng cách dưới
  },

  // Container điều khiển số lượng (tăng/giảm)
  quantityControl: {
    flexDirection: 'row', // Sắp xếp ngang
    alignItems: 'center', // Căn giữa theo chiều dọc
    marginTop: 0, // Không có khoảng cách trên
  },

  // Nút tăng/giảm số lượng
  quantityButton: {
    width: 32, // Chiều rộng
    height: 32, // Chiều cao
    borderWidth: 1, // Độ dày viền
    borderColor: '#e0e0e0', // Màu viền (xám nhạt)
    borderRadius: 16, // Bo góc tròn (hình tròn)
    alignItems: 'center', // Căn giữa nội dung
    justifyContent: 'center', // Căn giữa nội dung
    marginHorizontal: 8, // Khoảng cách ngang giữa các nút
  },

  // Văn bản trong nút tăng/giảm
  quantityButtonText: {
    fontSize: 16, // Kích thước chữ
  },

  // Văn bản hiển thị số lượng
  quantityText: {
    marginHorizontal: 8, // Khoảng cách ngang
    fontSize: 16, // Kích thước chữ
  },

  // Container giá và nút xóa
  closeprice: {
    flexDirection: 'column', // Sắp xếp dọc
    alignItems: 'center', // Căn giữa theo chiều ngang
    justifyContent: 'space-between', // Căn đều các phần tử
    height: 80, // Chiều cao cố định
    marginRight: 12, // Khoảng cách từ lề phải
  },

  // Nút xóa sản phẩm
  deleteButton: {
    padding: 8, // Khoảng cách bên trong
  },

  // Giá sản phẩm
  price: {
    fontSize: 16, // Kích thước chữ
    fontWeight: 'bold', // Chữ đậm
  },

  // Container nút thanh toán và xóa
  checkoutContainer: {
    position: 'absolute', // Đặt vị trí tuyệt đối
    bottom: 20, // Cách lề dưới 20px
    left: 15, // Cách lề trái 15px
    right: 15, // Cách lề phải 15px
    backgroundColor: '#008080', // Màu nền (xanh lam đậm)
    padding: 10, // Khoảng cách bên trong
    borderRadius: 25, // Bo góc
    shadowColor: '#000', // Màu bóng
    shadowOffset: { width: 0, height: 4 }, // Độ lệch bóng
    shadowOpacity: 0.3, // Độ mờ bóng
    shadowRadius: 6, // Bán kính bóng
    elevation: 10, // Độ nâng (cho Android)
    alignItems: 'center', // Căn giữa theo chiều ngang
  },

  // Nút xóa các sản phẩm được chọn
  deleteSelectedButton: {
    width: '100%', // Chiếm toàn bộ chiều rộng
    padding: 15, // Khoảng cách bên trong
    backgroundColor: '#ff4444', // Màu nền (đỏ)
    borderRadius: 25, // Bo góc
    alignItems: 'center', // Căn giữa nội dung
    marginBottom: 10, // Khoảng cách dưới
    shadowColor: '#000', // Màu bóng
    shadowOffset: { width: 0, height: 4 }, // Độ lệch bóng
    shadowOpacity: 0.3, // Độ mờ bóng
    shadowRadius: 6, // Bán kính bóng
    elevation: 5, // Độ nâng (cho Android)
  },

  // Văn bản trong nút xóa
  deleteSelectedButtonText: {
    color: 'white', // Màu chữ trắng
    fontSize: 18, // Kích thước chữ
    fontWeight: 'bold', // Chữ đậm
  },

  // Nút "Go to Checkout"
  checkoutButton: {
    width: '100%', // Chiếm toàn bộ chiều rộng
    padding: 15, // Khoảng cách bên trong
    backgroundColor: '#006241', // Màu nền (xanh đậm)
    borderRadius: 25, // Bo góc
    flexDirection: 'row', // Sắp xếp ngang
    justifyContent: 'space-between', // Căn đều hai bên
    maxWidth: 350, // Chiều rộng tối đa
  },

  // Văn bản "Go to Checkout"
  checkoutButtonText: {
    color: 'white', // Màu chữ trắng
    fontSize: 18, // Kích thước chữ
    paddingLeft: 20, // Khoảng cách lề trái
  },

  // Container giá trong nút checkout
  checkoutPrice: {
    backgroundColor: 'darkgreen', // Màu nền (xanh đậm)
    paddingVertical: 6, // Khoảng cách dọc
    paddingHorizontal: 12, // Khoảng cách ngang
    borderRadius: 6, // Bo góc
    width: '35%', // Chiều rộng
    alignItems: 'center', // Căn giữa nội dung
  },

  // Văn bản giá trong nút checkout
  checkoutPriceText: {
    color: 'white', // Màu chữ trắng
    fontSize: 16, // Kích thước chữ
    textAlign: 'center', // Căn giữa văn bản
  },

  // Overlay cho modal (lớp phủ mờ)
  overlay: {
    ...StyleSheet.absoluteFillObject, // Chiếm toàn bộ màn hình
    backgroundColor: 'rgba(0,0,0,0.5)', // Màu nền mờ (đen, độ mờ 50%)
    justifyContent: 'center', // Căn giữa theo chiều dọc
    alignItems: 'center', // Căn giữa theo chiều ngang
  },

  // Hàng ngang trong form checkout
  row: {
    flexDirection: 'row', // Sắp xếp ngang
    justifyContent: 'space-between', // Căn đều hai bên
    alignItems: 'center', // Căn giữa theo chiều dọc
    borderBottomWidth: 1, // Độ dày viền dưới
    borderBottomColor: '#e5e7eb', // Màu viền dưới (xám nhạt)
    paddingVertical: 15, // Khoảng cách dọc
  },

  // Nhãn (label) trong form checkout
  label: {
    color: '#006241', // Màu chữ (xanh đậm)
    fontSize: 20, // Kích thước chữ
    width: 120, // Chiều rộng cố định
  },

  // Phần cuối hàng (giá trị hoặc nút)
  rowEnd: {
    flexDirection: 'row', // Sắp xếp ngang
    alignItems: 'center', // Căn giữa theo chiều dọc
    flex: 1, // Chiếm toàn bộ không gian còn lại
  },

  // Giá trị (như phương thức thanh toán)
  value: {
    color: '#181725', // Màu chữ (đen đậm)
    marginRight: 10, // Khoảng cách từ biểu tượng mũi tên
    fontSize: 16, // Kích thước chữ
  },

  // Trường nhập liệu trong form
  input: {
    backgroundColor: '#E6F1D8', // Màu nền (xanh nhạt)
    paddingHorizontal: 10, // Khoảng cách ngang bên trong
    paddingVertical: 5, // Khoảng cách dọc bên trong
    borderRadius: 5, // Bo góc
    fontSize: 14, // Kích thước chữ
    flex: 1, // Chiếm toàn bộ không gian còn lại
    marginLeft: 10, // Khoảng cách từ nhãn
    borderWidth: 1, // Độ dày viền
    borderColor: '#000', // Màu viền (đen)
  },

  // Văn bản "Apply" cho mã giảm giá
  applyText: {
    color: '#367517', // Màu chữ (xanh lá đậm)
    fontWeight: 'bold', // Chữ đậm
    fontSize: 16, // Kích thước chữ
    paddingHorizontal: 10, // Khoảng cách ngang
  },

  // Nút "Place Order" trong form checkout
  button: {
    backgroundColor: '#EC870E', // Màu nền (xanh lá)
    padding: 15, // Khoảng cách bên trong
    borderRadius: 10, // Bo góc
    alignItems: 'center', // Căn giữa nội dung
    marginTop: 10, // Khoảng cách trên
    borderColor:'#000',
    borderWidth:1,
  },

  // Văn bản trong nút "Place Order"
  buttonText: {
    color: 'white', // Màu chữ trắng
    fontSize: 16, // Kích thước chữ
    fontWeight: '600', // Độ đậm chữ
  },

  // Overlay cho modal xác nhận
  modalOverlay: {
    flex: 1, // Chiếm toàn bộ không gian
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Màu nền mờ (đen, độ mờ 50%)
    justifyContent: 'center', // Căn giữa theo chiều dọc
    alignItems: 'center', // Căn giữa theo chiều ngang
  },

  // Container của modal xác nhận
  modalContainer: {
    backgroundColor: 'white', // Màu nền trắng
    padding: 20, // Khoảng cách bên trong
    borderRadius: 10, // Bo góc
    width: '80%', // Chiều rộng 80% màn hình
    alignItems: 'center', // Căn giữa nội dung
  },

  // Văn bản trong modal xác nhận
  modalText: {
    fontSize: 18, // Kích thước chữ
    marginBottom: 20, // Khoảng cách dưới
    textAlign: 'center', // Căn giữa văn bản
  },

  // Container các nút trong modal
  modalButtons: {
    flexDirection: 'row', // Sắp xếp ngang
    justifyContent: 'space-between', // Căn đều hai bên
    width: '100%', // Chiếm toàn bộ chiều rộng
  },

  // Nút trong modal (chung)
  modalButton: {
    paddingVertical: 10, // Khoảng cách dọc
    paddingHorizontal: 20, // Khoảng cách ngang
    borderRadius: 5, // Bo góc
    width: '45%', // Chiều rộng
    alignItems: 'center', // Căn giữa nội dung
  },

  // Nút "Confirm" trong modal
  confirmButton: {
    backgroundColor: '#ff4444', // Màu nền (đỏ)
  },

  // Nút "Cancel" trong modal
  cancelButton: {
    backgroundColor: '#ccc', // Màu nền (xám)
  },

  // Văn bản trong nút modal
  modalButtonText: {
    color: 'white', // Màu chữ trắng
    fontSize: 16, // Kích thước chữ
  },

  // Container khi giỏ hàng trống
  emptyCart: {
    flex: 1, // Chiếm toàn bộ không gian
    justifyContent: 'center', // Căn giữa theo chiều dọc
    alignItems: 'center', // Căn giữa theo chiều ngang
    padding: 16, // Khoảng cách bên trong
  },

  // Văn bản khi giỏ hàng trống
  emptyCartText: {
    fontSize: 18, // Kích thước chữ
    color: '#6B7280', // Màu chữ (xám)
  },

  // Container biểu tượng trong modal lỗi
  iconContainer: {
    position: 'relative', // Đặt vị trí tương đối
    width: 150, // Chiều rộng
    height: 150, // Chiều cao
    justifyContent: 'center', // Căn giữa theo chiều dọc
    alignItems: 'center', // Căn giữa theo chiều ngang
  },

  // Hình ảnh biểu tượng lỗi
  imageIcon: {
    width: 130, // Chiều rộng
    height: 120, // Chiều cao
    marginLeft: 100, // Dịch sang phải
  },

  // Tiêu đề trong modal lỗi
  title: {
    fontSize: 24, // Kích thước chữ
    fontWeight: '600', // Độ đậm chữ
    color: '#1F2937', // Màu chữ (đen đậm)
    marginBottom: 8, // Khoảng cách dưới
    textAlign: 'center', // Căn giữa văn bản
  },

  // Phụ đề trong modal lỗi
  subtitle: {
    fontSize: 16, // Kích thước chữ
    color: '#4B5563', // Màu chữ (xám đậm)
    marginBottom: 24, // Khoảng cách dưới
    textAlign: 'center', // Căn giữa văn bản
  },

  // Liên kết "Back to home" trong modal lỗi
  linkText: {
    color: 'black', // Màu chữ đen
    fontWeight: 'bold', // Chữ đậm
    fontSize: 16, // Kích thước chữ
    marginTop: 16, // Khoảng cách trên
    textAlign: 'center', // Căn giữa văn bản
  },

  // Container nút đóng modal lỗi
  closeIconContainer: {
    alignSelf: 'flex-end', // Căn sang phải
    marginBottom: 16, // Khoảng cách dưới
  },

  // Giá trong form checkout
  cost: {
    color: '#181725', // Màu chữ (đen đậm)
    fontSize: 16, // Kích thước chữ
    marginVertical: 2, // Khoảng cách dọc
  },

  // Container giá trong form
  costContainer: {
    alignItems: 'flex-end', // Căn sang phải
  },

  // Nội dung trong form checkout
  content: {
    marginBottom: 20, // Khoảng cách dưới
  },

  // Thẻ chứa form checkout
  card: {
    backgroundColor: 'white', // Màu nền trắng
    width: 320, // Chiều rộng cố định
    borderRadius: 20, // Bo góc
    padding: 20, // Khoảng cách bên trong
    shadowColor: '#000', // Màu bóng
    shadowOffset: { width: 0, height: 2 }, // Độ lệch bóng
    shadowOpacity: 0.2, // Độ mờ bóng
    shadowRadius: 8, // Bán kính bóng
    elevation: 5, // Độ nâng (cho Android)
  },
});

export default App;