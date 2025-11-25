import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const PaymentHistoryScreen = () => {
  const { schoolId, classId, studentId } = useLocalSearchParams();

  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  // ✅ AsyncStorage helpers
  const saveStudentToStorage = async (studentData, historyData) => {
    try {
      await AsyncStorage.setItem(
        `student_${studentId}`,
        JSON.stringify({ student: studentData, history: historyData, updatedAt: Date.now() })
      );
    } catch (error) {
      console.log("Error saving student to storage", error);
    }
  };

  const loadStudentFromStorage = async () => {
    try {
      const data = await AsyncStorage.getItem(`student_${studentId}`);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.log("Error reading student storage", error);
      return null;
    }
  };

  // ✅ Fetch student from API or cache
  const fetchStudent = async () => {
    setLoading(true);

    const cached = await loadStudentFromStorage();
    if (cached) {
      setStudent(cached.student);
      setHistory(cached.history);
      setOfflineMode(true); // initially show cached data
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setLoading(false);
      return; // offline, keep cached data
    }

    try {
      const res = await axios.get(`${API_URL}/api/school/student/getStudent`, {
        params: { schoolId, classId, studentId },
      });

      const latestStudent = res.data?.data.student;
      const latestHistory = res.data?.data.paymentHistory;

      setStudent(latestStudent);
      setHistory(latestHistory);
      setOfflineMode(false); // live data

      await saveStudentToStorage(latestStudent, latestHistory);
    } catch (error) {
      console.log("❌ API error:", error);
      if (!cached) Alert.alert("ত্রুটি", "ছাত্রের তথ্য লোড করতে ব্যর্থ।");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!schoolId || !classId || !studentId) return;
    fetchStudent();
  }, [schoolId, classId, studentId]);

  // ✅ Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchStudent();
  };

  const { totalDue } = useMemo(() => {
    if (!history) return { totalDue: 0 };
    let due = 0;
    history.forEach((p) => {
      if (p.paymentStatus !== "paid") due += p.totalAmount || 0;
    });
    return { totalDue: due };
  }, [history]);

  if (loading && !student) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#115bb5ff" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={{ color: "red" }}> কোনো তথ্য পাওয়া যায়নি।</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Offline Badge */}
      {offlineMode && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>🛈 অফলাইন মোড: ক্যাশড ডেটা দেখানো হচ্ছে</Text>
        </View>
      )}

      <Text style={styles.name}>{student.studentName}</Text>
      <Text style={styles.roll}>শ্রেণী: {student.className}</Text>
      <Text style={styles.roll}>রোল: {student.roll}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ফি ও পেমেন্ট ইতিহাস</Text>

        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.cell, styles.headerText]}>মাস</Text>
          <Text style={[styles.cell, styles.headerText]}>মোট ফি</Text>
          <Text style={[styles.cell, styles.headerText]}>স্ট্যাটাস</Text>
        </View>

        {history && history.length ? (
          history.map((payment, index) => (
            <View
              key={index}
              style={[styles.row, { backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff" }]}
            >
              <Text style={styles.cell}>{payment.paymentMonth}</Text>
              <Text style={styles.cell}>{payment.totalAmount}৳</Text>
              <Text
                style={[
                  styles.cell,
                  { color: payment.paymentStatus === "unpaid" ? "red" : "green", fontWeight: "bold" },
                ]}
              >
                {payment.paymentStatus.toUpperCase()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: "center", marginVertical: 10 }}>কোনো পেমেন্ট ইতিহাস নেই</Text>
        )}

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>মোট বেতন বাকি: {totalDue}৳</Text>
        </View>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>⚠ বিশেষ দ্রষ্টব্য</Text>
        <Text style={styles.noteText}>
          এখানে পরীক্ষার ফি, সেশন চার্জ ও অন্যান্য চার্জ অন্তর্ভুক্ত নয়।
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  name: { fontSize: 26, fontWeight: "bold", color: "#315cb2ff", textAlign: "center", marginTop: 10 },
  roll: { textAlign: "center", fontSize: 16, color: "#555", marginBottom: 5 },
  section: { marginTop: 15, backgroundColor: "#fff", borderRadius: 12, padding: 15, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  cell: { flex: 1, textAlign: "center", fontSize: 14 },
  tableHeader: { backgroundColor: "#f0f0f0", borderTopWidth: 1, borderBottomWidth: 2, borderColor: "#ccc" },
  headerText: { fontWeight: "bold", color: "#333" },
  summaryContainer: { marginTop: 15, borderTopWidth: 1, borderColor: "#ddd", paddingVertical: 10 },
  summaryText: { textAlign: "center", fontSize: 16, fontWeight: "600", color: "#333" },
  note: {
    backgroundColor: "#F6F8FF",
    borderLeftWidth: 4,
    borderLeftColor: "#3B1399",
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  noteTitle: { fontSize: 14, fontWeight: "700", color: "#3B1399", marginBottom: 4 },
  noteText: { fontSize: 13, color: "#444", lineHeight: 20 },
  offlineBadge: { backgroundColor: "#FFF4E5", padding: 8, margin: 10, borderRadius: 8, alignItems: "center" },
  offlineText: { color: "#B36B00", fontWeight: "600" },
});

export default PaymentHistoryScreen;
