import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import ProductCard from "../components/productCard";
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
    // Network listener
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    // Fetch products
    fetchProducts();

    return () => unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        "https://house-rent-management-uc5b.vercel.app/api/products/getproducts"
      );
      setProducts(res.data.products);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loader
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  // Offline page
  if (!isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Image
          source={require("../assets/icons/offline.png")} // আপনার অফলাইন আইকন দিন
          style={styles.offlineImage}
        />
        <Text style={styles.offlineTitle}>ইন্টারনেট সংযোগ নেই</Text>
        <Text style={styles.offlineText}>
          অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।
        </Text>
      </View>
    );
  }

  // Empty product list
  if (!products.length) {
    return (
      <View style={styles.loader}>
        <Text style={styles.emptyText}>কোনো পণ্য পাওয়া যায়নি।</Text>
      </View>
    );
  }

  // Product list
  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View style={{ width: "100%", marginBottom: 16 }}>
          <ProductCard product={item} />
        </View>
      )}
      ListHeaderComponent={
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={["#5300f9ff", "#e000feff"]} // modern gradient
          style={styles.headerContainer}
        >
          <Text style={styles.headerTitle}>বিশেষ ছাড় !</Text>
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
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 24,
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
