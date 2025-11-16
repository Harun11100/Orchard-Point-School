import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function StudentResultView() {
  const { schoolId, studentId, classId } = useLocalSearchParams();
  const [examType, setExamType] = useState("");
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [results, setResults] = useState([]);

  // ✅ Fetch results
  const fetchStudentResults = async (examType) => {
    if (!examType) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/school/student/result/getResult?schoolId=${schoolId}&studentId=${studentId}&examType=${examType}`
      );

      const fetched = Array.isArray(res.data.data) ? res.data.data : [];
      setResults(fetched);
    } catch (err) {
      console.error("❌ Error fetching results:", err);
      Alert.alert("ত্রুটি", "সার্ভার থেকে ছাত্রের ফলাফল আনতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
      setBtnLoading(false);
    }
  };

  // ✅ Search
  const handleSearch = async () => {
    if (!examType) {
      Alert.alert("ত্রুটি", "দয়া করে পরীক্ষার ধরন নির্বাচন করুন!");
      return;
    }
    setBtnLoading(true);
    await fetchStudentResults(examType);
  };


  return (
    <LinearGradient colors={["#f8fcffff", "#e8f1f8ff"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>🎓 পরীক্ষার ফলাফল </Text>

        {/* Picker Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>পরীক্ষার ধরন নির্বাচন করুন</Text>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={examType}
              onValueChange={setExamType}
              style={styles.picker}
              dropdownIconColor="#164a92ff"
              >
              <Picker.Item label="একটি অপশন নির্বাচন করুন" value="" />
              <Picker.Item label="১ম সেমিস্টার" value="1st Semester" />
              <Picker.Item label="২য় সেমিস্টার" value="2nd Semester" />
              <Picker.Item label="৩য় সেমিস্টার" value="3rd Semester" />
              <Picker.Item label="টিউটোরিয়াল পরীক্ষা" value="Tutorial Exam" />
              <Picker.Item label="বার্ষিক পরীক্ষা" value="Final Exam" />
            </Picker>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={btnLoading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#72b4e9ff", "#075ecfff"]}
              style={styles.searchButtonInner}
            >
              {btnLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <MaterialIcons name="search" size={22} color="#fff" />
                  <Text style={styles.buttonText}>অনুসন্ধান করুন</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      
        {!loading && results.length > 0 ? (
          <View style={styles.resultsSection}>
            <Text style={styles.subheader}>📊 ফলাফল</Text>

            {results.map((result) => (
              <View key={result._id} style={styles.resultCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.examType}>{result.examType}</Text>
                </View>

                {/* Table */}
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>
                      বিষয়
                    </Text>
                    <Text style={[styles.cell, styles.headerCell]}>নাম্বার</Text>
                    <Text style={[styles.cell, styles.headerCell]}>গ্রেড</Text>
                  </View>

                  {result.results?.map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tableRow,
                        {
                          backgroundColor:
                            index % 2 === 0 ? "#F9FAFB" : "#FFFFFF",
                        },
                      ]}
                    >
                      <Text style={[styles.cell, { flex: 2 }]}>
                        {item.subject}
                      </Text>
                      <Text style={styles.cell}>{item.mark}</Text>
                      <Text style={[styles.cell, styles.grade]}>
                        {item.grade}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.avgGrade}>
                    গড় গ্রেড: {result.averageGrade}
                  </Text>
                  <Text style={styles.totalMarks}>
                    মোট নাম্বার: {result.totalMarks}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          !loading && (
            <View style={styles.emptyState}>
              <Image
                style={styles.image}
                source={require("../../assets/image/empty.png")}
              />
              <Text style={styles.emptyText}>কোন ফলাফল পাওয়া যায়নি</Text>
            </View>
          )
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
   color: "#315cb2ff",
    textAlign: "center",
    marginVertical: 15,
  },
  inputSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    elevation: 3,
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 6,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },
  picker: {
    color: "#0a60d8ff",
    backgroundColor: "#fff",
  },
  searchButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  searchButtonInner: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  resultsSection: {
    marginTop: 10,
  },
  subheader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0e64afff",
    marginBottom: 10,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  examType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1853c0ff",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#dce5fcff",
    paddingVertical: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#374151",
  },
  headerCell: {
    fontWeight: "600",
    color: "#1670d6ff",
  },
  grade: {
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  avgGrade: {
    fontWeight: "600",
    color: "#0a7c4a",
  },
  totalMarks: {
    fontWeight: "600",
    color: "#2563EB",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  image: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  emptyText: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 16,
  },
  uploadButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  uploadButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
});
