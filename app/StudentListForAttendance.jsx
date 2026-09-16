import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
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
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import RollFilter from "../components/RollFilter";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function StudentListScreen() {
  const { schoolId, classId, classes } = useLocalSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attendanceTaken, setAttendanceTaken] = useState(false);
  const [rollQuery, setRollQuery] = useState("");
  const [filtered, setFiltered] = useState([]);

  const classData = classes ? JSON.parse(classes) : null;
  const STORAGE_KEY = `students_${classId}`;
  
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

  const normalizeStudent = (student) => ({
    _id: student._id,
    name: student.name,
    roll: student.roll,
    status: student.status || "absent",
  });

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

  const markAll = (status) => {
    const updatedStudents = students.map((s) => ({ ...s, status }));
    setStudents(updatedStudents);
  };

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
          "✅ সফল",
          attendanceTaken
            ? "হাজিরা সফলভাবে আপডেট করা হয়েছে!"
            : "হাজিরা সফলভাবে সংরক্ষণ করা হয়েছে!"
        );
        setAttendanceTaken(true);
      } else {
        Alert.alert("❌ ত্রুটি", "হাজিরা সংরক্ষণ করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      Alert.alert("❌ ত্রুটি", "হাজিরা সংরক্ষণ করতে ব্যর্থ হয়েছে।");
    } finally {
      setSaving(false);
    }
  };

  // Quick Stats Count
  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;

  const renderItem = ({ item }) => {
    const isPresent = item.status === "present";
    return (
      <View style={styles.studentCardWrapper}>
        <View style={[styles.studentCard, isPresent ? styles.cardPresent : styles.cardAbsent]}>
          <View style={styles.cardLeft}>
            <View style={[styles.rollBadge, isPresent ? styles.rollBadgePresent : styles.rollBadgeAbsent]}>
              <Text style={[styles.rollBadgeText, isPresent ? styles.textGreen : styles.textRed]}>
                {item.roll}
              </Text>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.studentName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.statusSubText}>
                {isPresent ? "উপস্থিত (Present)" : "অনুপস্থিত (Absent)"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => toggleStatus(item._id)}
            activeOpacity={0.8}
            style={[styles.statusToggleButton, isPresent ? styles.btnPresent : styles.btnAbsent]}
          >
            <MaterialIcons
              name={isPresent ? "check" : "close"}
              size={16}
              color="#fff"
            />
            <Text style={styles.statusToggleText}>
              {isPresent ? "উপস্থিত" : "অনুপস্থিত"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const currentDate = new Date();
  const bnDate = currentDate.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dayName = currentDate.toLocaleDateString("bn-BD", { weekday: "long" });

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAlign]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!students.length) {
    return (
      <View style={[styles.container, styles.centerAlign]}>
        <Image style={styles.emptyImage} source={require("../assets/image/empty.png")} />
        <Text style={styles.emptyText}>কোন শিক্ষার্থী পাওয়া যায়নি</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.classNameText}>
            {classData?.className} {classData?.sectionName ? `(${classData.sectionName})` : ""}
          </Text>
          <Text style={styles.dateText}>
            <Ionicons name="calendar-outline" size={13} color="#64748B" /> {dayName}, {bnDate}
          </Text>
        </View>

        {/* Quick Summary Pill */}
        <View style={styles.summaryBadgeBox}>
          <Text style={styles.summaryBadgeGreen}>উপ: {presentCount}</Text>
          <Text style={styles.summaryBadgeRed}>অনু: {absentCount}</Text>
        </View>
      </View>

      {/* Filter & Quick Actions */}
      <View style={styles.actionWrapper}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <RollFilter value={rollQuery} onChange={setRollQuery} />
        </View>
        <View style={styles.quickActionButtons}>
          <TouchableOpacity onPress={() => markAll("present")} style={styles.quickBtnGreen}>
            <Text style={styles.quickBtnText}>সব উপস্থিত</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => markAll("absent")} style={styles.quickBtnRed}>
            <Text style={styles.quickBtnText}>সব অনুপস্থিত</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Student List */}
      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item._id.toString()}
        extraData={filtered}
        contentContainerStyle={{ paddingBottom: 110, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Bottom Save Action */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
          onPress={saveAttendance}
          disabled={saving}
          activeOpacity={0.9}
        >
          <LinearGradient colors={["#4F46E5", "#3730A3"]} style={styles.saveButtonGradient}>
            <MaterialIcons name="save" size={20} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.saveButtonText}>
              {saving ? "সংরক্ষণ হচ্ছে..." : attendanceTaken ? "হাজিরা আপডেট করুন" : "হাজিরা সংরক্ষণ করুন"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    backgroundColor: "#F8FAFC" 
  },
  centerAlign: { 
    justifyContent: "center", 
    alignItems: "center" 
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  classNameText: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#0F172A",
    marginBottom: 2,
  },
  dateText: { 
    fontSize: 12, 
    fontWeight: "500", 
    color: "#64748B" 
  },
  summaryBadgeBox: {
    flexDirection: "row",
    gap: 6,
  },
  summaryBadgeGreen: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  summaryBadgeRed: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  actionWrapper: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 8 
  },
  quickActionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  quickBtnGreen: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickBtnRed: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  studentCardWrapper: { 
    marginBottom: 8 
  },
  studentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  rollBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rollBadgePresent: {
    backgroundColor: "#DCFCE7",
  },
  rollBadgeAbsent: {
    backgroundColor: "#FEE2E2",
  },
  rollBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  textGreen: {
    color: "#16A34A",
  },
  textRed: {
    color: "#DC2626",
  },
  infoContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  statusSubText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  statusToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  btnPresent: {
    backgroundColor: "#22C55E",
  },
  btnAbsent: {
    backgroundColor: "#EF4444",
  },
  statusToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(248, 250, 252, 0.9)",
  },
  saveButton: { 
    borderRadius: 14, 
    overflow: "hidden",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonGradient: { 
    paddingVertical: 15, 
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center", 
    borderRadius: 14 
  },
  saveButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
  emptyImage: { 
    height: 220, 
    width: 220, 
    resizeMode: "contain",
    marginBottom: 10,
  },
  emptyText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#64748B" 
  },
});