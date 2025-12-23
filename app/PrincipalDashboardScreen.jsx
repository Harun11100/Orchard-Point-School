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
  
  const router = useRouter();

  const stats = [
    {
      id: 1,
      title: "মোট শিক্ষার্থী ",
      count: schoolData?.totalStudents,
      icon: "people-outline",
    },
    {
      id: 2,
      title: "মাসিক পেমেন্ট গণনা",
      count: schoolData?.totalPaymentCount,
      icon: "cash-outline",
      isButton: true,
    },
    {
      id: 3,
      title: "মোট শিক্ষক",
      count: schoolData?.totalTeachers,
      icon: "school-outline",
    },
    {
      id: 4,
      title: "মোট নোটিশ",
      count: schoolData?.totalNotice,
      icon: "notifications-outline",
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
      const schoolData = response.data.school || null;
      if (schoolData) {
        setSchoolData(schoolData);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schoolData));
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
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          try {
            const response = await axios.post(
              `${API_URL}/api/school/resetPaymentCount`,
              { schoolId }
            );

            if (response.status === 200 && response.data.success) {
              // ✅ If code sent successfully, show modal
              setOtpModalVisible(true);

              Alert.alert(
                "✅ কোড পাঠানো হয়েছে",
                "আপনার ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হয়েছে।"
              );
            } else {
              alert(
                "পেমেন্ট কাউন্ট রিসেটের জন্য কোড পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।"
              );
            }
          } catch (err) {
            console.error("Error resetting payment count:", err);
            alert(
              "পেমেন্ট কাউন্ট রিসেটের জন্য কোড পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে পরে আবার চেষ্টা করুন।"
            );
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
        <ActivityIndicator size="large" color="#115bb5ff" />
      </View>
    );
  }

  if (!schoolData) {
    return (
        <View style={styles.lcontainer}>
  <View style={styles.iconCircle}>
    <MaterialIcons name="wifi-tethering-off" size={40} color="#2251aa" />
  </View>
  
  <Text style={styles.title}>সংযোগ বিচ্ছিন্ন</Text>
  
  <Text style={styles.subtitle}>
    আপনার ইন্টারনেট সংযোগটি পরীক্ষা করুন এবং সঠিক ফোন নম্বর ও পাসওয়ারড দিয়ে {"\n"}আবার চেষ্টা করুন।
  </Text>

  <TouchableOpacity style={styles.button} activeOpacity={0.8}>
    <Text style={styles.buttonText}>আবার চেষ্টা করুন</Text>
  </TouchableOpacity>
</View>
    );
  }

  const actions = [
    { title: "পেমেন্ট পরিচালনা", icon: "account-balance-wallet", route: "/ClassListScreenPayment" },
      { title: "ফলাফল ও গ্রেড", icon: "grading", route: "/ClassListScreenResult" },
    // { title: "শিক্ষক হাজিরা", icon: "person-add", route: "/TeacherAttendanceTaken" },
     {
      title: "হোমওয়ার্ক দিন",
      icon: "assignment",
      route: "/ClassListForHomework",
    },
    { title: "রুটিন আপলোড", icon: "book-online", route: "/RoutineUploadScreen" },
    { title: "নোটিশ তৈরি করুন", icon: "notifications-active", route: "/CreateNotice" },
    { title: "ছাত্রছাত্রী তালিকা", icon: "format-list-bulleted", route: "/ClassListScreenAttendance" },
    { title: " বিষয় তালিকা", icon: "subject", route: "/SubjectListScreen" },
  
    { title: "শিক্ষক তালিকা", icon: "school", route: "/TeachersListScreen" },
    { title: "শিক্ষার্থী যোগ করুন", icon: "person-add-alt", route: "/CreateStudent" },
    { title: "ক্লাস তৈরি করুন ", icon: "post-add", route: "/CreateClass" },
    // { title: "প্রশ্ন তৈরি করুন", icon: "upload-file", route: "/QuestionGenerationScreen" },
    { title: "শিক্ষক যোগ করুন", icon: "person-add", route: "/CreateTeacher" },
    { title: "স্কুল অ্যালবাম", icon: "photo-library", route: "/SchoolAlbumScreen" },
    { title: "কৃতি শিক্ষার্থীবৃন্দ", icon: "star", route: "/OurSuccessScreen" },
   
  ];
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#23417aff" />
      }
      >
        {schoolData.availableAlert === true && (
               <UpdateAlert
              availableAlert={schoolData.availableAlert||false}
              alertTitle={schoolData.alertTitle}
              alertMessage={schoolData.alertMessage}
            />
          )}

      <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/SettingsScreen",
                  params: { schoolData: JSON.stringify(schoolData) },
                })
              }
              style={styles.settings}
            >
               <MaterialIcons name="settings" size={22} color="#ffffffff" />
      </TouchableOpacity>
      <Modal visible={otpModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ভেরিফিকেশন কোড দিন</Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              placeholder="৬ সংখ্যার কোড লিখুন"
            />
            <TouchableOpacity
              style={[styles.verifyButton, verifying && { opacity: 0.6 }]}
              onPress={verifyOtpAndReset}
              disabled={verifying}
            >
              <LinearGradient
                colors={["#223e91ff", "#071e84ff"]}
                style={styles.verifyButtonGradient}
              >
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
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: schoolData?.cover?.url }}
          style={styles.coverImage}
          resizeMode="cover"
        />
        <Image
          source={{ uri: schoolData?.logo?.url }}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.schoolName}>
        {schoolData.schoolName}
      </Text>

      
      <View style={styles.statsContainer}>
      {stats.map((item) => (
        <LinearGradient
          key={item.id}
          colors={["#7777fcff", "#2f41b6ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <TouchableOpacity
            disabled={!item.isButton}
            onPress={item.isButton ? resetPaymentCount : null}
            activeOpacity={item.isButton ? 0.8 : 1}
          >
            <View style={styles.cardContent}>
              <Text style={styles.statCount}>{item.count ?? 0}</Text>
              <Text style={styles.statTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      ))}
    </View>
      <Text style={styles.sectionTitle}>কাজ</Text>
      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            onPress={() => router.push({ pathname: action.route, params: { schoolId } })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#ffffff", "#f1f5ff"]} style={styles.actionGradient}>
              <MaterialIcons name={action.icon} size={28} color="#4F46E5" />
              <Text style={styles.actionText}>{action.title}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
         <TouchableOpacity
            style={styles.shoppingCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname:"/ProductsListScreen",
                params: {
                  schoolId,
                },
              })
            }
          >
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.iconBackground}>
              <MaterialIcons name="shopping-bag" size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionText}>স্মার্ট লাইব্রেরি এন্ড স্টেশনারি</Text>
            <Text style={styles.actionDesc}> প্রয়োজনীয় সব কিছু একসাথে</Text> 
          </TouchableOpacity>
      </View>
     {
      schoolData?.appUpdateUrl?.trim() && (
        <View>   
           <AppUpdateButton updateUrl={schoolData.appUpdateUrl} />
        </View>
      )
    }
  <TouchableOpacity
  activeOpacity={0.8}
  style={styles.shareBtn}
  onPress={() =>
    router.push({
      pathname: "/ShareAppScreen",
      params: { url: schoolData.appUpdateUrl||"https://ptoja-update.vercel.app" },
    })
  }
