import React from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function AccountsScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
       colors={["#E0F2FE", "#FFFFFF"]}
        style={styles.logoContainer}
      >
      <Image
          style={styles.img}
          source={require("../assets/icons/icon2.png")}
      />
      </LinearGradient>
      <Text style={styles.title}>প্রাক্টিস স্কুল এন্ড কলেজ</Text>
      <Text style={styles.subtitle}>
        লগইন করুন অথবা নতুন অ্যাকাউন্ট রেজিস্ট্রেশন করুন
      </Text>
      
      <LinearGradient
        colors={["#F59E0B", "#F97316"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <TouchableOpacity
          onPress={() => router.push("/SchoolRegisterScreen")}
          style={styles.buttonInner}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>রেজিস্ট্রেশন</Text>
        </TouchableOpacity>
      </LinearGradient>

      <LinearGradient
        colors={["#65bdecff", "#1756baff"]}
        style={[styles.button, { marginTop: 16 }]}
      >
        <TouchableOpacity
          onPress={() => router.push("/SchoolLoginScreen")}
          style={styles.buttonInner}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>লগইন</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Footer */}
      <Text style={styles.footer}>
        © 2025 সর্বস্বত্ব সংরক্ষিত।
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  logoContainer: {
    borderRadius: 100,
    padding: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  img: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#164c98ff",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 35,
  },
  button: {
    width: "100%",
    borderRadius: 14,
    height: 52,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
    width: "100%",
    justifyContent: "center",
  },
  line: {
    height: 1,
    backgroundColor: "#CBD5E1",
    flex: 1,
  },
  orText: {
    color: "#64748B",
    marginHorizontal: 10,
    fontWeight: "600",
  },
  ctsBtn: {
    width: "100%",
    marginTop: 10,
  },
  ctsGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    height: 52,
    gap: 8,
  },
  ctsText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  footer: {
    marginTop: 60,
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
});
