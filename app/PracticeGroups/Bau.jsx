import React from "react";
import { View, Text, StyleSheet, ScrollView, Image, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PracticeSchoolCertificationPageBN() {
  return (
    <ScrollView style={styles.container}>
      {/* ✅ হিরো সেকশন */}
      <View style={styles.heroContainer}>
                  <Image
                           source={require("../../assets/image/openu.webp")}
                           style={styles.heroImage}
                         />
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.5)"]}
          style={styles.overlay}
        >
          <Text style={styles.heroTitle}>প্র্যাকটিস স্কুল</Text>
          <Text style={styles.heroSubtitle}>
            বাংলাদেশ ওপেন ইউনিভার্সিটি কর্তৃক সার্টিফায়েড
          </Text>
        </LinearGradient>
      </View>

      {/* ✅ বর্ণনা সেকশন */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>প্র্যাকটিস স্কুল সম্পর্কে</Text>
        <Text style={styles.paragraph}>
          <Text style={{ fontWeight: "bold" }}>প্র্যাকটিস স্কুল</Text> একটি
          উদ্ভাবনী শিক্ষামূলক উদ্যোগ যা প্রথাগত শিক্ষাকে বাস্তবজীবনের অভিজ্ঞতার সাথে
          সংযুক্ত করার জন্য ডিজাইন করা হয়েছে। ব্যবহারিক অভিজ্ঞতা, আধুনিক প্রযুক্তি
          এবং মূল্য-ভিত্তিক শিক্ষার মাধ্যমে, প্র্যাকটিস স্কুল শিক্ষার্থীদের একাডেমিক
          এবং পেশাদার উভয় পরিবেশেই সফল হতে প্রস্তুত করে।
        </Text>

        <Text style={styles.paragraph}>
          আমরা গর্বিত যে প্র্যাকটিস স্কুল সরকারিভাবে{" "}
          <Text style={{ fontWeight: "bold" }}>
            বাংলাদেশ ওপেন ইউনিভার্সিটি (BOU) দ্বারা সার্টিফায়েড
          </Text>।
          এটি বাংলাদেশের দূরশিক্ষা এবং পরবর্তী শিক্ষার অন্যতম সন্মানিত প্রতিষ্ঠান। 
          এই সার্টিফিকেশন আমাদের উচ্চমানের শিক্ষার প্রতি অঙ্গীকার এবং
          শিক্ষার্থীদের দক্ষতা ও প্রাসঙ্গিক জ্ঞান প্রদান নিশ্চিত করে।
        </Text>

        <Text style={styles.sectionTitle}>
          বাংলাদেশ ওপেন ইউনিভার্সিটির সাথে অংশীদারিত্ব
        </Text>
        <Text style={styles.paragraph}>
          বাংলাদেশ ওপেন ইউনিভার্সিটির সাথে এই সংযুক্তি প্র্যাকটিস স্কুলের শিক্ষার্থীদের 
          বিস্তৃত একাডেমিক নেটওয়ার্ক, মানসম্মত পাঠ্যক্রম নির্দেশিকা এবং স্বীকৃত 
          সার্টিফিকেশন পথ ব্যবহার করার সুযোগ দেয়। এই সহযোগিতার মাধ্যমে শিক্ষার্থীরা
          স্থানীয় এবং বৈশ্বিক শিক্ষার মান অনুযায়ী শিক্ষার অভিজ্ঞতা পায়।
        </Text>

        <Text style={styles.paragraph}>
          বাংলাদেশ ওপেন ইউনিভার্সিটির লক্ষ্য, যা নমনীয়, সহজলভ্য এবং আজীবন শিক্ষার সুযোগ 
          প্রদান করে, তা প্র্যাকটিস স্কুলের দর্শনের সাথে পুরোপুরি সামঞ্জস্যপূর্ণ। আমরা
          শিক্ষার্থীদের একাডেমিক, প্রযুক্তিগত এবং ব্যক্তিগত বিকাশে উৎকৃষ্টতা অর্জনের
          জন্য ক্ষমতায়িত করতে প্রতিশ্রুতিবদ্ধ।
        </Text>

        {/* ✅ সুবিধাসমূহ সেকশন */}
        <Text style={styles.sectionTitle}>BOU সার্টিফিকেশনের সুবিধা</Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>
            • শিক্ষার্থীরা জাতীয়ভাবে স্বীকৃত সনদ ও ক্রেডেনশিয়াল পায়।
          </Text>
          <Text style={styles.listItem}>
            • BOU এর ডিজিটাল শিক্ষামূলক সামগ্রী এবং একাডেমিক রিসোর্সের অ্যাক্সেস।
          </Text>
          <Text style={styles.listItem}>
            • BOU এর অধীনে উচ্চশিক্ষা বা পেশাগত প্রোগ্রামে অংশ নেওয়ার সুযোগ।
          </Text>
          <Text style={styles.listItem}>
            • স্থানীয় ও আন্তর্জাতিক সুযোগের জন্য একাডেমিক রেকর্ডের প্রামাণিকতা বৃদ্ধি।
          </Text>
          <Text style={styles.listItem}>
            • আধুনিক শিক্ষণ পদ্ধতি এবং দূরশিক্ষার প্রযুক্তি সম্পর্কে সচেতনতা।
          </Text>
          <Text style={styles.listItem}>
            • জাতীয় শিক্ষাগত লক্ষ্য ও উদ্ভাবনের সাথে শক্তিশালী সংযোগ।
          </Text>
        </View>

        {/* ✅ ভিশন সেকশন */}
        <Text style={styles.sectionTitle}>আমাদের দৃষ্টি</Text>
        <Text style={styles.paragraph}>
          প্র্যাকটিস স্কুলে আমরা এমন একটি শিক্ষা ব্যবস্থা কল্পনা করি যেখানে প্রতিটি শিক্ষার্থী
          একাডেমিক উৎকর্ষতা এবং ব্যবহারিক জ্ঞান দুটোই অর্জন করে। বাংলাদেশ ওপেন ইউনিভার্সিটির
          সহায়তায়, আমরা উন্নত শিক্ষণ পদ্ধতি, বাস্তব-জীবনের প্রকল্প এবং শিল্প-মানের প্রশিক্ষণ
          এক ছাতার তলে নিয়ে আসি।
        </Text>

        <Text style={styles.footerText}>
          একসাথে, প্র্যাকটিস স্কুল এবং বাংলাদেশ ওপেন ইউনিভার্সিটি একটি ভবিষ্যত-প্রস্তুত
          প্রজন্ম গড়ে তুলছে — আত্মবিশ্বাসী, দক্ষ এবং জ্ঞান ও সততার সাথে নেতৃত্ব দিতে
          প্রস্তুত।
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
    textAlign: "justify",
    marginBottom: 20,
  },
});
