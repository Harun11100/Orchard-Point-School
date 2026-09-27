import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  StatusBar,
  Platform,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

const ShareAppScreen = () => {
  const { url = "https://schoolapp.com/download" } = useLocalSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `📲 আমাদের স্কুল অ্যাপ ডাউনলোড করুন:\n${url}`,
      });
    } catch (error) {
      console.error("Share Error:", error);
    }
  };

  const handleCopy = async () => {
    try {
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Copy error:", err);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>শেয়ার করুন</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.container}>
        {/* Decorative Badge */}
        <View style={styles.iconBadge}>
          <Ionicons name="qr-code-outline" size={30} color="#2563EB" />
        </View>

        <Text style={styles.title}>স্কুল অ্যাপটি শেয়ার করুন</Text>
        <Text style={styles.subtitle}>
          QR কোড স্ক্যান করে অথবা নিচের লিঙ্কটি কপি/শেয়ার করে অন্যদের সাথে যুক্ত
          হতে পারেন।
        </Text>

        {/* QR Code Container */}
        <View style={styles.qrCardContainer}>
          <View style={styles.qrCard}>
            <QRCode
              value={url || "https://schoolapp.com"}
              size={180}
              color="#0F172A"
              backgroundColor="#FFFFFF"
            />
          </View>

          {/* Link Box */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.linkBox}
            onPress={handleCopy}
          >
            <Feather name="link" size={16} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="middle">
              {url}
            </Text>
            <View style={styles.copyBadge}>
              <MaterialIcons
                name={copied ? "check" : "content-copy"}
                size={14}
                color={copied ? "#16A34A" : "#2563EB"}
              />
              <Text style={[styles.copyBadgeText, copied && styles.copiedText]}>
                {copied ? "কপি হয়েছে" : "কপি"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.shareButton}
            onPress={handleShare}
          >
            <LinearGradient
              colors={["#2563EB", "#1D4ED8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              <Ionicons name="share-social" size={20} color="#FFFFFF" />
              <Text style={styles.shareText}>লিঙ্ক শেয়ার করুন</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.secondaryButton}
            onPress={handleCopy}
          >
            <Feather name="copy" size={18} color="#334155" />
            <Text style={styles.secondaryBtnText}>
              {copied ? "লিঙ্ক কপি হয়েছে!" : "লিঙ্ক কপি করুন"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ShareAppScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    color: "#64748B",
    lineHeight: 20,
    paddingHorizontal: 10,
    marginBottom: 28,
  },
  qrCardContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
  },
  qrCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 16,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  urlText: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },
  copyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 8,
  },
  copyBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 4,
  },
  copiedText: {
    color: "#16A34A",
  },
  actionContainer: {
    width: "100%",
    gap: 12,
  },
  shareButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2563EB",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  gradientBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 52,
    borderRadius: 14,
  },
  shareText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});