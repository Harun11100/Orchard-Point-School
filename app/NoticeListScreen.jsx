import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra?.API_URL;

export default function NoticeListScreen() {
  const { schoolId } = useLocalSearchParams();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const STORAGE_KEY = `notices_list_${schoolId}`;

  // Load cache from AsyncStorage
  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) setNotices(JSON.parse(savedData));
      } catch (err) {
        console.error("Error loading notices from storage:", err);
      }
    };
    loadFromStorage();
  }, [schoolId]);

  // Fetch notices from API
  const fetchNotices = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/school/Notice/getNotice?schoolId=${schoolId}`
      );
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices);
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data.notices)
        );
      } else {
        console.error("Failed to fetch notices:", data.message);
      }
    } catch (err) {
      console.error("Error fetching notices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [schoolId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotices(true);
  }, [schoolId]);

  if (loading && !notices.length) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>নোটিশ লোড হচ্ছে...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LinearGradient colors={["#F8FAFC", "#EEF2FF"]} style={{ flex: 1 }}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
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
          {/* Header Banner */}
          <View style={styles.headerContainer}>
            <View style={styles.headerIconBg}>
              <Ionicons name="megaphone-outline" size={26} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>প্রকাশিত নোটিশসমূহ</Text>
              <Text style={styles.headerSubtitle}>
                প্রতিষ্ঠানের সাম্প্রতিক ও জরুরি ঘোষণাসমূহ
              </Text>
            </View>
          </View>

          {/* Section Bar */}
          {notices.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>সবশেষ নোটিশ</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{notices.length}</Text>
              </View>
            </View>
          )}

          {/* Empty State */}
          {!notices.length ? (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.emptyImage}
                source={require("../assets/image/empty.png")}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>কোনো নোটিশ পাওয়া যায়নি</Text>
              <Text style={styles.emptySubText}>
                এখনো পর্যন্ত কোনো জরুরি তথ্য বা নোটিশ প্রকাশ করা হয়নি।
              </Text>
            </View>
          ) : (
            /* Notices List */
            notices.map((notice) => (
              <View key={notice._id} style={styles.noticeCard}>
                <View style={styles.cardAccentBar} />
                <View style={styles.cardMainContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                  </View>

                  <Text style={styles.noticeDesc}>{notice.description}</Text>

                  <View style={styles.cardFooter}>
                    <View style={styles.dateBadge}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#64748B"
                      />
                      <Text style={styles.noticeDate}>
                        প্রকাশিত: {notice.date}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },

  /* Header Section */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
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
    marginTop: 2,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  countBadge: {
    backgroundColor: "#E0E7FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4338CA",
  },

  /* Notice Cards */
  noticeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccentBar: {
    width: 5,
    backgroundColor: "#4F46E5",
  },
  cardMainContent: {
    flex: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  noticeTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1E293B",
    flex: 1,
    lineHeight: 22,
  },
  noticeDesc: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 8,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noticeDate: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 8,
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
  emptySubText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});