import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useUser } from "./contexts/UserContext";
import { login } from "../services/authService"; // Import service

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const { setUser } = useUser();

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleLogin = async () => {
    setErrors({});

    // Validate input
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email không được để trống" }));
      return;
    }
    if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Email không hợp lệ" }));
      return;
    }
    if (!password.trim()) {
      setErrors((prev) => ({ ...prev, password: "Mật khẩu không được để trống" }));
      return;
    }
    if (!validatePassword(password)) {
      setErrors((prev) => ({
        ...prev,
        password: "Mật khẩu phải có ít nhất 6 ký tự",
      }));
      return;
    }

    try {
      const user = await login(email, password); // Gọi service
      setUser(user);

      if (user.role === "ADMIN") {
        setErrors((prev) => ({
          ...prev,
          general: "Đăng nhập thành công. Chào mừng ADMIN!",
        }));
        Linking.openURL("http://localhost:5000/index.html");
      } else {
        setErrors((prev) => ({
          ...prev,
          general: `Đăng nhập thành công. Chào mừng ${user.gmail} (Role: ${user.role})`,
        }));
        router.push("/(tabs)");
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error instanceof Error ? error.message : "Đã xảy ra lỗi",
      }));
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.carrot}>
        <FontAwesome5 name="carrot" size={70} color="#00676B" />
      </View>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.subtitle}>Enter your email and password</Text>

      {/* Khung chứa các mục nhập liệu và nút bấm */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.inputFlex}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        <Link href="/forgot-password" asChild>
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => router.push("/forgot-password")}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        {errors.general && (
          <Text
            style={[
              styles.errorText,
              errors.general.includes("Đăng nhập thành công")
                ? { color: "green" }
                : { color: "red" },
            ]}
          >
            {errors.general}
          </Text>
        )}
      </View>

      <Text style={styles.signupText}>
        Don’t have an account?{" "}
        <Link href="/signup" asChild>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.signupLink}>Signup</Text>
          </TouchableOpacity>
        </Link>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container chính của màn hình
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#EC870E",
  },

  // Biểu tượng cà rốt phía trên
  carrot: {
    marginBottom: 50,
  },

  // Tiêu đề "Login"
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },

  // Phụ đề bên dưới tiêu đề
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },

  // Khung chứa các mục nhập liệu và nút bấm
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

  // Container cho mỗi ô nhập liệu
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },

  // Nhãn "Email" và "Password"
  label: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
    fontWeight: "500",
  },

  // Ô nhập liệu email
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

  // Container cho ô nhập mật khẩu (bao gồm biểu tượng mắt)
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

  // Ô nhập liệu mật khẩu bên trong passwordContainer
  inputFlex: {
    flex: 1,
    padding: 12,
  },

  // Nút "Forgot Password?"
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },

  // Văn bản "Forgot Password?"
  forgotPasswordText: {
    fontSize: 14,
    color: "#367517",
    fontWeight: "500",
  },

  // Nút "Log In"
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

  // Văn bản trên nút "Log In"
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Văn bản "Don’t have an account?"
  signupText: {
    fontSize: 14,
    color: "#333",
    marginTop: 20,
  },

  // Liên kết "Signup"
  signupLink: {
    color: "#367517",
    fontWeight: "bold",
  },

  // Văn bản thông báo lỗi
  errorText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
});