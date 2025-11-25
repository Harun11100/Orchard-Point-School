import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function MoralMessageScreen() {
  const { schoolId, classId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const STORAGE_KEY = `messages_list_${schoolId}_${classId}`;

  // Load cached messages
  const loadCachedMessages = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        setMessages(JSON.parse(cached));
        setOfflineMode(true);
      }
    } catch (err) {
      console.error("Error loading cached messages:", err);
    }
  };

  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    try {
      setRefreshing(true);

      // Check network status
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setRefreshing(false);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${API_URL}/api/school/moral-message/getMessage?schoolId=${schoolId}&classId=${classId}`
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setOfflineMode(false);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.messages));
      } else {
        Alert.alert("ত্রুটি", "বার্তা লোড করতে ব্যর্থ।");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      Alert.alert("ত্রুটি", "বার্তা লোড করতে ব্যর্থ।");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [schoolId, classId]);

  useEffect(() => {
    loadCachedMessages();
    fetchMessages();
  }, [fetchMessages]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchMessages} />}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.header}>📖 নৈতিক বার্তা</Text>

      {offlineMode && (
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>
            🛈 অফলাইন মোড: ক্যাশড বার্তা দেখানো হচ্ছে
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#115bb5ff" style={{ marginTop: 40 }} />
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image style={styles.emptyImage} source={require("../../assets/image/empty.png")} />
          <Text style={styles.emptyText}>এখনও কোনো বার্তা পাঠানো হয়নি।</Text>
        </View>
      ) : (
        messages.map((msg) => (
          <View key={msg._id} style={styles.noticeCard}>
            <Ionicons name="book-outline" size={26} color="#1770e4ff" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.noticeTitle}>{msg.title}</Text>
              <Text style={styles.noticeDesc}>{msg.message}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  header: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    color: "#315cb2ff",
    marginVertical: 10,
    marginBottom: 20,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DBFEFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0377c9ff",
    marginBottom: 4,
  },
  noticeDesc: { fontSize: 14, color: "#374151", lineHeight: 20 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  emptyImage: { width: 200, height: 200, marginBottom: 12, resizeMode: "contain" },
  emptyText: { textAlign: "center", color: "#6B7280", fontSize: 15 },
  offlineBadge: {
    backgroundColor: "#FFF4E5",
    padding: 8,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  offlineText: { color: "#B36B00", fontWeight: "600" },
});
