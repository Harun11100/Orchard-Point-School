"use client";

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
import Constants from "expo-constants";

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
      const res = await axios.get(`${API_URL}/api/products/getproducts`);
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
        <ActivityIndicator size="large" color="#5B4BFF" />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Image
          source={require("../assets/icons/offline.png")}
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
      ListHeaderComponent={
        <LinearGradient
          colors={["#5B4BFF", "#874CFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerContainer}
        >
          <Text style={styles.headerTitle}>আমাদের পণ্যসমূহ</Text>
        </LinearGradient>
      }
      ListFooterComponent={
       <LinearGradient
            colors={["#4F46E5", "#6D28D9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.footerContainer}
          >
            {/* Brand Logo */}
            <View style={styles.brandRow}>
              <Image
                source={require("../assets/icons/store.png")}
                style={styles.footerLogo}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.footerBrand}> স্মার্ট লাইব্রেরী এন্ড স্টেশনারি </Text>
                <View style={styles.verifiedRow}>
                  <Image
                    source={require("../assets/icons/verified.png")}
                    style={styles.verifiedIcon}
                  />
                  <Text style={styles.verifiedText}>Trusted & Verified</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

      }
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 40,
        backgroundColor: "#F4F5F7",
      }}
      showsVerticalScrollIndicator={false}
    />
  );
}
const styles = StyleSheet.create({
  // HEADER
  headerContainer: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 5,
    marginBottom: 18,
    marginTop: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },

  // FOOTER
  footerContainer: {

    paddingVertical: 20,
    borderRadius: 16,
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: "flex-start",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  footerLogo: {
    width: 60,
    height: 60,
    tintColor: "#fff",
  },

  footerBrand: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  verifiedIcon: {
    width: 20,
    height: 20,
    tintColor: "#A5F3FC",
    marginRight: 6,
  },

  verifiedText: {
    fontSize: 14,
    color: "#E0F2FE",
  },


  // LOADER
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },

  // OFFLINE
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
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    color: "#4B5563",
  },
  offlineText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
});
