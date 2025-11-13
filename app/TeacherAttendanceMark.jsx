import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function TeacherAttendancePage() {
  const { schoolId, teacherId, teacherName, teacherPhone } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(""); // current day's attendance

  const colorAnim = useRef(new Animated.Value(0)).current;

  // Map status to color
  const statusColors = {
    arrived: "#ffc72eff",
    present: "#32bb75",
    absent: "#f43f3f",
    leave: "#3b82f6",
    default: "#a4a4a4",
  };

  // Animate badge color when status changes
  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: status ? 1 : 0,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [status]);

  const interpolatedColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [statusColors.default, statusColors[status] || statusColors.default],
  });

  // Fetch today's attendance
  useEffect(() => {
    const fetchTodayStatus = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_URL}/api/teacher/getAttendance?teacherId=${teacherId}&schoolId=${schoolId}`
        );
        if (res.data.success && res.data.attendance) {
          setStatus(res.data.attendance.status); 

        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayStatus();
  }, []);

  const markAttendance = async () => {

    try {
      setSaving(true);
      const response = await axios.post(
        `${API_URL}/api/teacher/teacherAttendanceMark`,
        { teacherId, schoolId, teacherName, teacherPhone }
      );
      setStatus("arrived");
      alert(response.data.message);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>শিক্ষকের উপস্থিতি</Text>
      <Text style={styles.status}>আজকের স্ট্যাটাস: {status ? status.toUpperCase() : "Not marked"}</Text>
      <Animated.View
        style={[
          styles.statusBadge,
          { backgroundColor: interpolatedColor },
        ]}
      >
        <Text style={styles.statusText}>
          {status ? status.toUpperCase() : "Not marked"}
        </Text>
      </Animated.View>

      {loading ? (
             <ActivityIndicator size="large" color="#115bb5ff" />
      ) : (
        <TouchableOpacity
          style={status === "arrived" || saving ? styles.buttonDisabled : styles.button}
          onPress={markAttendance}
          disabled={status === "arrived" || saving}
        >
          <LinearGradient
            colors={status === "arrived" || saving ? ["#A5A5A5", "#7E7E7E"] : ["#4F46E5", "#818CF8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {status === "arrived" ? "Marked ✓" : "Mark Attendance"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20,
    backgroundColor: "#F9FAFB"
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 15, 
    color: "#185e3dff" 
  },
  status: { 
    fontSize: 18, 
    marginBottom: 40, 
    color: "#374151" 
  },
  statusBadge: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    textTransform: "capitalize",
  },
  button: {
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    borderRadius: 100,
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: 25,
    paddingHorizontal: 80,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { 
    color: "white", 
    fontSize: 20, 
    fontWeight: "bold" 
  },
});
