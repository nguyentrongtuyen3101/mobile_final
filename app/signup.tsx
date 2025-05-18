// signup.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { register } from "../services/authService";

const SignUpScreen: React.FC = () => {
  const [hoTen, setHoTen] = useState("");
  const [gmail, setGmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name: string) => {
    const nameRegex = /^[a-zA-ZÀ-ỹ\s'-]{2,50}$/;
    return nameRegex.test(name);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignUp = async () => {
    setErrors({});

    // Validate input
    if (!hoTen.trim()) {
      setErrors((prev) => ({ ...prev, hoTen: "Họ tên không được để trống" }));
      return;
    }
    if (!validateName(hoTen)) {
      setErrors((prev) => ({
        ...prev,
        hoTen:
          "Họ tên không hợp lệ (chỉ chứa chữ cái, khoảng trắng, dấu gạch ngang, dấu nháy đơn, độ dài 2-50 ký tự)",
      }));
      return;
    }
    if (!gmail.trim()) {
      setErrors((prev) => ({ ...prev, gmail: "Email không được để trống" }));
      return;
    }
    if (!validateEmail(gmail)) {
      setErrors((prev) => ({ ...prev, gmail: "Email không hợp lệ" }));
      return;
    }
    if (!matKhau.trim()) {
      setErrors((prev) => ({ ...prev, matKhau: "Mật khẩu không được để trống" }));
      return;
    }
    if (!validatePassword(matKhau)) {
      setErrors((prev) => ({
        ...prev,
        matKhau: "Mật khẩu phải có ít nhất 6 ký tự",
      }));
      return;
    }

    setIsLoading(true);

    try {
      const user = await register(hoTen, gmail, matKhau);
      Alert.alert("Thành công", "Đăng ký thành công!");
      router.push("/login");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error instanceof Error ? error.message : "Đăng ký thất bại",
      }));
      console.error("API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.carrot}>
          <FontAwesome5 name="carrot" size={70} color="#00676B" />
        </View>
        <Text style={styles.title}>Đăng ký</Text>
        <Text style={styles.subtitle}>Nhập thông tin để tiếp tục</Text>

        {/* Khung chứa các mục nhập liệu và nút bấm */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập họ tên"
              value={hoTen}
              onChangeText={setHoTen}
            />
            {errors.hoTen && <Text style={styles.errorText}>{errors.hoTen}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập email"
              value={gmail}
              onChangeText={setGmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.gmail && <Text style={styles.errorText}>{errors.gmail}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.inputFlex}
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                value={matKhau}
                onChangeText={setMatKhau}
              />
              <TouchableOpacity
                style={styles.icon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <FontAwesome
                  name={showPassword ? "eye-slash" : "eye"}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {errors.matKhau && <Text style={styles.errorText}>{errors.matKhau}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}
        </View>

        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.signupText}>
            Đã có tài khoản? <Text style={styles.signupLink}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EC870E",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  carrot: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "#FFFBD1",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#E6F1D8",
    borderWidth: 1,
    borderColor: "#367517",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#E6F1D8",
    borderWidth: 1,
    borderColor: "#367517",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingRight: 10,
  },
  inputFlex: {
    flex: 1,
    padding: 12,
  },
  icon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  loginButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#367517",
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#a0a0a0",
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  signupText: {
    fontSize: 14,
    color: "#333",
    marginTop: 20,
    textAlign: "center",
  },
  signupLink: {
    color: "#367517",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
});

export default SignUpScreen;