import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import ProductCard from "../../components/productCard";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import NetInfo from "@react-native-community/netinfo";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function ProductListScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    fetchProducts();
    return () => unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/products/getproducts`
      );
      setProducts(res.data.products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
       <ActivityIndicator size="large" color="#115bb5ff" />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Image
          source={require("../../assets/icons/offline.png")}
          style={styles.offlineImage}
        />
        <Text style={styles.offlineTitle}>ইন্টারনেট সংযোগ নেই</Text>
        <Text style={styles.offlineText}>
          অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।
        </Text>
      </View>
    );
  }

  if (!products.length) {
    return (
      <View style={styles.loader}>
        <Text style={styles.emptyText}>কোনো পণ্য পাওয়া যায়নি।</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={{ width: "100%", marginBottom: 16 }}>
          <ProductCard product={item} />
        </View>
      )}
      // 👇 makes the header sticky while scrolling
      stickyHeaderIndices={[0]}
      ListHeaderComponent={
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={["#4e8dfaff", "#517cfbff"]}
          style={styles.headerContainer}
        >
          <Text style={styles.headerTitle}>স্মার্ট লাইব্রেরি এন্ড ষ্টেশনারী</Text>
        </LinearGradient>
      }
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: "#f8f8f8",
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#4e8dfa",
    paddingVertical: 10,
    marginVertical: 10,
    alignItems: "center",
    borderRadius: 6,
    zIndex: 10, // ensure it's above other items
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  offlineContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  offlineImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: "contain",
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333",
  },
  offlineText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
