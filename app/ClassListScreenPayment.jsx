import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
// Animated Card Component
function ClassCard({ item, index, onPress }) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500 + index * 150,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cardWrapper}
        onPress={onPress}
      >
        <LinearGradient
          colors={["#394fbbff", "#647fe3ff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.className}>
                {item.className} {item.sectionName ? `(${item.sectionName})` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward-circle" size={32} color="#fff" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ClassListScreenPayment() {
  const { schoolId } = useLocalSearchParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const STORAGE_KEY = `classes_${schoolId}`;
  const router = useRouter();

  const normalizeClassData = (cls) => ({
    _id: cls._id,
    className: cls.className || "",
    sectionName: cls.sectionName || cls.sectionnName || "",
    studentCount: cls.studentCount || cls["studentCoun  nt"] || 0,
    schoolId: cls.schoolId,
  });

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
      Alert.alert("ত্রুটি", "সার্ভার থেকে ক্লাস লোড করতে ব্যর্থ হয়েছে");
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

  if (loading) {
    return (
      <View style={[styles.loaderContainer]}>
        <ActivityIndicator size="large" color="#1c3f92ff" />
        <Text style={{ color: "#6b7280", marginTop: 10 }}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#EEF2FF", "#E0E7FF"]} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📚 শ্রেণী নির্বাচন করুন</Text>
        <Text style={styles.subtitle}>পেমেন্ট ব্যবস্থাপনার জন্য ক্লাস বাছাই করুন</Text>
      </View>

      <FlatList
        data={classes}
        renderItem={({ item, index }) => (
          <ClassCard
            item={item}
            index={index}
            onPress={() =>
              router.push({
                pathname: "/StudentListScreenPayment",
                params: {
                  classId: item._id,
                  schoolId,
                  className: item.className,
                  sectionName: item.sectionName,
                },
              })
            }
          />
        )}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: 15, alignItems: "center"},
  title: { fontSize: 24, fontWeight: "700", color: "#315cb2ff", letterSpacing: 0.3},
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  cardWrapper: { marginVertical: 8 },
  card: { borderRadius: 16, padding: 18 },
  cardContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  className: { fontSize: 20, fontWeight: "700", color: "#fff" },
  studentCount: { color: "#E0E7FF", marginTop: 4, fontSize: 13 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#EEF2FF" },
});
