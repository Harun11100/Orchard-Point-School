import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function StudentProfileScreen() {
  const { schoolId, studentId } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const STORAGE_KEY = `profile_${schoolId}_${studentId}`;

  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) setProfile(JSON.parse(saved));
      } catch (err) {
        console.error("Error loading local profile:", err);
      }
    };
    loadFromStorage();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/school/student/getProfile?studentId=${studentId}`
        );
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.profile));
        }
      } catch (err) {
        console.error("❌ Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [studentId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#115bb5ff" />
       
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>কোনো প্রোফাইল তথ্য পাওয়া যায়নি</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#7aaaf8ff", "#3b1399ff"]} style={styles.header}>
        <Image
          source={require("../../assets/icons/avatar.png")}
          style={styles.profileImage}
        />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.idText}>রোল: {profile.roll}</Text>
      </LinearGradient>

      {/* Basic Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎓 শিক্ষাগত তথ্য</Text>
        <InfoRow label="শ্রেণি" value={profile.className} />
        <InfoRow label="শাখা" value={profile.section || "N/A"} />
        <InfoRow label="লিঙ্গ" value={profile.gender} />
        <InfoRow
          label="জন্ম তারিখ"
          value={
            profile.dateOfBirth
              ? new Date(profile.dateOfBirth).toLocaleDateString("bn-BD")
              : "N/A"
          }
        />
        <InfoRow label="রক্তের গ্রুপ" value={profile.bloodGroup || "N/A"} />
      </View>

      {/* Guardian Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👨‍👩‍👧 অভিভাবকের তথ্য</Text>
        <InfoRow label="অভিভাবকের নাম" value={profile.guardianName || "N/A"} />
        <InfoRow label="অভিভাবকের ফোন" value={profile.guardianPhone} />
        <InfoRow label="ঠিকানা" value={profile.address} />
      </View>

      {/* Payment Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💰 ফি সংক্রান্ত তথ্য</Text>
        <InfoRow label="টিউশন ফি" value={`${profile.tuitionFee} ৳`} />
        <InfoRow label="কোচিং ফি" value={`${profile.coachingFee} ৳`} />
        <InfoRow
          label="পেমেন্ট স্ট্যাটাস"
          value={
            profile.paymentStatus === "paid" ? "পরিশোধিত ✅" : "অপরিশোধিত ❌"
          }
        />
      </View>

      {/* Attendance & Remarks */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 উপস্থিতি</Text>
        <InfoRow label="এই মাসে অনুপস্থিত" value={`${profile.monthlyAbsent||0} দিন`} />
        <InfoRow label="মন্তব্য" value={profile.remarks || "N/A"} />
      </View>

      <Text style={styles.footer}>© ২০২৫ SchoolPro | Student Profile</Text>
    </ScrollView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <MaterialIcons name="chevron-right" size={18} color="#1E3A8A" />
    <Text style={styles.infoText}>
      <Text style={{ fontWeight: "700", color: "#1E3A8A" }}>{label}: </Text>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    alignItems: "center",
    paddingVertical: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
    marginBottom: 10,
  },
  name: { fontSize: 22, fontWeight: "700", color: "#fff" },
  idText: { fontSize: 14, color: "#E0E7FF", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
   color: "#315cb2ff",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  infoText: { fontSize: 14, color: "#374151", marginLeft: 4 },
  resultRow: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
  },
  resultExam: { fontWeight: "700", color: "#1E3A8A", fontSize: 14 },
  resultGrade: { color: "#111827", marginTop: 2 },
  resultDate: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 8, color: "#2563EB", fontSize: 16 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  emptyText: { fontSize: 16, color: "#6B7280" },
  footer: {
    textAlign: "center",
    color: "#9CA3AF",
    marginVertical: 30,
    fontSize: 13,
  },
});
