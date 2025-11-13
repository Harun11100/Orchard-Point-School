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
    if (role === "teacher") {
      router.push("/TeacherLoginScreen");
    } else if(role === "principal"){
      router.push("/AccountsScreen");
    } else{
        router.push("/Guardian/GuardianLoginScreen");
    }
  };

  return (
    <LinearGradient colors={["#E0EAFC", "#CFDEF3"]} style={styles.container}>
      <View style={styles.header}>
        <Image
          style={styles.img}
          source={require("../assets/icons/icon2.png")}
        />
        <Text style={styles.title}>প্রাক্টিস স্কুল এন্ড কলেজ</Text>
        <Text style={styles.subtitle}>আপনার স্কুল ব্যবস্থাপনার সহচর</Text>
      </View>

      {/* Role Buttons */}
      <View style={styles.rolesContainer}>
         <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => selectRole("guardian")}
        >
          <LinearGradient
            colors={["#57c3f9ff", "#0496b3ff"]}
            style={styles.roleCard}
          >
            <Ionicons name="person-circle-outline" size={30} color="#fff" />
            <Text style={styles.roleText}>অভিভাবক</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => selectRole("teacher")}
        >
          <LinearGradient
             colors={["#159fdfff", "#6827e1ff"]}
            style={styles.roleCard}
          >
            {/* <MaterialDesignIcons name="account-school-outline" size={30} color="#fff" /> */}
             <MaterialIcons name="school" size={30} color="#fff" />
            <Text style={styles.roleText}>শিক্ষক</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => selectRole("principal")}
        >
          <LinearGradient
            colors={["#79b7fdff", "#0b3f77ff"]}
            style={styles.roleCard}
          >
            <MaterialIcons
              name="admin-panel-settings"
              size={30}
              color="#fff"
            />
            <Text style={styles.roleText}>প্রধান শিক্ষক</Text>
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
  },
  img: {
    width: 150,
    height: 150,
    marginBottom: 12,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#203291ff",
    textAlign:"center"
  },
  subtitle: {
    fontSize: 14,
    color: "#5A5A89",
    marginTop: 4,
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
