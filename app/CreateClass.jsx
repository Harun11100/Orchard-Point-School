import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;

const availableClasses = [
  "প্লে-শ্রেণী", "নার্সারি-শ্রেণী", "প্রথম শ্রেণী", "দ্বিতীয় শ্রেণী",
  "তৃতীয় শ্রেণী", "চতুর্থ শ্রেণী", "পঞ্চম শ্রেণী", "ষষ্ঠ শ্রেণী",
  "সপ্তম শ্রেণী", "অষ্টম শ্রেণী", "নবম শ্রেণী", "দশম শ্রেণী"
];
const availableSections = ["A", "B", "C"];

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const params = useLocalSearchParams();
  const { schoolId } = params;
  const STORAGE_KEY = `classes_${schoolId}`;

  const fetchClassesFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/class/getClass?schoolId=${schoolId}`
      );
      const fetchedClasses = res.data.data || [];
      setClasses(fetchedClasses);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedClasses));
    } catch (err) {
      console.error("Error fetching classes:", err);
      Alert.alert("Error", "Failed to fetch classes from server.");
    }
  };

  const loadClassesFromStorage = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) setClasses(JSON.parse(storedData));
      else await fetchClassesFromDb();
    } catch (err) {
      console.error("Error loading from storage:", err);
    } finally {
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    loadClassesFromStorage();
  }, []);

  // Add new class
  const addClass = async () => {
    if (!selectedClass) {
      return Alert.alert("Warning", "দয়া করে শ্রেণী নির্বাচন করুন");
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/school/class/addClass`,
        {
          schoolId,
          className: selectedClass,
          sectionName: selectedSection,
        }
      );
      if (res.data.success) {
        setSelectedClass("");
        setSelectedSection("");
        await fetchClassesFromDb();
        Alert.alert("Success", "ক্লাস সফলভাবে যুক্ত হয়েছে!");
      } else {
        Alert.alert("Warning", res.data.message);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "ক্লাস যোগ করতে ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.header}>ক্লাস যোগ করুন</Text>

      {/* Class Selector */}
      <Text style={styles.label}>শ্রেণী নির্বাচন করুন</Text>
      <View style={styles.selectorContainer}>
        {availableClasses.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.selectorButton,
              selectedClass === c && styles.selectedButton,
            ]}
            onPress={() => setSelectedClass(c)}
          >
            <Text
              style={[
                styles.selectorText,
                selectedClass === c && styles.selectedText,
              ]}
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section Selector */}
      <Text style={styles.label}>শাখা নির্বাচন করুন</Text>
      <View style={styles.selectorContainer}>
        {availableSections.map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.selectorButton,
              selectedSection === s && styles.selectedButton,
            ]}
            onPress={() => setSelectedSection(s)}
          >
            <Text
              style={[
                styles.selectorText,
                selectedSection === s && styles.selectedText,
              ]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, loading && { opacity: 0.7 }]}
        onPress={addClass}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
        )}
      </TouchableOpacity>

      {/* Class List */}
      <Text style={[styles.header, { marginTop: 20 }]}>মৌলিক তালিকা</Text>
      <View style={{marginBottom:40}}>
       {initialLoad ? (
        <ActivityIndicator size="large" color="#1d3c76ff" style={{ marginTop: 20 }} />
      ) : classes.length === 0 ? (
        <Text style={styles.emptyText}>এখনও কোনো ক্লাস যোগ করা হয়নি।</Text>
      ) : (
        classes.map((item, i) => (
          <View key={i} style={styles.placeCard}>
            <Ionicons name="school-outline" size={20} color="#273487ff" />
            <Text style={styles.placeText}>
              {item.className} {item.sectionName ? `- Section ${item.sectionName}` : ""}
            </Text>
          </View>
        ))
      )}
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB", padding: 16 },
  header: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20, color: "#1E3A8A" },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 10, color: "#1E3A8A" },
  selectorContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  selectorButton: { padding: 10, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", margin: 5 },
  selectedButton: { backgroundColor: "#E0E7FF", borderColor: "#6366F1" },
  selectorText: { fontSize: 14, fontWeight: "500", color: "#374151" },
  selectedText: { fontWeight: "700", color: "#1E3A8A" },
  addButton: { backgroundColor: "#2563EB", borderRadius: 12, padding: 12, alignItems: "center", marginBottom: 20 },
  placeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: "#DBEAFE" },
  placeText: { fontSize: 16, color: "#1E3A8A", marginLeft: 8 },
  emptyText: { textAlign: "center", color: "#6B7280", fontSize: 15, marginTop: 10 },
});
