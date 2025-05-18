import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from './contexts/CartContext';
import { useUser } from './contexts/UserContext'; // Thêm useUser
import IP_ADDRESS from '../ipv4';

interface Item {
    id: number;
    title: string;
    subtitle: string;
    price: string;
    image: any;
}

const AllProducts: React.FC = () => {
    const router = useRouter();
    const { title, items } = useLocalSearchParams();
    const { addToCart } = useCart();
    const { user } = useUser(); // Thêm useUser

    console.log("Raw items from params:", items);

    let parsedItems: Item[] = [];
    try {
        parsedItems = items ? JSON.parse(items as string) : [];
    } catch (error) {
        console.error("Error parsing items:", error);
    }
    console.log("Parsed items:", parsedItems);

    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredItems = parsedItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddToCart = async (item: Item) => {
        if (!user) {
            alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
            router.push("/login");
            return;
        }

        const cartData = {
            accountId: parseInt(user.id),
            sanPhamId: item.id,
            soLuong: 1,
        };

        try {
            const response = await fetch(`http://${IP_ADDRESS}:8080/API_for_mobile/api/sanphammagager/themgiohang`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(cartData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Lỗi khi gọi API thêm giỏ hàng: ${response.status} - ${errorText}`);
                throw new Error(`Không thể thêm vào giỏ hàng: ${errorText}`);
            }

            const result = await response.json();
            console.log("Thêm vào giỏ hàng thành công:", result);

            const productData = {
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                price: item.price,
                image: item.image,
                quantity: result.soLuong,
            };
            addToCart(productData);

            alert("Đã thêm sản phẩm vào giỏ hàng!");
        } catch (err: any) {
            console.error("Lỗi khi thêm vào giỏ hàng:", err);
            alert(`Lỗi khi thêm vào giỏ hàng: ${err.message}`);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{title as string}</Text>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                />
            </View>

            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                    console.log("Item ID before navigation:", item.id);
                    return (
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => {
                                if (!item.id) {
                                    console.error("Item ID is undefined:", item);
                                    return;
                                }
                                router.push({
                                    pathname: '/productdetail',
                                    params: {
                                        id: item.id,
                                    },
                                });
                            }}
                        >
                            <Image source={item.image} style={styles.cardImage} />
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                            <View style={styles.cardFooter}>
                                <Text style={styles.cardPrice}>{item.price}</Text>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => handleAddToCart(item)}
                                >
                                    <Ionicons name="add" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No products found.</Text>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
    },
    card: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        marginBottom: 10,
        borderRadius: 10,
    },
    cardImage: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5,
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'gray',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6B00',
    },
    addButton: {
        backgroundColor: '#FF6B00',
        padding: 8,
        borderRadius: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 16,
        color: 'gray',
    },
});

export default AllProducts;