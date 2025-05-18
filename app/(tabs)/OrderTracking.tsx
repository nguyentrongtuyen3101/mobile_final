import React, { useState, useRef } from 'react';
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
import { useOrder } from '../contexts/OrderContext';

// Định nghĩa kiểu cho CartItem
interface CartItem {
    title: string;
    subtitle: string;
    price: string;
    image: any;
    quantity: number;
}

// Định nghĩa kiểu cho Order
interface Order {
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
    order: Order;
    onCancel?: (orderId: string) => void;
    onShowDetails: (order: Order) => void;
}> = ({ order, onCancel, onShowDetails }) => {
    const totalCost = order.totalCost || order.items.reduce((total: number, item: CartItem) => {
        const price = parseFloat(item.price.replace('$', '')) * item.quantity;
        return total + price;
    }, 0);

    // Lấy sản phẩm đầu tiên làm đại diện
    const representativeItem = order.items[0];

    return (
        <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id}</Text>
                <Text style={styles.orderDate}>
                    Placed on {order.placementDate.toLocaleDateString('en-US')}
                </Text>
            </View>
            <View style={styles.orderDetails}>
                <Text style={styles.orderStatus}>Status: {order.status}</Text>
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
            {order.status === 'Preparing Order' && onCancel && (
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
    const { orders, removeOrder } = useOrder();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [showDetails, setShowDetails] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const blurAnim = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
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

    const activeOrders = orders.filter((order: Order) =>
        ['Preparing Order', 'Order Shipped'].includes(order.status)
    );
    const historyOrders = orders.filter((order: Order) =>
        ['Delivered', 'Canceled'].includes(order.status)
    );

    const handleCancelOrder = (orderId: string) => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: () => {
                        removeOrder(orderId);
                        Alert.alert('Success', 'Order has been canceled.');
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleShowDetails = (order: Order) => {
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
                {activeTab === 'active' ? (
                    activeOrders.length === 0 ? (
                        <View style={styles.emptyOrders}>
                            <Text style={styles.emptyOrdersText}>No active orders found</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.orderList}>
                            {activeOrders.map((order: Order) => (
                                <OrderItem
                                    key={order.id}
                                    order={order}
                                    onCancel={handleCancelOrder}
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
                            {historyOrders.map((order: Order) => (
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
        flex: 1,
        backgroundColor: 'white',
    },
    mainContent: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#181725',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginHorizontal: 16,
        marginBottom: 8,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabButtonActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#53B175',
    },
    tabText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#53B175',
    },
    emptyOrders: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    emptyOrdersText: {
        fontSize: 18,
        color: '#6B7280',
    },
    orderList: {
        padding: 16,
    },
    orderItem: {
        backgroundColor: '#F9FAFB',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#181725',
    },
    orderDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    orderDetails: {
        marginBottom: 12,
    },
    orderStatus: {
        fontSize: 16,
        color: '#53B175',
        fontWeight: '600',
        marginBottom: 4,
    },
    deliveryDate: {
        fontSize: 14,
        color: '#181725',
        marginBottom: 4,
    },
    orderInfo: {
        fontSize: 14,
        color: '#181725',
        marginBottom: 4,
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#181725',
        marginTop: 4,
    },
    orderItems: {
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 12,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#181725',
    },
    itemSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    itemPrice: {
        fontSize: 12,
        color: '#181725',
        fontWeight: '600',
    },
    viewMoreText: {
        fontSize: 12,
        color: '#53B175',
        marginTop: 4,
    },
    cancelButton: {
        backgroundColor: '#FF4D4F',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
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
    detailContent: {
        maxHeight: 400,
        marginBottom: 20,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    detailImage: {
        width: 64,
        height: 64,
        borderRadius: 8,
        marginRight: 12,
    },
    detailInfo: {
        flex: 1,
    },
    detailName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#181725',
    },
    detailSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    detailPrice: {
        fontSize: 14,
        color: '#181725',
        fontWeight: '600',
    },
    closeButton: {
        backgroundColor: '#53B175',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OrderTrackingScreen;