import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NetInfo from "@react-native-community/netinfo";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra?.API_URL;

export default function StudentHomeworkScreen() {
  const { schoolId, classId } = useLocalSearchParams();
  const router = useRouter();

  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const STORAGE_KEY = `homework_${schoolId}_${classId}`;

  // Load cached homework
  const loadCachedHomework = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.log("Error reading cached homework", error);
      return null;
    }
  };

  // Save homework to storage
  const saveHomeworkToStorage = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("Error saving homework to storage", error);
    }
  };

  const fetchHomework = async () => {
    setLoading(true);

    // 1️⃣ Load cached homework first
    const cached = await loadCachedHomework();
    if (cached) {
      setHomework(cached);
      setOfflineMode(true);
    }

    // 2️⃣ Check network connection
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setLoading(false);
      setRefreshing(false);
      return; // offline, show cached data
    }

    try {
      const res = await fetch(
        `${API_URL}/api/teacher/Homework/getHomework?schoolId=${schoolId}&classId=${classId}`
      );
      const data = await res.json();

      if (data.success) {
        setHomework(data.homework || []);
        setOfflineMode(false);
        await saveHomeworkToStorage(data.homework);
      }
    } catch (err) {
      console.error("Error fetching homework:", err);
      if (!cached) Alert.alert("ত্রুটি", "বাড়ির কাজ লোড করতে ব্যর্থ।");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [schoolId, classId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomework();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "নির্দিষ্ট নেই";
    const date = new Date(dateString);
    return date.toLocaleDateString("bn-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.screen}>
        {/* Modern Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>বাড়ির কাজ</Text>
            <Text style={styles.headerSubtitle}>প্রতিদিনের নির্ধারিত কাজ</Text>
          </View>

          <View style={styles.headerRightBadge}>
            <Ionicons name="book-outline" size={18} color="#4F46E5" />
          </View>
        </View>

        {/* Offline Banner */}
        {offlineMode && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color="#D97706" />
            <Text style={styles.offlineText}>
              অফলাইন মোড: সংরক্ষিত ডেটা দেখানো হচ্ছে
            </Text>
          </View>
        )}

        {/* Homework List Container */}
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F46E5"]}
              tintColor="#4F46E5"
            />
          }
        >
          {loading && !homework.length ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>বাড়ির কাজ লোড হচ্ছে...</Text>
            </View>
          ) : homework.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.emptyImage}
                source={require("../assets/image/empty.png")}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>কোনো বাড়ির কাজ পাওয়া যায়নি</Text>
              <Text style={styles.emptySubtitle}>
                তোমার শ্রেণীর জন্য এই মুহূর্তে কোনো বাড়ির কাজ নির্ধারিত নেই।
              </Text>
            </View>
          ) : (
            homework.map((h, index) => (
              <View key={h._id || index.toString()} style={styles.cardContainer}>
                <LinearGradient
                  colors={["#FFFFFF", "#F8FAFC"]}
                  style={styles.cardContent}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
                    </View>
                    <View style={styles.titleWrapper}>
                      <Text style={styles.homeworkTitle}>{h.title}</Text>
                      {h.subject && (
                        <Text style={styles.subjectTag}>{h.subject}</Text>
                      )}
                    </View>
                  </View>

                  {h.description ? (
                    <Text style={styles.homeworkDesc}>{h.description}</Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <View style={styles.dateBadge}>
                      <Ionicons name="calendar-outline" size={14} color="#2563EB" />
                      <Text style={styles.homeworkDate}>
                        জমা: {formatDate(h.dueDate)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },

  /* Header Bar */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  headerRightBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Offline Indicator */
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  offlineText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Homework Cards */
  cardContainer: {
    marginBottom: 14,
    borderRadius: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrapper: {
    flex: 1,
  },
  homeworkTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#0F172A",
    lineHeight: 22,
  },
  subjectTag: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366F1",
    marginTop: 2,
  },
  homeworkDesc: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    marginTop: 6,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  homeworkDate: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Loading State */
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 20,
  },
  emptyImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
    opacity: 0.85,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});