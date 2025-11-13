import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "teacherAttendanceList";
const { width } = Dimensions.get("window");

export default function TeacherAttendancePage() {
  const { schoolId } = useLocalSearchParams();
  const [teacherData, setTeacherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  // Load cached data
  const loadFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setTeacherData(JSON.parse(stored));
    } catch (err) {
      console.error("Error loading local data:", err);
    }
  };
const today = new Date().toISOString().split("T")[0];

const fetchTeacherData = async () => {
  setLoading(true); // 🔹 ensure loader shows
  try {
    const res = await axios.get(
      `${API_URL}/api/school/getTeacherAttendance?schoolId=${schoolId}&date=${today}`
    );

    if (res.status === 200 && res.data.success) {
      const records = res.data.attendance || []; // 🔹 use `attendance`
      setTeacherData(records);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } else {
      Alert.alert("⚠️", "কোন হাজিরার তথ্য পাওয়া যায়নি।");
    }
  } catch (err) {
    console.error("Error fetching teacher data:", err);
    Alert.alert("ত্রুটি", "ডেটা আনতে সমস্যা হয়েছে");
  } finally {
    setLoading(false);
  }
};

  // Toggle tempStatus in cycle: present -> arrived -> absent -> present
  const toggleTempStatus = (id) => {
    const updated = teacherData.map((teacher) =>
      teacher._id === id
        ? {
            ...teacher,
            tempStatus:
              teacher.tempStatus === "present"
                ? "arrived"
                : teacher.tempStatus === "arrived"
                ? "absent"
                : "present",
          }
        : teacher
    );
    setTeacherData(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.error);
  };

  // 🟢 Save attendance
  const updateAttendance = async () => {
    if (teacherData.length === 0) return;

    setSaving(true);
    try {
      const payload = {
        schoolId,
        attendance: teacherData.map((t) => ({
          teacherId: t.teacherId?._id || t._id,
          status: t.tempStatus,
          tempStatus: t.tempStatus || "",
        })),
      };

      const res = await axios.put(`${API_URL}/api/teacher/updateAttendance`, payload);

      if (res.data.success) {
        setTeacherData((prev) =>
          prev.map((t) => {
            const updated = res.data.updated.find(
              (u) => u.teacherId === (t.teacherId?._id || t._id)
            );
            return updated ? { ...t, ...updated } : t;
          })
        );

        Alert.alert("✅ সফল", "হাজিরা সফলভাবে সংরক্ষন করা হয়েছে!");
        await AsyncStorage.removeItem(STORAGE_KEY);
      } else {
        Alert.alert("❌ ত্রুটি", res.data.message || "সংরক্ষণ ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      Alert.alert("ত্রুটি", "হাজিরা সংরক্ষন ব্যর্থ হয়েছে");
    } finally {
      setSaving(false);
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
  
  const getStatusColor = (tempStatus) => {
    switch (tempStatus) {
      case "present":
        return "#32bb75";      // green
      case "arrived":
        return "#fbbf24";      // yellow
      case "absent":
        return "#f75055ff";    // red
      default:
        return "#d1d5db";      // gray
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#266e4cff" />
        <Text style={{ color: "#236a49ff", marginTop: 10 }}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <Text style={styles.header}>শিক্ষক হাজিরা</Text>
      <Text style={{ textAlign:"center",marginBottom:15 }}>তারিখঃ {today}</Text>

      {teacherData.length === 0 ? (
        <Text style={styles.noData}>কোন শিক্ষক পাওয়া যায়নি</Text>
      ) : (
        teacherData.map((teacher) => (
          <LinearGradient
            key={teacher._id}
            colors={["#eef2ff", "#ffffff"]}
            style={styles.card}
          > 
            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{teacher.teacherName}</Text>
                <Text style={styles.phone}>ফোন: {teacher.teacherPhone}</Text>
              </View>

              {/* Big round tempStatus button */}
              <TouchableOpacity
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(teacher.tempStatus || teacher.status) },
                ]}
                onPress={() => toggleTempStatus(teacher._id)}
              >
                <Text style={styles.statusText}>
                  {(teacher.tempStatus || teacher.status)?.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ))
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={updateAttendance}
        disabled={saving}
      >
        <LinearGradient colors={["#287d5bff", "#077441ff"]} style={styles.saveButtonGradient}>
          <Text style={styles.saveButtonText}>
            {saving ? "সেভ হচ্ছে..." : "সংরক্ষন করুন"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2FF", paddingHorizontal: 18 },
  header: { fontSize: 24, fontWeight: "800", color: "#1d6b4bff", textAlign: "center", marginTop: 20, marginBottom: 10 },
  card: { padding: 18, borderRadius: 18, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "700", color: "#1c6c44ff" },
  phone: { fontSize: 14, color: "#4B5563", marginTop: 2 },
  statusBadge: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5, elevation: 5 },
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  saveButton: { marginTop: 25, borderRadius: 12, overflow: "hidden" },
  saveButtonGradient: { paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  noData: { textAlign: "center", color: "#6B7280", fontSize: 16, marginTop: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EEF2FF" },
});
