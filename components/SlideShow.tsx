import React, { useState } from "react";
import { View, Text, Image, Dimensions, StyleSheet } from "react-native";
import Carousel from "react-native-snap-carousel";

const { width } = Dimensions.get("window");

const data = [
    {
        id: "1",
        title: "Fresh Vegetables",
        image: require('../assets/images/freshVegetable.png'),
    },
    {
        id: "2",
        title: "Tropical Fruits",
        image: require("../assets/images/traicay.png"),
    },
    {
        id: "3",
        title: "Dairy Products",
        image: require("../assets/images/traicay.png"),
    },
];

const SlideShow = () => {
    const [activeSlide, setActiveSlide] = useState(0);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.slide}>
            <Image source={item.image} style={styles.image} resizeMode="cover" />
            <Text style={styles.title}>{item.title}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Carousel
                data={data}
                renderItem={renderItem}
                sliderWidth={width}
                itemWidth={width * 0.8}
                loop
                autoplay
                autoplayInterval={3000}
                onSnapToItem={(index) => setActiveSlide(index)}
            />
            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {data.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            activeSlide === index ? styles.activeDot : styles.inactiveDot,
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    slide: {
        backgroundColor: "#fff",
        borderRadius: 10,
        alignItems: "center",
        padding: 10,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    image: {
        width: "100%",
        height: 200,
        borderRadius: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 10,
    },
    pagination: {
        flexDirection: "row",
        marginTop: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: "#53B175",
    },
    inactiveDot: {
        backgroundColor: "#aaa",
    },
});

export default SlideShow;
