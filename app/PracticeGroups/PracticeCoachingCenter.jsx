import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PracticeCoachingCenterPage() {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
          <Image
            source={require("../../assets/image/image.png")}
            style={styles.heroImage}
            />
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.3)"]}
          style={styles.overlay}
        >
          <Text style={styles.heroTitle}>প্র্যাকটিস কোচিং সেন্টার</Text>
          <Text style={styles.heroSubtitle}>
            বিশেষজ্ঞ নির্দেশনার মাধ্যমে আপনার সম্ভাবনা উন্মোচন করুন
          </Text>
        </LinearGradient>
      </View>

      {/* About Section */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>প্র্যাকটিস কোচিং সেন্টার সম্পর্কে</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>প্র্যাকটিস কোচিং সেন্টার</Text> 
          উচ্চমানের একাডেমিক নির্দেশনা ও ব্যক্তিগত কোচিং প্রদান করে, যা শিক্ষার্থীদের 
          সাফল্যের পথে প্রস্তুত করে। আমাদের লক্ষ্য হলো ক্লাসরুমের শিক্ষাকে পরীক্ষার প্রস্তুতির সাথে সংযোগ করা।
        </Text>

        {/* Courses Section */}
        <Text style={styles.sectionTitle}>প্রদত্ত কোর্সসমূহ</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• গণিত ও বিজ্ঞান কোচিং</Text>
          <Text style={styles.listItem}>• ইংরেজি ভাষা ও যোগাযোগ দক্ষতা</Text>
          <Text style={styles.listItem}>• প্রতিযোগিতামূলক পরীক্ষার প্রস্তুতি (বিদ্যালয় ও বিশ্ববিদ্যালয়)</Text>
          <Text style={styles.listItem}>• ব্যক্তিগত টিউটরিং ও পরামর্শ</Text>
          <Text style={styles.listItem}>• ইন্টারেক্টিভ ওয়ার্কশপ ও সেমিনার</Text>
        </View>

        {/* Benefits Section */}
        <Text style={styles.sectionTitle}>যোগদানের সুফল</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• বিষয়ভিত্তিক একাডেমিক পারফরম্যান্স বৃদ্ধি</Text>
          <Text style={styles.listItem}>• আত্মবিশ্বাস ও সমস্যা সমাধানের দক্ষতা বৃদ্ধি</Text>
          <Text style={styles.listItem}>• কার্যকর অধ্যয়ন পদ্ধতি শেখা</Text>
          <Text style={styles.listItem}>• অভিজ্ঞ শিক্ষক ও পরামর্শদাতার সঙ্গে সংযোগ</Text>
          <Text style={styles.listItem}>• নিয়মিত মূল্যায়ন ও প্রতিক্রিয়া</Text>
        </View>

        {/* Vision Section */}
        <Text style={styles.sectionTitle}>আমাদের দৃষ্টি</Text>
        <Text style={styles.paragraph}>
          প্র্যাকটিস কোচিং সেন্টার একটি প্রজন্ম তৈরি করতে চায় যারা একাডেমিক ও পেশাগত ক্ষেত্রে আত্মবিশ্বাসী। 
          আমরা বিশ্বাস করি জ্ঞান, দক্ষতা ও চরিত্রের সমন্বয়ে একটি সুষম উন্নয়ন সম্ভব।
        </Text>

        <Text style={styles.footerText}>
          প্র্যাকটিস কোচিং সেন্টার — শিখুন, বৃদ্ধি পান, সাফল্য অর্জন করুন।
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fb",
  },
  heroContainer: {
    position: "relative",
    width: width,
    height: 230,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  heroSubtitle: {
    color: "#fff",
    fontSize: 16,
    marginTop: 6,
    textAlign: "center",
    opacity: 0.9,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 10,
  },
  paragraph: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 10,
    textAlign: "justify",
  },
  list: {
    marginVertical: 8,
  },
  listItem: {
    fontSize: 15,
    color: "#444",
    marginVertical: 4,
  },
  footerText: {
    marginTop: 12,
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 30,
  },
});
