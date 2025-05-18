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
          backgroundColor: '#000000', // Màu nền cam nhạt, đồng bộ với App.js
          borderTopWidth: 0, // Xóa viền trên của tab
          height: 60, // Chiều cao thanh tab
          paddingBottom: 5, // Padding dưới để icon và chữ không sát đáy
          paddingTop: 5, // Padding trên cho cân đối
          shadowColor: '#000', // Đổ bóng: màu đen
          shadowOffset: { width: 0, height: 2 }, // Độ lệch bóng
          shadowOpacity: 0.2, // Độ mờ bóng
          shadowRadius: 4, // Bán kính bóng
          elevation: 5, // Đổ bóng cho Android
        },
        tabBarActiveTintColor: '#DF0029', // Màu khi tab được chọn (cam đậm)
        tabBarInactiveTintColor: '#98D0B9', // Màu khi tab không được chọn (xám)
        tabBarLabelStyle: {
          fontSize: 12, // Kích thước chữ của nhãn
          fontWeight: '500', // Chữ in đậm nhẹ
          marginBottom: 3, // Khoảng cách dưới của nhãn
        },
      }}
        >
        {/* Tab đầu tiên - Trang chính (Shop) */}
        <Tabs.Screen
          name="index"
          options={{
            title: "Shop",
            headerShown: false,
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
            headerShown: false,
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
            headerShown: false,
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
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="heart" size={size} color={color} />
            ),
          }}
        />

        {/* Tab thứ năm - Tài khoản (Account) */}
        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="user" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
  );
}