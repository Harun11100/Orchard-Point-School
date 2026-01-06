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
import { MaterialIcons } from "@expo/vector-icons";

export default function AccountsScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo Section */}
     
        <Image
          style={styles.img}
          source={require("../assets/icons/logo.png")}
        />
  

      {/* Title */}
      <Text style={styles.title}>বারেন্ডা এফ. চাঁন একাডেমী</Text>
      <Text style={styles.subtitle}>লগইন অপশন নির্বাচন করুন</Text>

      {/* Teacher Button */}
      <LinearGradient
           colors={["#4CA8FF", "#175FCC"]}
        style={styles.button}
      >
        <TouchableOpacity
          onPress={() => router.push("/TeacherLoginScreen")}
          style={styles.buttonInner}
          activeOpacity={0.85}
        >
          <MaterialIcons name="school" size={28} color="#fff" />
          <Text style={styles.buttonText}>শিক্ষক</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Admin Button */}
      <LinearGradient
    
         colors={["#31D387", "#1E7A4F"]}
        style={[styles.button, { marginTop: 18 }]}
      >
        <TouchableOpacity
          onPress={() => router.push("/SchoolLoginScreen")}
          style={styles.buttonInner}
          activeOpacity={0.85}
        >
          <MaterialIcons name="admin-panel-settings" size={28} color="#fff" />
          <Text style={styles.buttonText}>এডমিন</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Footer */}
      <Text style={styles.footer}>© 2025 সর্বস্বত্ব সংরক্ষিত।</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#e8effaff",
    justifyContent: "center",
    alignItems: "center",
    padding: 26,
    paddingTop: 60,
  },

  logoContainer: {
    padding: 18,
    borderRadius: 120,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },

  img: {
    width: 125,
    height: 125,
    resizeMode: "contain",
    marginBottom:30
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
     color: "#2e3e8bff",
    textAlign: "center",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 38,
  },

  button: {
    width: "100%",
    borderRadius: 16,
    height: 58,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },

  buttonInner: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  footer: {
    marginTop: 70,
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
  },
});
