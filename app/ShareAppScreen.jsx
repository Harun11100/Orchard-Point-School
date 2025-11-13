import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  SafeAreaView,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";

const ShareAppScreen = () => {
  const { url } = useLocalSearchParams();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📲 Download our School App here:\n${url}`,
      });
    } catch (error) {
      console.error("Share Error:", error);
    }
  };

  return (
    <LinearGradient colors={["#e8f1ffff", "#bfdfffff", "#bed0f6ff"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>📱 অ্যাপ শেয়ার করুন</Text>
        <Text style={styles.subtitle}>
          নিচের QR কোড স্ক্যান করে অথবা লিঙ্ক শেয়ার করে অন্যকে জানাতে পারেন।
        </Text>
        <View style={styles.qrCard}>
          <QRCode value={url} size={200} />
          <Text style={styles.qrText}>🔗 {url}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.shareButton}
          onPress={handleShare}
        >
          <LinearGradient
            colors={["#7fabf8ff", "#1b72e4ff"]}
           
            style={styles.gradientBtn}
          >
            <Ionicons name="share-social-outline" size={22} color="#fff" />
            <Text style={styles.shareText}>লিঙ্ক শেয়ার করুন</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ShareAppScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0574ebff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#4b5563",
    marginBottom: 25,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    alignItems: "center",
    marginBottom: 40,
  },
  qrText: {
    marginTop: 10,
    color: "#1876f1ff",
    fontSize: 13,
    textAlign: "center",
  },
  shareButton: {
    width: "80%",
    borderRadius: 14,
    overflow: "hidden",
  },
  gradientBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  shareText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
