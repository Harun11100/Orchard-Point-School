import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Make sure this key matches what you used in your app
const STORAGE_KEY = "guardianDashboardData";

export default function NotFoundScreen() {
  const router = useRouter();

  const handleGoBack = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEY,
        "guardianDashboardData",
      ]);

      await SecureStore.deleteItemAsync("guardianLogin");

      router.push("/ChooseRoleScreen");
    } catch (error) {
      console.error("❌ Error clearing data:", error);
    }
  };

  return (
    <View style={styles.container}>
      <MaterialIcons name="error-outline" size={80} color="#EF4444" />
      <Text style={styles.title}>পৃষ্ঠা পাওয়া যায়নি</Text>
      <Text style={styles.message}>
        আপনি যে তথ্যটি খুঁজছেন তা পাওয়া যায়নি বা মুছে ফেলা হয়েছে।
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleGoBack}>
        <LinearGradient colors={["#4F46E5", "#6366F1"]} style={styles.gradient}>
          <Text style={styles.buttonText}>প্রধান পৃষ্ঠায় ফিরে যান</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#F3F4F6",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginTop: 16,
  },
  message: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginVertical: 12,
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
