import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;

const PaymentHistoryScreen = () => {
  const { schoolId, classId, studentId } = useLocalSearchParams();

  const [student, setStudent] = useState(null);
   const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId || !classId || !studentId) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchStudent = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/school/student/getStudent`,
          {
            params: { schoolId, classId, studentId },
            signal: controller.signal,
          }
        );
        if (isMounted) {
          setStudent(res.data?.data.student);
          setHistory(res.data?.data.paymentHistory)
        }
      } catch (error) {
        console.error("❌ Error fetching student:", error);
        Alert.alert("ত্রুটি", "ছাত্রের তথ্য লোড করতে ব্যর্থ।");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudent();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [schoolId, classId, studentId]);

  // 💰 Calculate totals
  const { totalPaid, totalDue } = useMemo(() => {
    if (!student?.paymentHistory) return { totalPaid: 0, totalDue: 0 };
    let paid = 0;
    let due = 0;
    student.paymentHistory.forEach((p) => {
      if (p.paymentStatus === "paid") paid += p.totalAmount || 0;
      else due += p.totalAmount || 0;
    });
    return { totalPaid: paid, totalDue: due };
  }, [student]);


  if (loading) {
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
    <ScrollView style={styles.container}>
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

        {/* Table Rows */}
        {history.length ? (
          history.map((payment, index) => (
            <View
              key={index}
              style={[
                styles.row,
                { backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff" },
              ]}
            >
              <Text style={styles.cell}>{payment.paymentMonth}</Text>
              <Text style={styles.cell}>{payment.totalAmount}৳</Text>
              <Text
                style={[
                  styles.cell,
                  {
                    color: payment.paymentStatus === "unpaid" ? "red" : "green",
                    fontWeight: "bold",
                  },
                ]}
              >
                {payment.paymentStatus.toUpperCase()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ textAlign: "center", marginVertical: 10 }}>
            কোনো পেমেন্ট ইতিহাস নেই
          </Text>
        )}

        {/* Totals */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>মোট পরিশোধিত: {totalPaid}৳</Text>
          <Text style={styles.summaryText}>মোট বাকি: {totalDue}৳</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  name: { fontSize: 26, fontWeight: "bold", color: "#3e50adff", textAlign: "center", marginTop: 10 },
  roll: { textAlign: "center", fontSize: 16, color: "#555", marginBottom: 5 },
  section: { marginTop: 15, backgroundColor: "#fff", borderRadius: 12, padding: 15, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  cell: { flex: 1, textAlign: "center", fontSize: 14 },
  tableHeader: { backgroundColor: "#f0f0f0", borderTopWidth: 1, borderBottomWidth: 2, borderColor: "#ccc" },
  headerText: { fontWeight: "bold", color: "#333" },
  summaryContainer: { marginTop: 15, borderTopWidth: 1, borderColor: "#ddd", paddingVertical: 10 },
  summaryText: { textAlign: "center", fontSize: 16, fontWeight: "600", color: "#333" },
  card: { margin: 15 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  label: { color: "#555", fontWeight: "500" },
  value: { color: "#333", fontWeight: "600" },
});
export default PaymentHistoryScreen;