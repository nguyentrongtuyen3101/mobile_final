import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartItem {
    id: number;
    title: string;
    subtitle: string;
    price: string;
    image: any;
    quantity: number;
}

interface CartContextValue {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
    setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
        setCartItems((prevItems) => {
            const existingItem = prevItems.find((cartItem) => cartItem.title === item.title);
            if (existingItem) {
                // Nếu sản phẩm đã tồn tại, cập nhật số lượng bằng cách cộng dồn quantity mới
                return prevItems.map((cartItem) =>
                    cartItem.title === item.title
                        ? { ...cartItem, quantity: cartItem.quantity + (item.quantity || 1) }
                        : cartItem
                );
            }
            // Nếu sản phẩm chưa tồn tại, thêm mới với quantity được truyền vào
            return [...prevItems, { ...item, quantity: item.quantity || 1 }];
        });
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, setCartItems }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = (): CartContextValue => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};