import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PracticeHumanRightsPageBN() {
  return (
    <ScrollView style={styles.container}>
      {/* হিরো সেকশন */}
      <View style={styles.heroContainer}>
              <Image
                 source={require("../../assets/image/humanrights.jpg")}
                 style={styles.heroImage}
               />
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]}
          style={styles.overlay}
        >
          <Text style={styles.heroTitle}>প্র্যাকটিস মানবাধিকার সংস্থা</Text>
          <Text style={styles.heroSubtitle}>
            শিক্ষার্থীদের অধিকার ও ন্যায় সম্পর্কে শিক্ষিত ও ক্ষমতায়িত করা
          </Text>
        </LinearGradient>
      </View>

      {/* বর্ণনা সেকশন */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>সংস্থা সম্পর্কে</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>প্র্যাকটিস মানবাধিকার সংস্থা</Text> 
          শিক্ষার্থীদের মৌলিক মানবাধিকার, সামাজিক ন্যায় এবং সমতার বিষয়ে সচেতন করে। 
          এটি এমন একটি প্রজন্ম গড়ে তুলতে চায় যারা ন্যায়, মর্যাদা এবং স্বাধীনতাকে সম্মান করে।
        </Text>

        <Text style={styles.sectionTitle}>উদ্দেশ্য</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• শিক্ষার্থীদের মানবাধিকার সম্পর্কে সচেতন করা।</Text>
          <Text style={styles.listItem}>• সামাজিক ন্যায় ও নৈতিক আচরণ উৎসাহিত করা।</Text>
          <Text style={styles.listItem}>• নেতৃত্ব ও সমালোচনামূলক চিন্তাভাবনা বিকাশ করা।</Text>
          <Text style={styles.listItem}>• সমতা, ন্যায় ও সহনশীলতা প্রচার করা।</Text>
        </View>

        <Text style={styles.sectionTitle}>ছাত্রছাত্রীদের সুযোগ</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• কর্মশালা, সচেতনতা প্রচার ও বিতর্কে অংশগ্রহণ।</Text>
          <Text style={styles.listItem}>• এনজিও ও সামাজিক প্রকল্পের সঙ্গে সহযোগিতা।</Text>
        </View>

        <Text style={styles.sectionTitle}>সুবিধা</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• অধিকার ও দায়িত্ব সম্পর্কে সচেতনতা বৃদ্ধি।</Text>
          <Text style={styles.listItem}>• নেতৃত্ব এবং জনসাধারণের দক্ষতা বৃদ্ধি।</Text>
          <Text style={styles.listItem}>• সামাজিক সমস্যা সম্পর্কে সমঝোতা ও সহানুভূতি বৃদ্ধি।</Text>
        </View>

        <Text style={styles.sectionTitle}>ভিশন</Text>
        <Text style={styles.paragraph}>
          আমাদের লক্ষ্য হলো এমন একটি প্রজন্ম গড়ে তোলা যা সচেতন, ক্ষমতায়িত এবং 
          ন্যায়, সমতা ও মানবাধিকারের প্রচারে সক্রিয়।
        </Text>

        <Text style={styles.footerText}>
          প্র্যাকটিস মানবাধিকার সংস্থা — শিক্ষার্থীদের ক্ষমতায়িত করা, অধিকার রক্ষা করা।
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
