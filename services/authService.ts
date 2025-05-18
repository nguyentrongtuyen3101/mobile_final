import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Asset } from 'react-native-image-picker';
import baseurl from '../baseurl';
export interface User_model {
  id: string;
  gmail: string;
  role: string;
  hoten: string;
  diachi: string;
  gioitinh: boolean | undefined;
  sinhnhat: string;
  duongDanAnh: string | undefined;
  sdt:string;
  token?: string;
}

// Đăng nhập
export const login = async (email: string, password: string): Promise<User_model> => {
  try {
    const response = await fetch(`${baseurl}/checkmobile/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gmail: email,
        matKhau: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Đã xảy ra lỗi khi đăng nhập');
    }

    const user: User_model = {
      id: data.id || '',
      gmail: data.gmail || '',
      role: data.role || '',
      hoten: data.hoten || '',
      diachi: data.diachi || '',
      gioitinh: data.gioitinh,
      sinhnhat: data.sinhnhat || '',
      duongDanAnh: data.duongDanAnh,
      sdt:data.sdt ||'',
      token: data.token,
    };

    if (data.token) {
      console.log('Token sau khi login:', data.token);
      await AsyncStorage.setItem('authToken', data.token);
    }

    return user;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};

// Đăng ký
export const register = async (hoTen: string, gmail: string, matKhau: string): Promise<User_model> => {
  try {
    const response = await fetch(`${baseurl}/checkmobile/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hoTen,
        gmail,
        matKhau,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Đã xảy ra lỗi khi đăng ký');
    }

    const user: User_model = {
      id: data.id || '',
      gmail: data.gmail || '',
      role: data.role || '',
      hoten: data.hoten || '',
      diachi: data.diachi || '',
      gioitinh: data.gioitinh,
      sinhnhat: data.sinhnhat || '',
      duongDanAnh: data.duongDanAnh,
      sdt:data.sdt ||'',
      token: data.token,
    };

    if (data.token) {
      await AsyncStorage.setItem('authToken', data.token);
    }

    return user;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};

// Gửi OTP
export const sendOtp = async (email: string): Promise<string> => {
  try {
    const response = await fetch(`${baseurl}/checkmobile/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gmail: email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(data.message || 'Email không tồn tại');
      }
      throw new Error(data.message || 'Đã xảy ra lỗi khi gửi OTP');
    }

    return data.otp;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};

// Đặt lại mật khẩu
export const resetPassword = async (email: string, newPassword: string, otp: string): Promise<void> => {
  try {
    const response = await fetch(`${baseurl}/checkmobile/quenmk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gmail: email,
        matKhau: newPassword,
        otp,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Cập nhật mật khẩu thất bại');
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Không thể kết nối đến server');
  }
};

// Cập nhật thông tin tài khoản
export const updateAccountuser = async (payload: {
  gmail: string;
  hoten: string;
  diachi: string;
  sinhnhat: string;
  sex?: boolean | undefined;
  sdt?: string; // Thêm sdt vào payload
  duongDanAnh?: string;
}): Promise<User_model | null> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) return null;

  try {
    const response = await fetch(`${baseurl}/checkmobile/updateaccount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status === 401) return null;
    if (!response.ok) throw new Error(data.message || 'Không thể cập nhật thông tin tài khoản');

    const user: User_model = {
      id: data.id || '',
      gmail: data.gmail || '',
      role: data.role || '',
      hoten: data.hoten || '',
      diachi: data.diachi || '',
      gioitinh: data.gioitinh,
      sinhnhat: data.sinhnhat || '',
      duongDanAnh: data.duongDanAnh,
      sdt: data.sdt || '', // Cập nhật sdt từ response
      token: token,
    };

    return user;
  } catch (error) {
    console.error('Lỗi cập nhật tài khoản:', error);
    return null;
  }
};

// Tải lên ảnh đại diện
export const uploadProfilePicture = async (
  gmail: string,
  file: string | File, // Cập nhật kiểu dữ liệu để chấp nhận cả string và File
  asset: { fileName?: string; type?: string } | Asset // Cập nhật kiểu asset để linh hoạt
): Promise<User_model | null> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('gmail', gmail);

    if (Platform.OS === 'web' && file instanceof File) {
      // Xử lý file trên web
      formData.append('file', file, asset.fileName || 'profile.jpg');
    } else {
      // Xử lý file trên mobile
      const uri = typeof file === 'string' ? (Platform.OS === 'android' ? file : file.replace('file://', '')) : '';
      formData.append('file', {
        uri,
        name: (asset as Asset).fileName || 'profile.jpg',
        type: (asset as Asset).type || 'image/jpeg',
      } as any);
    }

    const response = await fetch(`${baseurl}/checkmobile/uploadprofilepic`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.status === 401) {
      console.error('Token không hợp lệ hoặc hết hạn');
      return null;
    }
    if (!response.ok) {
      console.error('Lỗi từ server:', data.message);
      throw new Error(data.message || 'Không thể upload ảnh');
    }

    const user: User_model = {
      id: data.id || '',
      gmail: data.gmail || '',
      role: data.role || '',
      hoten: data.hoten || '',
      diachi: data.diachi || '',
      gioitinh: data.gioitinh,
      sinhnhat: data.sinhnhat || '',
      duongDanAnh: data.duongDanAnh,
      sdt:data.sdt ||'',
      token: token,
    };

    console.log('Upload ảnh thành công:', user);
    return user;
  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    return null;
  }
};

// Lấy thông tin tài khoản
export const showAccount = async (): Promise<User_model | null> => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('Không tìm thấy token');
    return null;
  }

  try {
    const response = await fetch(`${baseurl}/checkmobile/showaccount`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      console.error('Token không hợp lệ hoặc hết hạn');
      return null;
    }
    if (!response.ok) {
      console.error('Lỗi từ server:', data.message);
      throw new Error(data.message || 'Không thể lấy thông tin tài khoản');
    }

    const user: User_model = {
      id: data.id || '',
      gmail: data.gmail || '',
      role: data.role || '',
      hoten: data.hoten || '',
      diachi: data.diachi || '',
      gioitinh: data.gioitinh,
      sinhnhat: data.sinhnhat || '',
      duongDanAnh: data.duongDanAnh,
      sdt:data.sdt ||'',
      token: token,
    };

    return user;
  } catch (error) {
    console.error('Lỗi khi lấy thông tin tài khoản:', error);
    return null;
  }
};