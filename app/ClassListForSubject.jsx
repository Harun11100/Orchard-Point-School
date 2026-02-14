import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function ClassListForSubject() {
  const { schoolId } = useLocalSearchParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = `classes_${schoolId}`;
  const router = useRouter();

  // Normalize API data to avoid undefined fields
  const normalizeClassData = (cls) => ({
    _id: cls._id,
    className: cls.className,
    sectionName: cls.sectionName,
    studentCount:
      cls.studentCount ||
      cls["studentCount"] || // handle typo in backend
      0,
    schoolId: cls.schoolId,
    guardianPhone: cls.guardianPhone || null,
  });

  // Fetch latest classes from API
  const fetchClassesFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/class/getClass?schoolId=${schoolId}`
      );

      const fetchedClasses = res.data.data.map(normalizeClassData);

      setClasses(fetchedClasses);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedClasses));
    } catch (err) {
      console.error("Error fetching classes:", err);
      Alert.alert("Error", "Failed to fetch classes from server.");
    }
  };


  const loadClasses = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setClasses(parsed.map(normalizeClassData));
      }
      await fetchClassesFromDb();
    } catch (err) {
      console.error("Error loading classes:", err);
      await fetchClassesFromDb();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardWrapper}
      onPress={() =>
      router.push({
      pathname: "/SubjectListScreen",
      params: {
      classId: item._id,
      schoolId,
    },
  })
}
    >
      <LinearGradient
        colors={["#fefeffff", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.className}>
              {item.className} {item.sectionName? `(${item.sectionName})`:""} 
            </Text>
          </View>
          <Ionicons
            name="arrow-forward-circle-outline"
            size={30}
            color="#2a76f0ff"
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
      >
         <ActivityIndicator size="large" color="#115bb5ff" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#EEF2FF", "#f9f9f9"]} style={styles.container}>
      <Text style={styles.title}>📚 শ্রেণী নির্বাচন করুন</Text>
      <FlatList
        data={classes}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#315cb2ff",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.6,
  },
  cardWrapper: { marginBottom: 16, borderRadius: 20 },
  card: {
    borderRadius: 15,
    padding: 15,
    margin: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.08,
    // shadowRadius: 4,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  className: { fontSize: 18, fontWeight: "700", color: "#2b5dc0ff" },
  
});
