import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig.extra.API_URL;
const { width } = Dimensions.get("window");

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
        console.error("❌ ছাত্রের তথ্য আনার সময় ত্রুটি:", error);
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
      params: {
        schoolId,
        classId,
        student: JSON.stringify(student),
        studentId: student._id,
      },
    });
  };

  const handleDelete = async (id) => {
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
                `${API_URL}/api/school/student/deleteStudent/${id}`
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
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.emptyCard}>
          <MaterialIcons name="person-off" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>শিক্ষার্থীর কোনো তথ্য পাওয়া যায়নি।</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>ফিরে যান</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isPaid = student.paymentStatus?.toLowerCase() === "paid";

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>শিক্ষার্থীর বিস্তারিত প্রোফাইল</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}
      >
        {/* Profile Card Header */}
        <LinearGradient
          colors={["#4F46E5", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeaderCard}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {student.studentName ? student.studentName.charAt(0).toUpperCase() : "S"}
            </Text>
          </View>
          <Text style={styles.studentName}>{student.studentName}</Text>
          <View style={styles.rollBadge}>
            <Ionicons name="id-card-outline" size={14} color="#4F46E5" />
            <Text style={styles.rollBadgeText}>রোল: {student.roll || "N/A"}</Text>
          </View>
        </LinearGradient>

        {/* Academic Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="school" size={20} color="#4F46E5" />
            <Text style={styles.cardTitle}>একাডেমিক তথ্য</Text>
          </View>
          <InfoRow label="শ্রেণি" value={student.className} icon="class" />
          <InfoRow label="সেকশন" value={student.section || "N/A"} icon="grid-view" />
          <InfoRow
            label="মাসিক অনুপস্থিতি"
            value={`${student.monthlyAbsent || 0} দিন`}
            icon="event-busy"
          />
        </View>

        {/* Personal Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={20} color="#4F46E5" />
            <Text style={styles.cardTitle}>ব্যক্তিগত তথ্য</Text>
          </View>
          <InfoRow label="লিঙ্গ" value={student.gender} icon="wc" />
          <InfoRow label="জন্মতারিখ" value={student.dateOfBirth} icon="cake" />
          <InfoRow label="রক্তের গ্রুপ" value={student.bloodGroup || "N/A"} icon="opacity" />
          <InfoRow label="ঠিকানা" value={student.address} icon="place" />
        </View>

        {/* Guardian Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="family-restroom" size={20} color="#4F46E5" />
            <Text style={styles.cardTitle}>অভিভাবকের তথ্য</Text>
          </View>
          <InfoRow label="অভিভাবক" value={student.guardianName || "N/A"} icon="person-outline" />
          <InfoRow label="ফোন নম্বর" value={student.guardianPhone} icon="phone" />
        </View>

        {/* Fees and Payment Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="account-balance-wallet" size={20} color="#4F46E5" />
            <Text style={styles.cardTitle}>ফি ও পেমেন্ট তথ্য</Text>
          </View>
          <InfoRow label="টিউশন ফি" value={`৳${student.tuitionFee || 0}`} icon="payments" />
          <InfoRow label="কোচিং ফি" value={`৳${student.coachingFee || 0}`} icon="receipt" />

          <View style={styles.infoRow}>
            <View style={styles.labelContainer}>
              <MaterialIcons name="verified-user" size={18} color="#64748B" />
              <Text style={styles.infoLabel}>পেমেন্ট স্ট্যাটাস</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isPaid ? "#DEF7EC" : "#FDE8E8" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isPaid ? "#03543F" : "#9B1C1C" },
                ]}
              >
                {student.paymentStatus ? student.paymentStatus.toUpperCase() : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Results Card */}
        {student.results && student.results.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="assignment" size={20} color="#4F46E5" />
              <Text style={styles.cardTitle}>পরীক্ষার ফলাফল</Text>
            </View>
            {student.results.map((res, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultRow}>
                  <Text style={styles.examName}>📘 {res.examType}</Text>
                  <View style={styles.gradeChip}>
                    <Text style={styles.gradeText}>গ্রেড: {res.grade}</Text>
                  </View>
                </View>
                <Text style={styles.resultDate}>
                  তারিখ: {new Date(res.date).toLocaleDateString("bn-BD")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Remarks Card */}
        {student.remarks && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="comment" size={20} color="#4F46E5" />
              <Text style={styles.cardTitle}>মন্তব্য</Text>
            </View>
            <Text style={styles.remarksText}>{student.remarks}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.actionBtnWrapper}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#6366F1", "#4F46E5"]}
              style={styles.editBtn}
            >
              <MaterialIcons name="edit" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>এডিট করুন</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnWrapper, styles.deleteBtn]}
            onPress={() => handleDelete(student._id)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
            <Text style={styles.deleteBtnText}>মুছে ফেলুন</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <View style={styles.labelContainer}>
      <MaterialIcons name={icon} size={18} color="#64748B" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeaderCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  studentName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  rollBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rollBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  resultItem: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  examName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  gradeChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  resultDate: {
    fontSize: 12,
    color: "#64748B",
  },
  remarksText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#334155",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  actionBtnWrapper: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    gap: 6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  deleteBtnText: {
    color: "#EF4444",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyCard: {
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 12,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default StudentDetailsScreen;