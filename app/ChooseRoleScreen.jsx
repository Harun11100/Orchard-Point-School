import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,

} from "react-native";
import * as SecureStore from "expo-secure-store";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons} from "@expo/vector-icons";


export default function ChooseRoleScreen() {
  const router = useRouter();

  const selectRole = async (role) => {
    await SecureStore.setItemAsync("userRole", role);
    if (role === "administration") {
     router.push("/AccountsScreen");
    } else{
        router.push("/Guardian/GuardianLoginScreen");
    }
  };

  return (
    <LinearGradient colors={["#ffffffff", "#e8e9fcff"]} style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
               colors={["#D9EFFF", "#FFFFFF"]}
               style={styles.logoContainer}
             >
               <Image
                 style={styles.img}
                 source={require("../assets/icons/logo.png")}
               />
             </LinearGradient>
        <Text style={styles.title}>বারেন্ডা এফ চাঁন একাডেমী </Text>
        <Text style={styles.subtitle}>আপনার স্কুল ব্যবস্থাপনার সহচর</Text>
      </View>

      {/* Role Buttons */}
      <View style={styles.rolesContainer}>
         <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => selectRole("guardian")}
        >
          <LinearGradient
            colors={["#57d0f9ff", "#046ab3ff"]}
            style={styles.roleCard}
          >
            <Ionicons name="person-circle-outline" size={30} color="#fff" />
            <Text style={styles.roleText}>অভিভাবক</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => selectRole("administration")}
        >
          <LinearGradient
             colors={["#3cd6b5ff", "#126e5aff"]}
            style={styles.roleCard}
          >
          
            <MaterialIcons
              name="admin-panel-settings"
              size={30}
              color="#fff"
            />
            <Text style={styles.roleText}> প্রাতিষ্ঠানিক </Text>
          </LinearGradient>
        </TouchableOpacity>

      
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginHorizontal:30
  },
  img: {
   width: 165,
    height: 165,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e3e8bff",
    textAlign:"center"
  },
  subtitle: {
    fontSize: 14,
    color: "#5A5A89",
    marginTop: 4,
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
  rolesContainer: {
    width: "90%",
    gap: 20,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
  },
  roleText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },

  footer: {
    marginTop: 50,
    alignItems: "center",
  },
  guideBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#0b5737ff",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  guideBtnText: {
    color: "#145934ff",
    fontSize: 16,
    fontWeight: "500",
  },
});

