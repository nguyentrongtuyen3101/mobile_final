import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import baseurl from '../baseurl';

// Định nghĩa kiểu dữ liệu cho giỏ hàng (dựa trên GioHangResponseDTO từ server)
interface GioHangItem {
  id: number;
  accountId: number;
  sanPhamId: number;
  tenSanPham: string;
  duongDanAnh: string;
  giaTien: number;
  soLuong: number;
}

// Định nghĩa kiểu dữ liệu cho yêu thích (YeuThichDTO)
interface YeuThichDTO {
  sanPhamId: number;
}

// Định nghĩa kiểu dữ liệu phản hồi yêu thích (YeuthichResponseDTO)
interface YeuthichResponseDTO {
  id: number;
  accountId: number;
  sanPhamId: number;
  message?: string;
  tenSanPham?: string;
  duongDanAnh?: string;
  giaTien?: number;
}

// Định nghĩa kiểu dữ liệu cho lỗi từ API
interface ErrorResponse {
  message: string;
}

// Định nghĩa kiểu dữ liệu CartItem cho client
interface CartItem {
  id: number; // ID của giỏ hàng
  sanPhamId: number; // Thêm sanPhamId để sử dụng khi chuyển hướng
  title: string;
  subtitle: string;
  price: string;
  image: any;
  quantity: number;
}

interface AddCartRequest {
  sanPhamId: number;
  soLuong: number;
}

// Gọi API để thêm sản phẩm vào giỏ hàng
export const addToCart = async (request: AddCartRequest): Promise<boolean> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token trong AsyncStorage');
    return false;
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/themgiohang`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ server khi thêm vào giỏ hàng:', data.message || 'Không xác định');
      return false;
    }

    console.log('Thêm vào giỏ hàng thành công:', data);
    return true;
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error);
    return false;
  }
};

// Gọi API để lấy danh sách giỏ hàng
export const getCartItems = async (): Promise<CartItem[] | null> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token trong AsyncStorage');
    return null;
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/giohang`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ server khi lấy giỏ hàng:', data.message || 'Không xác định');
      return null;
    }

    const cartItems: CartItem[] = (data as GioHangItem[]).map((item) => ({
      id: item.id,
      sanPhamId: item.sanPhamId,
      title: item.tenSanPham,
      subtitle: `${item.soLuong} items`,
      price: `$${item.giaTien}`,
      image: { uri: `${baseurl}${item.duongDanAnh}` },
      quantity: item.soLuong,
    }));

    console.log('Danh sách giỏ hàng:', cartItems);
    return cartItems;
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error);
    return null;
  }
};

// Gọi API để xóa sản phẩm khỏi giỏ hàng (đơn giản hóa giống xoayeuthich)
export const removeFromCart = async (gioHangId: number): Promise<boolean> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token trong AsyncStorage');
    return false;
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/xoagiohang?id=${gioHangId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ server khi xóa giỏ hàng:', data.message || 'Không xác định');
      return false;
    }

    console.log('Xóa sản phẩm khỏi giỏ hàng thành công:', data);
    return true;
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', error);
    return false;
  }
};

// Gọi API để thêm sản phẩm vào danh sách yêu thích
export const themyeuthich = async (request: YeuThichDTO): Promise<YeuthichResponseDTO | null> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token trong AsyncStorage');
    return null;
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/themyeuthich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ server khi thêm vào yêu thích:', data.message || 'Không xác định');
      return null;
    }

    console.log('Thêm vào yêu thích thành công:', data);
    return data as YeuthichResponseDTO;
  } catch (error) {
    console.error('Lỗi khi thêm vào yêu thích:', error);
    return null;
  }
};

// Gọi API để lấy danh sách yêu thích
export const showyeuthich = async (): Promise<YeuthichResponseDTO[] | null> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token trong AsyncStorage');
    return null;
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/showyeuthich`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ server khi lấy danh sách yêu thích:', data.message || 'Không xác định');
      return null;
    }

    console.log('Danh sách yêu thích:', data);
    return data as YeuthichResponseDTO[];
  } catch (error) {
    console.error('Lỗi khi lấy danh sách yêu thích:', error);
    return null;
  }
};

// Gọi API để xóa sản phẩm khỏi danh sách yêu thích
export const xoayeuthich = async (yeuthichId: number): Promise<boolean> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token trong AsyncStorage');
    return false;
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/xoayeuthich?id=${yeuthichId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ server khi xóa yêu thích:', data.message || 'Không xác định');
      return false;
    }

    console.log('Xóa sản phẩm khỏi yêu thích thành công:', data);
    return true;
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm khỏi yêu thích:', error);
    return false;
  }
};
// Gọi API để kiểm tra sản phẩm có trong danh sách yêu thích không
export const checkFavourite = async (sanPhamId: number): Promise<boolean> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token trong AsyncStorage');
    return false;
  }

  try {
    const response = await fetch(`${baseurl}/sanphammagager/check-favourite?sanPhamId=${sanPhamId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data: any = await response.json();

    if (!response.ok) {
      console.error('Lỗi từ server khi kiểm tra yêu thích:', data.message || 'Không xác định');
      return false;
    }

    console.log('Kết quả kiểm tra yêu thích:', data);
    return data.isFavourite as boolean;
  } catch (error) {
    console.error('Lỗi khi kiểm tra yêu thích:', error);
    return false;
  }
};
// Định nghĩa kiểu dữ liệu cho loại sản phẩm và sản phẩm
interface LoaiSanPham {
  id: number;
  tenLoai: string;
  donVi: string;
  duongDanAnh: string;
}

interface Product {
  id: number;
  loai: string;
  tenSanPham: string;
  moTa: string;
  giaTien: number;
  duongDanAnh: string;
  soLuong: number;
  donVi: string;
}

const SanPhamService = {
  getAllLoaiSanPham: async (): Promise<LoaiSanPham[]> => {
    try {
      const response = await fetch(`${baseurl}/sanphammagager/loaisanpham`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  getSanPhamByIdLoai: async (idLoai: number): Promise<Product[]> => {
    try {
      const response = await fetch(`${baseurl}/sanphammagager/sanpham/idloai?idloai=${idLoai}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch products: ${errorText}`);
      }
      const data: Product[] = await response.json();
      console.log(`Fetched products for idLoai ${idLoai}:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching products for idLoai ${idLoai}:`, error);
      throw error;
    }
  },
  getSanPhamById: async (productId: number): Promise<Product> => {
    try {
      const response = await fetch(`${baseurl}/sanphammagager/sanphamchitiet/${productId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch product details: ${errorText}`);
      }
      const data: Product = await response.json();
      console.log(`Fetched product details for productId ${productId}:`, data);
      return data;
    } catch (error) {
      console.error(`Error fetching product details for productId ${productId}:`, error);
      throw error;
    }
  },
};

export default SanPhamService;