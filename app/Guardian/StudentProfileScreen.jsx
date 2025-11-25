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
  const [currentAttendance, setCurrentAttendance]= useState(null);

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
          setCurrentAttendance(data.todayAttendance);

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
   <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

  {/* HEADER */}
  <LinearGradient
    colors={["#6EA0F8", "#3B1399"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <View style={styles.avatarWrapper}>
      <Image
        source={require("../../assets/icons/avatar.png")}
        style={styles.profileImage}
      />
    </View>

    <View style={styles.profileInfo}>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.subText}>রোল: {profile.roll}</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>বর্তমান স্ট্যাটাস:</Text>
        <Text
          style={[
            styles.statusValue,
            currentAttendance === "present"
              ? styles.present
              : currentAttendance === "absent"
              ? styles.absent
              : styles.notTaken,
          ]}
        >
          {currentAttendance === "present"
            ? "উপস্থিত"
            : currentAttendance === "absent"
            ? "অনুপস্থিত"
            : "নেয়া হয়নি"}
        </Text>
      </View>
    </View>
  </LinearGradient>

  {/* EDUCATIONAL INFO */}
  <View style={styles.card}>
    <Text style={styles.cardTitle}>🎓 শিক্ষাগত তথ্য</Text>
    <InfoRow label="শ্রেণি" value={profile.className} />
    <InfoRow label="শাখা" value={profile.section || "N/A"} />
    <InfoRow label="লিঙ্গ" value={profile.gender} />
  </View>

  {/* FEES SECTION */}
  <View style={styles.card}>
    <Text style={styles.cardTitle}>💰 ফি সংক্রান্ত তথ্য</Text>
    <InfoRow label="টিউশন ফি" value={`${profile.tuitionFee} ৳`} />
    <InfoRow label="কোচিং ফি" value={`${profile.coachingFee} ৳`} />
    <InfoRow
      label="পেমেন্ট স্ট্যাটাস"
      value={profile.paymentStatus === "paid" ? "পরিশোধিত ✅" : "অপরিশোধিত ❌"}
    />
  </View>

  {/* ATTENDANCE */}
  <View style={styles.card}>
    <Text style={styles.cardTitle}>📅 উপস্থিতি</Text>
    <InfoRow
      label="এই মাসে অনুপস্থিত"
      value={`${profile.monthlyAbsent || 0} দিন`}
    />
    <InfoRow label="মন্তব্য" value={profile.remarks || "N/A"} />
  </View>

  {/* FOOTER */}
  <Text style={styles.footer}>© ২০২৫ স্মার্ট বিদ্যালয় । অরচার্ড পয়েন্ট স্কুল এন্ড কলেজ </Text>
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
  container: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },

  /* HEADER */
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { height: 4, width: 0 },
  },

  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#fff",
  },

  profileImage: {
    width: "100%",
    height: "100%",
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },

  subText: {
    fontSize: 15,
    color: "#f0f0f0",
    marginTop: 4,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },

  statusLabel: {
    fontSize: 14,
    color: "#eaeaea",
  },

  statusValue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  present: {
    backgroundColor: "rgba(0, 200, 83, 0.9)",
  },

  absent: {
    backgroundColor: "rgba(229, 57, 53, 0.9)",
  },

  notTaken: {
    backgroundColor: "rgba(255, 193, 7, 0.9)",
  },

  /* CARD STYLE */
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { height: 3, width: 0 },
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
  },
    infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  infoText: { fontSize: 14, color: "#374151", marginLeft: 4 },

  /* FOOTER */
  footer: {
    textAlign: "center",
    color: "#808080",
    marginVertical: 25,
  },
});
