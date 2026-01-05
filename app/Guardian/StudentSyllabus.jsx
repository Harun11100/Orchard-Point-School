import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function StudentSyllabusScreen() {
  const { schoolId, classId } = useLocalSearchParams();
  const [syllabusList, setSyllabusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const STORAGE_KEY = `syllabusList_${schoolId}_${classId}`;

  const loadCachedSyllabus = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        setSyllabusList(JSON.parse(cached));
        setOfflineMode(true);
      }
    } catch (err) {
      console.error("Error loading cached syllabus:", err);
    }
  };

  const fetchSyllabus = useCallback(async () => {
    try {
      setRefreshing(true);

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setRefreshing(false);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${API_URL}/api/school/syllabus/getSyllabus?schoolId=${schoolId}&classId=${classId}`
      );
      const data = await res.json();

      if (data.success) {
        setSyllabusList(data.syllabus);
        setOfflineMode(false);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.syllabus));
      }
    } catch (err) {
      console.error("Error fetching syllabus:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId, classId]);

  useEffect(() => {
    loadCachedSyllabus();
    fetchSyllabus();
  }, [fetchSyllabus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSyllabus();
  };

  if (loading && !syllabusList.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#115bb5ff" />
      </View>
    );
  }

  if (!syllabusList.length) {
    return (
      <>
      <Text style={{ color: "#315cb2ff", fontSize: 22, fontWeight: "700",textAlign:"center",marginTop:"top" }}>🧾 ক্লাস সিলেবাস</Text>
      <View style={styles.emptyContainer}>
        <Image style={styles.emptyImage} source={require("../../assets/image/empty.png")} />
        <Text style={styles.emptyText}>কোন সিলেবাস পাওয়া যায়নি</Text>
      </View>
      </>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧾 ক্লাস সিলেবাস</Text>
        <Text style={styles.subHeader}>আপনার ক্লাসের সকল সিলেবাস দেখুন</Text>
      </View>

      {offlineMode && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>🛈 অফলাইন মোড: ক্যাশড সিলেবাস দেখানো হচ্ছে</Text>
        </View>
      )}

      {syllabusList.map((syllabus) => (
        <View key={syllabus._id} style={styles.syllabusCard}>
          <Ionicons name="book-outline" size={22} color="#0d50dfff" />
          <View style={styles.syllabusContent}>
            <Text style={styles.syllabusTitle}>{syllabus.subject}</Text>
            <Text style={styles.syllabusDesc}>{syllabus.description}</Text>
            <Text style={styles.syllabusDate}>
              তারিখ: {new Date(syllabus.date).toLocaleDateString("bn-BD")}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingHorizontal: 20 },
  header: { paddingTop: 20, paddingBottom: 30, alignItems: "center" },
  headerTitle: { color: "#315cb2ff", fontSize: 22, fontWeight: "700" },
  subHeader: { color: "#6B7280", fontSize: 14, marginTop: 4 },
  syllabusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#effffaff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#163eedff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  syllabusContent: { flex: 1, marginLeft: 10 },
  syllabusTitle: { fontSize: 16, fontWeight: "700", color: "#0c6decff" },
  syllabusDesc: { fontSize: 14, color: "#374151", marginVertical: 4 },
  syllabusDate: { fontSize: 12, color: "#6B7280" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  emptyImage: { width: 200, height: 200, marginBottom: 16, resizeMode: "contain" },
  emptyText: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  offlineBadge: {
    backgroundColor: "#FFF4E5",
    padding: 8,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  offlineText: { color: "#B36B00", fontWeight: "600" },
});
