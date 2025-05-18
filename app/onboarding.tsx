import { View, Image, TouchableOpacity, Text, StyleSheet, Button, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

// Lấy kích thước màn hình
const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Image source={require('../assets/images/onboarding.png')} style={styles.image} />
            <View>
                <View>
                    <FontAwesome5 style={styles.icon} name="carrot" size={24} color="white" />
                </View>
                <View>
                    <Text style={styles.welcome}>Welcome</Text>
                    <Text style={styles.welcome}>to our store</Text>
                </View>
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: "white" }}>Ger your groceries in as fast as one hour</Text>
                </View>
                <View>
                    <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,  // Để phần tử con (Image) có thể mở rộng
        alignItems: 'center',
        justifyContent: "flex-end", //justify dọc , align ngang
    },
    image: {
        width: width, // Chiều rộng = chiều rộng màn hình
        height: height, // Chiều cao = chiều cao màn hình
        resizeMode: 'cover', // Lấp đầy màn hình, có thể cắt bớt ảnh
        position: 'absolute', // Đặt ảnh nền phía sau
    },
    button: {
        backgroundColor: '#53B175',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        marginBottom: 150,

    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        padding: 5,
    },
    welcome: {
        color: "#FFFFFF",
        fontSize: 40,
        textAlign: "center",

    },
    icon: {
        fontSize: 40,
        textAlign: 'center',
    }

});
