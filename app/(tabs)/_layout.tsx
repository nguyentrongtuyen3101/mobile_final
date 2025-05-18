// Import thư viện `Tabs` từ `expo-router` để tạo thanh điều hướng dạng tab
import { Tabs } from "expo-router";
// Import FontAwesome để sử dụng các icon
import { FontAwesome } from "@expo/vector-icons";
// Import UserProvider từ UserContext
import { UserProvider } from "../contexts/UserContext";

// Component `TabLayout` chứa thanh điều hướng của ứng dụng
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Tùy chỉnh giao diện chung của thanh tab
        tabBarStyle: {
          backgroundColor: '#000000', // Màu nền đen cho thanh tab
          borderTopWidth: 0, // Xóa viền trên của tab để giao diện liền mạch
          height: 60, // Chiều cao thanh tab
          paddingBottom: 5, // Khoảng cách dưới để icon và chữ không sát đáy
          paddingTop: 5, // Khoảng cách trên để cân đối giao diện
          shadowColor: '#000', // Màu bóng đen
          shadowOffset: { width: 0, height: 2 }, // Độ lệch bóng (hướng xuống dưới)
          shadowOpacity: 0.2, // Độ mờ của bóng
          shadowRadius: 4, // Bán kính bóng để tạo hiệu ứng mềm mại
          elevation: 5, // Độ nâng (cho Android) để tạo bóng
        },
        tabBarActiveTintColor: '#DF0029', // Màu khi tab được chọn (đỏ đậm)
        tabBarInactiveTintColor: '#98D0B9', // Màu khi tab không được chọn (xanh nhạt)
        tabBarLabelStyle: {
          fontSize: 12, // Kích thước chữ của nhãn tab
          fontWeight: '500', // Độ đậm chữ (medium)
          marginBottom: 3, // Khoảng cách dưới của nhãn để không sát đáy
        },
      }}
    >
      {/* Tab đầu tiên - Trang chính (Shop) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Shop",
          headerShown: false, // Ẩn header để giao diện gọn gàng
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="shopping-bag" size={size} color={color} />
          ),
        }}
      />

      {/* Tab thứ hai - Trang Khám phá (Explore) */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          headerShown: false, // Ẩn header
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="search" size={size} color={color} />
          ),
        }}
      />

      {/* Tab thứ ba - Giỏ hàng (Mycart) */}
      <Tabs.Screen
        name="mycart"
        options={{
          title: "Mycart",
          headerShown: false, // Ẩn header
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="shopping-cart" size={size} color={color} />
          ),
        }}
      />

      {/* Tab thứ tư - Danh sách yêu thích (Favourite) */}
      <Tabs.Screen
        name="favourite"
        options={{
          title: "Favourite",
          headerShown: false, // Ẩn header
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="heart" size={size} color={color} />
          ),
        }}
      />

      {/* Tab thứ năm - Theo dõi đơn hàng (Orders) */}
      <Tabs.Screen
        name="OrderTracking"
        options={{
          title: 'Orders',
          headerShown: false, // Ẩn header
          tabBarIcon: ({ color, size }) => (
            // Thay icon "shopping-cart" bằng "truck" để biểu thị theo dõi đơn hàng
            <FontAwesome name="truck" size={size} color={color} />
          ),
        }}
      />

      {/* Tab thứ sáu - Tài khoản (Account) */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          headerShown: false, // Ẩn header
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}