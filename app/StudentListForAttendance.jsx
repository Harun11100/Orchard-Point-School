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
import { filterStudentsByRollAndStatus } from "./utils/filterStudents";
import RollFilter from "../components/RollFilter";
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
const [rollQuery, setRollQuery] = useState("");
 const [filtered, setFiltered] = useState(students);
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB").replace(/\//g, "-");
     useEffect(() => {
     if (!rollQuery.trim()) {
        setFiltered(students);
      } else {
        setFiltered(
          students.filter((s) =>
            String(s.roll).includes(rollQuery.trim())
          )
        );
      }
    }, [students, rollQuery]);
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
<View style={{ paddingHorizontal: 4 }}>

  <View
    style={[
      styles.studentCard,
      item.status === "present"
        ? styles.cardPresent
        : styles.cardAbsent,
    ]}
  >
    {/* Top Row */}
    <View style={styles.topRow}>
      <Text style={styles.studentName} numberOfLines={1}>
        {item.name}
      </Text>

      {/* Status Pill */}
      <View
        style={[
          styles.statusPill,
          item.status === "present"
            ? styles.presentPill
            : styles.absentPill,
        ]}
      >
        <Text style={styles.statusPillText}>
          {item.status === "present" ? "PRESENT" : "ABSENT"}
        </Text>
      </View>
    </View>

    {/* Bottom Row */}
    <View style={styles.bottomRow}>
      <Text style={styles.rollNumber}>রোল / আইডি: {item.roll}</Text>

      <TouchableOpacity
        onPress={() => toggleStatus(item._id)}
        activeOpacity={0.85}
        style={styles.toggleBtn}
      >
        <Text style={styles.toggleText}>Toggle</Text>
      </TouchableOpacity>
    </View>
  </View>
</View>

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
      <View style={styles.actionWrapper}>
       <Text style={styles.dateText}>{`${dayName}, ${bnDate}`}</Text>
        <RollFilter value={rollQuery} onChange={setRollQuery} />

      </View>
      
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item._id.toString()} // stable key
        extraData={filtered}
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
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10, alignSelf: "center",  color: "#315cb2ff", },

 studentCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 18,
  padding: 16,
  marginVertical: 8,

  shadowColor: "#000",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 14,
  elevation: 4,

  borderWidth: 1,
  borderColor: "#F1F5F9",
},

cardPresent: {
  borderLeftWidth: 4,
  borderLeftColor: "#22C55E",
},

cardAbsent: {
  borderLeftWidth: 4,
  borderLeftColor: "#EF4444",
},

topRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 10,
},

studentName: {
  fontSize: 16,
  fontWeight: "600",
  color: "#111827",
  flex: 1,
  marginRight: 10,
},

bottomRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

rollNumber: {
  fontSize: 13,
  color: "#6B7280",
},

statusPill: {
  paddingHorizontal: 12,
  paddingVertical: 4,
  borderRadius: 999,
},

presentPill: {
  backgroundColor: "#DCFCE7",
},

absentPill: {
  backgroundColor: "#FEE2E2",
},

statusPillText: {
  fontSize: 11,
  fontWeight: "700",
  letterSpacing: 0.6,
  color: "#065F46",
},

toggleBtn: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  backgroundColor: "#F1F5F9",
},

toggleText: {
  fontSize: 12,
  fontWeight: "600",
  color: "#1E40AF",
},

present: {
  backgroundColor: "#22C55E",
},

absent: {
  backgroundColor: "#EF4444",
},

statusText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 12,
  letterSpacing: 0.5,
},

  actionWrapper: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  saveButton: { position: "absolute", bottom: 60, left: 16, right: 16, borderRadius: 12, overflow: "hidden" },
  saveButtonGradient: { paddingVertical: 16, alignItems: "center", borderRadius: 12 },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  image: { height: 280, width: 280 },
});
