import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { filterStudentsByRollAndStatus } from "./utils/filterStudents";
import RollFilter from "../components/RollFilter";

const API_URL = Constants.expoConfig?.extra?.API_URL || "";

export default function FeeCollectionScreen() {
  const { schoolId, classId, className, sectionName } = useLocalSearchParams();
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [rollQuery, setRollQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = `students_${classId}`;
  const router = useRouter();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("bn-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter effect
  useEffect(() => {
    const result = filterStudentsByRollAndStatus({
      students: students,
      rollQuery,
      status: activeFilter,
    });
    setFiltered(result);
  }, [students, rollQuery, activeFilter]);

  /** Fetch students from backend */
  const fetchStudentsFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/student/getStudents?schoolId=${schoolId}&classId=${classId}`
      );
      const fetched = res.data?.data || [];
      setStudents(fetched);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fetched));
    } catch (err) {
      console.error("❌ Error fetching students:", err);
      Alert.alert("ত্রুটি", "সার্ভার থেকে ছাত্রদের তথ্য আনতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  /** Load from AsyncStorage, then fetch fresh */
  const loadStudents = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setStudents(parsed);
      }
      await fetchStudentsFromDb();
    } catch (err) {
      console.error("Error loading students:", err);
      await fetchStudentsFromDb();
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  /** Manual filter change */
  const handleFilterChange = (status) => setActiveFilter(status);

  /** Toggle payment status */
  const changeStatus = (item) => {
    if (item.paymentStatus === "paid") {
      Alert.alert(
        "দুঃখিত",
        "একবার 'paid' হওয়ার পরে স্ট্যাটাস পরিবর্তন করতে হলে পেমেন্ট ইতিহাস পেজ থেকে পরিবর্তন করতে হবে।"
      );
      return;
    }

    const newStatus = "paid";

    Alert.alert(
      "স্ট্যাটাস পরিবর্তন নিশ্চিতকরণ",
      `${item.name} এর স্ট্যাটাস '${item.paymentStatus}' থেকে '${newStatus}' এ পরিবর্তন করতে চান?`,
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "হ্যাঁ, পরিবর্তন করুন",
          onPress: async () => {
            try {
              const res = await axios.put(
                `${API_URL}/api/school/updatePaymentStatus`,
                { studentId: item._id, classId, status: newStatus },
                { headers: { "Content-Type": "application/json" } }
              );

              if (res.data?.success) {
                const updated = students.map((s) =>
                  s._id === item._id ? { ...s, paymentStatus: newStatus } : s
                );
                setStudents(updated);
                await AsyncStorage.setItem(
                  STORAGE_KEY,
                  JSON.stringify(updated)
                );
              } else {
                Alert.alert("ব্যর্থ", "স্ট্যাটাস পরিবর্তন করা যায়নি।");
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

  const handlePaymentAction = (item) => {
    Alert.alert(
      "অ্যাকশন নির্বাচন করুন",
      `${item.name} এর জন্য আপনি কি করতে চান?`,
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "বার্তা পাঠান",
          onPress: async () => {
            try {
              const res = await fetch(
                `${API_URL}/api/school/send-notification`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    studentId: item._id,
                    title: "স্কুলের বেতন স্মরণ করানো হচ্ছে",
                    body: `${item.name} এর গত মাসের স্কুলের বেতন এখনো বাকি। দ্রুত পরিশোধ করার জন্য অনুরোধ করা হল।`,
                  }),
                }
              );
              const data = await res.json();
              Alert.alert(
                data.success ? "সফল" : "ব্যর্থ",
                data.success ? "বার্তা পাঠানো হয়েছে!" : "বার্তা পাঠানো যায়নি।"
              );
            } catch (err) {
              console.error(err);
              Alert.alert("ত্রুটি", "বার্তা পাঠানোর সময় সমস্যা হয়েছে।");
            }
          },
        },
        {
          text: "পেমেন্ট হিস্ট্রি সংরক্ষণ করুন",
          onPress: async () => {
            try {
              const res = await fetch(
                `${API_URL}/api/school/save-payment-history`,
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ studentId: item._id, schoolId }),
                }
              );
              const data = await res.json();
              Alert.alert(
                data.success ? "সফল" : "ব্যর্থ",
                data.success
                  ? "পেমেন্ট হিস্ট্রি সংরক্ষণ করা হয়েছে!"
                  : "সংরক্ষণ করতে সমস্যা হয়েছে।"
              );
            } catch (err) {
              console.error(err);
              Alert.alert("ত্রুটি", "পেমেন্ট সংরক্ষণ করার সময় সমস্যা হয়েছে।");
            }
          },
        },
      ]
    );
  };

  if (!loading && !students.length) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.topHeaderTitle}>বেতন সংগ্রহ</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Image
            style={styles.emptyImage}
            source={require("../assets/image/empty.png")}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>কোনো তথ্য পাওয়া যায়নি</Text>
          <Text style={styles.emptySubtitle}>
            এই শ্রেণীর জন্য কোনো শিক্ষার্থীর ডাটা এন্ট্রি করা হয়নি।
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>বেতন সংগ্রহ</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.container}>
        {/* Class Banner & Search Controls */}
        <View style={styles.headerCard}>
          <View style={styles.classBanner}>
            <View>
              <Text style={styles.classTitle}>
                {className} {sectionName ? `(${sectionName})` : ""}
              </Text>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filtered.length} জন</Text>
            </View>
          </View>

          {/* Roll Filter Component Container */}
          <View style={styles.filterWrapper}>
            <RollFilter value={rollQuery} onChange={setRollQuery} />
          </View>
        </View>

        {/* Filter Segmented Pills */}
        <View style={styles.filterBar}>
          {[
            { key: "all", label: "সকল" },
            { key: "paid", label: "পরিশোধিত" },
            { key: "unpaid", label: "অপরিশোধিত" },
          ].map((item) => {
            const isActive = activeFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.7}
                style={[styles.filterTab, isActive && styles.activeFilterTab]}
                onPress={() => handleFilterChange(item.key)}
              >
                <Text
                  style={[
                    styles.filterTabTxt,
                    isActive && styles.activeFilterTabTxt,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main List / Loading */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>শিক্ষার্থীদের তালিকা লোড হচ্ছে...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listPadding}
            renderItem={({ item }) => {
              const isPaid = item.paymentStatus === "paid";
              const totalFee = (item.tuitionFee || 0) + (item.coachingFee || 0);

              return (
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() =>
                    router.push({
                      pathname: "/StudentPaymentHistory",
                      params: {
                        schoolId,
                        classId,
                        studentId: item._id,
                      },
                    })
                  }
                  style={styles.card}
                >
                  <View
                    style={[
                      styles.cardAccent,
                      { backgroundColor: isPaid ? "#16A34A" : "#DC2626" },
                    ]}
                  />

                  <View style={styles.cardBody}>
                    {/* Upper Student Info */}
                    <View style={styles.topRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>
                          {item.name ? item.name.charAt(0) : "S"}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.rollText}>
                          রোল নম্বর: <Text style={styles.rollHighlight}>{item.roll}</Text>
                        </Text>
                      </View>

                      {/* Status Tag */}
                      <View
                        style={[
                          styles.statusBadge,
                          isPaid ? styles.paidBadge : styles.unpaidBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            isPaid
                              ? styles.paidBadgeText
                              : styles.unpaidBadgeText,
                          ]}
                        >
                          {isPaid ? "পরিশোধিত" : "অপরিশোধিত"}
                        </Text>
                      </View>
                    </View>

                    {/* Middle Financial Overview */}
                    <View style={styles.middleRow}>
                      <View>
                        <Text style={styles.feeLabel}>
                          {isPaid ? "পরিশোধিত ফি" : "বাকি ফি"}
                        </Text>
                        <Text
                          style={[
                            styles.feeAmount,
                            { color: isPaid ? "#16A34A" : "#DC2626" },
                          ]}
                        >
                          ৳{totalFee}
                        </Text>
                      </View>

                      {!isPaid && (
                        <TouchableOpacity
                          activeOpacity={0.75}
                          style={styles.msgBtn}
                          onPress={() => handlePaymentAction(item)}
                        >
                          <Ionicons
                            name="notifications-outline"
                            size={14}
                            color="#2563EB"
                          />
                          <Text style={styles.msgBtnTxt}>বার্তা পাঠান</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.divider} />

                    {/* Bottom Action bar */}
                    <View style={styles.bottomRow}>
                      <Text style={styles.historyHint}>
                        হিস্ট্রি দেখতে ট্যাপ করুন
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.changeStatusBtn,
                          isPaid && styles.disabledStatusBtn,
                        ]}
                        onPress={() => changeStatus(item)}
                      >
                        <Text
                          style={[
                            styles.changeStatusBtnTxt,
                            isPaid && styles.disabledStatusBtnTxt,
                          ]}
                        >
                          {isPaid ? "স্ট্যাটাস লক করা" : "স্ট্যাটাস পরিবর্তন"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  /* Header Card */
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  classBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  filterWrapper: {
    marginTop: 4,
  },

  /* Segmented Filter Pills */
  filterBar: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  activeFilterTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterTabTxt: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  activeFilterTabTxt: {
    fontWeight: "700",
    color: "#2563EB",
  },

  /* Cards */
  listPadding: {
    paddingBottom: 30,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccent: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563EB",
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  rollText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  rollHighlight: {
    fontWeight: "600",
    color: "#1E293B",
  },

  /* Badges */
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  paidBadge: {
    backgroundColor: "#DCFCE7",
  },
  unpaidBadge: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  paidBadgeText: {
    color: "#15803D",
  },
  unpaidBadgeText: {
    color: "#B91C1C",
  },

  /* Middle details */
  middleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 10,
  },
  feeLabel: {
    fontSize: 11,
    color: "#64748B",
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  msgBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  msgBtnTxt: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },

  /* Bottom actions */
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyHint: {
    fontSize: 11,
    color: "#94A3B8",
  },
  changeStatusBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  changeStatusBtnTxt: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  disabledStatusBtn: {
    backgroundColor: "#E2E8F0",
  },
  disabledStatusBtnTxt: {
    color: "#94A3B8",
  },

  /* Loaders & Empty states */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#64748B",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
});