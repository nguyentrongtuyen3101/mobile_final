import baseurl from '../baseurl';
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
      const response = await fetch(
        `${baseurl}/sanphammagager/loaisanpham`
      );
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
  // Hàm mới: Lấy chi tiết sản phẩm theo ID
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