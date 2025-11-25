import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function NoticeListScreen() {
  const { schoolId } = useLocalSearchParams();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = `notices_list_${schoolId}`;

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
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/school/Notice/getNotice?schoolId=${schoolId}`
        );
        const data = await res.json();
        if (data.success) {
          setNotices(data.notices);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.notices));
        } else {
          console.error("Failed to fetch notices:", data.message);
        }
      } catch (err) {
        console.error("Error fetching notices:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, [schoolId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#115bb5ff"  />
      
      </View>
    );
  }

  if (!notices.length) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          style={styles.emptyImage}
          source={require("../assets/image/empty.png")}
        />
        <Text style={styles.emptyText}>কোন তথ্য নোটিশ পাওয়া যায়নি</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
             <Text style={styles.headerTitle}>🧾 প্রকাশিত নোটিশ সমুহ</Text>
             <Text style={styles.subHeader}> প্রতিষ্ঠানের জরুরী ঘোষণা সম্পর্কে অবগত হঙ  </Text>
      </View>
     
      {notices.map((notice) => (
        <View key={notice._id} style={styles.noticeCard}>
          <Ionicons name="notifications-outline" size={22} color="#066be6ff" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeDesc}>{notice.description}</Text>
            <Text style={styles.noticeDate}>প্রকাশিত: {notice.date}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
   header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#215598ff",
    fontSize: 22,
    fontWeight: "700",
  },
  subHeader: {
    color: "#6B7280",
    fontSize: 14,
    marginTop: 4,
  },
  noticeHeader: { fontSize: 20, fontWeight: "700", color: "#025ae7ff", marginBottom: 16 },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eff4ffff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#6daceaff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  noticeContent: { flex: 1, marginLeft: 10 },
  noticeTitle: { fontSize: 16, fontWeight: "700", color: "#0888eaff" },
  noticeDesc: { fontSize: 14, color: "#374151", marginVertical: 4 },
  noticeDate: { fontSize: 12, color: "#6B7280" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  emptyImage: { width: 200, height: 200, marginBottom: 16, resizeMode: "contain" },
  emptyText: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  loadingText: { marginTop: 10, fontSize: 16, color: "#0c88eeff" },
});
