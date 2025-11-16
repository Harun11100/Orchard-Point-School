import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function NoticeScreen() {
  const { schoolId } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(null); // store deleting noticeId
  const [notices, setNotices] = useState([]);
  const STORAGE_KEY = `notices_list_${schoolId}`;

  useEffect(() => {
    const loadNoticesFromStorage = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) setNotices(JSON.parse(savedData));
      } catch (err) {
        console.error("Error loading notices from storage:", err);
      }
    };
    loadNoticesFromStorage();
  }, [schoolId]);

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
      }
    };
    fetchNotices();
  }, [schoolId]);

  // Add a new notice
  const handleAddNotice = async () => {
    if (!title.trim() || !description.trim()) {
      return Alert.alert("ত্রুটি", "শিরোনাম এবং বর্ণনা লিখুন!");
    }

    setLoadingAdd(true);
    try {
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;
      const res = await fetch(
        `${API_URL}/api/school/Notice/postNotice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolId, title, description, date: formattedDate }),
        }
      );

      const data = await res.json();

      if (data.success) {
        const updatedNotices = [data.notice, ...notices];
        setNotices(updatedNotices);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotices));

        setTitle("");
        setDescription("");
        Alert.alert("সফল", "নোটিশ সফলভাবে সংরক্ষণ করা হয়েছে!");
      } else {
        Alert.alert("ত্রুটি", data.message || "নোটিশ সংরক্ষণ ব্যর্থ হয়েছে!");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("ত্রুটি", "নোটিশ সংরক্ষণ ব্যর্থ হয়েছে!");
    } finally {
      setLoadingAdd(false);
    }
  };

  // Delete notice with optimistic update
  const handleDeleteNotice = (noticeId) => {
    Alert.alert(
      "নিশ্চিত করুন",
      "আপনি কি এই নোটিশটি মুছে ফেলতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        { text: "মুছে ফেলুন", style: "destructive", onPress: () => deleteNotice(noticeId) },
      ]
    );
  };

  const deleteNotice = async (noticeId) => {
    console.log("Notice Id",noticeId)
    const prevNotices = [...notices];
    const updatedNotices = prevNotices.filter((n) => n._id !== noticeId);
    setNotices(updatedNotices);
    setLoadingDelete(noticeId);

    try {
      const res = await fetch(
        `${API_URL}/api/school/Notice/deleteNotice/${noticeId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (!data.success) {
        setNotices(prevNotices); // rollback
        Alert.alert("ত্রুটি", data.message || "নোটিশ মুছে ফেলা যায়নি।");
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotices));
      }
    } catch (err) {
      console.error(err);
      setNotices(prevNotices); // rollback
      Alert.alert("ত্রুটি", "নোটিশ মুছে ফেলা যায়নি।");
    } finally {
      setLoadingDelete(null);
    }
  };

  const renderNotice = ({ item }) => (
    <View style={styles.noticeCard}>
      <Ionicons name="notifications-outline" size={22} color="#267655ff" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.noticeTitle}>{item.title}</Text>
        <Text style={styles.noticeDesc}>{item.description}</Text>
        <Text style={styles.noticeDate}>📅 {item.date}</Text>
      </View>
      <TouchableOpacity
        disabled={loadingDelete === item._id}
        onPress={() => handleDeleteNotice(item._id)}
      >
        {loadingDelete === item._id ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>📢 নোটিশ তৈরি করুন</Text>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.label}>নোটিশের শিরোনাম</Text>
              <TextInput
                style={styles.input}
                placeholder="নোটিশের শিরোনাম লিখুন..."
                placeholderTextColor="#888"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>বর্ণনা</Text>
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: "top" }]}
                placeholder="বর্ণনা লিখুন..."
                placeholderTextColor="#888"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddNotice}
                disabled={loadingAdd}
              >
                <LinearGradient colors={["#4d73bfff", "#184c9fff"]} style={styles.gradientButton}>
                  {loadingAdd ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>নোটিশ যুক্ত করুন</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.noticeHeader}>📄 প্রকাশিত নোটিশসমূহ</Text>
            {notices.length === 0 && (
              <Text style={styles.emptyText}>এখনও কোনো নোটিশ যোগ করা হয়নি।</Text>
            )}
          </>
        }
        data={notices}
        renderItem={renderNotice}
        keyExtractor={(item) => item._id}
      />
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { fontSize: 24, fontWeight: "700", textAlign: "center",  color: "#315cb2ff", marginVertical: 10 },
  formCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 25,
  },
  label: { fontSize: 14, color: "#47609aff", fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#FFF",
    marginBottom: 15,
    fontSize: 15,
    color: "#111827",
  },
  submitButton: { borderRadius: 10, overflow: "hidden" },
  gradientButton: { paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  noticeHeader: { fontSize: 20, fontWeight: "700",  color: "#315cb2ff", marginBottom: 10 },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  noticeTitle: { fontSize: 16, fontWeight: "700", color: "#1E40AF" },
  noticeDesc: { fontSize: 14, color: "#374151", marginVertical: 4 },
  noticeDate: { fontSize: 12, color: "#6B7280" },
  emptyText: { textAlign: "center", color: "#6B7280", fontSize: 15, marginTop: 10 },
});

