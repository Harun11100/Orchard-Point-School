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


const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "teacherDashboardData";

export default function TeacherDashboardScreen() {
  const { phone, schoolId } = useLocalSearchParams();
  const [schoolData, setSchoolData] = useState(null);
  const [teacherData,setTeacherData]=useState(null)
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.school));
        await AsyncStorage.setItem("teacherInfo", JSON.stringify({ phone, schoolId }));
      } else {
        console.warn("School or teacher data not found, clearing storage...");
        await AsyncStorage.removeItem(STORAGE_KEY);
        await AsyncStorage.removeItem("teacherInfo");
        router.push("/NotFoundTeacher");
      }
    } catch (err) {
      console.error("Error fetching school/teacher data:", err);
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem("teacherInfo");
      router.replace("/TeacherLoginScreen");
    } finally {
      setLoading(false);
    }
  };

  fetchSchool();
}, [schoolId, phone]);


const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem("teacherInfo");
    router.push({
      pathname: "/ChooseRoleScreen",
    });
  } catch (error) {
    console.error("❌ Error during logout:", error);
  }
};
  const actions = [
    {
      title: "ক্লাস/পরিক্ষার রুটিন",
      icon: "class",
      route: "/TeacherClassRoutine",
      desc: "নিজের ক্লাস দেখুন ও পরিচালনা করুন",
    },
    {
      title: "উপস্থিতি নিন",
      icon: "check-circle-outline",
      route: "/ClassListForAttendance",
      desc: "শিক্ষার্থীদের উপস্থিতি রেকর্ড করুন",
    },
    {
      title: "হোমওয়ার্ক দিন",
      icon: "assignment",
      route: "/ClassListForHomework",
      desc: "নতুন হোমওয়ার্ক তৈরি ও পরিচালনা করুন",
    },
      {
      title: "সিলেবাস আপলোড",
      icon: "book",
      route: "/ClassListForSyllabus",
      desc: "নতুন সিলেবাস তৈরি ও পরিচালনা করুন",
    },
    {
      title: "ফলাফল আপডেট",
      icon: "fact-check",
      route: "/ClassListForResult",
      desc: "শিক্ষার্থীদের ফলাফল আপলোড করুন",
    },
    {
      title: "OMR চেক করুন",
      icon: "scanner",
      route: "/Ai/OmrCheckScreen",
      desc: "শিক্ষার্থীদের OMR ফলাফল check করুন",
    },
    {
      title: "নোটিশ দেখুন",
      icon: "notifications",
      route: "/NoticeListScreen",
      desc: "প্রধান শিক্ষক কর্তৃক নোটিশ দেখুন",
    },
    {
      title: "প্রোফাইল",
      icon: "settings",
      route: "/TeacherDetailsUpdate",
      desc: "প্রোফাইল আপডেট করুন",
    },
    {
      title: "নৈতিক বার্তা",
      icon: "menu-book",
      route: "/ClassSelectForMoral",
      desc: " নৈতিক বার্তা আপলোড করুন",
    },
    {
      title: "স্কুল অ্যালবাম",
      icon: "photo-library",
      route: "/SchoolAlbumPublicScreen",
      desc: "স্কুলের ছবি ও ভিডিও গ্যালারি দেখুন",
    },
     { title: "আমাদের কৃতি শিক্ষার্থী ", icon: "star-outline", route: "/SuccessPublicScreen" },
    

  ];
   
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#115bb5ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>শিক্ষক ড্যাশবোর্ড</Text>
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
              : require("../assets/icons/icon2.png")
          }
          style={styles.logoImage}
        />
      </View>

      <View style={{ alignItems: "center", marginTop: 5 }}>
        <Text style={{ fontSize: 22, fontWeight: "600", color: "#1b36a6ff" ,textAlign:"center",marginTop:30}}>
          {schoolData?.schoolName || "বিদ্যালয়ের নাম"}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: action.route, params: { schoolId, teacherId:teacherData._id, teacherName:teacherData.name, teacherPhone:teacherData.phone, teacherData: JSON.stringify(teacherData) } })}
          >
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.iconBackground}>
              <MaterialIcons name={action.icon} size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDesc}>{action.desc}</Text>
          </TouchableOpacity>
        ))}
         {teacherData?.role === "admin" && (
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/CreateStudent",
                params: {
                  schoolId,
                  teacherId: teacherData._id,
                  teacherName: teacherData.name,
                  teacherPhone: teacherData.phone,
                },
              })
            }
          >
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.iconBackground}>
              <MaterialIcons name="person-add" size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionTitle}>নতুন শিক্ষার্থী</Text>
            <Text style={styles.actionDesc}>নতুন শিক্ষার্থী যোগ করুন</Text>
          </TouchableOpacity>
        )}

        {teacherData?.role === "accountant" && (
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/ClassListScreenPayment",
                params: {
                  schoolId,
                  teacherId: teacherData._id,
                  teacherName: teacherData.name,
                  teacherPhone: teacherData.phone,
                },
              })
            }
          >
            <LinearGradient colors={["#6366F1", "#4F46E5"]} style={styles.iconBackground}>
              <MaterialIcons name="payments" size={26} color="#fff" />
            </LinearGradient>
            <Text style={styles.actionTitle}>পেমেন্ট</Text>
            <Text style={styles.actionDesc}>শিক্ষার্থীদের পেমেন্ট পরিচালনা করুন</Text>
          </TouchableOpacity>
        )}
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
            <Text style={styles.actionTitle}>স্মার্ট লাইব্রেরি এন্ড স্টেশনারি</Text>
            <Text style={styles.actionDesc}> প্রয়োজনীয় সব কিছু একসাথে</Text> 
          </TouchableOpacity>
      </View>
         {
              schoolData?.appUpdateUrl?.trim() && (
                <AppUpdateButton updateUrl={schoolData.appUpdateUrl} schoolId />
              )
            }

       <TouchableOpacity
          onPress={handleLogout}
          style={styles.logout}
        >
            <MaterialIcons name="logout" size={22} color="#fff" />
            <Text  style={styles.logoutText} >লগ আউট</Text>
        </TouchableOpacity>
          
        <Text style={styles.footer}>© ২০২৫ বিদ্যালয় অ্যাডমিন সিস্টেম</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF", paddingHorizontal: 20 },
  headerContainer: { marginTop: 10, alignItems: "center", marginBottom: 10 },
  header: { fontSize: 24, fontWeight: "700",  color: "#1E3A8A" },
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
     shoppingCard: {
    width: "100%",
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
    marginTop:30,  
    flexDirection:'row',  
    backgroundColor: "#6366F1",
    padding: 10,
    borderRadius: 15,
    justifyContent:'center',
    marginBottom:20

  },
    logoutText: {
    fontSize:18,
    color:"#ffff"
  },
    footer: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 13,
    marginTop: 30,
    marginBottom: 20,
  },
});
