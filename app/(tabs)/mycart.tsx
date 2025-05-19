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
import { getCartItems, removeFromCart, CartItem } from '../../services/muasamservice';
import { addOrder, findDiscount, Order, OrderDetail, Discount } from '../../services/orderService';
import { showAccount } from '../../services/authService';
import SanPhamService from '../../services/sanphamservice';

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
  const [stock, setStock] = useState<number | null>(null);

  // Lấy số lượng tồn kho khi render
  useEffect(() => {
    const fetchStock = async () => {
      const stock = await getProductStock(item.sanPhamId);
      setStock(stock);
    };
    fetchStock();
  }, [item.sanPhamId]);

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
        {stock !== null && (
          <Text style={styles.stockText}>Tồn kho: {stock}</Text>
        )}
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

// Cache để lưu số lượng tồn kho
const stockCache = new Map<number, number>();

// Hàm lấy số lượng tồn kho
const getProductStock = async (sanPhamId: number): Promise<number> => {
  if (stockCache.has(sanPhamId)) {
    return stockCache.get(sanPhamId)!;
  }
  try {
    const product = await SanPhamService.getSanPhamById(sanPhamId);
    stockCache.set(sanPhamId, product.soLuong);
    return product.soLuong;
  } catch (error) {
    console.error(`Lỗi khi lấy số lượng tồn kho cho sản phẩm ${sanPhamId}:`, error);
    return 0;
  }
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

    // Tìm sản phẩm trong giỏ hàng
    const item = cartItems.find((item) => item.id === id);
    if (!item) return;

    // Lấy số lượng tồn kho
    const stock = await getProductStock(item.sanPhamId);

    // Kiểm tra số lượng mới có vượt quá tồn kho không
    if (newQuantity > stock) {
      Alert.alert('Lỗi', `Số lượng vượt quá tồn kho. Chỉ còn ${stock} sản phẩm.`);
      return;
    }

    // Cập nhật số lượng nếu hợp lệ
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

    // Kiểm tra số lượng tồn kho cho tất cả sản phẩm được chọn
    for (const id of checkedItems) {
      const item = cartItems.find((item) => item.id === id);
      if (!item) continue;

      const stock = await getProductStock(item.sanPhamId);
      if (item.quantity > stock) {
        Alert.alert('Lỗi', `Sản phẩm ${item.title} vượt quá tồn kho. Chỉ còn ${stock} sản phẩm.`);
        return;
      }
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
            idSanpham: item.sanPhamId,
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
  container: {
    flex: 1,
    backgroundColor: '#EC870E',
  },
  myCart: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#945305',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  selectAllText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 100,
  },
  cartItems: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FEEBD0',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDetailsText: {
    color: 'gray',
    marginBottom: 8,
  },
  stockText: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  quantityButtonText: {
    fontSize: 16,
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 16,
  },
  closeprice: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
    marginRight: 12,
  },
  deleteButton: {
    padding: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  deleteSelectedButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#006241',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 350,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    paddingLeft: 20,
  },
  checkoutPrice: {
    backgroundColor: 'darkgreen',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    width: '35%',
    alignItems: 'center',
  },
  checkoutPriceText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 15,
  },
  label: {
    color: '#006241',
    fontSize: 20,
    width: 120,
  },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  value: {
    color: '#181725',
    marginRight: 10,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#E6F1D8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  applyText: {
    color: '#367517',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#EC870E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderColor: '#000',
    borderWidth: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#ff4444',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#6B7280',
  },
  iconContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIcon: {
    width: 130,
    height: 120,
    marginLeft: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  linkText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  closeIconContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  cost: {
    color: '#181725',
    fontSize: 16,
    marginVertical: 2,
  },
  costContainer: {
    alignItems: 'flex-end',
  },
  content: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    width: 320,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default App;//hello final end game
