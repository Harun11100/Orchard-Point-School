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
    const [loadingDelete, setLoadingDelete] = useState(null); // store deleting classId
  
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
    const handleDeleteNotice = (classId) => {
      Alert.alert(
        "নিশ্চিত করুন",
        "আপনি কি এই টি মুছে ফেলতে চান?",
        [
          { text: "বাতিল", style: "cancel" },
          { text: "মুছে ফেলুন", style: "destructive", onPress: () => deleteClass(classId) },
        ]
      );
    };

  const deleteClass = async (classId) => {
  const prevClasses = [...classes];
  const updatedClasses = prevClasses.filter((n) => n._id !== classId);
  setClasses(updatedClasses);
  setLoadingDelete(classId);

  try {
    const res = await fetch(
      `${API_URL}/api/school/class/deleteClass?classId=${classId}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (!data.success) {
      setClasses(prevClasses); // rollback
      Alert.alert("ত্রুটি", data.message || " মুছে ফেলা যায়নি।");
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedClasses));
    }
  } catch (err) {
    console.error(err);
    setClasses(prevClasses); // rollback
    Alert.alert("ত্রুটি", " মুছে ফেলা যায়নি।");
  } finally {
    setLoadingDelete(null);
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
        <ActivityIndicator size="large" color="#2462b4ff" style={{ marginTop: 20 }} />
      ) : classes.length === 0 ? (
        <Text style={styles.emptyText}>এখনও কোনো ক্লাস যোগ করা হয়নি।</Text>
      ) : (
        classes.map((item, i) => (
         <View key={i} style={styles.cardWrapper}>
        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <View style={styles.iconBox}>
              <Ionicons name="school-outline" size={22} color="#2557bbff" />
            </View>

            <Text style={styles.cardTitle}>
              {item.className}
              {item.sectionName ? ` - ${item.sectionName}` : ""}
            </Text>
          </View>

          <TouchableOpacity
            disabled={loadingDelete === item._id}
            onPress={() => handleDeleteNotice(item._id)}
            style={styles.deleteButton}
          >
            {loadingDelete === item._id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
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
  addButton: { backgroundColor: "#1b56d6ff", borderRadius: 12, padding: 12, alignItems: "center", marginBottom: 20 },
  placeCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: "#DBEAFE" },
  placeText: { fontSize: 16, color: "#1E3A8A", marginLeft: 8 },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E8F8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FEECEC",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { textAlign: "center", color: "#6B7280", fontSize: 15, marginTop: 10 },
});
