import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PracticeMultiFabsEximPageBN() {
  return (
    <ScrollView style={styles.container}>
      {/* হিরো সেকশন */}
      <View style={styles.heroContainer}>
        <Image
          source={require("../../assets/image/exim.jpg")}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.6)"]}
          style={styles.overlay}
        >
          <Text style={styles.heroTitle}>প্র্যাকটিস মাল্টি ফ্যাবস এক্সিম</Text>
          <Text style={styles.heroSubtitle}>ভবিষ্যৎ রপ্তানিকারক ও আমদানিকারক তৈরি</Text>
        </LinearGradient>
      </View>

      {/* বর্ণনা সেকশন */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>সংস্থা সম্পর্কে</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>প্র্যাকটিস মাল্টি ফ্যাবস এক্সিম</Text> শিক্ষার্থীদের আন্তর্জাতিক বাণিজ্যের বাস্তব অভিজ্ঞতা দেওয়ার জন্য তৈরি একটি 
          সাব-গ্রুপ। এখানে রপ্তানি ও আমদানি প্রক্রিয়া, পণ্য সোর্সিং, ডকুমেন্টেশন, 
          লজিস্টিক এবং বৈশ্বিক বাজার যোগাযোগ শেখানো হয়।
        </Text>
        <Text style={styles.paragraph}>
          অভিজ্ঞ পেশাদাররা শিক্ষার্থীদের বাণিজ্য আইন, শিপিং, কাস্টমস এবং বাজার কৌশল সম্পর্কে 
          শিক্ষা দেন। শিক্ষার্থীরা বাস্তব অভিজ্ঞতা ও ব্যবসায়িক দক্ষতা অর্জন করে।
        </Text>

        {/* সুবিধাসমূহ */}
        <Text style={styles.sectionTitle}>শিক্ষার্থীদের সুবিধা</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• বাস্তব রপ্তানি ও আমদানি প্রক্রিয়া শেখা।</Text>
          <Text style={styles.listItem}>• কাস্টমস, শিপিং ও বাণিজ্য আইন বোঝা।</Text>
          <Text style={styles.listItem}>• যোগাযোগ ও দর কষাকষির দক্ষতা বৃদ্ধি।</Text>
          <Text style={styles.listItem}>• পেশাদার রপ্তানিকারকদের থেকে পরামর্শ নেওয়া।</Text>
          <Text style={styles.listItem}>• সিমুলেটেড বাণিজ্য প্রকল্পে কাজ করার সুযোগ।</Text>
          <Text style={styles.listItem}>• ব্যবসায়িক সচেতনতা ও উদ্যোক্তা মানসিকতা তৈরি।</Text>
          <Text style={styles.listItem}>• দলগত কাজের মাধ্যমে নেতৃত্ব ও দলবদ্ধ কাজের দক্ষতা বৃদ্ধি।</Text>
        </View>

        <Text style={styles.footerText}>
          প্র্যাকটিস মাল্টি ফ্যাবস এক্সিম শুধুমাত্র শিক্ষামূলক প্রোগ্রাম নয় — এটি 
          শিক্ষার্থীদের বৈশ্বিক ব্যবসায় সুযোগ অন্বেষণ এবং আন্তর্জাতিক বাজারে স্বীকৃতি 
          পাওয়ার একটি পথ।
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },
  heroContainer: { position: "relative", width: width, height: 220 },
  heroImage: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "bold", textAlign: "center" },
  heroSubtitle: { color: "#fff", fontSize: 16, marginTop: 5, textAlign: "center", opacity: 0.9 },
  contentContainer: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginVertical: 10 },
  paragraph: { fontSize: 15, color: "#555", lineHeight: 22, marginBottom: 10, textAlign: "justify" },
  list: { marginVertical: 8 },
  listItem: { fontSize: 15, color: "#444", marginVertical: 4 },
  footerText: { marginTop: 12, fontSize: 15, color: "#555", lineHeight: 22, textAlign: "justify", marginBottom: 20 },
});
