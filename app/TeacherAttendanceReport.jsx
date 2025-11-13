import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function TeacherReportPage() {
  const { teacherId, schoolId, teacherPhone, teacherName } = useLocalSearchParams();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/teacher/teacherMonthlyStats?teacherId=${teacherId}&schoolId=${schoolId}&month=${month}&year=${year}`
      );
      if (res.data.success) {
        setStats(res.data.stats);
      } else {
        Alert.alert("ত্রুটি", res.data.message || "No data found");
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      Alert.alert("ত্রুটি", "ডেটা আনতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [month, year]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>শিক্ষক হাজিরা প্রতিবেদন</Text>

      <View style={styles.teacherInfo}>
        <Text style={styles.teacherName}>{teacherName}</Text>
        <Text style={styles.teacherPhone}>{teacherPhone}</Text>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.pickerContainer}>
          <Text style={styles.filterLabel}>মাস</Text>
          <Picker
            selectedValue={month}
            onValueChange={(value) => setMonth(value)}
            style={styles.picker}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <Picker.Item key={m} label={m.toString()} value={m} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.filterLabel}>বছর</Text>
          <Picker
            selectedValue={year}
            onValueChange={(value) => setYear(value)}
            style={styles.picker}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <Picker.Item key={y} label={y.toString()} value={y} />
            ))}
          </Picker>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4548e6ff" style={{ marginTop: 50 }} />
      ) : stats ? (
        <View style={styles.statsWrapper}>
          <LinearGradient
            colors={["#43a0ceff", "#1f5ee6ff"]}
            style={styles.statsCard}
          >
            <Text style={styles.statsLabel}>মোট দিন</Text>
            <Text style={styles.statsValue}>{stats.totalDays}</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#32bb75", "#0f9d58"]}
            style={styles.statsCard}
          >
            <Text style={styles.statsLabel}>প্রেজেন্ট</Text>
            <Text style={styles.statsValue}>{stats.presentDays}</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#f42e35", "#e53935"]}
            style={styles.statsCard}
          >
            <Text style={styles.statsLabel}>অনুপস্থিত</Text>
            <Text style={styles.statsValue}>{stats.absentDays}</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#fbbf24", "#f59e0b"]}
            style={styles.statsCard}
          >
            <Text style={styles.statsLabel}>আসা অবস্থায়</Text>
            <Text style={styles.statsValue}>{stats.arrivedDays}</Text>
          </LinearGradient>
        </View>
      ) : (
        <Text style={styles.noData}>কোন তথ্য পাওয়া যায়নি</Text>
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={fetchStats}>
        <Text style={styles.refreshText}>আপডেট করুন</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#EEF2FF",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1E3A8A",
  },
  teacherInfo: {
    marginBottom: 20,
    alignItems: "center",
  },
  teacherName: { fontSize: 20, fontWeight: "700", color: "#1E3A8A" },
  teacherPhone: { fontSize: 16, color: "#4B5563", marginTop: 4 },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  pickerContainer: { flex: 1, alignItems: "center" },
  filterLabel: { fontWeight: "600", marginBottom: 4 },
  picker: { width: "100%", height: 50 },
  statsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statsCard: {
    width: "48%",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },
  statsLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  statsValue: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  refreshButton: {
    backgroundColor: "#1f5ee6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  refreshText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  noData: { textAlign: "center", fontSize: 16, color: "#6B7280", marginTop: 50 },
});
