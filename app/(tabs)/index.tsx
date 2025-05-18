import React from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCart } from "../contexts/CartContext"; // Thay useGioHang bằng useCart
import { useUser } from "../contexts/UserContext";
import IP_ADDRESS from "../../ipv4";

// Định nghĩa kiểu cho props (nếu có)
interface Props {}

// Định nghĩa kiểu cho item trong section
interface Item {
  id: number;
  title: string;
  subtitle: string;
  price: string;
  image: any;
}

const App: React.FC<Props> = () => {
  const router = useRouter();
  const { addToCart } = useCart(); // Thay useGioHang bằng useCart
  const { user } = useUser();

  console.log("User ID:", user?.id);

  const handleAddToCart = async (item: Item) => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      router.push("/login");
      return;
    }

    const cartData = {
      accountId: parseInt(user.id),
      sanPhamId: item.id,
      soLuong: 1,
    };

    try {
      const response = await fetch(`http://${IP_ADDRESS}:8080/API_for_mobile/api/checkmobile/themgiohang`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Lỗi khi gọi API thêm giỏ hàng: ${response.status} - ${errorText}`);
        throw new Error(`Không thể thêm vào giỏ hàng: ${errorText}`);
      }

      const result = await response.json();
      console.log("Thêm vào giỏ hàng thành công:", result);

      const productData = {
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        price: item.price,
        image: item.image,
        quantity: result.soLuong,
      };
      addToCart(productData); // Thay addToGioHang bằng addToCart

      alert("Đã thêm sản phẩm vào giỏ hàng!");
    } catch (err: any) {
      console.error("Lỗi khi thêm vào giỏ hàng:", err);
      alert(`Lỗi khi thêm vào giỏ hàng: ${err.message}`);
    }
  };

  const renderSection = (title: string, items: Item[]) => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/allproduct",
                params: {
                  title,
                  items: JSON.stringify(items),
                },
              })
            }
          >
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={styles.cardContainer}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/productdetail",
                    params: {
                      id: item.id,
                      title: item.title,
                      price: item.price,
                      image: item.title,
                      subtitle: item.subtitle,
                    },
                  })
                }
              >
                <Image source={item.image} style={styles.cardImage} />
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <FontAwesome5 name="carrot" size={40} color="orange" />
        </View>
        <Text style={styles.textHeader}>
          Store Groceries {user ? ` - Welcome ${user.gmail}` : ""}
        </Text>
      </View>

      {renderSection("Exclusive Offer", [
        {
          id: 1,
          title: "Organic Bananas",
          subtitle: "7pcs",
          price: "$4.99",
          image: require("../../assets/images/banana.png"),
        },
        {
          id: 2,
          title: "Red Apple",
          subtitle: "1kg",
          price: "$4.99",
          image: require("../../assets/images/apple.png"),
        },
        {
          id: 2,
          title: "Red Apple",
          subtitle: "1kg",
          price: "$4.99",
          image: require("../../assets/images/apple.png"),
        },
      ])}

      {renderSection("Best Selling", [
        {
          id: 3,
          title: "Bell Pepper Red",
          subtitle: "1kg",
          price: "$4.99",
          image: require("../../assets/images/bell_pepper.png"),
        },
        {
          id: 4,
          title: "Ginger",
          subtitle: "250gm",
          price: "$4.99",
          image: require("../../assets/images/ginger.png"),
        },
      ])}

      {renderSection("Groceries", [
        {
          id: 5,
          title: "Beef Bone",
          subtitle: "1kg",
          price: "$4.99",
          image: require("../../assets/images/beefBone.png"),
        },
        {
          id: 6,
          title: "Broiler Chicken",
          subtitle: "1kg",
          price: "$4.99",
          image: require("../../assets/images/boiler_chicken.png"),
        },
      ])}
    </ScrollView>
  );
};

const imageMap: Record<string, any> = {
  "Organic Bananas": require("../../assets/images/banana.png"),
  "Red Apple": require("../../assets/images/apple.png"),
  "Bell Pepper Red": require("../../assets/images/bell_pepper.png"),
  "Ginger": require("../../assets/images/ginger.png"),
  "Beef Bone": require("../../assets/images/beefBone.png"),
  "Broiler Chicken": require("../../assets/images/boiler_chicken.png"),
};

const styles = StyleSheet.create({
  textHeader: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionLink: {
    color: "#4CAF50",
    fontSize: 14,
  },
  cardContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  card: {
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "gray",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    width: "100%",
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    padding: 5,
    borderRadius: 5,
    marginBottom: 10,
    marginRight: 10,
  },
  container: { flex: 1, backgroundColor: "white", padding: 16 },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  location: { flexDirection: "row", alignItems: "center" },
  locationText: { marginLeft: 4, color: "black" },
  icons: { flexDirection: "row", alignItems: "center" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1 },
  bannerContainer: { position: "relative", marginBottom: 16 },
  bannerImage: { width: "100%", height: 200, borderRadius: 10 },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  bannerTitle: { color: "black", fontSize: 20, fontWeight: "bold" },
  bannerSubtitle: { color: "green", fontSize: 14 },
});

export default App;