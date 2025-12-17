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
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function NoticeScreen() {
  const { schoolId } = useLocalSearchParams();
  const STORAGE_KEY = `notices_list_${schoolId}`;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notices, setNotices] = useState([]);
  const [noticeId, setNoticeId] = useState(null);

  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(null);

  /* ================= LOAD FROM STORAGE ================= */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setNotices(JSON.parse(saved));
    })();
  }, [schoolId]);

  /* ================= FETCH NOTICES ================= */
  const fetchNotices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/school/Notice/getNotice?schoolId=${schoolId}`);
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.notices));
      }
    } catch (err) {
      console.error("Error fetching notices:", err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      return Alert.alert("ত্রুটি", "শিরোনাম এবং বর্ণনা লিখুন!");
    }

    setLoadingAdd(true);

    try {
      const date = `${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}`;
      const isUpdate = !!noticeId;

      const url = isUpdate
        ? `${API_URL}/api/school/Notice/updateNotice/${noticeId}`
        : `${API_URL}/api/school/Notice/postNotice`;

      const body = isUpdate
        ? { title, description } // only update these
        : { schoolId, title, description, date }; // create requires schoolId & date

      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        return Alert.alert("ত্রুটি", data.message || "অপারেশন ব্যর্থ হয়েছে!");
      }

      // Refresh list from API to get latest data
      await fetchNotices();

      Alert.alert("সফল", isUpdate ? "নোটিশ আপডেট হয়েছে!" : "নোটিশ যুক্ত হয়েছে!");

      // Reset form
      setTitle("");
      setDescription("");
      setNoticeId(null);
    } catch (err) {
      console.error(err);
      Alert.alert("ত্রুটি", "নোটিশ সংরক্ষণ ব্যর্থ হয়েছে!");
    } finally {
      setLoadingAdd(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (notice) => {
    if (!notice?._id) return;
    setNoticeId(notice._id);
    setTitle(notice.title);
    setDescription(notice.description);
  };

  /* ================= DELETE ================= */
  const deleteNotice = async (id) => {
    setLoadingDelete(id);
    const backup = [...notices];
    setNotices((prev) => prev.filter((n) => n._id !== id));

    try {
      const res = await fetch(`${API_URL}/api/school/Notice/deleteNotice/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!data.success) {
        setNotices(backup);
        Alert.alert("ত্রুটি", data.message || "নোটিশ মুছে ফেলা যায়নি!");
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(backup.filter((n) => n._id !== id)));
      }
    } catch (err) {
      console.error(err);
      setNotices(backup);
    } finally {
      setLoadingDelete(null);
    }
  };

  /* ================= RENDER ITEM ================= */
  const renderItem = ({ item }) => (
    <View style={styles.noticeCard}>
      <Ionicons name="notifications-outline" size={22} color="#267655ff" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.noticeTitle}>{item.title}</Text>
        <Text style={styles.noticeDesc}>{item.description}</Text>
        <Text style={styles.noticeDate}>📅 {item.date}</Text>
      </View>

      <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 10 }}>
        <Ionicons name="pencil-outline" size={20} color="#1E40AF" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => deleteNotice(item._id)}>
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
        data={notices}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>📢 নোটিশ তৈরি / সম্পাদনা</Text>

            <View style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder="নোটিশের শিরোনাম"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={[styles.input, { height: 90 }]}
                placeholder="বর্ণনা"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity onPress={handleSubmit} disabled={loadingAdd}>
                <LinearGradient
                  colors={["#4d73bfff", "#184c9fff"]}
                  style={styles.gradientButton}
                >
                  {loadingAdd ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {noticeId ? "নোটিশ আপডেট করুন" : "নোটিশ যুক্ত করুন"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        }
      />
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 10, color: "#0a47a1", },
  formCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10 },
  gradientButton: { padding: 12, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700" },
  noticeCard: { flexDirection: "row", padding: 12, borderRadius: 10, marginBottom: 8 },
  noticeTitle: { fontWeight: "700", fontSize: 16 },
  noticeDesc: { fontSize: 14 },
  noticeDate: { fontSize: 12, color: "#6B7280" },
});
