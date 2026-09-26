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
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppUpdateButton from "../components/AppUpdateButton";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const STORAGE_KEY = "teacherDashboardData";
const { width } = Dimensions.get("window");

export default function TeacherDashboardScreen() {
  const { phone, schoolId } = useLocalSearchParams();

  const [schoolData, setSchoolData] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    const fetchSchool = async () => {
      if (!schoolId || !phone) {
        router.replace("/TeacherLoginScreen");
        return;
      }

      try {
        const res = await fetch(
          `${API_URL}/api/teacher/teacherDashboard?schoolId=${schoolId}&phone=${phone}`
        );

        const data = await res.json();

        if (data.success && data.school && data.teacher) {
          setSchoolData(data.school);
          setTeacherData(data.teacher);

          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data.school)
          );

          await AsyncStorage.setItem(
            "teacherInfo",
            JSON.stringify(data.teacher)
          );
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
          await AsyncStorage.removeItem("teacherInfo");

          router.replace("/NotFoundTeacher");
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);

        await AsyncStorage.removeItem(STORAGE_KEY);
        await AsyncStorage.removeItem("teacherInfo");

        router.replace("/TeacherLoginScreen");
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [schoolId, phone]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    Alert.alert(
      "লগ আউট করুন?",
      "আপনি কি নিশ্চিতভাবে আপনার অ্যাকাউন্ট থেকে লগ আউট করতে চান?",
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
              await AsyncStorage.removeItem(STORAGE_KEY);
              await AsyncStorage.removeItem("teacherInfo");

              router.replace("/ChooseRoleScreen");
            } catch (error) {
              console.error("Logout error:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // ==========================================
  // COMMON ROUTE PARAMS
  // ==========================================

  const commonParams = {
    schoolId,
    teacherId: teacherData?._id,
    teacherName: teacherData?.name,
    teacherPhone: teacherData?.phone,
    teacherData: JSON.stringify(teacherData || {}),
  };

  // ==========================================
  // ACTIONS
  // ==========================================

  const actions = [
    {
      title: "ক্লাস ও পরীক্ষার রুটিন",
      desc: "আপনার ক্লাস ও পরীক্ষার রুটিন দেখুন",
      icon: "calendar-month",
      color: "#4F46E5",
      route: "/TeacherClassRoutine",
    },
    {
      title: "উপস্থিতি",
      desc: "শিক্ষার্থীদের উপস্থিতি নিন",
      icon: "fact-check",
      color: "#059669",
      route: "/ClassListForAttendance",
    },
    {
      title: "হোমওয়ার্ক",
      desc: "নতুন হোমওয়ার্ক দিন",
      icon: "assignment",
      color: "#D97706",
      route: "/ClassListForHomework",
    },
    {
      title: "সিলেবাস",
      desc: "সিলেবাস তৈরি ও পরিচালনা করুন",
      icon: "menu-book",
      color: "#7C3AED",
      route: "/ClassListForSyllabus",
    },
    {
      title: "ফলাফল",
      desc: "শিক্ষার্থীদের ফলাফল আপডেট করুন",
      icon: "grading",
      color: "#DB2777",
      route: "/ClassListForResult",
    },
    {
      title: "নোটিশ",
      desc: "স্কুলের গুরুত্বপূর্ণ নোটিশ দেখুন",
      icon: "notifications-active",
      color: "#0284C7",
      route: "/NoticeListScreen",
    },
    {
      title: "প্রোফাইল",
      desc: "আপনার প্রোফাইল আপডেট করুন",
      icon: "person",
      color: "#475569",
      route: "/TeacherDetailsUpdate",
    },
    {
      title: "নৈতিক বার্তা",
      desc: "শিক্ষার্থীদের জন্য নৈতিক বার্তা দিন",
      icon: "auto-stories",
      color: "#92400E",
      route: "/ClassSelectForMoral",
    },
    {
      title: "স্কুল অ্যালবাম",
      desc: "স্কুলের ছবি ও ভিডিও দেখুন",
      icon: "photo-library",
      color: "#0891B2",
      route: "/SchoolAlbumPublicScreen",
    },
    {
      title: "কৃতি শিক্ষার্থী",
      desc: "সফল শিক্ষার্থীদের দেখুন",
      icon: "star",
      color: "#CA8A04",
      route: "/SuccessPublicScreen",
    },
  ];

  // ==========================================
  // NAVIGATION
  // ==========================================

  const openAction = (action) => {
    router.push({
      pathname: action.route,
      params: commonParams,
    });
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.loadingLogo}>
          <Ionicons
            name="school"
            size={34}
            color="#4F46E5"
          />
        </View>

        <ActivityIndicator
          size="large"
          color="#4F46E5"
          style={{ marginTop: 18 }}
        />

        <Text style={styles.loadingText}>
          ড্যাশবোর্ড প্রস্তুত হচ্ছে...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#4F46E5"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* =====================================
            HERO HEADER
        ===================================== */}

        <LinearGradient
          colors={["#4F46E5", "#6366F1", "#818CF8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.topBar}>
            <View>
              <Text style={styles.smallGreeting}>
                স্বাগতম 👋
              </Text>

              <Text style={styles.dashboardTitle}>
                শিক্ষক ড্যাশবোর্ড
              </Text>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/NoticeListScreen",
                  params: commonParams,
                })
              }
            >
              <Ionicons
                name="notifications-outline"
                size={23}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

          {/* Teacher Info */}

          <View style={styles.teacherHeader}>
            <View style={styles.teacherAvatar}>
              {teacherData?.imageUrl ? (
                <Image
                  source={{
                    uri: teacherData.imageUrl,
                  }}
                  style={styles.teacherImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {teacherData?.name
                    ?.charAt(0)
                    ?.toUpperCase() || "T"}
                </Text>
              )}
            </View>

            <View style={styles.teacherInfo}>
              <Text style={styles.teacherName}>
                {teacherData?.name || "শিক্ষক"}
              </Text>

              <View style={styles.roleBadge}>
                <Ionicons
                  name={
                    teacherData?.role === "admin"
                      ? "shield-checkmark"
                      : teacherData?.role === "accountant"
                      ? "calculator"
                      : "school"
                  }
                  size={13}
                  color="#E0E7FF"
                />

                <Text style={styles.roleText}>
                  {teacherData?.role === "admin"
                    ? "অ্যাডমিন"
                    : teacherData?.role === "accountant"
                    ? "হিসাবরক্ষক"
                    : "শিক্ষক"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* =====================================
            SCHOOL CARD
        ===================================== */}

        <View style={styles.schoolCard}>
          <View style={styles.schoolLogoWrapper}>
            <Image
              source={
                schoolData?.logo?.url
                  ? { uri: schoolData.logo.url }
                  : require("../assets/icons/icon.png")
              }
              style={styles.schoolLogo}
            />
          </View>

          <View style={styles.schoolInfo}>
            <Text style={styles.schoolLabel}>
              আপনার প্রতিষ্ঠান
            </Text>

            <Text
              style={styles.schoolName}
              numberOfLines={2}
            >
              {schoolData?.schoolName ||
                "বিদ্যালয়ের নাম"}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#94A3B8"
          />
        </View>

        {/* =====================================
            COVER IMAGE
        ===================================== */}

        <View style={styles.coverWrapper}>
          <Image
            source={
              schoolData?.cover?.url
                ? { uri: schoolData.cover.url }
                : require("../assets/image/no-image.png")
            }
            style={styles.coverImage}
          />

          <LinearGradient
            colors={[
              "transparent",
              "rgba(15,23,42,0.65)",
            ]}
            style={styles.coverOverlay}
          />

          <View style={styles.coverText}>
            <Text style={styles.coverTitle}>
              Smart School Management
            </Text>

            <Text style={styles.coverSubtitle}>
              শিক্ষা ব্যবস্থাপনা আরও সহজ ও আধুনিক
            </Text>
          </View>
        </View>

        {/* =====================================
            QUICK ACTION TITLE
        ===================================== */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              দ্রুত কাজ
            </Text>

            <Text style={styles.sectionSubtitle}>
              আপনার প্রতিদিনের কাজগুলো এখান থেকে পরিচালনা করুন
            </Text>
          </View>

          <View style={styles.sectionIcon}>
            <Ionicons
              name="grid-outline"
              size={20}
              color="#4F46E5"
            />
          </View>
        </View>

        {/* =====================================
            ACTION GRID
        ===================================== */}

        <View style={styles.actionGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => openAction(action)}
            >
              <View
                style={[
                  styles.actionIcon,
                  {
                    backgroundColor:
                      `${action.color}15`,
                  },
                ]}
              >
                <MaterialIcons
                  name={action.icon}
                  size={25}
                  color={action.color}
                />
              </View>

              <Text
                style={styles.actionTitle}
                numberOfLines={2}
              >
                {action.title}
              </Text>

              <Text
                style={styles.actionDescription}
                numberOfLines={2}
              >
                {action.desc}
              </Text>

              <View style={styles.actionArrow}>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={action.color}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* =====================================
            ADMIN ACTION
        ===================================== */}

        {teacherData?.role === "admin" && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.specialCard}
            onPress={() =>
              router.push({
                pathname: "/CreateStudent",
                params: commonParams,
              })
            }
          >
            <LinearGradient
              colors={["#4338CA", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.specialGradient}
            >
              <View style={styles.specialIcon}>
                <MaterialIcons
                  name="person-add"
                  size={27}
                  color="#fff"
                />
              </View>

              <View style={styles.specialContent}>
                <Text style={styles.specialTitle}>
                  নতুন শিক্ষার্থী
                </Text>

                <Text style={styles.specialDescription}>
                  নতুন শিক্ষার্থীকে স্কুল সিস্টেমে যুক্ত করুন
                </Text>
              </View>

              <Ionicons
                name="arrow-forward-circle"
                size={32}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* =====================================
            ACCOUNTANT ACTION
        ===================================== */}

        {teacherData?.role === "accountant" && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.specialCard}
            onPress={() =>
              router.push({
                pathname: "/ClassListScreenPayment",
                params: commonParams,
              })
            }
          >
            <LinearGradient
              colors={["#047857", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.specialGradient}
            >
              <View style={styles.specialIcon}>
                <MaterialIcons
                  name="payments"
                  size={27}
                  color="#fff"
                />
              </View>

              <View style={styles.specialContent}>
                <Text style={styles.specialTitle}>
                  পেমেন্ট ব্যবস্থাপনা
                </Text>

                <Text style={styles.specialDescription}>
                  শিক্ষার্থীদের ফি ও পেমেন্ট পরিচালনা করুন
                </Text>
              </View>

              <Ionicons
                name="arrow-forward-circle"
                size={32}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>
        )}
        {/* =====================================
            APP UPDATE
        ===================================== */}

        {schoolData?.appUpdateUrl?.trim() && (
          <View style={styles.updateContainer}>
            <AppUpdateButton
              updateUrl={schoolData.appUpdateUrl}
              schoolId={schoolId}
            />
          </View>
        )}

        {/* =====================================
            BOTTOM ACTIONS
        ===================================== */}

        <View style={styles.bottomActions}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <MaterialIcons
              name="logout"
              size={21}
              color="#DC2626"
            />

            <Text style={styles.logoutText}>
              লগ আউট
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.shareButton}
            onPress={() =>
              router.push({
                pathname: "/ShareAppScreen",
                params: {
                  url:
                    schoolData?.appUpdateUrl ||
                    "https://150store.com",
                },
              })
            }
          >
            <Ionicons
              name="share-social-outline"
              size={21}
              color="#fff"
            />

            <Text style={styles.shareText}>
              অ্যাপ শেয়ার করুন
            </Text>
          </TouchableOpacity>
        </View>

        {/* =====================================
            FOOTER
        ===================================== */}

        <View style={styles.footer}>
          <Ionicons
            name="school-outline"
            size={17}
            color="#94A3B8"
          />

          <Text style={styles.footerText}>
            Smart School Management System
          </Text>

          <Text style={styles.footerCopyright}>
            © ২০২৫
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    paddingBottom: 35,
  },

  // ===============================
  // LOADING
  // ===============================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingLogo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  // ===============================
  // HERO
  // ===============================

  hero: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  smallGreeting: {
    color: "#E0E7FF",
    fontSize: 13,
    marginBottom: 4,
  },

  dashboardTitle: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "800",
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  teacherHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },

  teacherAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },

  teacherImage: {
    width: "100%",
    height: "100%",
  },

  avatarText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#4F46E5",
  },

  teacherInfo: {
    marginLeft: 14,
    flex: 1,
  },

  teacherName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  roleText: {
    color: "#E0E7FF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },

  // ===============================
  // SCHOOL CARD
  // ===============================

  schoolCard: {
    marginHorizontal: 20,
    marginTop: -12,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  schoolLogoWrapper: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  schoolLogo: {
    width: 47,
    height: 47,
    borderRadius: 14,
  },

  schoolInfo: {
    flex: 1,
    marginLeft: 13,
  },

  schoolLabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginBottom: 3,
  },

  schoolName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },

  // ===============================
  // COVER
  // ===============================

  coverWrapper: {
    marginHorizontal: 20,
    marginTop: 18,
    height: 150,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },

  coverImage: {
    width: "100%",
    height: "100%",
  },

  coverOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
  },

  coverText: {
    position: "absolute",
    bottom: 15,
    left: 17,
    right: 17,
  },

  coverTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },

  coverSubtitle: {
    color: "#E2E8F0",
    fontSize: 11,
    marginTop: 3,
  },

  // ===============================
  // SECTION
  // ===============================

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
    maxWidth: width - 90,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },

  // ===============================
  // ACTION GRID
  // ===============================

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },

  actionCard: {
    width: "48%",
    minHeight: 168,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 13,

    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 2,
  },

  actionIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  actionTitle: {
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
  },

  actionDescription: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  actionArrow: {
    position: "absolute",
    right: 14,
    bottom: 13,
  },

  // ===============================
  // SPECIAL CARDS
  // ===============================

  specialCard: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 13,
    borderRadius: 21,
    overflow: "hidden",

    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  specialGradient: {
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  specialIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  specialContent: {
    flex: 1,
    marginLeft: 13,
  },

  specialTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  specialDescription: {
    color: "#E0E7FF",
    fontSize: 11,
    marginTop: 4,
  },

  // ===============================
  // STORE
  // ===============================

  storeCard: {
    marginHorizontal: 20,
    marginTop: 5,
    borderRadius: 21,
    overflow: "hidden",

    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 3,
  },

  storeGradient: {
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  storeIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.17)",
    alignItems: "center",
    justifyContent: "center",
  },

  storeContent: {
    flex: 1,
    marginLeft: 13,
  },

  storeTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  storeDescription: {
    color: "#EDE9FE",
    fontSize: 11,
    marginTop: 4,
  },

  // ===============================
  // UPDATE
  // ===============================

  updateContainer: {
    marginHorizontal: 20,
    marginTop: 18,
  },

  // ===============================
  // BOTTOM BUTTONS
  // ===============================

  bottomActions: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 22,
    gap: 10,
  },

  logoutButton: {
    width: 105,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  logoutText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },

  shareButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  shareText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },

  // ===============================
  // FOOTER
  // ===============================

  footer: {
    alignItems: "center",
    marginTop: 28,
  },

  footerText: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 6,
  },

  footerCopyright: {
    color: "#CBD5E1",
    fontSize: 10,
    marginTop: 3,
  },
});
