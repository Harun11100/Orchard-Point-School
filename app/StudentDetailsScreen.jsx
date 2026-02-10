import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const StudentDetailsScreen = () => {
  const { schoolId, studentId, classId } = useLocalSearchParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
          const fetched = res.data?.data.student;
          setStudent(fetched);
        }
      } catch (error) {
          console.error("❌ ছাত্রের তথ্য আনার সময় ত্রুটি:", error);
        
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

  const handleEdit = () => {
    router.push({
      pathname: "/EditStudentDetails",
      params: { schoolId, classId,  student: JSON.stringify(student), studentId:student._id },
    });
  };

  const handleDelete = async (studentId) => {
    Alert.alert(
      "নিশ্চিত করুন",
      "আপনি কি নিশ্চিত যে আপনি এই ছাত্রের তথ্য মুছে ফেলতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "হ্যাঁ, মুছে ফেলুন",
          style: "destructive",
          onPress: async () => {
            try {
             await axios.delete(
                  `${API_URL}/api/school/student/deleteStudent/${studentId}`
                  );

              Alert.alert("সফল", "ছাত্রের তথ্য সফলভাবে মুছে ফেলা হয়েছে");
              router.back();
            } catch (error) {
              Alert.alert("ত্রুটি", "ছাত্রের তথ্য মুছে ফেলা যায়নি");
              console.error(error);
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
        <Text style={{ color: "red" }}> শিক্ষার্থীর কোনো তথ্য পাওয়া যায়নি।</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{student.studentName}</Text>
        <Text style={styles.roll}>রোল: {student.roll}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>একাডেমিক তথ্য</Text>
          <Info label="শ্রেণি" value={student.className} />
          <Info label="সেকশন" value={student.section || "N/A"} />
          <Info label="মাসিক অনুপস্থিতি" value={student.monthlyAbsent} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ব্যক্তিগত তথ্য</Text>
          <Info label="লিঙ্গ" value={student.gender} />
          <Info
            label="জন্মতারিখ"
            value={
              student.dateOfBirth
            }
          />
          <Info label="রক্তের গ্রুপ" value={student.bloodGroup || "N/A"} />
          <Info label="ঠিকানা" value={student.address} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>অভিভাবকের তথ্য</Text>
          <Info label="নাম" value={student.guardianName || "N/A"} />
          <Info label="ফোন" value={student.guardianPhone} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ফি ও পেমেন্ট</Text>
          <Info label="টিউশন ফি" value={`৳${student.tuitionFee}`} />
          <Info label="কোচিং ফি" value={`৳${student.coachingFee}`} />
          <Info
            label="পেমেন্ট স্ট্যাটাস"
            value={student.paymentStatus.toUpperCase()}
            color={student.paymentStatus === "unpaid" ? "red" : "green"}
          />
        </View>

        {student.results && student.results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>পরীক্ষার ফলাফল</Text>
            {student.results.map((res, index) => (
              <View key={index} style={styles.resultCard}>
                <Text style={styles.resultText}>📘 {res.examType}</Text>
                <Text style={styles.resultText}>গ্রেড: {res.grade}</Text>
                <Text style={styles.resultText}>
                  তারিখ: {new Date(res.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {student.remarks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>মন্তব্য</Text>
            <Text style={styles.value}>{student.remarks}</Text>
          </View>
        )}

        {/* ✅ Edit & Delete Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.buttonText}>✏️ এডিট করুন</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={()=>handleDelete(student._id)}>
            <Text style={styles.buttonText}>🗑️ মুছে ফেলুন</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const Info = ({ label, value, color }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={[styles.value, { color: color || "#333" }]}>{value}</Text>
  </View>
);


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f549d",
    textAlign: "center",
  },
  roll: { textAlign: "center", fontSize: 16, color: "#555", marginBottom: 10 },
  section: { marginTop: 15, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 6 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#666", fontWeight: "500" },
  value: { color: "#333", fontWeight: "600" },
  resultCard: {
    backgroundColor: "#f0f4ff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  resultText: { color: "#333" },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  editButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
export default StudentDetailsScreen;
