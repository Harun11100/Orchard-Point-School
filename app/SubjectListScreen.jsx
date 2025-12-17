import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function SubjectListScreen() {
  const { schoolId } = useLocalSearchParams();
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (schoolId) fetchSubjects();
  }, [schoolId]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/school/subject/getSubject?schoolId=${schoolId}`
      );
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
      } else {
        Alert.alert("ত্রুটি", res.data.message || "বিষয়গুলি লোড করতে ব্যর্থ");
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      Alert.alert("ত্রুটি", "বিষয়গুলি লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (subjectId) => {
    Alert.alert("নিশ্চিত করুন", "আপনি কি এই বিষয়টি মুছে ফেলতে চান?", [
      { text: "বাতিল করুন", style: "cancel" },
      {
        text: "মুছুন",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await axios.delete(
              `${API_URL}/api/school/subject/deleteSubject?subjectId=${subjectId}`
            );
            if (res.data.success) {
              Alert.alert("সফল", "বিষয়টি সফলভাবে মুছে ফেলা হয়েছে");
              fetchSubjects();
            } else {
              Alert.alert("ত্রুটি", res.data.message || "বিষয় মুছে ফেলা যায়নি");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("ত্রুটি", "বিষয় মুছে ফেলা যায়নি");
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>বিষয়সমূহ</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(`/CreateSubject?schoolId=${schoolId}`)}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>নতুন বিষয়</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 50 }} />
      ) : subjects.length === 0 ? (
        <Text style={styles.noData}>কোনো বিষয় পাওয়া যায়নি।</Text>
      ) : (
        subjects.map((subject) => (
          <View key={subject._id} style={styles.subjectCard}>
            <View style={styles.subjectInfo}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.subjectCode}>কোড: {subject.code}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push(
                    `/EditSubject?schoolId=${schoolId}&subjectId=${subject._id}&data=${encodeURIComponent(
                      JSON.stringify(subject)
                    )}`
                  )
                }
              >
                <Ionicons name="pencil-outline" size={20} color="#1E3A8A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(subject._id)}
              >
                <Ionicons name="trash-outline" size={20} color="#DB2777" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ✅ আধুনিক স্টাইল
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6fb", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: { fontSize: 22, fontWeight: "700", color: "#1E3A8A" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  subjectCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectInfo: {},
  subjectName: { fontSize: 16, fontWeight: "600", color: "#1E3A8A" },
  subjectCode: { fontSize: 14, color: "#4B5563", marginTop: 4 },
  actions: { flexDirection: "row" },
  actionButton: { marginLeft: 12 },
  noData: { textAlign: "center", marginTop: 50, fontSize: 16, color: "#888" },
});
