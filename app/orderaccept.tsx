import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
export default function App() {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <View style={styles.circle} />
                <Image source={require('../assets/images/accept.png')} style={styles.icon} />
            </View>
            <Text></Text>
            <Text style={styles.title}>Your Order has been accepted</Text>
            <Text style={styles.subtitle}>
                Your items have been placed and are on their way to being processed
            </Text>
            <Text></Text>

            {/* Nút Track Order */}
            <TouchableOpacity style={styles.button} onPress={() => router.push('/mycart')}>
                <Text style={styles.buttonText}>Track Order</Text>
            </TouchableOpacity>

            {/* Nút Back to Home */}
            <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                <Text style={styles.backToHome}>Back to home</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    iconContainer: {
        position: 'relative',
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        width: 200,
        height: 200,
        marginBottom: 40
    },
    circle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#4CAF50',
    },
    title: {
        marginTop: 20,
        fontSize: 30,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    button: {
        backgroundColor: '#53B175',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        width: "80%",
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
    backToHome: {
        marginTop: 20,
        fontSize: 16,
        color: 'black',
    },
});
