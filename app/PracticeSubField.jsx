import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const { width } = Dimensions.get("window");

export default function PractiseGroupScreens() {
  const router = useRouter();

  const practiceGroups = [
    { title: "প্র্যাকটিস স্কুল ও কলেজ স্কাউট গ্রুপ", icon: "group", route: "/PracticeGroups/ScoutGroup" },
    { title: "প্র্যাকটিস কোচিং সেন্টার", icon: "book", route: "/PracticeGroups/PracticeCoachingCenter" },
    { title: "বাংলাদেশ ওপেন ইউনিভার্সিটি", icon: "domain", route: "/PracticeGroups/Bau" },
    { title: "প্র্যাকটিস মাল্টি ফ্যাবস Exim", icon: "factory", route: "/PracticeGroups/MultiFabsExim" },
    { title: "প্র্যাকটিস সমাজ সেবা", icon: "volunteer-activism", route: "/PracticeGroups/Shomajsheba" },
    { title: "প্র্যাকটিস স্কলারশিপ", icon: "card-giftcard", route: "/PracticeGroups/Scholarship" },
    { title: "প্র্যাকটিস ভাষা ক্লাব", icon: "translate", route: "/PracticeGroups/PracticeSpokenClub" },
    { title: "প্র্যাকটিস মানবাধিকার", icon: "gavel", route: "/PracticeGroups/HumanRights" },
  ];

  return (
    <LinearGradient colors={["#EEF2FF", "#FFFFFF"]} style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl tintColor="#2d62ccff" />}
      >
        <Text style={styles.header}>🧭 প্র্যাকটিস ও ডেভেলপমেন্ট গ্রুপসমূহ</Text>
        <Text style={styles.subText}>বিভিন্ন প্রশিক্ষণ ও সহযোগী প্রতিষ্ঠানের কার্যক্রম দেখুন</Text>

        <View style={styles.gridContainer}>
          {practiceGroups.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => router.push(item.route)}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={["#FFFFFF", "#E0E7FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name={item.icon} size={32} color="#2661cdff" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1,margin:3 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#1E1B4B",
    marginTop: 30,
  },
  subText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 20,
    marginTop: 6,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  cardWrapper: {
    width: width / 2 - 20,
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    backgroundColor: "#fff",
  },
  iconContainer: {
    backgroundColor: "#E0E7FF",
    borderRadius: 50,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#1E1B4B",
  },
});
