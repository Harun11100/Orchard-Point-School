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
  const [deleteLoadingIds, setDeleteLoadingIds] = useState([]);
  const router = useRouter();

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

  // ✅ Delete result
  const deleteResult = async (resultId) => {
    if (!resultId) return;
    setDeleteLoadingIds((prev) => [...prev, resultId]);
    try {
      const res = await axios.delete(
        `${API_URL}/api/school/student/result/deleteResult`,
        {
          data: JSON.stringify({ studentId, resultId }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.data.success) {
        setResults((prev) => prev.filter((r) => r._id !== resultId));
        Alert.alert("সফল", "ফলাফল সফলভাবে মুছে ফেলা হয়েছে।");
      } else {
        Alert.alert("ত্রুটি", res.data.error || "ফলাফল মুছে ফেলা ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error(err.response ? err.response.data : err.message);
      Alert.alert("ত্রুটি", "ফলাফল মুছে ফেলার সময় সমস্যা হয়েছে।");
    } finally {
      setDeleteLoadingIds((prev) => prev.filter((id) => id !== resultId));
    }
  };

  return (
    <LinearGradient colors={["#f8fcffff", "#e8f1f8ff"]} style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

   <TouchableOpacity
  style={styles.homeButton}
  onPress={() => router.back()}
>
        <LinearGradient
          colors={["#629bebff", "#1680eaff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.homeButtonGradient}
        >
          <MaterialIcons name="home" size={24} color="#fff" />
          
        </LinearGradient>
      </TouchableOpacity>
        <Text style={styles.header}>🎓 শিক্ষার্থীর ফলাফল</Text>

        {/* Picker Section */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>পরীক্ষার ধরন নির্বাচন করুন</Text>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={examType}
              onValueChange={setExamType}
              style={styles.picker}
              dropdownIconColor="#176d9bff"
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
              colors={["#4296deff", "#287aebff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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
                  <TouchableOpacity onPress={() => deleteResult(result._id)}>
                    {deleteLoadingIds.includes(result._id) ? (
                      <ActivityIndicator size="small" color="#e11d48" />
                    ) : (
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={22}
                        color="#e11d48"
                      />
                    )}
                  </TouchableOpacity>
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
                source={require("../assets/image/empty.png")}
              />
              <Text style={styles.emptyText}>কোন ফলাফল পাওয়া যায়নি</Text>
            </View>
          )
        )}

        {/* Upload Button */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/TeacherResultUpload",
              params: { schoolId, studentId, classId },
            })
          }
          style={styles.uploadButton}
        >
          <LinearGradient
            colors={["#46af81ff", "#0f6943ff"]}
            style={styles.uploadButtonInner}
          >
            <MaterialIcons name="add" size={22} color="#fff" />
            <Text style={styles.uploadText}>ফলাফল আপলোড করুন</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
   homeButton: {
    position:"absolute",
    borderRadius: 30,
    top:10,
    left:15,
    overflow: "hidden",
    elevation: 5,
    marginTop: 10,
    alignSelf: "center",
  },
  homeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  container: {
    padding: 18,
    paddingBottom: 60,
  },
  header: {
    fontSize: 23,
    fontWeight: "700",
     color: "#315cb2ff",
    textAlign: "center",
    marginTop: 55,
    marginBottom:15
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
    color: "#327acdff",
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
    color: "#217dc8ff",
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
    color: "#3673c3ff",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#dce9fcff",
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
    color: "#044a78ff",
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
