import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  ScrollView,
  View,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "HomeworkData";

export default function StudentHomeworkScreen() {
  const { schoolId, classId } = useLocalSearchParams();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomework = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/api/teacher/Homework/getHomework?schoolId=${schoolId}&classId=${classId}`
      );
      const data = await res.json();
      if (data.success) {
        setHomework(data.homework);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.homework));
      }
    } catch (err) {
      console.error("বাড়ির কাজ আনার সময় ত্রুটি:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [schoolId, classId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomework();
  };

 return (
    <View style={styles.screen}>
      {/* 🌈 হেডার */}
      <View  style={styles.header}>
        <Text style={styles.headerTitle}>📘 বাড়ির কাজ</Text>
        <Text style={styles.subHeader}>তোমার প্রতিদিনের কাজের তালিকা দেখো</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
        
          <ActivityIndicator size="large" color="#115bb5ff" style={{ marginTop: 40 }} />
        ) : homework.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              style={styles.image}
              source={require("../../assets/image/empty.png")}
            />
            <Text style={styles.emptyText}>কোনো বাড়ির কাজ পাওয়া যায়নি</Text>
          </View>
        ) : (
          homework.map((h) => (
            <Card key={h._id} style={styles.homeworkCard}>
              <LinearGradient
                colors={["#E0EAFC", "#CFDEF3"]}
                style={styles.cardGradient}
              >
                <View style={styles.cardContent}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name="book-outline" size={26} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.homeworkTitle}>{h.title}</Text>
                    <Text style={styles.homeworkDesc}>{h.description}</Text>
                    <Text style={styles.homeworkDate}>
                      📅 জমা দেওয়ার তারিখ: {new Date(h.dueDate).toDateString()}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6faffff",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: "center",
    justifyContent: "center",

  },
  headerTitle: {
    color: "#3e50adff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subHeader: {
    color: "#7f7f7fff",
    fontSize: 14,
    marginTop: 4,
  },
  container: {
    padding: 18,
    paddingBottom: 50,
  },
  image: {
    height: 200,
    width: 200,
    resizeMode: "contain",
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    color: "#6B7280",
  },
  homeworkCard: {
    marginBottom: 18,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconWrapper: {
    backgroundColor: "#EEF2FF",
    padding: 10,
    borderRadius: 12,
  },
  homeworkTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111827",
  },
  homeworkDesc: {
    color: "#4B5563",
    marginVertical: 4,
    lineHeight: 20,
  },
  homeworkDate: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
});
