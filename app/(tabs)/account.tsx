import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useUser } from '../contexts/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IP_ADDRESS from '../../ipv4';
import { launchImageLibrary, type ImageLibraryOptions, type ImagePickerResponse, type Asset } from 'react-native-image-picker';
import { User_model, showAccount, updateAccountuser, uploadProfilePicture } from '../../services/authService';

// Định nghĩa kiểu cho tên icon của FontAwesome5
type IconName =
  | 'box-open'
  | 'id-card'
  | 'map-marker-alt'
  | 'credit-card'
  | 'ticket-alt'
  | 'bell'
  | 'question-circle'
  | 'info-circle'
  | 'store'
  | 'search'
  | 'shopping-cart'
  | 'heart'
  | 'user'
  | 'pencil-alt'
  | 'angle-right'
  | 'sign-out-alt'
  | 'signal'
  | 'wifi'
  | 'battery-full'
  | 'envelope'
  | 'phone'
  | 'home'
  | 'birthday-cake'
  | 'venus-mars'
  | 'shopping-bag'
  | 'wallet';

// Định nghĩa interface cho thông tin khách hàng
interface CustomerInfo {
  name: string;
  email: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  profilePicture?: string;
}

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, setUser } = useUser();

  // Chuyển đổi giới tính từ boolean sang chuỗi
  const convertGender = (gioitinh: boolean | undefined): string => {
    if (gioitinh === undefined) return 'Other';
    return gioitinh ? 'Male' : 'Female';
  };

  // Khởi tạo thông tin khách hàng từ user context
  const initialCustomerInfo: CustomerInfo = user
    ? {
        name: user.hoten || 'Unknown',
        email: user.gmail || 'Unknown',
        address: user.diachi || 'Unknown',
        dateOfBirth: user.sinhnhat || 'Unknown',
        gender: convertGender(user.gioitinh),
        profilePicture: user.duongDanAnh ? `http://${IP_ADDRESS}:8080${user.duongDanAnh}` : 'https://via.placeholder.com/64',
      }
    : {
        name: 'Unknown',
        email: 'Unknown',
        address: 'Unknown',
        dateOfBirth: 'Unknown',
        gender: 'Other',
        profilePicture: 'https://via.placeholder.com/64',
      };

  // State quản lý thông tin khách hàng, chế độ chỉnh sửa, lỗi, và token
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(initialCustomerInfo);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempInfo, setTempInfo] = useState<CustomerInfo>({ ...customerInfo });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [token, setToken] = useState<string | null>(null);

  // Load token và thông tin tài khoản khi component mount
  useEffect(() => {
    const loadTokenAndUserData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        setToken(storedToken);

        if (storedToken) {
          const userData = await showAccount();
          if (userData) {
            setUser(userData);
            const updatedInfo = {
              name: userData.hoten || 'Unknown',
              email: userData.gmail || 'Unknown',
              address: userData.diachi || 'Unknown',
              dateOfBirth: userData.sinhnhat || 'Unknown',
              gender: convertGender(userData.gioitinh),
              profilePicture: userData.duongDanAnh ? `http://${IP_ADDRESS}:8080${userData.duongDanAnh}` : 'https://i.pinimg.com/736x/5c/7b/72/5c7b72122673157a8e8bd019efaf0957.jpg',
            };
            console.log('Updated profilePicture:', updatedInfo.profilePicture); // Log để kiểm tra
            setCustomerInfo(updatedInfo);
            setTempInfo(updatedInfo);
          } else {
            setErrors((prev) => ({ ...prev, general: 'Không thể lấy thông tin tài khoản, vui lòng đăng nhập lại' }));
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải token hoặc thông tin tài khoản:', error);
        setErrors((prev) => ({ ...prev, general: 'Lỗi khi tải dữ liệu, vui lòng thử lại' }));
      }
    };
    loadTokenAndUserData();
  }, [setUser]);

  // Xác thực dữ liệu đầu vào
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateName = (name: string) => /^[a-zA-ZÀ-ỹ\s'-]{2,50}$/.test(name);
  const validateAddress = (address: string) => /^.{5,100}$/.test(address);
  const validateDateOfBirth = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);

  // Đăng xuất
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      setToken(null);
      router.replace('/login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      Alert.alert('Lỗi', 'Không thể đăng xuất, vui lòng thử lại');
    }
  };

  // Kiểm tra và yêu cầu quyền truy cập thư viện ảnh trên Android
  const checkAndRequestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        console.log('Phiên bản Android:', androidVersion);

        const permissionToCheck = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        const granted = await PermissionsAndroid.check(permissionToCheck);
        console.log(`Trạng thái quyền ${permissionToCheck}:`, granted);

        if (granted) {
          return true;
        }

        const result = await PermissionsAndroid.request(permissionToCheck, {
          title: 'Yêu cầu quyền truy cập ảnh',
          message: 'Ứng dụng cần quyền truy cập thư viện ảnh để bạn có thể chọn ảnh đại diện.',
          buttonNeutral: 'Hỏi lại sau',
          buttonNegative: 'Từ chối',
          buttonPositive: 'Đồng ý',
        });
        console.log(`Kết quả yêu cầu quyền ${permissionToCheck}:`, result);

        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (result === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert(
            'Quyền bị từ chối',
            'Ứng dụng không có quyền truy cập thư viện ảnh. Vui lòng cấp quyền trong cài đặt.',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Quyền bị từ chối vĩnh viễn',
            'Ứng dụng không có quyền truy cập thư viện ảnh. Vui lòng vào cài đặt để cấp quyền.',
            [
              { text: 'Hủy', style: 'cancel' },
              { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }
        return false;
      } catch (err) {
        console.warn('Lỗi khi kiểm tra/yêu cầu quyền:', err);
        Alert.alert('Lỗi', 'Không thể kiểm tra quyền truy cập. Vui lòng thử lại.');
        return false;
      }
    }
    return true;
  };

  // Tải lên ảnh đại diện
  const handleUploadProfilePicture = async () => {
    console.log('Bấm upload ảnh, isEditing:', isEditing);
    setErrors({});
    if (!token) {
      setErrors((prev) => ({ ...prev, general: 'Không tìm thấy token xác thực' }));
      Alert.alert('Lỗi', 'Vui lòng đăng nhập lại');
      return;
    }

    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          const file = target.files[0];
          const updatedUser = await uploadProfilePicture(tempInfo.email, file, { fileName: file.name, type: file.type });
          if (updatedUser) {
            setUser(updatedUser);
            const imageUrl = updatedUser.duongDanAnh ? `http://${IP_ADDRESS}:8080${updatedUser.duongDanAnh}` : 'https://i.pinimg.com/736x/5c/7b/72/5c7b72122673157a8e8bd019efaf0957.jpg';
            setTempInfo((prev) => ({ ...prev, profilePicture: imageUrl }));
            setCustomerInfo((prev) => ({ ...prev, profilePicture: imageUrl }));
            Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công');
          } else {
            setErrors((prev) => ({ ...prev, general: 'Cập nhật ảnh thất bại, vui lòng kiểm tra token' }));
            Alert.alert('Lỗi', 'Cập nhật ảnh thất bại');
          }
        }
      };
      input.click();
    } else {
      console.log('Kiểm tra quyền trước khi mở thư viện ảnh');
      const hasPermission = await checkAndRequestStoragePermission();
      if (!hasPermission) {
        console.log('Không có quyền truy cập thư viện ảnh');
        return;
      }

      console.log('Bắt đầu mở thư viện ảnh trên mobile');
      const options: ImageLibraryOptions = { 
        mediaType: 'photo', 
        maxWidth: 300, 
        maxHeight: 300, 
        quality: 1,
        selectionLimit: 1,
      };
      try {
        console.log('Options truyền vào launchImageLibrary:', JSON.stringify(options, null, 2));
        launchImageLibrary(options, (response: ImagePickerResponse) => {
          console.log('Phản hồi từ launchImageLibrary:', JSON.stringify(response, null, 2));
          if (response.didCancel) {
            console.log('Người dùng hủy chọn ảnh');
            Alert.alert('Thông báo', 'Bạn đã hủy chọn ảnh');
          } else if (response.errorCode) {
            console.error('Lỗi từ image picker:', response.errorCode, response.errorMessage);
            setErrors((prev) => ({ ...prev, general: `Không thể chọn ảnh: ${response.errorMessage || response.errorCode}` }));
            Alert.alert('Lỗi', `Không thể chọn ảnh: ${response.errorMessage || response.errorCode}`);
            if (response.errorCode === 'permission') {
              Alert.alert(
                'Quyền bị từ chối',
                'Ứng dụng không có quyền truy cập thư viện ảnh. Vui lòng vào cài đặt để cấp quyền.',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Mở cài đặt', onPress: () => Linking.openSettings() },
                ]
              );
            }
          } else if (response.assets && response.assets.length > 0) {
            const asset: Asset = response.assets[0];
            const uri = asset.uri;
            if (!uri) {
              setErrors((prev) => ({ ...prev, general: 'Không thể lấy URI của ảnh' }));
              Alert.alert('Lỗi', 'Không thể lấy URI của ảnh');
              return;
            }

            console.log('URI của ảnh:', uri);
            uploadProfilePicture(tempInfo.email, uri, asset).then(updatedUser => {
              if (updatedUser) {
                setUser(updatedUser);
                const imageUrl = updatedUser.duongDanAnh ? `http://${IP_ADDRESS}:8080${updatedUser.duongDanAnh}` : 'https://i.pinimg.com/736x/5c/7b/72/5c7b72122673157a8e8bd019efaf0957.jpg';
                setTempInfo((prev) => ({ ...prev, profilePicture: imageUrl }));
                setCustomerInfo((prev) => ({ ...prev, profilePicture: imageUrl }));
                Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công');
              } else {
                setErrors((prev) => ({ ...prev, general: 'Cập nhật ảnh thất bại, vui lòng kiểm tra token' }));
                Alert.alert('Lỗi', 'Cập nhật ảnh thất bại');
              }
            }).catch(err => {
              console.error('Lỗi khi upload ảnh:', err);
              const errorMessage = err instanceof Error ? err.message : String(err);
              Alert.alert('Lỗi', 'Cập nhật ảnh thất bại: ' + errorMessage);
            });
          } else {
            Alert.alert('Lỗi', 'Không có ảnh nào được chọn');
          }
        });
      } catch (error) {
        console.error('Lỗi khi gọi launchImageLibrary:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        Alert.alert('Lỗi', 'Không thể mở thư viện ảnh: ' + errorMessage);
      }
    }
  };

  // Cập nhật thông tin tài khoản
  const handleUpdateAccount = async () => {
    setErrors({});
    if (!token) {
      setErrors((prev) => ({ ...prev, general: 'Không tìm thấy token xác thực' }));
      return;
    }

    if (!tempInfo.email.trim() || !validateEmail(tempInfo.email)) {
      setErrors((prev) => ({ ...prev, email: 'Email không hợp lệ' }));
      return;
    }
    if (!tempInfo.name.trim() || !validateName(tempInfo.name)) {
      setErrors((prev) => ({ ...prev, name: 'Họ tên không hợp lệ' }));
      return;
    }
    if (tempInfo.address && !validateAddress(tempInfo.address)) {
      setErrors((prev) => ({ ...prev, address: 'Địa chỉ không hợp lệ' }));
      return;
    }
    if (tempInfo.dateOfBirth && !validateDateOfBirth(tempInfo.dateOfBirth)) {
      setErrors((prev) => ({ ...prev, dateOfBirth: 'Ngày sinh không hợp lệ' }));
      return;
    }

    const payload = {
      gmail: tempInfo.email,
      hoten: tempInfo.name,
      diachi: tempInfo.address,
      sinhnhat: tempInfo.dateOfBirth,
      sex: tempInfo.gender === 'Male' ? true : tempInfo.gender === 'Female' ? false : undefined,
      duongDanAnh: tempInfo.profilePicture,
    };

    const updatedUser = await updateAccountuser(payload);
    if (updatedUser) {
      setUser(updatedUser);
      setCustomerInfo({ ...tempInfo });
      Alert.alert('Thành công', 'Cập nhật thông tin tài khoản thành công');
    } else {
      setErrors((prev) => ({ ...prev, general: 'Cập nhật thông tin thất bại, vui lòng kiểm tra token hoặc kết nối' }));
    }
  };

  // Chuyển đổi giữa chế độ chỉnh sửa và lưu
  const handleEditToggle = async () => {
    console.log('Chuyển chế độ chỉnh sửa, isEditing trước:', isEditing);
    if (isEditing) {
      await handleUpdateAccount();
    } else {
      setTempInfo({ ...customerInfo });
      setTempInfo((prev) => ({ ...prev, profilePicture: undefined })); // Reset để dùng ảnh cứng
    }
    setIsEditing(!isEditing);
    console.log('isEditing sau:', !isEditing);
  };

  // Cập nhật giá trị input
  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setTempInfo((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <TouchableOpacity
          onPress={isEditing ? handleUploadProfilePicture : () => Alert.alert('Thông báo', 'Vui lòng bấm "Chỉnh sửa" để thay đổi ảnh đại diện')}
          style={styles.profileImageContainer}
        >
          <Image
            source={{ uri: tempInfo.profilePicture || 'https://i.pinimg.com/736x/59/2e/ae/592eae7a8e7c96381294c01576a0d882.jpg' }}
            style={styles.profileImage}
            onError={(e) => console.log('Lỗi tải ảnh:', e.nativeEvent.error)}
          />
          {isEditing && (
            <View style={styles.uploadIconOverlay}>
              <FontAwesome5 name="camera" size={20} color="white" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          {isEditing ? (
            <View>
              <TextInput
                style={styles.profileNameInput}
                value={tempInfo.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
          ) : (
            <Text style={styles.profileName}>{customerInfo.name}</Text>
          )}
          <Text style={styles.profileEmail}>{customerInfo.email}</Text>
        </View>
      </View>

      <ScrollView style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <View style={styles.infoRow}>
            <FontAwesome5 name="envelope" size={24} color="#EC870E" />
            <Text style={styles.infoLabel}>Email</Text>
          </View>
          {isEditing ? (
            <View>
              <TextInput
                style={styles.infoInput}
                value={tempInfo.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          ) : (
            <Text style={styles.infoText}>{customerInfo.email}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoRow}>
            <FontAwesome5 name="home" size={24} color="#EC870E" />
            <Text style={styles.infoLabel}>Địa chỉ</Text>
          </View>
          {isEditing ? (
            <View>
              <TextInput
                style={styles.infoInput}
                value={tempInfo.address}
                onChangeText={(text) => handleInputChange('address', text)}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>
          ) : (
            <Text style={styles.infoText}>{customerInfo.address}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoRow}>
            <FontAwesome5 name="birthday-cake" size={24} color="#EC870E" />
            <Text style={styles.infoLabel}>Ngày sinh</Text>
          </View>
          {isEditing ? (
            <View>
              <TextInput
                style={styles.infoInput}
                value={tempInfo.dateOfBirth}
                onChangeText={(text) => handleInputChange('dateOfBirth', text)}
                placeholder="YYYY-MM-DD"
              />
              {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
            </View>
          ) : (
            <Text style={styles.infoText}>{customerInfo.dateOfBirth}</Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <View style={styles.infoRow}>
            <FontAwesome5 name="venus-mars" size={24} color="#EC870E" />
            <Text style={styles.infoLabel}>Giới tính</Text>
          </View>
          {isEditing ? (
            <Picker
              selectedValue={tempInfo.gender}
              onValueChange={(value) => handleInputChange('gender', value)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Nam" value="Male" />
              <Picker.Item label="Nữ" value="Female" />
              <Picker.Item label="Khác" value="Other" />
            </Picker>
          ) : (
            <Text style={styles.infoText}>{customerInfo.gender}</Text>
          )}
        </View>
      </ScrollView>

      {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

      <TouchableOpacity style={styles.editButton} onPress={handleEditToggle}>
        <Text style={styles.editButtonText}>{isEditing ? 'Lưu' : 'Chỉnh sửa'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome5 name="sign-out-alt" size={24} color="#ffffff" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Màu nền nhẹ nhàng
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#00676B',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
    elevation: 5, // Đổ bóng cho phần profile (Android)
    shadowColor: '#000', // Đổ bóng cho iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 80, // Tăng kích thước ảnh đại diện
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  uploadIconOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    padding: 6,
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  profileName: {
    fontSize: 30, // Tăng kích thước font chữ tên
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileNameInput: {
    fontSize: 26, // Tăng kích thước font chữ input tên
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 6,
    color: '#ffffff',
  },
  profileEmail: {
    fontSize: 22, // Tăng kích thước font chữ email
    color: '#ffffff',
    marginTop: 6,
  },
  infoContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoItem: {
    backgroundColor: '#FAEBD7', // Nền trắng cho mỗi mục
    borderWidth: 1, // Đóng khung
    borderColor: '#000',
    borderRadius: 12, // Bo góc khung
    padding: 15,
    marginBottom: 15,
    elevation: 3, // Đổ bóng (Android)
    shadowColor: '#000', // Đổ bóng (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth:4,
    borderRightWidth:4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 25, // Tăng kích thước font chữ tiêu đề
    fontWeight: '600',
    color: '#211551',
    marginLeft: 12,
  },
  infoText: {
    fontSize: 20, // Tăng kích thước font chữ nội dung
    color: '#211551',
    marginLeft: 36, // Căn lề để thẳng hàng với icon
    paddingVertical: 8,
  },
  infoInput: {
    fontSize: 18, // Tăng kích thước font chữ input
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
    marginLeft: 36,
    color: '#333',
  },
  picker: {
    marginLeft: 36,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    marginRight: -8,
  },
  pickerItem: {
    fontSize: 18, // Tăng kích thước font chữ picker
    color: '#333',
  },
  editButton: {
    backgroundColor: '#00676B', // Màu xanh lá đậm hơn
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 15,
    elevation: 4, // Đổ bóng nút
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderColor:'#000',
    borderWidth:1,
    borderBottomWidth:4,
    borderRightWidth:4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 20, // Tăng kích thước font chữ nút
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#8E1E20',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4, // Đổ bóng nút
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderColor:'#000',
    borderWidth:1,
    borderBottomWidth:4,
    borderRightWidth:4,
  },
  logoutText: {
    marginLeft: 12,
    color: '#ffffff',
    fontSize: 20, // Tăng kích thước font chữ nút đăng xuất
    fontWeight: 'bold',
  },
  errorText: {
    color: '#E53935', // Màu đỏ đậm hơn
    fontSize: 14, // Tăng kích thước font chữ lỗi
    marginTop: 6,
    marginLeft: 36,
  },
});

export default ProfileScreen;