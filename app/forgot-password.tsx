import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { sendOtp, resetPassword } from "../services/authService";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const router = useRouter();

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateConfirmPassword = (password: string, confirm: string) => {
    return password === confirm && confirm.length > 0;
  };

  const validateOtp = (otp: string) => {
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(otp);
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    setErrors({});

    if (!validateEmail(email)) {
      setErrors((prev) => ({ ...prev, email: "Vui lòng nhập email hợp lệ" }));
      return;
    }

    try {
      const otpFromServer = await sendOtp(email);
      setGeneratedOtp(otpFromServer);
      alert("OTP đã được gửi đến email của bạn!");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        email: error instanceof Error ? error.message : "Đã xảy ra lỗi khi gửi OTP",
      }));
    }
  };

  // Handle Confirm
  const handleConfirm = async () => {
    setErrors({});

    if (!validateOtp(otp)) {
      setErrors((prev) => ({ ...prev, otp: "OTP phải gồm 6 chữ số" }));
      return;
    }

    if (otp !== generatedOtp) {
      setErrors((prev) => ({ ...prev, otp: "OTP không khớp, vui lòng nhập lại" }));
      return;
    }

    if (!validatePassword(newPassword)) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Mật khẩu phải có ít nhất 6 ký tự",
      }));
      return;
    }

    if (!validateConfirmPassword(newPassword, confirmPassword)) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu xác nhận không khớp",
      }));
      return;
    }

    try {
      await resetPassword(email, newPassword, otp);
      setErrors((prev) => ({
        ...prev,
        general: "Mật khẩu đã được cập nhật thành công!",
      }));
      setTimeout(() => router.push("/login"), 1500); // Chuyển hướng sau 1.5s
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: error instanceof Error ? error.message : "Cập nhật mật khẩu thất bại",
      }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.carrot}>
        <FontAwesome5 name="carrot" size={70} color="#00676B" />
      </View>
      <Text style={styles.title}>Quên Mật Khẩu</Text>
      <Text style={styles.subtitle}>Đặt lại mật khẩu của bạn trong vài bước</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email của bạn"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mật Khẩu Mới</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          {errors.newPassword && (
            <Text style={styles.errorText}>{errors.newPassword}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Xác Nhận Mật Khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.sendOtpButton} onPress={handleSendOtp}>
          <Text style={styles.sendOtpButtonText}>Gửi OTP</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập OTP đã nhận"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
          />
          {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Xác Nhận</Text>
        </TouchableOpacity>

        {errors.general && (
          <Text
            style={[
              styles.errorText,
              errors.general.includes("thành công")
                ? { color: "green" }
                : { color: "red" },
            ]}
          >
            {errors.general}
          </Text>
        )}
      </View>

      <Text style={styles.backToLoginText}>
        Quay lại{" "}
        <TouchableOpacity onPress={() => router.push("/login")}>
          <Text style={styles.loginLink}>Đăng Nhập</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#EC870E",
  },
  carrot: {
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
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
  sendOtpButton: {
    width: "100%",
    padding: 15,
    backgroundColor: "#EC870E",
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  sendOtpButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmButton: {
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
  confirmButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  backToLoginText: {
    fontSize: 14,
    color: "#333",
    marginTop: 20,
  },
  loginLink: {
    color: "#367517",
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
});