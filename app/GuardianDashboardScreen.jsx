import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppUpdateButton from "../components/AppUpdateButton";
import Constants from 'expo-constants';
import * as SecureStore from "expo-secure-store";

const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "guardianDashboardData";

export default function GuardianDashboardScreen() {
  const { studentId, classId, schoolId,phone } = useLocalSearchParams();
  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/guardian/guardianDashboardData?schoolId=${schoolId}&phone=${phone}`
        );
        const data = await res.json();
        
        if (data.success && data.school) {
          setSchoolData(data.school);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
          console.error("ড্যাশবোর্ড তথ্য আনতে ব্যর্থ:", data.message);
        }
      } catch (err) {
        console.error("ড্যাশবোর্ড তথ্য আনার সময় ত্রুটি:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [schoolId, classId, studentId]);

 

  const actions = [
    {
      title: "ক্লাস ও পরীক্ষার রুটিন",
      icon: "list-alt",
      route: "/Guardian/StudentRoutine",
      desc: " ক্লাস/পরীক্ষার রুটিন দেখুন",
    },
    {
      title: "প্রোফাইল",
      icon: "person",
      route: "/Guardian/StudentProfileScreen",
      desc: "আপনার প্রোফাইল দেখুন",
    },
    {
      title: "বাড়ির কাজ",
      icon: "assignment",
      route: "/Guardian/StudentHomeworkScreen",
      desc: "বাড়ির কাজ দেখুন",
    },
    {
      title: "নোটিশ",
      icon: "announcement",
      route: "/NoticeListScreen",
      desc: "বিদ্যালয়ের নোটিশ দেখুন",
    },
    {
      title: "সিলেবাস",
      icon: "book",
      route: "/Guardian/StudentSyllabus",
      desc: "বিদ্যালয়ের সিলেবাস দেখুন",
    },
    {
      title: "ফলাফল",
      icon: "grading",
      route: "/Guardian/StudentResultViewScreen",
      desc: "আপনার সন্তানের ফলাফল দেখুন",
    },
      {
      title: "নৈতিক বার্তা",
      icon: "menu-book",
      route: "/Guardian/MoralMessageScreen",
      desc: "আপনার সন্তানকে নৈতিক মূল্যবোধের সাথে গড়ে তুলুন ",
    },
    {
      title: "পেমেন্ট ইতিহাস",
      icon: "account-balance-wallet",
      route: "/Guardian/PaymentHistory",
      desc: "আপনার সন্তানের বেতনের ইতিহাস ও বকেয়া দেখুন ",
    },
    {
      title: "স্কুল অ্যালবাম",
      icon: "photo-library",
      route: "/SchoolAlbumPublicScreen",
      desc: "স্কুলের ছবি ও ভিডিও গ্যালারি দেখুন",
    },
     { title: "আমাদের কৃতি শিক্ষার্থীবৃন্দ", icon: "star-outline", route: "/SuccessPublicScreen" },
    
  ];

 const handleLogout = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEY,
      "guardianDashboardData",
    
    ]);

    await SecureStore.deleteItemAsync("guardianLogin");

    setTimeout(() => {
      router.replace("/ChooseRoleScreen");
    }, 500);
  } catch (error) {
    console.error("❌ Error during logout:", error);
  }
};


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2268e9ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>অভিভাবক ড্যাশবোর্ড</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={
            schoolData?.cover
              ? { uri: schoolData.cover.url }
              : require("../assets/image/no-image.jpg")
          }
          style={styles.coverImage}
        />
        <Image
          source={
            schoolData?.logo
              ? { uri: schoolData.logo.url }
              : require("../assets/icons/icon3.png")
          }
          style={styles.logoImage}
        />
      </View>

      <View style={{ alignItems: "center", marginTop: 50 }}>
        <Text style={{ fontSize: 22, fontWeight: "600", color: "#1E3A8A" }}>
          {schoolData?.schoolName || "বিদ্যালয়ের নাম"}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: action.route,
                params: {
                  schoolId,
                  studentId,
                  classId,
                },
              })
            }
          >
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.iconBackground}>
              <MaterialIcons name={action.icon} size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDesc}>{action.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    

      <TouchableOpacity onPress={handleLogout} style={styles.logout}>
        <MaterialIcons name="logout" size={22} color="#fff" />
        <Text style={styles.logoutText}>লগআউট</Text>
      </TouchableOpacity>
    {
      schoolData?.appUpdateUrl?.trim() && (
        <AppUpdateButton updateUrl={schoolData.appUpdateUrl} />
      )
    }
    
      <Text style={styles.footer}>© ২০২৫ বিদ্যালয় ব্যবস্থাপনা সিস্টেম</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF", paddingHorizontal: 20 },
  headerContainer: { marginTop: 20, alignItems: "center", marginBottom: 10 },
  header: { fontSize: 26, fontWeight: "700", color: "#1E3A8A" },
 imageContainer: {
    alignItems: "center",
    marginBottom:15,
     marginTop:15,
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
  },
  logoImage: {
    width: 110,
    height: 110,
    borderRadius: 60,
    position: "absolute",
    bottom: -45,
    left:20,
    borderWidth: 4,
    borderColor: "#4F46E5",
    backgroundColor: "#fff",
  },
  actionsContainer: {
    marginTop: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionTitle: { fontSize: 14, fontWeight: "700", color: "#1E3A8A", textAlign: "center" },
  actionDesc: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  logout: {
    marginTop: 30,
    flexDirection: "row",
    backgroundColor: "#6366F1",
    padding: 10,
    borderRadius: 15,
    justifyContent: "center",
    marginBottom:30
  },
  logoutText: { fontSize: 18, color: "#fff", marginLeft: 6,  },
  footer: { textAlign: "center", color: "#9CA3AF", fontSize: 13, marginTop: 30, marginBottom: 20 },
});
