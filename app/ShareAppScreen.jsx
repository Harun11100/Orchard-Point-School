import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

const ShareAppScreen = () => {
  const { url } = useLocalSearchParams();
  const qrRef = useRef(null);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📲 Download our School App here:\n${url}`,
      });
    } catch (error) {
      console.error("Share Error:", error);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("অনুমতি প্রয়োজন", "গ্যালারিতে সেভ করতে অনুমতি দিন।");
      }

      qrRef.current.toDataURL(async (base64) => {
        if (!base64) {
          return Alert.alert("ত্রুটি", "QR কোড থেকে ডেটা পাওয়া যায়নি।");
        }

        const fileUri = FileSystem.cacheDirectory + "qr.png";

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await MediaLibrary.saveToLibraryAsync(fileUri);

        Alert.alert("সফল!", "QR কোড আপনার গ্যালারিতে সেভ হয়েছে।");
      });
    } catch (err) {
      console.log(err);
      Alert.alert("ত্রুটি", "QR কোড ডাউনলোড করা যায়নি।");
    }
  };

  return (
    <LinearGradient colors={["#eef3ffff", "#dae3f8ff"]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>📱 অ্যাপ শেয়ার করুন</Text>
        <Text style={styles.subtitle}>
          নিচের QR কোড স্ক্যান করে অথবা লিঙ্ক শেয়ার করে অন্যকে জানাতে পারেন।
        </Text>

        <View style={styles.qrCard}>
          <QRCode
            value={url}
            size={200}
            backgroundColor="white"
            color="black"
            getRef={(ref) => (qrRef.current = ref)}
          />
          <Text style={styles.qrText}>🔗 {url}</Text>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <LinearGradient colors={["#7fabf8ff", "#3d58b0ff"]} style={styles.gradientBtn}>
            <Ionicons name="share-social-outline" size={22} color="#fff" />
            <Text style={styles.shareText}>লিঙ্ক শেয়ার করুন</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareButton, { marginTop: 14 }]}
          onPress={handleDownloadQR}
        >
          <LinearGradient colors={["#34d399", "#059669"]} style={styles.gradientBtn}>
            <Ionicons name="download-outline" size={22} color="#fff" />
            <Text style={styles.shareText}>QR কোড ডাউনলোড করুন</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default ShareAppScreen;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 25 },
  title: { fontSize: 24, fontWeight: "800", color: "#1f5098ff", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", color: "#4b5563", marginBottom: 25 },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    elevation: 6,
    alignItems: "center",
    marginBottom: 40,
  },
  qrText: { marginTop: 10, color: "#1e6aceff", fontSize: 13, textAlign: "center" },
  shareButton: { width: "80%", borderRadius: 14, overflow: "hidden" },
  gradientBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareText: { color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 8 },
});
