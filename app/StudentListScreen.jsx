import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function StudentListScreen() {
  const { schoolId, classId, classes } = useLocalSearchParams();
  const router = useRouter();

  const classData = classes ? JSON.parse(classes) : null;
  const STORAGE_KEY = `students_${classId}`;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  /** Fetch students */
  const fetchStudentsFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/student/getStudents?schoolId=${schoolId}&classId=${classId}`
      );
      const fetchedStudents = res.data.data || [];
      setStudents(fetchedStudents);
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(fetchedStudents)
      );
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsFromDb();
  }, []);

  /** Date (Bangla) */
  const currentDate = new Date();
  const bnDate = currentDate.toLocaleDateString("bn-BD", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dayName = currentDate.toLocaleDateString("bn-BD", {
    weekday: "long",
  });

  /** Student Card */
  const renderItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.studentCard,
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        router.push({
          pathname: "/StudentDetailsScreen",
          params: {
            schoolId,
            classId,
            studentId: item._id,
          },
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase()}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.rollNumber}>রোল / আইডি: {item.roll}</Text>
      </View>
    </Pressable>
  );

  /** Loading */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  /** Empty */
  if (!students.length) {
    return (
      <View style={styles.center}>
        <Image
          source={require("../assets/image/empty.png")}
          style={styles.emptyImage}
        />
        <Text style={styles.emptyText}>কোন তথ্য পাওয়া যায়নি</Text>
      </View>
    );
  }

  /** UI */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.title}>
          {classData?.className}{" "}
          {classData?.sectionName ? `(${classData.sectionName})` : ""}
        </Text>
        <Text style={styles.dateText}>{`${dayName}, ${bnDate}`}</Text>
      </View>

      <FlatList
        data={students}
        renderItem={renderItem}
        keyExtractor={(item) => item._id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 16,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },

  headerCard: {
    backgroundColor: "#fff",
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E40AF",
  },

  dateText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },

  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 18,
    marginBottom: 10,
    marginHorizontal:1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  cardPressed: {
    transform: [{ scale: 0.97 }],
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E3A8A",
  },

  cardBody: {
    flex: 1,
  },

  studentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  rollNumber: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
    fontWeight: "500",
  },

  emptyImage: {
    width: 260,
    height: 260,
    opacity: 0.8,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
});
