import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig?.extra?.API_URL || "";

const StudentPaymentHistoryScreen = () => {
  const { schoolId, classId, studentId } = useLocalSearchParams();
  const router = useRouter();

  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Format date in Bengali
  const formatBengaliDate = (dateString) => {
    if (!dateString) return "";
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
        const res = await axios.get(
          `${API_URL}/api/school/student/getStudent`,
          {
            params: { schoolId, classId, studentId },
            signal: controller.signal,
          }
        );
        if (isMounted) {
          setStudent(res.data?.data?.student);
          setHistory(res.data?.data?.paymentHistory);
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

  // Toggle payment status
  const handleChangeStatus = (paymentId) => {
    Alert.alert(
      "পেমেন্ট স্ট্যাটাস পরিবর্তন",
      "আপনি কি এই মাসের পেমেন্ট স্ট্যাটাস পরিবর্তন করতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "হ্যাঁ, পরিবর্তন করুন",
          onPress: async () => {
            try {
              const res = await axios.put(
                `${API_URL}/api/school/updateHistory`,
                { studentId, classId, paymentId },
                { headers: { "Content-Type": "application/json" } }
              );

              if (res.data?.success) {
                Alert.alert("🎉 সফল", "পেমেন্ট স্ট্যাটাস সফলভাবে আপডেট হয়েছে");
                setStudent(res.data.updatedStudent);
              } else {
                Alert.alert(
                  "ত্রুটি",
                  res.data?.message || "স্ট্যাটাস পরিবর্তন করতে ব্যর্থ।"
                );
              }
            } catch (err) {
              console.error(err);
              Alert.alert(
                "ত্রুটি",
                "স্ট্যাটাস পরিবর্তনের সময় সমস্যা হয়েছে।"
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>তথ্য লোড হচ্ছে...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.loaderContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>শিক্ষার্থীর কোনো তথ্য পাওয়া যায়নি।</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Navigation Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>পেমেন্ট ইতিহাস</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Student Profile Card Header */}
        <LinearGradient
          colors={["#2563EB", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.studentCard}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {student.studentName ? student.studentName.charAt(0) : "S"}
            </Text>
          </View>

          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{student.studentName}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="school-outline" size={12} color="#DBEAFE" />
                <Text style={styles.badgeText}>শ্রেণী: {student.className}</Text>
              </View>
              <View style={styles.badge}>
                <Feather name="hash" size={12} color="#DBEAFE" />
                <Text style={styles.badgeText}>রোল: {student.roll}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Financial KPI Summary Cards */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiCard, styles.paidKpi]}>
            <View style={styles.kpiHeader}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text style={styles.kpiTitle}>মোট পরিশোধিত</Text>
            </View>
            <Text style={[styles.kpiAmount, { color: "#16A34A" }]}>
              ৳{student.totalPaidAmount || 0}
            </Text>
          </View>

          <View style={[styles.kpiCard, styles.dueKpi]}>
            <View style={styles.kpiHeader}>
              <Ionicons name="time" size={18} color="#DC2626" />
              <Text style={styles.kpiTitle}>মোট বাকি</Text>
            </View>
            <Text style={[styles.kpiAmount, { color: "#DC2626" }]}>
              ৳{student.totalDueAmount || 0}
            </Text>
          </View>
        </View>

        {/* Payment History List Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>মাসিক ফি বিবরণী</Text>
          </View>

          {history?.length ? (
            history.map((payment) => {
              const isPaid = payment.paymentStatus === "paid";

              return (
                <TouchableOpacity
                  key={payment._id}
                  activeOpacity={0.7}
                  style={styles.paymentCard}
                  onPress={() => handleChangeStatus(payment._id)}
                >
                  <View style={styles.paymentLeft}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isPaid ? "#16A34A" : "#DC2626" },
                      ]}
                    />
                    <View>
                      <Text style={styles.paymentDate}>
                        {formatBengaliDate(payment.paymentDate)}
                      </Text>
                      <Text style={styles.tapTip}>স্ট্যাটাস বদলাতে ট্যাপ করুন</Text>
                    </View>
                  </View>

                  <View style={styles.paymentRight}>
                    <Text style={styles.amountText}>৳{payment.totalAmount}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        isPaid ? styles.paidBadge : styles.unpaidBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isPaid ? styles.paidBadgeText : styles.unpaidBadgeText,
                        ]}
                      >
                        {isPaid ? "পরিশোধিত" : "বাকি"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <Feather name="inbox" size={36} color="#94A3B8" />
              <Text style={styles.emptyText}>কোনো পেমেন্ট ইতিহাস নেই</Text>
            </View>
          )}
        </View>

        {/* Guardian & Fee Structure Cards */}
        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>অভিভাবকের তথ্য</Text>
          </View>
          <InfoRow
            label="অভিভাবকের নাম"
            value={student.guardianName || "N/A"}
          />
          <InfoRow
            label="যোগাযোগ নাম্বার"
            value={student.guardianPhone || "N/A"}
          />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={18} color="#2563EB" />
            <Text style={styles.sectionTitle}>ফি বিবরণী</Text>
          </View>
          <InfoRow
            label="টিউশন ফি"
            value={`৳${student.tuitionFee || 0}`}
            highlight
          />
          <InfoRow
            label="কোচিং ফি"
            value={`৳${student.coachingFee || 0}`}
            highlight
          />
        </View>
      </ScrollView>
    </View>
  );
};

// Reusable Info Row Component
const InfoRow = ({ label, value, highlight }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, highlight && styles.highlightValue]}>
      {value}
    </Text>
  </View>
);

export default StudentPaymentHistoryScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
  },
  errorText: {
    marginTop: 10,
    fontSize: 15,
    color: "#EF4444",
    fontWeight: "500",
  },
  /* Top Bar */
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  /* Student Card Header */
  studentCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: "#DBEAFE",
    fontWeight: "500",
  },
  /* KPI Cards */
  kpiContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  paidKpi: {
    borderLeftWidth: 4,
    borderLeftColor: "#16A34A",
  },
  dueKpi: {
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  kpiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  kpiAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  /* Payment History Section */
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  paymentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentDate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  tapTip: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  paymentRight: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidBadge: {
    backgroundColor: "#DCFCE7",
  },
  unpaidBadge: {
    backgroundColor: "#FEE2E2",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  paidBadgeText: {
    color: "#15803D",
  },
  unpaidBadgeText: {
    color: "#B91C1C",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 13,
  },
  /* Info Cards */
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  highlightValue: {
    color: "#2563EB",
  },
});