import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const StudentPaymentHistoryScreen = () => {
  const { schoolId, classId, studentId } = useLocalSearchParams();

  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Helper: Format date in Bengali
  const formatBengaliDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getUTCDate().toLocaleString("bn-BD");
    const month = new Intl.DateTimeFormat("bn-BD", { month: "long" }).format(
      date
    );
    const year = date.getUTCFullYear().toLocaleString("bn-BD");
    return `${day} ${month}, ${year}`;
  };

  useEffect(() => {
    if (!schoolId || !classId || !studentId) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchStudent = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/school/student/getStudent`, {
          params: { schoolId, classId, studentId },
          signal: controller.signal,
        });
        if (isMounted) {
          setStudent(res.data?.data.student);
          setHistory(res.data?.data.paymentHistory);
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

  // 🔄 Toggle payment status
  const handleChangeStatus = (paymentId) => {
    Alert.alert(
      "নিশ্চিতকরণ",
      "আপনি কি এই মাসের পেমেন্ট স্ট্যাটাস পরিবর্তন করতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "হ্যাঁ",
          onPress: async () => {
            try {
              const res = await axios.put(
                `${API_URL}/api/school/updateHistory`,
                { studentId, classId, paymentId },
                { headers: { "Content-Type": "application/json" } }
              );

              if (res.data.success) {
                Alert.alert("সফলতা", "স্ট্যাটাস পরিবর্তন হয়েছে");
                setStudent(res.data.updatedStudent);
              } else {
                Alert.alert(
                  "ত্রুটি",
                  res.data.message || "স্ট্যাটাস পরিবর্তন করতে ব্যর্থ।"
                );
              }
            } catch (err) {
              console.error(err);
              Alert.alert("ত্রুটি", "স্ট্যাটাস পরিবর্তনের সময় সমস্যা হয়েছে।");
            }
          },
        },
      ]
    );
  };

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
        <Text style={{ color: "red" }}>ছাত্রের কোনো তথ্য পাওয়া যায়নি।</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{student.studentName}</Text>
      <Text style={styles.class}>শ্রেণী: {student.className}</Text>
      <Text style={styles.roll}>রোল: {student.roll}</Text>

      {/* Payment History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ফি ও পেমেন্ট ইতিহাস</Text>

        {/* Table Header */}
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.cell, styles.headerText]}>তারিখ</Text>
          <Text style={[styles.cell, styles.headerText]}>মোট ফি</Text>
          <Text style={[styles.cell, styles.headerText]}>স্ট্যাটাস</Text>
        </View>

        {/* Table Rows */}
        {history?.length ? (
          history.map((payment, index) => (
            <TouchableOpacity
              key={payment._id}
              style={[
                styles.row,
                { backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#fff" },
              ]}
              onPress={() => handleChangeStatus(payment._id)}
            >
              <Text style={styles.cell}>{formatBengaliDate(payment.paymentDate)}</Text>
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
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ textAlign: "center", marginVertical: 10 }}>
            কোনো পেমেন্ট ইতিহাস নেই
          </Text>
        )}

        {/* Totals */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryText}>
            মোট পরিশোধিত বেতন : {student.totalPaidAmount}৳
          </Text>
          <Text style={styles.summaryText}>
            মোট বাকি: {student.totalDueAmount}৳
          </Text>
        </View>
      </View>

      {/* Guardian & Fees Info */}
      <View style={styles.card}>
        <View>
          <Text style={styles.sectionTitle}>অভিভাবকের তথ্য</Text>
          <Info label="নাম" value={student.guardianName} />
          <Info label="ফোন" value={student.guardianPhone} />
        </View>

        <View>
          <Text style={styles.sectionTitle}>ফি ও পেমেন্ট</Text>
          <Info label="টিউশন ফি" value={`৳${student.tuitionFee}`} />
          <Info label="কোচিং ফি" value={`৳${student.coachingFee}`} />
        </View>
      </View>
    </ScrollView>
  );
};

// ℹ️ Reusable Info component
const Info = ({ label, value, color }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={[styles.value, { color: color || "#333" }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6ffff" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f4f6ffff" },
  name: { fontSize: 22, fontWeight: "bold", color: "#4471d2ff", textAlign: "center", marginTop: 10 },
  roll: { textAlign: "center", fontSize: 16, color: "#555" },
  class: { textAlign: "center", fontSize: 16, color: "#2f3152ff", marginBottom: 5, fontWeight: "600" },
  section: { marginTop: 15, backgroundColor: "#ffffffff", padding: 15, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  cell: { flex: 1, textAlign: "center", fontSize: 14 },
  tableHeader: { backgroundColor: "#f0f0f0", borderTopWidth: 1, borderBottomWidth: 2, borderColor: "#ccc" },
  headerText: { fontWeight: "bold", color: "#333" },
  summaryContainer: { marginTop: 15, borderTopWidth: 1, borderColor: "#ddd", paddingVertical: 10 },
  summaryText: { textAlign: "center", fontSize: 16, fontWeight: "600", color: "#333" },
  card: { marginHorizontal: 20, marginVertical: 40 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  label: { color: "#555", fontWeight: "500" },
  value: { color: "#333", fontWeight: "600" },
});

export default StudentPaymentHistoryScreen;
