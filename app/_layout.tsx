import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SplashScreen from '@/components/SplashScreen';
import { CartProvider } from './contexts/CartContext';
import { FavouriteProvider } from './contexts/FavouriteContext';
import { UserProvider } from './contexts/UserContext';
import { OrderProvider } from './contexts/OrderContext';

export default function Layout() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Kiểm tra lần đầu chạy ứng dụng
  useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        if (value === null) {
          await AsyncStorage.setItem('alreadyLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    }

    checkFirstLaunch();
  }, []);

  // Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    async function checkLoginStatus() {
      try {
        const value = await AsyncStorage.getItem('isLoggedIn');
        setIsLoggedIn(value === 'true');
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    }

    checkLoginStatus();
  }, []);

  // Hiển thị SplashScreen trong 2 giây
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  // Điều hướng sau khi kiểm tra xong
  useEffect(() => {
    if (!loading && isFirstLaunch !== null && isLoggedIn !== null) {
      if (isFirstLaunch) {
        router.replace('/onboarding');
      } else if (!isLoggedIn) {
        router.replace('/login');
      } else {
        router.replace('(tabs)' as any);
      }
    }
  }, [loading, isFirstLaunch, isLoggedIn, router]);

  // Nếu đang loading, hiển thị SplashScreen
  if (loading) {
    return <SplashScreen />;
  }

  // Nếu chưa kiểm tra xong isFirstLaunch hoặc isLoggedIn, render Stack
  if (isFirstLaunch === null || isLoggedIn === null) {
    return (
      <UserProvider>
        <CartProvider>
          <FavouriteProvider>
             <OrderProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="productdetail" />
              <Stack.Screen name="category" />
              <Stack.Screen name="mycart" options={{ title: 'My Cart' }} />
              <Stack.Screen name="onboarding" />
            </Stack>
            </OrderProvider>
          </FavouriteProvider>
        </CartProvider>
      </UserProvider>
    );
  }

  // Render Stack cho tất cả các trường hợp còn lại
  return (
    <UserProvider>
      <CartProvider>
        <FavouriteProvider>
          <OrderProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="productdetail" />
            <Stack.Screen name="category" />
            <Stack.Screen name="mycart" options={{ title: 'My Cart' }} />
            <Stack.Screen name="onboarding" />
          </Stack>
          </OrderProvider>
        </FavouriteProvider>
      </CartProvider>
    </UserProvider>
  );
}