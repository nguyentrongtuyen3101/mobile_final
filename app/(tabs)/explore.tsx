import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import SanPhamService from '../../services/sanphamservice';
import baseurl from '../../baseurl';
interface LoaiSanPham {
  id: number;
  tenLoai: string;
  donVi: string;
  duongDanAnh: string;
}

const App = () => {
  const router = useRouter();
  const [allCategories, setAllCategories] = useState<LoaiSanPham[]>([]);
  const [displayedCategories, setDisplayedCategories] = useState<LoaiSanPham[]>([]);
  const [loadCount, setLoadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const screenHeight = Dimensions.get('window').height;
  const itemHeight = 180;
  const itemsPerScreen = Math.ceil(screenHeight / itemHeight) * 2;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await SanPhamService.getAllLoaiSanPham();
        setAllCategories(data);
        setDisplayedCategories(data.slice(0, itemsPerScreen));
        setLoadCount(itemsPerScreen);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const colors = ['#00676B', '#211551', '#8B0016', '#367517', '#976D00', '#64004B'];

  const renderCategory = ({ item, index }: { item: LoaiSanPham; index: number }) => {
    const backgroundColor = colors[index % colors.length] + '55';
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor, borderColor: colors[index % colors.length] }]}
        onPress={() =>
          router.push({
            pathname: '/category',
            params: {
              title: encodeURIComponent(item.tenLoai),
              idLoai: item.id.toString(),
            },
          })
        }
      >
        <View style={styles.imageFrame}>
          <Image
            source={{ uri: `${baseurl}${item.duongDanAnh}` }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.cardText}>{item.tenLoai}</Text>
      </TouchableOpacity>
    );
  };

  const loadMoreCategories = () => {
    if (loadCount >= allCategories.length) return;
    const nextLoadCount = Math.min(loadCount + 4, allCategories.length);
    setDisplayedCategories(allCategories.slice(0, nextLoadCount));
    setLoadCount(nextLoadCount);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Find Products</Text>
      {isLoading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={displayedCategories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.grid}
          onEndReached={loadMoreCategories}
          onEndReachedThreshold={0.1}
          initialNumToRender={itemsPerScreen}
          windowSize={3}
          removeClippedSubviews={true}
          ListEmptyComponent={<Text>No categories available</Text>}
          extraData={displayedCategories}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FACE9C',
    padding: 16,
  },
  header: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    paddingBottom: 16,
  },
  card: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 12,
    margin: '1%',
  },
  imageFrame: {
    width: 145,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '100%',
  },
});

export default App;