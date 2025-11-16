import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "teacherList";
const { width } = Dimensions.get("window");

export default function TeacherListScreen() {
  const { phone, schoolId } = useLocalSearchParams();
  const [teacherData, setTeacherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTeacherData(parsed);
      }
    } catch (err) {
      console.error("Error loading teacherData from storage:", err);
    }
  };

  const fetchTeacherData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/school/getTeachers?schoolId=${schoolId}`
      );

      if (response.status === 200 && response.data.success) {
        const teachers = response.data.teachers || [];
        setTeacherData(teachers);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
      }
    } catch (err) {
      console.error("Error fetching teacherData:", err);
      Alert.alert("ত্রুটি", "শিক্ষকের তথ্য লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        await fetchTeacherData();
      } else {
        await loadFromStorage();
        setLoading(false);
      }
    };
    init();
  }, [schoolId]);

const handleDelete = async (id) => {
  Alert.alert("নিশ্চিত করুন", "আপনি কি এই শিক্ষককে মুছে ফেলতে চান?", [
    { text: "বাতিল", style: "cancel" },
    {
      text: "হ্যাঁ, মুছে ফেলুন",
      onPress: async () => {
        try {
          const res = await axios.delete(
            `${API_URL}/api/school/deleteTeacher/${id}`
          );

          if (res.data.success) {
            const updatedList = teacherData.filter((t) => t._id !== id);
            setTeacherData(updatedList);
            await AsyncStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(updatedList)
            );
            Alert.alert("সফল", "শিক্ষক মুছে ফেলা হয়েছে");
          } else {
            Alert.alert("ত্রুটি", res.data.message || "মুছে ফেলা ব্যর্থ হয়েছে");
          }
        } catch (error) {
          console.error("Delete error:", error);
          Alert.alert("ত্রুটি", "মুছে ফেলার সময় সমস্যা হয়েছে");
        }
      },
    },
  ]);
};


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#115bb5ff" />
        <Text style={{ color: "#3d65c1ff", marginTop: 10 }}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.header}>শিক্ষক তালিকা</Text>

      {teacherData.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Image
          style={styles.emptyImage}
          source={require("../assets/image/empty.png")}
        />
          <Text style={styles.noData}>কোন শিক্ষক পাওয়া যায়নি</Text>
        </View>
        
      ) : (
         teacherData.map((teacher) => (
          <LinearGradient
            key={teacher._id}
            colors={["#eef2ff", "#ffffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
             <>
            <View style={styles.infoRow}>
              <Image
                source={{
                  uri:
                    teacher.photo ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                }}
                style={styles.teacherImage}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{teacher.name}</Text>
                <Text style={styles.subject}>
                  বিষয়: {Array.isArray(teacher.subjects) ? teacher.subjects.join(", ") : teacher.subjects}
                </Text>
                <Text style={styles.phone}>ফোন: {teacher.phone}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  router.push({
                    pathname: "/EditTeacherDetails",
                    params: { teacherData: JSON.stringify(teacher) },
                  })
                }
              >
                <MaterialIcons name="edit" size={22} color="#fff" />
                <Text style={styles.btnText}>সম্পাদনা</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(teacher._id)}
              >
                <MaterialIcons name="delete" size={22} color="#fff" />
                <Text style={styles.btnText}>মুছে ফেলুন</Text>
              </TouchableOpacity>
            </View>
            </>
          </LinearGradient>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 18,
  },
  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#315cb2ff",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 18,
  },
  noData: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
    marginTop: 40,
  },
  card: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  teacherImage: {
    width: 70,
    height: 70,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#103c65ff",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#113d61ff",
  },
  subject: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 3,
  },
  phone: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3e78ebff",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
  },
  emptyImage:{ width:250, height:250, alignSelf:"center"}
});
