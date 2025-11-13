import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function StudentListScreen() {
  const { schoolId, classId, classes } = useLocalSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceTaken, setAttendanceTaken] = useState(false);

  const router = useRouter();
  const classData = classes ? JSON.parse(classes) : null;
  const STORAGE_KEY = `students_${classId}`;

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB").replace(/\//g, "-");

  /** Normalize student data */
  const normalizeStudent = (student) => ({
    _id: student._id,
    name: student.name,
    roll: student.roll,
    status: student.status || "absent",
  });

  /** Step 1: Check if today's attendance exists */
  const checkTodayAttendance = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/api/school/student/attendance/getToday`,
        { schoolId, classId, date: formattedDate }
      );

      if (res.data.success && res.data.alreadyTaken) {
        setAttendanceTaken(true);
        const existing = res.data.attendance.map((s) => ({
          _id: s.studentId,
          name: s.name,
          roll: s.roll,
          status: s.status,
        }));
        setStudents(existing);
      } else {
        await fetchStudentsFromDb();
      }
    } catch (err) {
      console.error("Error checking attendance:", err);
      await fetchStudentsFromDb();
    } finally {
      setLoading(false);
    }
  };

  /** Step 2: Fetch students from DB if attendance not taken */
  const fetchStudentsFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/student/getStudents?schoolId=${schoolId}&classId=${classId}`
      );
      const fetchedStudents = res.data.data.map(normalizeStudent);
      setStudents(fetchedStudents);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedStudents));
    } catch (err) {
      console.error("Error fetching students:", err);
      Alert.alert("Error", "Failed to fetch students from server.");
    }
  };

  useEffect(() => {
    checkTodayAttendance();
  }, []);

  /** Toggle attendance status */
  const toggleStatus = async (id) => {
    const updatedStudents = students.map((student) =>
      student._id === id
        ? { ...student, status: student.status === "present" ? "absent" : "present" }
        : student
    );
    setStudents(updatedStudents);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStudents));
    } catch (err) {
      console.error("Error saving local attendance:", err);
    }
  };

  /** Save or update attendance */
  const saveAttendance = async () => {
    setSaving(true);
    try {
      const payload = {
        schoolId,
        classId,
        date: formattedDate,
        attendance: students.map((s) => ({
          studentId: s._id,
          status: s.status,
          ...(attendanceTaken ? {} : { name: s.name, roll: s.roll }),
        })),
      };

      const endpoint = attendanceTaken
        ? `${API_URL}/api/school/student/attendance/update`
        : `${API_URL}/api/school/student/attendance/save`;

      const res = attendanceTaken
        ? await axios.put(endpoint, payload)
        : await axios.post(endpoint, payload);

      if (res.data.success) {
        Alert.alert(
          "✅ Success",
          attendanceTaken
            ? "Attendance updated successfully!"
            : "Attendance saved successfully!"
        );
        setAttendanceTaken(true);
      } else {
        Alert.alert("❌ Error", "Failed to save attendance.");
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      Alert.alert("❌ Error", "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  /** Render each student card */
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/StudentDetailsScreen", 
          params: { schoolId, classId, studentId: item._id },
        })
      }
    >
      <View>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.rollNumber}>রোল নং: {item.roll}</Text>
      </View>

      <Pressable
        style={[
          styles.statusButton,
          { backgroundColor: item.status === "present" ? "#4caf50" : "#f44336" },
        ]}
        onPress={(e) => {
          e.stopPropagation(); // prevent card press navigation
          toggleStatus(item._id);
        }}
      >
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </Pressable>
    </TouchableOpacity>
  );

  const currentDate = new Date();
  const bnDate = currentDate.toLocaleDateString("bn-BD", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dayName = currentDate.toLocaleDateString("bn-BD", { weekday: "long" });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#115bb5ff" />
      </View>
    );
  }

  if (!students.length) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Image style={styles.image} source={require("../assets/image/empty.png")} />
        <Text style={{ fontSize: 18, color: "#555" }}>কোন তথ্য পাওয়া যায়নি</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {classData?.className} {classData?.sectionName ? `(${classData.sectionName})` : ""}
      </Text>
      <Text style={styles.dateText}>{`${dayName}, ${bnDate}`}</Text>

      <FlatList
        data={students}
        renderItem={renderItem}
        keyExtractor={(item) => item._id.toString()} // stable key
        extraData={students}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={saveAttendance}
        disabled={saving}
      >
        <LinearGradient colors={["#76abf1ff", "#3271fbff"]} style={styles.saveButtonGradient}>
          <Text style={styles.saveButtonText}>
            {saving ? "সেভ হচ্ছে..." : attendanceTaken ? "আপডেট করুন" : "সংরক্ষন করুন"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9faff" },
  dateText: { fontSize: 16, fontWeight: "500", color: "#555", alignSelf: "center", marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10, alignSelf: "center", color: "#1f60baff" },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginHorizontal:1,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  studentName: { fontSize: 18, fontWeight: "600", color: "#333" },
  rollNumber: { fontSize: 14, color: "#666", marginTop: 4 },
  statusButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  statusText: { color: "#fff", fontWeight: "700" },
  saveButton: { position: "absolute", bottom: 60, left: 16, right: 16, borderRadius: 12, overflow: "hidden" },
  saveButtonGradient: { paddingVertical: 16, alignItems: "center", borderRadius: 12 },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  image: { height: 280, width: 280 },
});
