import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PracticeLanguageClubPageBN() {
  return (
    <ScrollView style={styles.container}>
      {/* হিরো সেকশন */}
      <View style={styles.heroContainer}>
      <Image
      source={require("../../assets/image/englishlaguage.webp")}
      style={styles.heroImage}
      />
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]}
          style={styles.overlay}
        >
          <Text style={styles.heroTitle}>প্র্যাকটিস ল্যাঙ্গুয়েজ ক্লাব</Text>
          <Text style={styles.heroSubtitle}>আত্মবিশ্বাসের সাথে ইংরেজি শেখা</Text>
        </LinearGradient>
      </View>

      {/* বর্ণনা সেকশন */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>সংস্থা সম্পর্কে</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>প্র্যাকটিস ল্যাঙ্গুয়েজ ক্লাব</Text> শিক্ষার্থীদের
          ইংরেজি কথা বলা ও যোগাযোগ দক্ষতা উন্নয়নের জন্য প্র্যাকটিস গ্রুপের একটি উদ্যোগ। 
          বিশ্বায়িত সমাজে ইংরেজিতে সাবলীলতা শিক্ষার্থীকে একাডেমিক, পেশাগত এবং সামাজিকভাবে 
          সফল হতে সাহায্য করে।
        </Text>

        <Text style={styles.paragraph}>
          ক্লাসগুলোতে কথোপকথন, শব্দভাণ্ডার বৃদ্ধি, উচ্চারণ উন্নতি এবং ইন্টারেকটিভ কার্যক্রম 
          অন্তর্ভুক্ত। শিক্ষার্থীরা বিতর্ক, উপস্থাপনা, রোল প্লে এবং গ্রুপ ডিসকাশনে অংশ নিয়ে 
          ভাষা দক্ষতা প্রয়োগ করে।
        </Text>

        <Text style={styles.sectionTitle}>শেখার পদ্ধতি</Text>
        <Text style={styles.paragraph}>
          ক্লাবটি শিক্ষার্থী-কেন্দ্রিক এবং ব্যবহারিক পদ্ধতি অনুসরণ করে। অভিজ্ঞ শিক্ষকেরা 
          ব্যক্তিগত ফিডব্যাক দিয়ে শিক্ষার্থীদের দ্রুত উন্নতি করতে সাহায্য করেন। ক্লাসগুলো 
          মজাদার, অংশগ্রহণমূলক এবং ইন্টারেকটিভ।
        </Text>

        <Text style={styles.sectionTitle}>সুবিধা</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• কথ্য ইংরেজি ও উচ্চারণে উন্নতি।</Text>
          <Text style={styles.listItem}>• শব্দভাণ্ডার ও ব্যাকরণ দক্ষতা বৃদ্ধি।</Text>
          <Text style={styles.listItem}>• আত্মবিশ্বাসী পাবলিক স্পিকিং।</Text>
          <Text style={styles.listItem}>• একাডেমিক কাজে উন্নতি।</Text>
          <Text style={styles.listItem}>• বিতর্ক, কুইজ ও প্রতিযোগিতায় অংশগ্রহণের সুযোগ।</Text>
          <Text style={styles.listItem}>• আন্তর্জাতিক যোগাযোগ পদ্ধতিতে অভিজ্ঞতা।</Text>
          <Text style={styles.listItem}>• সফট স্কিল ও দলগত কাজের দক্ষতা বৃদ্ধি।</Text>
        </View>

        <Text style={styles.sectionTitle}>ভিশন</Text>
        <Text style={styles.paragraph}>
          প্র্যাকটিস ল্যাঙ্গুয়েজ ক্লাব লক্ষ্য রাখে আত্মবিশ্বাসী ইংরেজি বক্তা তৈরি করা, যারা 
          একাডেমিক, পেশাগত এবং সামাজিকভাবে সফল হবে। শিক্ষকের নির্দেশনা ও ইন্টারেকটিভ 
          শেখার মাধ্যমে শিক্ষার্থীরা দক্ষ, আত্মবিশ্বাসী এবং বিশ্বমানের চ্যালেঞ্জ মোকাবিলা করতে 
          সক্ষম হবে।
        </Text>

        <Text style={styles.footerText}>
          প্র্যাকটিস ল্যাঙ্গুয়েজ ক্লাব — ইংরেজি বলুন, আত্মবিশ্বাসের সাথে বলুন!
        </Text>
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
