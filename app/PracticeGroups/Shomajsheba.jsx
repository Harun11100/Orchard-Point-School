import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PracticeShomajShebaPage() {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
       <Image
               source={require("../../assets/image/image2.jpeg")}
               style={styles.heroImage}
             />
        <LinearGradient colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]} style={styles.overlay}>
          <Text style={styles.heroTitle}>প্র্যাকটিস সমাজ সেবা</Text>
          <Text style={styles.heroSubtitle}>শিক্ষার্থীর স্বেচ্ছাসেবার মাধ্যমে সমাজ গড়া</Text>
        </LinearGradient>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>স্কুল সমাজ সেবা সম্পর্কে</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>প্র্যাকটিস সমাজ সেবা</Text> শিক্ষার্থীদের সামাজিক সচেতনতা, সহমর্মিতা ও নেতৃত্ব গড়ে তোলে। স্বেচ্ছাসেবার মাধ্যমে সমাজকে উন্নত করতে শিক্ষার্থীদের অনুপ্রাণিত করা হয়।
        </Text>

        <Text style={styles.sectionTitle}>মূল দর্শন</Text>
        <Text style={styles.paragraph}>
          শিক্ষা সামাজিক দায়িত্বের সঙ্গে সম্পূর্ণ হয়। ছাত্ররা দলগত কাজ, নেতৃত্ব ও মানবিক মূল্যবোধ শেখে। সমাজ সেবার মাধ্যমে তারা দায়িত্বশীল নাগরিক হিসেবে গড়ে ওঠে।
        </Text>

        <Text style={styles.sectionTitle}>ছাত্রদের সুযোগ</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• স্বেচ্ছাসেবী প্রোগ্রামে অংশগ্রহণ।</Text>
          <Text style={styles.listItem}>• স্বাস্থ্য ও পরিবেশ সচেতনতা প্রচার।</Text>
          <Text style={styles.listItem}>• এনজিও ও সামাজিক প্রতিষ্ঠানগুলোর সাথে কাজ।</Text>
          <Text style={styles.listItem}>• দলগত কাজ ও নেতৃত্ব দক্ষতা অর্জন।</Text>
          <Text style={styles.listItem}>• সমাজসেবার মাধ্যমে স্বীকৃতি ও পুরস্কার।</Text>
        </View>

        <Text style={styles.sectionTitle}>সুবিধা</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• সহমর্মিতা ও সামাজিক দায়িত্ববোধ বৃদ্ধি।</Text>
          <Text style={styles.listItem}>• নেতৃত্ব ও যোগাযোগ দক্ষতা উন্নয়ন।</Text>
          <Text style={styles.listItem}>• নৈতিক শিক্ষা ও নাগরিক সচেতনতা।</Text>
          <Text style={styles.listItem}>• বাস্তব জীবনের অভিজ্ঞতা ও দলগত দক্ষতা।</Text>
          <Text style={styles.listItem}>• সারাজীবন সেবামূলক অভ্যাস গড়ে ওঠে।</Text>
        </View>

        <Text style={styles.sectionTitle}>আমাদের লক্ষ্য</Text>
        <Text style={styles.paragraph}>
          আমরা একটি সমাজ সচেতন প্রজন্ম গড়ে তোলার চেষ্টা করি, যারা সদয় ও দায়িত্বশীল, এবং বাংলাদেশের উন্নয়নে কাজ করে।
        </Text>

        <Text style={styles.footerText}>প্র্যাকটিস সমাজ সেবা — যেখানে শিক্ষা মানসিকতা ও মানবতার সঙ্গে মিলে যায়।</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },
  heroContainer: { position: "relative", width: width, height: 230 },
  heroImage: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "bold", textAlign: "center" },
  heroSubtitle: { color: "#fff", fontSize: 16, marginTop: 6, textAlign: "center", opacity: 0.9 },
  contentContainer: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginVertical: 10 },
  paragraph: { fontSize: 15, color: "#555", lineHeight: 22, marginBottom: 10, textAlign: "justify" },
  list: { marginVertical: 8 },
  listItem: { fontSize: 15, color: "#444", marginVertical: 4 },
  footerText: { marginTop: 12, fontSize: 15, color: "#555", lineHeight: 22, textAlign: "center", fontStyle: "italic", marginBottom: 30 },
});
