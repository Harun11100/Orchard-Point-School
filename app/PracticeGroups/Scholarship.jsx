import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PracticeScholarshipPageBN() {
  return (
    <ScrollView style={styles.container}>
      {/* হিরো সেকশন */}
      <View style={styles.heroContainer}>
         <Image
                 source={require("../../assets/image/scholarship.jpeg")}
                 style={styles.heroImage}
               />
         <LinearGradient
          colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.4)"]}
          style={styles.overlay}
        >
          <Text style={styles.heroTitle}>প্র্যাকটিস স্কলারশিপ</Text>
          <Text style={styles.heroSubtitle}>শিক্ষার মাধ্যমে স্বপ্নকে শক্তিশালী করা</Text>
        </LinearGradient>
      </View>

      {/* বর্ণনা সেকশন */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>সংস্থা সম্পর্কে</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>প্র্যাকটিস স্কলারশিপ</Text> হল প্র্যাকটিস গ্রুপের একটি উদ্যোগ
          যা মেধাবী, প্রতিভাবান এবং আর্থিকভাবে অসুবিধাগ্রস্ত শিক্ষার্থীদের সহায়তা করে। 
          এই প্রোগ্রামের লক্ষ্য, আর্থিক সীমাবদ্ধতা শিক্ষার্থীর শেখার পথে বাধা না হয়ে 
          মানসম্মত শিক্ষা সবার জন্য উপলব্ধ করা।
        </Text>

        <Text style={styles.sectionTitle}>উদ্দেশ্য ও ভিশন</Text>
        <Text style={styles.paragraph}>
          শিক্ষাই জাতির অগ্রগতির ভিত্তি। প্র্যাকটিস স্কলারশিপের মাধ্যমে আমরা ভবিষ্যতের 
          নেতা, উদ্ভাবক ও পরিবর্তনসাধক গড়ে তুলতে চাই, যারা সততা, সহানুভূতি এবং 
          উৎকর্ষের সাথে মানবতার সেবা করবে। শিক্ষার্থীরা আত্মবিশ্বাসী ও উদ্দেশ্যবোধসম্পন্ন 
          হয়ে সামাজিক ও একাডেমিক ক্ষেত্রে এগিয়ে যাবে।
        </Text>

        <Text style={styles.sectionTitle}>স্কলারশিপের ধরন</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• একাডেমিক এক্সেলেন্স স্কলারশিপ</Text>
          <Text style={styles.listItem}>• আর্থিক প্রয়োজনভিত্তিক স্কলারশিপ</Text>
          <Text style={styles.listItem}>• নেতৃত্ব ও কমিউনিটি সার্ভিস অ্যাওয়ার্ড</Text>
          <Text style={styles.listItem}>• বিশেষ প্রতিভা স্বীকৃতি অনুদান</Text>
          <Text style={styles.listItem}>• জাতীয় ও আন্তর্জাতিক প্রতিযোগিতার সহায়তা</Text>
        </View>

        <Text style={styles.sectionTitle}>সুবিধা</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• নির্বাচিত শিক্ষার্থীদের জন্য সম্পূর্ণ বা আংশিক ফি মওকুফ।</Text>
          <Text style={styles.listItem}>• মেধা ও কৃতিত্বের স্বীকৃতি ও সার্টিফিকেট।</Text>
          <Text style={styles.listItem}>• সিনিয়র শিক্ষকদের পরামর্শ ও একাডেমিক গাইডেন্স।</Text>
          <Text style={styles.listItem}>• উন্নত শিক্ষার উৎস এবং কর্মশালায় অংশগ্রহণের সুযোগ।</Text>
          <Text style={styles.listItem}>• উচ্চ লক্ষ্য অর্জনের জন্য প্রেরণা ও আত্মবিশ্বাস।</Text>
          <Text style={styles.listItem}>• শেখার সাথে সমাজসেবার সংযোগ বৃদ্ধি।</Text>
        </View>

        <Text style={styles.sectionTitle}>যোগ্যতা</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• প্র্যাকটিস গ্রুপের অন্তর্ভুক্ত শিক্ষার্থী হতে হবে।</Text>
          <Text style={styles.listItem}>• ধারাবাহিক ভালো একাডেমিক ফলাফল থাকতে হবে।</Text>
          <Text style={styles.listItem}>• আর্থিক প্রয়োজন বা বিশেষ মেধা প্রমাণিত থাকতে হবে।</Text>
          <Text style={styles.listItem}>• ইতিবাচক আচরণ ও সামাজিক বা স্কুল কার্যক্রমে অংশগ্রহণ।</Text>
        </View>

        <Text style={styles.sectionTitle}>আমাদের প্রতিশ্রুতি</Text>
        <Text style={styles.paragraph}>
          আমরা বিশ্বাস করি, প্রতিটি শিক্ষার্থীকে সমান সুযোগ পাওয়া উচিত। প্র্যাকটিস স্কলারশিপ 
          হলো আশা, সমতা এবং শিক্ষাগত ক্ষমতায়নের প্রতীক — শক্তিশালী, দায়িত্বশীল ও 
          দূরদর্শী নাগরিক তৈরি করতে সাহায্য করবে।
        </Text>

        <Text style={styles.footerText}>
          প্র্যাকটিস স্কলারশিপ — কারণ প্রতিটি স্বপ্নের একটি সুযোগ থাকা উচিত।
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
