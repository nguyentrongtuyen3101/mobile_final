import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
    Animated,
    TouchableWithoutFeedback,
} from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getOrdersByAccount, getOrderDetailsByOrder, huydonhang, Order, OrderDetail } from '../../services/orderService';
import SanPhamService from '../../services/sanphamservice';
import baseurl from '../../baseurl';

// Định nghĩa kiểu cho CartItem
interface CartItem {
    title: string;
    subtitle: string;
    price: string;
    image: any; // Có thể là { uri: string } hoặc require
    quantity: number;
}

// Định nghĩa kiểu cho Order (tương thích với dữ liệu từ API)
interface DisplayOrder {
    id: string;
    items: CartItem[];
    placementDate: Date;
    status: 'Preparing Order' | 'Order Shipped' | 'Delivered' | 'Canceled';
    recipientInfo?: {
        name: string;
        phone: string;
        address: string;
    };
    deliveryMethod?: string;
    paymentMethod?: string;
    totalCost?: number;
}

// Hàm ánh xạ dữ liệu từ API Order sang DisplayOrder
const mapOrderToDisplayOrder = (apiOrder: Order, items: CartItem[]): DisplayOrder => {
    const statusMap: { [key: number]: 'Preparing Order' | 'Order Shipped' | 'Delivered' | 'Canceled' } = {
        0: 'Preparing Order',
        1: 'Order Shipped',
        2: 'Delivered',
        3: 'Canceled',
    };

    return {
        id: apiOrder.id?.toString() || '',
        items: items,
        placementDate: new Date(), // Giả lập ngày đặt hàng, bạn có thể thêm trường ngayDatHang vào OrderResponseDTO nếu cần
        status: statusMap[apiOrder.status || 0] || 'Preparing Order',
        recipientInfo: {
            name: apiOrder.hoTen,
            phone: apiOrder.sdt || '',
            address: apiOrder.diachigiaohang,
        },
        deliveryMethod: 'Standard Shipping', // Giả lập, bạn có thể thêm trường này vào OrderResponseDTO nếu cần
        paymentMethod: apiOrder.phuongthucthanhtoan ? 'Online Payment' : 'Cash on Delivery',
        totalCost: apiOrder.tongtien,
    };
};