>
  <LinearGradient
    colors={["#657be9ff", "#5737d9ff"]}
    style={styles.gradientBtn}
  >
    <Ionicons name="share-social-outline" size={20} color="#fff" />
    <Text style={styles.shareBtnText}>শেয়ার করুন</Text>
  </LinearGradient>
</TouchableOpacity>


      <Text style={styles.footer}>© ২০২৫ বিদ্যালয় ব্যবস্থাপনা সিস্টেম</Text>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
   lcontainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#f8f9fc', // Light, airy background
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    // Soft shadow for depth
    shadowColor: "#2251aa",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2251aa',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30, // Pill shape
    shadowColor: "#2251aa",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 15,
  },
  modalContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "rgba(0,0,0,0.5)",
},
modalContent: {
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 12,
  width: "80%",
  alignItems: "center",
},
modalTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#193772ff",
  marginBottom: 12,
},
otpInput: {
  borderWidth: 1,
  borderColor: "#0e296fff",
  borderRadius: 8,
  padding: 12,
  fontSize: 18,
  textAlign: "center",
  width: "80%",
  letterSpacing: 6,
  marginBottom: 20,
},
verifyButton: {
  width: "80%",
  borderRadius: 10,
  overflow: "hidden",
  marginBottom: 10,
},
verifyButtonGradient: {
  paddingVertical: 12,
  alignItems: "center",
  borderRadius: 10,
},
verifyButtonText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
},
cancelButton: {
  marginTop: 10,
},
cancelText: {
  color: "#EF4444",
  fontWeight: "600",
  fontSize: 15,
},
  schoolName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#373bb8ff",
    textAlign: "center",
    marginTop:40,
    marginBottom: 10,
  },
    settings: {
    position: "absolute",
    top: 22,
    right: 7,
    backgroundColor: "#3e47edff",
    padding: 8,
    borderRadius: 30,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
   backgroundColor: "#EEF2FF",
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263a92ff",
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    borderRadius: 16,
    marginVertical: 7,
    elevation: 5, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  icon: {
    marginBottom: 6,
    opacity: 0.9,
  },
  statCount: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 3,
  },
  statTitle: {
    fontSize: 14,
    color: "#e0f7e9",
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    borderRadius: 18,
    marginBottom: 15,
    elevation: 3,
  },
    shoppingCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 10,
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
  actionGradient: {
    paddingVertical: 24,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
   actionDesc: { fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4 },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    color: "#1E3A8A",
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 30,
    marginBottom: 20,
  },
  shareBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 20,
    alignSelf: "center",
    width: "70%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  gradientBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  
});
