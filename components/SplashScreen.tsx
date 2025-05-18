import { View, Image, ActivityIndicator, StyleSheet } from "react-native";

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require("../assets/logo.png")} // Thay bằng đường dẫn hình ảnh của bạn
                style={styles.logo}
                resizeMode="contain"
            />
            <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#53B175", // Màu nền xanh lá
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: 270, // Điều chỉnh kích thước logo
        height: 70,
    },
    loader: {
        marginTop: 20, // Khoảng cách giữa logo và vòng xoay loading
    },
});