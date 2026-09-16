import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AppUpdateButton from "../components/AppUpdateButton";
import Constants from 'expo-constants';
import * as SecureStore from "expo-secure-store";
import UpdateAlert from "../components/updatePopup";

const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "schoolData";
const { width } = Dimensions.get("window");

export default function PrincipalDashboardScreen() {
  const { phone, schoolId } = useLocalSearchParams();
  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const router = useRouter();

  const stats = [
    {
      id: 1,
      title: "মোট শিক্ষার্থী",
      count: schoolData?.totalStudents,
      icon: "people",
      color: ["#6366F1", "#4F46E5"],
    },
    {
      id: 2,
      title: "মাসিক পেমেন্ট গণনা",
      count: schoolData?.totalPaymentCount,
      icon: "wallet",
      isButton: true,
      color: ["#10B981", "#059669"],
    },
    {
      id: 3,
      title: "মোট শিক্ষক",
      count: schoolData?.totalTeachers,
      icon: "school",
      color: ["#3B82F6", "#2563EB"],
    },
    {
      id: 4,
      title: "মোট নোটিশ",
      count: schoolData?.totalNotice,
      icon: "notifications",
      color: ["#F59E0B", "#D97706"],
    },
  ];

  const loadOwnerFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.phone === phone) setSchoolData(parsed);
      }
    } catch (err) {
      console.error("Error loading schoolData from storage:", err);
    }
  };

  const fetchSchoolData = async () => {
    const token = await SecureStore.getItemAsync("auth_token");
    if (!token) {
      router.replace("/ChooseRoleScreen");
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/school/getSchoolData?schoolId=${schoolId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.status === 200 && response.data.success) {
        const data = response.data.school || null;
        if (data) {
          setSchoolData(data);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error("Error fetching schoolData:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initData = async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      await fetchSchoolData();
    } else {
      await loadOwnerFromStorage();
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initData();
  }, [phone, schoolId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    initData();
  }, []);

  const resetPaymentCount = async () => {
    Alert.alert(
      "নিশ্চিতকরণ",
      "আপনি কি নিশ্চিত যে আপনি মাসিক পেমেন্ট কাউন্ট রিসেট করতে চান?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              const response = await axios.post(
                `${API_URL}/api/school/resetPaymentCount`,
                { schoolId }
              );

              if (response.status === 200 && response.data.success) {
                setOtpModalVisible(true);
                Alert.alert("✅ কোড পাঠানো হয়েছে", "আপনার ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।");
              } else {
                alert("পেমেন্ট কাউন্ট রিসেটের জন্য কোড পাঠাতে ব্যর্থ হয়েছে।");
              }
            } catch (err) {
              console.error("Error resetting payment count:", err);
              alert("পেমেন্ট কাউন্ট রিসেটের জন্য কোড পাঠাতে ব্যর্থ হয়েছে।");
            }
          },
        },
      ]
    );
  };

  const verifyOtpAndReset = async () => {
    if (!otp.trim()) {
      Alert.alert("ত্রুটি", "অনুগ্রহ করে কোড লিখুন।");
      return;
    }
    
    setVerifying(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/school/verifyResetCode`,
        { schoolId, code: otp }
      );
      if (response.data.success) {
        Alert.alert("✅ সফল", "পেমেন্ট কাউন্ট সফলভাবে রিসেট হয়েছে।");
        setOtpModalVisible(false);
        fetchSchoolData();
      } else {
        Alert.alert("❌ ভুল কোড", "কোডটি সঠিক নয়। আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      Alert.alert("ত্রুটি", "কোড যাচাই করতে ব্যর্থ হয়েছে।");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!schoolData) {
    return (
      <View style={styles.lcontainer}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="wifi-off" size={40} color="#4F46E5" />
        </View>
        <Text style={styles.title}>সংযোগ বিচ্ছিন্ন</Text>
        <Text style={styles.subtitle}>
          আপনার ইন্টারনেট সংযোগটি পরীক্ষা করুন এবং সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।
        </Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={initData}>
          <Text style={styles.buttonText}>আবার চেষ্টা করুন</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allActions = [
    { title: "পেমেন্ট পরিচালনা", icon: "account-balance-wallet", route: "/ClassListScreenPayment" },
    { title: "ফলাফল ও গ্রেড", icon: "grading", route: "/ClassListScreenResult" },
    { title: "হোমওয়ার্ক দিন", icon: "assignment", route: "/ClassListForHomework" },
    { title: "রুটিন আপলোড", icon: "book-online", route: "/RoutineUploadScreen" },
    { title: "নোটিশ তৈরি করুন", icon: "notifications-active", route: "/CreateNotice" },
    { title: "শিক্ষার্থী হাজিরা", icon: "how-to-reg", route: "/ClassListScreenAttendance" },
    { title: "বিষয় তালিকা", icon: "subject", route: "/ClassListForSubject" },
    { title: "শিক্ষার্থী তালিকা", icon: "format-list-bulleted", route: "/ClassListScreen" },
    { title: "শিক্ষক তালিকা", icon: "school", route: "/TeachersListScreen" },
    { title: "শিক্ষার্থী যোগ করুন", icon: "person-add-alt", route: "/CreateStudent" },
    { title: "শ্রেণী তালিকা", icon: "post-add", route: "/CreateClass" },
    { title: "শিক্ষক যোগ করুন", icon: "person-add", route: "/CreateTeacher" },
    { title: "স্কুল অ্যালবাম", icon: "photo-library", route: "/SchoolAlbumScreen" },
    { title: "কৃতি শিক্ষার্থী তালিকা", icon: "star", route: "/OurSuccessScreen" },
  ];

  const sidebarListItems = allActions.filter((item) => item.title.includes("তালিকা"));
  const mainActions = allActions.filter((item) => !item.title.includes("তালিকা"));

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />
        }
      >
        {schoolData.availableAlert === true && (
          <UpdateAlert
            availableAlert={schoolData.availableAlert || false}
            alertTitle={schoolData.alertTitle}
            alertMessage={schoolData.alertMessage}
          />
        )}

        {/* Top Advanced Header Banner */}
        <View style={styles.headerWrapper}>
          <Image
            source={{ uri: schoolData?.cover?.url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(15, 23, 42, 0.4)"]}
            style={styles.coverGradient}
          />
          
          <View style={styles.topRightIcons}>
            <TouchableOpacity
              onPress={() => setSidebarVisible(true)}
              style={styles.iconButtonStyle}
              activeOpacity={0.8}
            >
              <MaterialIcons name="menu" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/SettingsScreen",
                  params: { schoolData: JSON.stringify(schoolData) },
                })
              }
              style={styles.iconButtonStyle}
              activeOpacity={0.8}
            >
              <MaterialIcons name="settings" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileRow}>
            <Image
              source={{ uri: schoolData?.logo?.url }}
              style={styles.logoImage}
              resizeMode="cover"
            />
            <View style={styles.titleContainer}>
              <Text style={styles.schoolName} numberOfLines={2}>
                {schoolData.schoolName}
              </Text>
              <View style={styles.badgeContainer}>
                <Ionicons name="shield-checkmark" size={14} color="#059669" />
                <Text style={styles.badgeText}>অ্যাক্টিভ ড্যাশবোর্ড</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Bento Grid */}
        <View style={styles.statsContainer}>
          {stats.map((item) => (
            <TouchableOpacity
              key={item.id}
              disabled={!item.isButton}
              onPress={item.isButton ? resetPaymentCount : null}
              activeOpacity={item.isButton ? 0.8 : 1}
              style={styles.statCardWrapper}
            >
              <LinearGradient
                colors={item.color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <View style={styles.statHeaderRow}>
                  <View style={styles.statIconBox}>
                    <Ionicons name={item.icon} size={18} color="#fff" />
                  </View>
                  {item.isButton && (
                    <View style={styles.resetBadge}>
                      <Text style={styles.resetBadgeText}>রিসেট</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.statCount}>{item.count ?? 0}</Text>
                <Text style={styles.statTitle}>{item.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Management Actions Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>পরিচালনা প্যানেল</Text>
          <Text style={styles.sectionSubtitle}>ম্যানেজমেন্ট অপশনসমূহ</Text>
        </View>

        <View style={styles.actionsGrid}>
          {mainActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={() => router.push({ pathname: action.route, params: { schoolId } })}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconBox}>
                <MaterialIcons name={action.icon} size={22} color="#4F46E5" />
              </View>
              <Text style={styles.actionText} numberOfLines={2}>{action.title}</Text>
              <MaterialIcons name="arrow-forward-ios" size={12} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {schoolData?.appUpdateUrl?.trim() && (
          <View style={{ marginTop: 15 }}>
            <AppUpdateButton updateUrl={schoolData.appUpdateUrl} />
          </View>
        )}

        {/* Share App CTA */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.shareBtn}
          onPress={() =>
            router.push({
              pathname: "/ShareAppScreen",
              params: { url: schoolData.appUpdateUrl || "https://150store.com" },
            })
          }
        >
          <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.gradientBtn}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={styles.shareBtnText}>অ্যাপটি শেয়ার করুন</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.footer}>© ২০২৬ বিদ্যালয় ব্যবস্থাপনা সিস্টেম</Text>
      </ScrollView>

      {/* Slide-out Sidebar Drawer Modal */}
      <Modal visible={sidebarVisible} animationType="fade" transparent>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialIcons name="list-alt" size={20} color="#4F46E5" />
                <Text style={styles.drawerTitle}>সকল তালিকা সমূহ</Text>
              </View>
              <TouchableOpacity onPress={() => setSidebarVisible(false)} style={styles.closeDrawerBtn}>
                <MaterialIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
              {sidebarListItems.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.drawerItem}
                  onPress={() => {
                    setSidebarVisible(false);
                    router.push({ pathname: item.route, params: { schoolId } });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.drawerItemIcon}>
                    <MaterialIcons name={item.icon} size={18} color="#4F46E5" />
                  </View>
                  <Text style={styles.drawerItemText}>{item.title}</Text>
                  <MaterialIcons name="chevron-right" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <TouchableOpacity 
            style={styles.drawerBackdropTouch} 
            activeOpacity={1} 
            onPress={() => setSidebarVisible(false)} 
          />
        </View>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal visible={otpModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <MaterialIcons name="lock-reset" size={28} color="#4F46E5" />
            </View>
            <Text style={styles.modalTitle}>ভেরিফিকেশন কোড দিন</Text>
            <Text style={styles.modalSubText}>আপনার ইমেইলে পাঠানো ৬ সংখ্যার কোডটি এখানে দিন।</Text>
            
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              placeholder="------"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              style={[styles.verifyButton, verifying && { opacity: 0.6 }]}
              onPress={verifyOtpAndReset}
              disabled={verifying}
            >
              <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.verifyButtonGradient}>
                <Text style={styles.verifyButtonText}>
                  {verifying ? "যাচাই হচ্ছে..." : "যাচাই করুন"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setOtpModalVisible(false)}
            >
              <Text style={styles.cancelText}>বাতিল</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  headerWrapper: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  coverImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#E2E8F0",
  },
  coverGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  topRightIcons: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    gap: 8,
  },
  iconButtonStyle: {
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    padding: 8,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -35,
  },
  logoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    backgroundColor: "#E2E8F0",
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
    marginTop: 38,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statCardWrapper: {
    width: "48%",
    marginBottom: 14,
  },
  statCard: {
    borderRadius: 20,
    padding: 16,
    minHeight: 115,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  statHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statIconBox: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 6,
    borderRadius: 10,
  },
  resetBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  resetBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  statCount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#64748B",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    justifyContent: "space-between",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  shareBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    color: "#64748B",
    fontSize: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  drawerContent: {
    width: "80%",
    maxWidth: 300,
    backgroundColor: "#FFFFFF",
    height: "100%",
    paddingTop: 45,
    paddingHorizontal: 16,
    elevation: 20,
    borderRightWidth: 1,
    borderColor: "#E2E8F0",
  },
  drawerBackdropTouch: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginBottom: 10,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  closeDrawerBtn: {
    padding: 4,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginVertical: 2,
    backgroundColor: "#F8FAFC",
  },
  drawerItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  drawerItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  modalSubText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    padding: 12,
    fontSize: 22,
    textAlign: "center",
    width: "100%",
    letterSpacing: 8,
    marginBottom: 20,
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
  },
  verifyButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  verifyButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  cancelButton: {
    marginTop: 12,
    padding: 8,
  },
  cancelText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 14,
  },
  lcontainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F8FAFC',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});