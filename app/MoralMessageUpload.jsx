import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { moralMessage } from "../Data/moralValue";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function MoralMessageScreen() {
  const { schoolId, classId, teacherId } = useLocalSearchParams();

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState([]);

  const STORAGE_KEY = `messages_list_${schoolId}`;

  // 🔹 Load message from AsyncStorage (local cache)
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          setMessage(JSON.parse(savedData));
        }
      } catch (err) {
        console.error("Error loading message:", err);
      }
    };
    loadMessages();
  }, [schoolId]);

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/school/moral-message/getMessage?schoolId=${schoolId}&classId=${classId}`
        );

        const data = await res.json();
        if (data.success) {
          setMessage(data.messages);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.messages));
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
  // 🔹 Fetch messages from backend
  useEffect(() => {
    fetchMessages();
  }, [schoolId, classId]);



  // 🔹 Add new message
  const handleAddMessage = async () => {
    if (!selectedMessage) {
      return Alert.alert("ত্রুটি", "দয়া করে একটি বার্তা নির্বাচন করুন!");
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/school/moral-message/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schoolId,
            classId,
            teacherId,
            title: selectedMessage.title,
            message: selectedMessage.message,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        const updatedMessages = [data.message, ...message];
        setMessage(updatedMessages);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMessages));
        setSelectedMessage(null);
        Alert.alert("সফল", "বার্তাটি সফলভাবে পাঠানো হয়েছে!");
        fetchMessages();
      } else {
        Alert.alert("ত্রুটি", data.message || "বার্তা পাঠানো ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      console.error("Error adding message:", err);
      Alert.alert("ত্রুটি", "বার্তা পাঠানো ব্যর্থ হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete message
  const handleDeleteMessage = (messageId) => {
    Alert.alert("নিশ্চিত করুন", "আপনি কি এই বার্তা মুছে ফেলতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছে ফেলুন",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `${API_URL}/api/school/moral-message/deleteMessage`,
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId }),
              }
            );
            const data = await res.json();
            if (data.success) {
              const updatedMessages = message.filter((m) => m._id !== messageId);
              setMessage(updatedMessages);
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updatedMessages)
              );
              Alert.alert("সফল", "বার্তা মুছে ফেলা হয়েছে।");
            } else {
              Alert.alert("ত্রুটি", data.message || "বার্তা মুছে ফেলা যায়নি।");
            }
          } catch (err) {
            console.error("Error deleting message:", err);
            Alert.alert("ত্রুটি", "বার্তা মুছে ফেলা যায়নি।");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.header}>📖 নৈতিক বা ইসলামিক বার্তা নির্বাচন করুন</Text>

      {/* 🔸 Selection Area */}
      <View style={styles.formCard}>
        <Text style={styles.label}>বার্তা নির্বাচন করুন:</Text>

        {moralMessage.map((item,index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.titleOption,
              selectedMessage?.title === item.title && styles.selectedOption,
            ]}
            onPress={() => setSelectedMessage(item)}
          >
            <Text
              style={[
                styles.optionText,
                selectedMessage?.title === item.title && { color: "#fff" },
              ]}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}

        {selectedMessage && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>📜 বার্তার বিবরণ:</Text>
            <Text style={styles.previewMessage}>{selectedMessage.message}</Text>
          </View>
        )}

        {/* 🔸 Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAddMessage}
          disabled={loading}
        >
          <LinearGradient
            colors={["#2563EB", "#4F46E5"]}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>বার্তা পাঠান</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 🔸 Sent Messages */}
      <Text style={styles.noticeHeader}>📄 পাঠানো বার্তাসমূহ</Text>

      {message.length === 0 ? (
        <Text style={styles.emptyText}>এখনও কোনো বার্তা পাঠানো হয়নি।</Text>
      ) : (
        message.map((msg) => (
          <View key={msg._id} style={styles.noticeCard}>
            <Ionicons name="notifications-outline" size={22} color="#2563EB" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.noticeTitle}>{msg.title}</Text>
              <Text style={styles.noticeDesc}>{msg.message}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteMessage(msg._id)}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </TouchableOpacity>
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
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#1E3A8A",
    marginVertical: 20,
  },
  formCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  label: { fontSize: 16, color: "#111827", fontWeight: "600", marginBottom: 10 },
  titleOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#F1F5F9",
  },
  selectedOption: {
    backgroundColor: "#2563EB",
    borderColor: "#1E40AF",
  },
  optionText: { fontSize: 15, color: "#1E3A8A" },
  previewBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  previewTitle: { fontSize: 16, fontWeight: "700", color: "#1E3A8A" },
  previewMessage: { fontSize: 14, color: "#374151", marginTop: 5 },
  submitButton: { marginTop: 15, borderRadius: 10, overflow: "hidden" },
  gradientButton: { paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  noticeHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 10,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  noticeTitle: { fontSize: 16, fontWeight: "700", color: "#1E40AF" },
  noticeDesc: { fontSize: 14, color: "#374151", marginVertical: 4 },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    marginTop: 10,
  },
});
