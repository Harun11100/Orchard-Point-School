import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "guardianDashboardData";

export default function GuardianDashboardScreen() {
  const { studentId, classId, schoolId, phone } = useLocalSearchParams();
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
          router.push("/NotFoundPage");
        }
      } catch (err) {
        console.error("ড্যাশবোর্ড তথ্য আনার সময় ত্রুটি:", err);
        router.push("/NotFoundPage");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [schoolId, classId, studentId, phone]);

  const actions = [
    {
      title: "ক্লাস ও রুটিন",
      icon: "list-alt",
      route: "/ClassRoutine",
      desc: "ক্লাস ও পরীক্ষার রুটিন দেখুন",
      gradient: ["#4F46E5", "#6366F1"],
    },
    {
      title: "প্রোফাইল",
      icon: "person",
      route: "/Guardian/StudentProfileScreen",
      desc: "আপনার প্রোফাইল দেখুন",
      gradient: ["#0284C7", "#38BDF8"],
    },
    {
      title: "বাড়ির কাজ",
      icon: "assignment",
      route: "/Guardian/StudentHomeworkScreen",
      desc: "বাড়ির কাজ আপডেট দেখুন",
      gradient: ["#059669", "#34D399"],
    },
    {
      title: "নোটিশ বোর্ডে",
      icon: "announcement",
      route: "/NoticeListScreen",
      desc: "বিদ্যালয়ের নতুন নোটিশ",
      gradient: ["#D97706", "#FBBF24"],
    },
   
    {
      title: "ফলাফল",
      icon: "grading",
      route: "/Guardian/StudentResultViewScreen",
      desc: "সন্তানের পরীক্ষার ফলাফল",
      gradient: ["#DC2626", "#F87171"],
    },
    {
      title: "পেমেন্ট ইতিহাস",
      icon: "account-balance-wallet",
      route: "/Guardian/PaymentHistory",
      desc: "বেতন ও বকেয়া হিসাব",
      gradient: ["#2563EB", "#60A5FA"],
    },
    {
      title: "স্কুল অ্যালবাম",
      icon: "photo-library",
      route: "/SchoolAlbumPublicScreen",
      desc: "ছবি ও ভিডিও গ্যালারি",
      gradient: ["#DB2777", "#F472B6"],
    },
    {
      title: "কৃতি শিক্ষার্থী",
      icon: "star",
      route: "/SuccessPublicScreen",
      desc: "আমাদের সেরা শিক্ষার্থীরা",
      gradient: ["#EA580C", "#FB923C"],
    },
  ];

  const handleLogout = async () => {
    Alert.alert(
      "লগ আউট করুন?",
      "আপনি কি নিশ্চিত লগ আউট করতে চান?",
      [
        {
          text: "বাতিল",
          style: "cancel",
        },
        {
          text: "লগ আউট",
          style: "destructive",
          onPress: async () => {
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
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>ড্যাশবোর্ড তথ্য লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Top Header */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.dashboardSubtitle}>স্বাগতম,</Text>
            <Text style={styles.dashboardTitle}>অভিভাবক ড্যাশবোর্ড</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.iconLogoutBtn}>
            <MaterialIcons name="logout" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Cover & Logo Section */}
        <View style={styles.bannerContainer}>
          <Image
            source={
              schoolData?.cover
                ? { uri: schoolData.cover.url }
                : require("../assets/image/no-image.png")
            }
            style={styles.coverImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(15, 23, 42, 0.6)"]}
            style={styles.coverOverlay}
          />
          <View style={styles.logoWrapper}>
            <Image
              source={
                schoolData?.logo
                  ? { uri: schoolData.logo.url }
                  : require("../assets/icons/icon.png")
              }
              style={styles.logoImage}
            />
          </View>
        </View>

        {/* School Details */}
        <View style={styles.schoolInfoContainer}>
          <Text style={styles.schoolName}>
            {schoolData?.schoolName || "বিদ্যালয়ের নাম"}
          </Text>
          <View style={styles.statusBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.statusText}>সক্রিয় সেশন</Text>
          </View>
        </View>

        {/* Grid Action Cards */}
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              activeOpacity={0.8}
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
              <LinearGradient
                colors={action.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <MaterialIcons name={action.icon} size={24} color="#FFF" />
              </LinearGradient>
              <Text style={styles.actionTitle} numberOfLines={1}>
                {action.title}
              </Text>
              <Text style={styles.actionDesc} numberOfLines={2}>
                {action.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Action Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>লগ আউট করুন</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>© ২০২৫ বিদ্যালয় ব্যবস্থাপনা সিস্টেম</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },

  /* Header Styles */
  headerBar: {
    marginTop: 12,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dashboardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  iconLogoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Banner & Logo */
  bannerContainer: {
    position: "relative",
    borderRadius: 20,
    overflow: "visible",
    marginBottom: 45,
  },
  coverImage: {
    width: "100%",
    height: 150,
    borderRadius: 20,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  logoWrapper: {
    position: "absolute",
    bottom: -35,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },

  /* School Information */
  schoolInfoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  /* Actions Grid Layout */
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconGradient: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
  },

  /* Buttons & Footer */
  logoutButton: {
    marginTop: 16,
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EF4444",
    marginLeft: 8,
  },
  footer: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 24,
  },
});