// Hàm tính ngày dự kiến giao hàng (1 ngày sau ngày đặt hàng)
const getExpectedDeliveryDate = (placementDate: Date): string => {
    const deliveryDate = new Date(placementDate);
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    return deliveryDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Component hiển thị sản phẩm trong overlay
const OrderItemDetail: React.FC<{ item: CartItem }> = ({ item }) => {
    const price = parseFloat(item.price.replace('$', '')) * item.quantity;
    return (
        <View style={styles.detailItem}>
            <Image source={item.image} style={styles.detailImage} />
            <View style={styles.detailInfo}>
                <Text style={styles.detailName}>{item.title}</Text>
                <Text style={styles.detailSubtitle}>{item.subtitle}</Text>
                <Text style={styles.detailPrice}>
                    ${price.toFixed(2)} (x{item.quantity})
                </Text>
            </View>
        </View>
    );
};

// Component hiển thị thông tin từng đơn hàng
const OrderItem: React.FC<{
    order: DisplayOrder;
    onCancel?: (orderId: string) => void;
    onShowDetails: (order: DisplayOrder) => void;
}> = ({ order, onCancel, onShowDetails }) => {
    const totalCost = order.totalCost || order.items.reduce((total: number, item: CartItem) => {
        const price = parseFloat(item.price.replace('$', '')) * item.quantity;
        return total + price;
    }, 0);

    // Lấy sản phẩm đầu tiên làm đại diện
    const representativeItem = order.items[0];

    // Ánh xạ trạng thái sang màu sắc
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Preparing Order':
                return styles.statusPreparing;
            case 'Order Shipped':
                return styles.statusShipped;
            case 'Delivered':
                return styles.statusDelivered;
            case 'Canceled':
                return styles.statusCanceled;
            default:
                return styles.statusPreparing;
        }
    };

    return (
        <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <Text style={styles.orderDate}>
                    Placed on {order.placementDate.toLocaleDateString('en-US')}
                </Text>
            </View>
            <View style={styles.orderDetails}>
                <Text style={[styles.orderStatus, getStatusStyle(order.status)]}>
                    Status: {order.status}
                </Text>
                <Text style={styles.deliveryDate}>
                    Expected Delivery: {getExpectedDeliveryDate(order.placementDate)}
                </Text>
                {order.recipientInfo && (
                    <>
                        <Text style={styles.orderInfo}>Recipient: {order.recipientInfo.name}</Text>
                        <Text style={styles.orderInfo}>Phone: {order.recipientInfo.phone}</Text>
                        <Text style={styles.orderInfo}>Address: {order.recipientInfo.address}</Text>
                    </>
                )}
                {order.deliveryMethod && (
                    <Text style={styles.orderInfo}>Delivery: {order.deliveryMethod}</Text>
                )}
                {order.paymentMethod && (
                    <Text style={styles.orderInfo}>Payment: {order.paymentMethod}</Text>
                )}
                <Text style={styles.orderTotal}>Total: ${totalCost.toFixed(2)}</Text>
            </View>
            <View style={styles.orderItems}>
                <TouchableOpacity onPress={() => onShowDetails(order)}>
                    <View style={styles.itemRow}>
                        <Image source={representativeItem.image} style={styles.itemImage} />
                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>{representativeItem.title}</Text>
                            <Text style={styles.itemSubtitle}>{representativeItem.subtitle}</Text>
                            <Text style={styles.itemPrice}>
                                ${(parseFloat(representativeItem.price.replace('$', '')) * representativeItem.quantity).toFixed(2)} (x{representativeItem.quantity})
                            </Text>
                            {order.items.length > 1 && (
                                <Text style={styles.viewMoreText}>
                                    +{order.items.length - 1} more items
                                </Text>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
            {onCancel && order.status === 'Preparing Order' && (
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => onCancel(order.id)}
                >
                    <Text style={styles.cancelButtonText}>Cancel Order</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const OrderTrackingScreen: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [showDetails, setShowDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<DisplayOrder | null>(null);
    const [orders, setOrders] = useState<DisplayOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const blurAnim = useRef(new Animated.Value(1)).current;

    // Lấy danh sách đơn hàng khi component mount
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const response = await getOrdersByAccount();
                console.log('Orders response:', response); // Log để kiểm tra dữ liệu
                const fetchedOrders = await Promise.all(
                    response.orders.map(async (apiOrder: Order) => {
                        // Gọi API lấy chi tiết đơn hàng
                        const orderDetailsResponse = await getOrderDetailsByOrder(apiOrder.id!);
                        console.log('Order details response:', orderDetailsResponse); // Log để kiểm tra
                        const items: CartItem[] = await Promise.all(
                            orderDetailsResponse.orderDetails.map(async (detail: OrderDetail) => {
                                // Kiểm tra idSanpham có tồn tại không
                                if (detail.idSanpham == null) {
                                    console.warn(`idSanpham is undefined for detail:`, detail);
                                    return {
                                        title: `Unknown Product`,
                                        subtitle: `Product ID: N/A`,
                                        price: `$${detail.giatien || 0}`,
                                        image: { uri: 'https://via.placeholder.com/150' }, // Ảnh placeholder
                                        quantity: detail.soluong,
                                    };
                                }

                                try {
                                    // Gọi API để lấy chi tiết sản phẩm
                                    const product = await SanPhamService.getSanPhamById(detail.idSanpham);
                                    return {
                                        title: product.tenSanPham || `Product ${detail.idSanpham}`,
                                        subtitle: `Product ID: ${detail.idSanpham}`,
                                        price: `$${detail.giatien}`,
                                        image: { uri: `${baseurl}${product.duongDanAnh}` }, // Đảm bảo đường dẫn ảnh đầy đủ
                                        quantity: detail.soluong,
                                    };
                                } catch (error) {
                                    console.error(`Error fetching product ${detail.idSanpham}:`, error);
                                    return {
                                        title: `Product ${detail.idSanpham}`,
                                        subtitle: `Product ID: ${detail.idSanpham}`,
                                        price: `$${detail.giatien}`,
                                        image: { uri: 'https://via.placeholder.com/150' }, // Ảnh placeholder từ URL
                                        quantity: detail.soluong,
                                    };
                                }
                            })
                        );
                        return mapOrderToDisplayOrder(apiOrder, items);
                    })
                );
                setOrders(fetchedOrders);
            } catch (error) {
                console.error('Fetch orders error:', error);
                Alert.alert('Error', error instanceof Error ? error.message : 'Không thể lấy danh sách đơn hàng');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: showDetails ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(blurAnim, {
                toValue: showDetails ? 0.3 : 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [showDetails]);

    // Chỉ các đơn hàng có status là Preparing Order (0), Order Shipped (1), hoặc Canceled (3) nằm ở Active Orders
    const activeOrders = orders.filter((order: DisplayOrder) =>
        ['Preparing Order', 'Order Shipped', 'Canceled'].includes(order.status)
    );
    // Chỉ các đơn hàng có status là Delivered (2) nằm ở Purchase History
    const historyOrders = orders.filter((order: DisplayOrder) =>
        order.status === 'Delivered'
    );

    const handleCancelOrder = (orderId: string, currentStatus: string) => {
        // Validate: Chỉ cho phép hủy khi status là 0 (Preparing Order)
        if (currentStatus !== 'Preparing Order') {
            Alert.alert('Cannot Cancel', 'This order cannot be canceled as it has already been processed.');
            return;
        }

        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await huydonhang(parseInt(orderId)); // Gọi API để hủy đơn hàng
                            // Cập nhật trạng thái đơn hàng sau khi hủy
                            setOrders((prevOrders) =>
                                prevOrders.map((order) =>
                                    order.id === orderId ? { ...order, status: 'Canceled' } : order
                                )
                            );
                            Alert.alert('Success', 'Order has been canceled.');
                        } catch (error) {
                            Alert.alert('Error', error instanceof Error ? error.message : 'Không thể hủy đơn hàng');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleShowDetails = (order: DisplayOrder) => {
        setSelectedOrder(order);
        setShowDetails(true);
    };

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.mainContent, { opacity: blurAnim }]}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                            Active Orders
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                            Purchase History
                        </Text>
                    </TouchableOpacity>
                </View>
                {loading ? (
                    <View style={styles.emptyOrders}>
                        <Text style={styles.emptyOrdersText}>Loading orders...</Text>
                    </View>
                ) : activeTab === 'active' ? (
                    activeOrders.length === 0 ? (
                        <View style={styles.emptyOrders}>
                            <Text style={styles.emptyOrdersText}>No active orders found</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.orderList}>
                            {activeOrders.map((order: DisplayOrder) => (
                                <OrderItem
                                    key={order.id}
                                    order={order}
                                    onCancel={(orderId) => handleCancelOrder(orderId, order.status)}
                                    onShowDetails={handleShowDetails}
                                />
                            ))}
                        </ScrollView>
                    )
                ) : (
                    historyOrders.length === 0 ? (
                        <View style={styles.emptyOrders}>
                            <Text style={styles.emptyOrdersText}>No purchase history found</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.orderList}>
                            {historyOrders.map((order: DisplayOrder) => (
                                <OrderItem
                                    key={order.id}
                                    order={order}
                                    onShowDetails={handleShowDetails}
                                />
                            ))}
                        </ScrollView>
                    )
                )}
            </Animated.View>

            {showDetails && selectedOrder && (
                <TouchableWithoutFeedback
                    onPress={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowDetails(false);
                            setSelectedOrder(null);
                        }
                    }}
                >
                    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                        <View style={styles.card}>
                            <View style={styles.header}>
                                <Text style={styles.headerText}>Order #{selectedOrder.id} Items</Text>
                            </View>
                            <ScrollView style={styles.detailContent}>
                                {selectedOrder.items.map((item: CartItem, index: number) => (
                                    <OrderItemDetail key={index} item={item} />
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => {
                                    setShowDetails(false);
                                    setSelectedOrder(null);
                                }}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </TouchableWithoutFeedback>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Định dạng cho container chính của màn hình
        flex: 1,
        backgroundColor: '#000',
    },
    mainContent: {
        // Định dạng cho khu vực nội dung chính (dùng với Animated.View để tạo hiệu ứng mờ)
        flex: 1,
    },
    header: {
        // Định dạng cho phần tiêu đề của thẻ overlay
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        // Định dạng cho văn bản tiêu đề trong thẻ overlay
        fontSize: 25,
        fontWeight: 'bold',
        color: '#006241',
    },
    tabContainer: {
        // Định dạng cho khu vực chứa các tab (Active Orders và Purchase History)
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginHorizontal: 16,
        marginBottom: 8,
    },
    tabButton: {
        // Định dạng cho các nút tab
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabButtonActive: {
        // Định dạng cho nút tab đang được chọn (có đường viền dưới)
        borderBottomWidth: 2,
        borderBottomColor: '#EC870E',
    },
    tabText: {
        // Định dạng cho văn bản của tab (trạng thái mặc định)
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    tabTextActive: {
        // Định dạng cho văn bản của tab đang được chọn
        color: '#EC870E',
    },
    emptyOrders: {
        // Định dạng cho khu vực hiển thị thông báo khi không có đơn hàng
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    emptyOrdersText: {
        // Định dạng cho văn bản thông báo khi không có đơn hàng
        fontSize: 18,
        color: '#6B7280',
    },
    orderList: {
        // Định dạng cho danh sách đơn hàng có thể cuộn
        padding: 16,
    },
    orderItem: {
        // Định dạng cho từng thẻ đơn hàng
        backgroundColor: '#FEEBD0',
        borderRadius: 10,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        // Định dạng cho phần tiêu đề của mỗi đơn hàng (ID đơn hàng và ngày đặt)
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    orderId: {
        // Định dạng cho văn bản ID đơn hàng
        fontSize: 16,
        fontWeight: 'bold',
        color: '#181725',
    },
    orderDate: {
        // Định dạng cho văn bản ngày đặt hàng
        fontSize: 14,
        color: '#6B7280',
    },
    orderDetails: {
        // Định dạng cho phần chi tiết của mỗi đơn hàng
        marginBottom: 12,
    },
    orderStatus: {
        // Định dạng cơ bản cho văn bản trạng thái đơn hàng (có nền và viền)
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        borderWidth: 1,
        textAlign: 'center',
    },
    statusPreparing: {
        // Định dạng cho trạng thái "Preparing Order" (màu xám)
        backgroundColor: '#6c757d', // Xám (Bootstrap gray)
        borderColor: '#5a6268',
        color: 'white',
    },
    statusShipped: {
        // Định dạng cho trạng thái "Order Shipped" (màu tím)
        backgroundColor: '#6f42c1', // Tím (Bootstrap indigo)
        borderColor: '#5e37a6',
        color: 'white',
    },
    statusDelivered: {
        // Định dạng cho trạng thái "Delivered" (màu xanh)
        backgroundColor: '#28a745', // Xanh (Bootstrap success)
        borderColor: '#218838',
        color: 'white',
    },
    statusCanceled: {
        // Định dạng cho trạng thái "Canceled" (màu đỏ)
        backgroundColor: '#dc3545', // Đỏ (Bootstrap danger)
        borderColor: '#c82333',
        color: 'white',
    },
    deliveryDate: {
        // Định dạng cho văn bản ngày giao hàng dự kiến
        fontSize: 14,
        color: '#181725',
        marginBottom: 4,
    },
    orderInfo: {
        // Định dạng cho văn bản thông tin đơn hàng (người nhận, số điện thoại, địa chỉ, v.v.)
        fontSize: 14,
        color: '#181725',
        marginBottom: 4,
    },
    orderTotal: {
        // Định dạng cho văn bản tổng chi phí của đơn hàng
        fontSize: 16,
        fontWeight: 'bold',
        color: '#181725',
        marginTop: 4,
    },
    orderItems: {
        // Định dạng cho phần danh sách sản phẩm của mỗi đơn hàng
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 12,
        marginBottom: 12,
    },
    itemRow: {
        // Định dạng cho mỗi hàng sản phẩm trong đơn hàng (ảnh và thông tin)
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemImage: {
        // Định dạng cho ảnh sản phẩm trong mỗi hàng
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        // Định dạng cho khu vực chứa thông tin sản phẩm trong mỗi hàng
        flex: 1,
    },
    itemName: {
        // Định dạng cho văn bản tên sản phẩm trong mỗi hàng
        fontSize: 14,
        fontWeight: 'bold',
        color: '#181725',
    },
    itemSubtitle: {
        // Định dạng cho văn bản phụ đề sản phẩm trong mỗi hàng
        fontSize: 12,
        color: '#6B7280',
    },
    itemPrice: {
        // Định dạng cho văn bản giá sản phẩm trong mỗi hàng
        fontSize: 12,
        color: '#181725',
        fontWeight: '600',
    },
    viewMoreText: {
        // Định dạng cho văn bản "xem thêm sản phẩm" trong mỗi hàng
        fontSize: 12,
        color: '#53B175',
        marginTop: 4,
    },
    cancelButton: {
        // Định dạng cho nút hủy đơn hàng
        backgroundColor: '#FF4D4F',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        // Định dạng cho văn bản của nút hủy đơn hàng
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    overlay: {
        // Định dạng cho nền overlay (hiển thị khi xem chi tiết đơn hàng)
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        // Định dạng cho thẻ overlay (chứa chi tiết đơn hàng)
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
    detailContent: {
        // Định dạng cho khu vực nội dung có thể cuộn trong thẻ overlay
        maxHeight: 400,
        marginBottom: 20,
    },
    detailItem: {
        // Định dạng cho mỗi sản phẩm trong thẻ overlay (chi tiết đơn hàng)
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    detailImage: {
        // Định dạng cho ảnh sản phẩm trong thẻ overlay
        width: 64,
        height: 64,
        borderRadius: 8,
        marginRight: 12,
    },
    detailInfo: {
        // Định dạng cho khu vực chứa thông tin sản phẩm trong thẻ overlay
        flex: 1,
    },
    detailName: {
        // Định dạng cho văn bản tên sản phẩm trong thẻ overlay
        fontSize: 16,
        fontWeight: 'bold',
        color: '#181725',
    },
    detailSubtitle: {
        // Định dạng cho văn bản phụ đề sản phẩm trong thẻ overlay
        fontSize: 14,
        color: '#6B7280',
    },
    detailPrice: {
        // Định dạng cho văn bản giá sản phẩm trong thẻ overlay
        fontSize: 14,
        color: '#181725',
        fontWeight: '600',
    },
    closeButton: {
        // Định dạng cho nút đóng trong thẻ overlay
        backgroundColor: '#53B175',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        // Định dạng cho văn bản của nút đóng trong thẻ overlay numberone!!!!
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OrderTrackingScreen;