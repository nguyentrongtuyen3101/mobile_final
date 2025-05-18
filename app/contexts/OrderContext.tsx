import React, { createContext, useContext, useState, ReactNode } from 'react';
import * as orderService from '../../services/orderService';

// Định nghĩa các interface (phải khớp với orderService.ts)
export interface Order {
  id?: number;
  idAccount: number;
  hoTen: string;
  sdt?: string;
  diachigiaohang: string;
  phuongthucthanhtoan: boolean;
  tongtien: number;
  status?: number;
}

export interface OrderDetail {
  id?: number;
  idOrder: number;
  idSanpham: number;
  soluong: number;
  giatien: number;
  tongtiensanpham: number;
}

export interface Discount {
  id?: number;
  idAccount: number;
  maKhuyenMai: string;
  giaTien: number;
}

interface OrderContextType {
  currentOrder: Order | null;
  orderDetails: OrderDetail[];
  discount: Discount | null;
  setCurrentOrder: (order: Order | null) => void;
  setOrderDetails: (details: OrderDetail[]) => void;
  setDiscount: (discount: Discount | null) => void;
  addOrder: (orderData: { order: Order; orderDetails: OrderDetail[] }) => Promise<void>;
  findDiscount: (discountCode: string) => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        orderDetails,
        discount,
        setCurrentOrder,
        setOrderDetails,
        setDiscount,
        addOrder: async (orderData: { order: Order; orderDetails: OrderDetail[] }) => {
          try {
            // Gọi API để tạo đơn hàng
            await orderService.addOrder(orderData);
            // API trả về orderId trong response, nhưng không trả về toàn bộ Order object
            // Vì vậy, ta sẽ cập nhật orderData.order với id từ response nếu cần
            setCurrentOrder({
              ...orderData.order,
              id: undefined, // API không trả về id trong trường hợp này, để undefined
            });
            setOrderDetails(orderData.orderDetails);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi khi tạo đơn hàng');
          }
        },
        findDiscount: async (discountCode: string) => {
          try {
            const discountResult = await orderService.findDiscount(discountCode);
            setDiscount(discountResult);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi khi tìm mã giảm giá');
          }
        },
        error,
        setError,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};