import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function MoralMessageScreen() {
  const { schoolId, classId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const STORAGE_KEY = `messages_list_${schoolId}_${classId}`;

  const loadCachedMessages = async () => {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEY);
      if (cached) {
        setMessages(JSON.parse(cached));
      }
    } catch (err) {
      console.error("Error loading cached messages:", err);
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch(
        `${API_URL}/api/school/moral-message/getMessage?schoolId=${schoolId}&classId=${classId}`
      );
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.messages));
     
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
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
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.header}>📖 নৈতিক বার্তা</Text>

      {loading ? (
      
        <ActivityIndicator
          size="large"
          color="#115bb5ff"
          style={{ marginTop: 50 }}
        />
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            style={styles.emptyImage}
            source={require("../../assets/image/empty.png")}
          />
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

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  header: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    color: "#3e50adff",
    marginVertical: 10,
    marginBottom:20
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dbfeeeff",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 12,
    resizeMode: "contain",
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
  },
  lastUpdated: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 10,
  },
});
