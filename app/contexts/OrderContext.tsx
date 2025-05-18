import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
    title: string;
    subtitle: string;
    price: string;
    image: any;
    quantity: number;
}

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

interface OrderContextType {
    orders: Order[];
    addOrder: (order: Order) => void;
    removeOrder: (orderId: string) => void;
    updateOrderStatus: (orderId: string, status: Order['status']) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [orders, setOrders] = useState<Order[]>([]);

    const addOrder = (order: Order) => {
        setOrders(prev => [...prev, order]);
    };

    const removeOrder = (orderId: string) => {
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId ? { ...order, status: 'Canceled' } : order
            )
        );
    };

    const updateOrderStatus = (orderId: string, status: Order['status']) => {
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId ? { ...order, status } : order
            )
        );
    };

    // Mock timer to simulate status changes (for testing)
    useEffect(() => {
        const timer = setInterval(() => {
            setOrders(prev =>
                prev.map(order => {
                    if (order.status === 'Preparing Order' && Math.random() > 0.8) {
                        return { ...order, status: 'Order Shipped' };
                    } else if (order.status === 'Order Shipped' && Math.random() > 0.8) {
                        return { ...order, status: 'Delivered' };
                    }
                    return order;
                })
            );
        }, 30000); // Check every 30 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <OrderContext.Provider value={{ orders, addOrder, removeOrder, updateOrderStatus }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrder = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrder must be used within an OrderProvider');
    }
    return context;
};