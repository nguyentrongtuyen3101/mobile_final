import AsyncStorage from '@react-native-async-storage/async-storage';
import baseurl from '../baseurl';

// Interface khớp với OrderResponseDTO từ backend
export interface Order {
  id?: number;
  idAccount?: number;
  idDiscount?: number;
  hoTen: string;
  sdt?: string;
  diachigiaohang: string;
  phuongthucthanhtoan: boolean;
  tongtien: number;
  status?: number;
}

// Interface khớp với OrderDetailResponseDTO từ backend
export interface OrderDetail {
  id?: number;
  idOrder?: number;
  idSanpham?: number;
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

// Lấy danh sách đơn hàng
export const getOrdersByAccount = async (): Promise<{ message: string; orders: Order[] }> => {
  const token = await AsyncStorage.getItem('authToken');
  console.log('Token:', token);
  if (!token) {
    throw new Error('Không tìm thấy token');
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/get-orders-by-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    const data = await response.json();

    if (!response.ok) {
      console.error('Error data:', data);
      throw new Error(data.message || 'Đã xảy ra lỗi khi lấy danh sách đơn hàng');
    }

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};

// Lấy chi tiết đơn hàng theo orderId
export const getOrderDetailsByOrder = async (orderId: number): Promise<{ message: string; orderDetails: OrderDetail[] }> => {
  const token = await AsyncStorage.getItem('authToken');
  console.log('Token:', token);
  if (!token) {
    throw new Error('Không tìm thấy token');
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/get-order-details-by-order?orderId=${orderId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    const data = await response.json();

    if (!response.ok) {
      console.error('Error data:', data);
      throw new Error(data.message || 'Đã xảy ra lỗi khi lấy chi tiết đơn hàng');
    }

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};

// Thêm đơn hàng
export const addOrder = async (orderData: { order: Order; orderDetails: OrderDetail[] }): Promise<void> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    throw new Error('Không tìm thấy token');
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/add-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order: orderData.order,
        orderDetails: orderData.orderDetails,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Đã xảy ra lỗi khi tạo đơn hàng');
    }

    console.log('Thêm đơn hàng thành công:', data);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};

// Tìm mã giảm giá
export const findDiscount = async (discountCode: string): Promise<Discount> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    throw new Error('Không tìm thấy token');
  }

  try {
    const response = await fetch(`${baseurl}/checkmobile/find-discount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        discountCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Đã xảy ra lỗi khi tìm mã giảm giá');
    }

    const discount: Discount = {
      id: data.id || undefined,
      idAccount: data.idAccount || 0,
      maKhuyenMai: data.maKhuyenMai || '',
      giaTien: data.giaTien || 0,
    };

    return discount;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};
// Hàm mới: Hủy đơn hàng bằng cách gọi API update-order-status
export const huydonhang = async (orderId: number): Promise<void> => {
  const token = await AsyncStorage.getItem('authToken');
  console.log('Token:', token);
  if (!token) {
    throw new Error('Không tìm thấy token');
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/update-order-status?orderId=${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    const data = await response.json();

    if (!response.ok) {
      console.error('Error data:', data);
      throw new Error(data.message || 'Đã xảy ra lỗi khi hủy đơn hàng');
    }

    console.log('Hủy đơn hàng thành công:', data);
  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};