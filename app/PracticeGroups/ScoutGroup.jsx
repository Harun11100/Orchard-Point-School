import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const benefits = [
  {
    icon: "groups",
    title: "নেতৃত্বের গুণাবলি বৃদ্ধি",
    desc: "স্কাউট কার্যক্রম ছাত্রদের নেতৃত্ব, সহযোগিতা ও দায়িত্ববোধ গড়ে তোলে।",
  },
  {
    icon: "hiking",
    title: "শারীরিক ও মানসিক উন্নয়ন",
    desc: "বিভিন্ন আউটডোর কার্যক্রমের মাধ্যমে শারীরিক সক্ষমতা ও আত্মবিশ্বাস বৃদ্ধি পায়।",
  },
  {
    icon: "emoji-people",
    title: "সামাজিক সচেতনতা",
    desc: "স্কাউট সদস্যরা সমাজে সেবা প্রদান, দুর্যোগ মোকাবিলা ও জনসচেতনতা বৃদ্ধিতে কাজ করে।",
  },
  {
    icon: "public",
    title: "আন্তর্জাতিক সুযোগ",
    desc: "জাতীয় ও আন্তর্জাতিক স্কাউট ক্যাম্প ও ইভেন্টে অংশগ্রহণের মাধ্যমে দৃষ্টিভঙ্গি প্রসারিত হয়।",
  },
];

export default function ScoutGroupModernPage() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <ImageBackground
        source={require("../../assets/image/scout.jpeg")}
        style={styles.heroImage}
      >
        <View style={styles.overlay} />
        <Text style={styles.heroTitle}>প্র্যাকটিস স্কুল ও কলেজ স্কাউট গ্রুপ</Text>
      </ImageBackground>

      {/* Description Section */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>স্কাউট সম্পর্কে</Text>
        <Text style={styles.description}>
          স্কাউট আন্দোলন বিশ্বের অন্যতম বৃহৎ যুব সংগঠন, যা শিক্ষার্থীদের
          আত্মনির্ভরশীল, শৃঙ্খলাবদ্ধ ও সমাজ সচেতন নাগরিক হিসেবে গড়ে তোলে।{"\n\n"}
          প্র্যাকটিস স্কুল ও কলেজ স্কাউট গ্রুপের সদস্যরা নিয়মিত প্রশিক্ষণ, ক্যাম্প,
          স্বেচ্ছাসেবী কাজ ও সমাজসেবামূলক কার্যক্রমে অংশ নেয়।{"\n\n"}
          স্কাউট কার্যক্রমের মাধ্যমে শিক্ষার্থীরা দলগতভাবে কাজ করা, সময় ব্যবস্থাপনা,
          সিদ্ধান্ত নেওয়ার দক্ষতা এবং মানবিক মূল্যবোধ অর্জন করে।
        </Text>

        {/* Benefits Section */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          স্কাউটে যোগদানের সুফল ও সুযোগ
        </Text>
        <View style={styles.benefitsContainer}>
          {benefits.map((item, index) => (
            <View key={index} style={styles.benefitCard}>
              <View style={styles.iconWrapper}>
                <MaterialIcons name={item.icon} size={28} color="#4338CA" />
              </View>
              <Text style={styles.benefitTitle}>{item.title}</Text>
              <Text style={styles.benefitDesc}>{item.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Additional Image */}
      <Image
        source={require("../../assets/image/scout2.jpeg")}
        style={styles.image}
      />
        <Image
        source={require("../../assets/image/image1.jpeg")}
        style={styles.image}
      />
        <Image
        source={require("../../assets/image/image2.jpeg")}
        style={styles.image}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  heroImage: {
    width: width,
    height: 250,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E1B4B",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    textAlign: "justify",
  },
  benefitsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  benefitCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    backgroundColor: "#E0E7FF",
    padding: 10,
    borderRadius: 50,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E1B4B",
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 13,
    color: "#6B7280",
  },
  image: {
    width: width - 32,
    height: 200,
    borderRadius: 16,
    margin: 16,
    alignSelf: "center",
  },
});
