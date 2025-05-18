import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OrderAcceptScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.circle} />
        <Image source={require('../assets/images/accept.png')} style={styles.icon} />
      </View>
      <Text style={styles.title}>Your Order has been accepted</Text>
      <Text style={styles.subtitle}>
        Your items have been placed and are on their way to being processed
      </Text>
      <Text style={styles.orderId}>Order ID: #{orderId || 'N/A'}</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)/OrderTracking')}>
        <Text style={styles.buttonText}>Track Order</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
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
    marginBottom: 40,
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
  orderId: {
    fontSize: 18,
    color: '#333',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#53B175',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: '80%',
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