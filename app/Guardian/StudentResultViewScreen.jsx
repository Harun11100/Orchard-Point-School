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

/* ------------------ SAFE API URL ------------------ */
const API_URL =
  Constants.expoConfig?.extra?.API_URL ||
  Constants.manifest?.extra?.API_URL ||
  "";

export default function StudentResultView() {
  const params = useLocalSearchParams();
  const router = useRouter();

  /* ------------------ SAFE PARAMS ------------------ */
  const schoolId = Array.isArray(params.schoolId)
    ? params.schoolId[0]
    : params.schoolId;

  const studentId = Array.isArray(params.studentId)
    ? params.studentId[0]
    : params.studentId;

  const classId = Array.isArray(params.classId)
    ? params.classId[0]
    : params.classId;

  const [examType, setExamType] = useState("");
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [deleteLoadingIds, setDeleteLoadingIds] = useState([]);

  /* ------------------ FETCH RESULTS ------------------ */
  const fetchStudentResults = async (type) => {
    if (!type || !schoolId || !studentId) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/school/student/result/getResult`,
        {
          params: {
            schoolId,
            studentId,
            examType: type,
          },
        }
      );

      const fetched = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setResults(fetched);
    } catch (err) {
      console.error("❌ Fetch error:", err?.response?.data || err.message);
      Alert.alert("ত্রুটি", "ফলাফল লোড করা যায়নি।");
    } finally {
      setLoading(false);
      setBtnLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!examType) {
      Alert.alert("ত্রুটি", "পরীক্ষার ধরন নির্বাচন করুন!");
      return;
    }
    setBtnLoading(true);
    fetchStudentResults(examType);
  };

  /* ------------------ DELETE RESULT ------------------ */
  const deleteResult = async (resultId) => {
    if (!resultId) return;

    setDeleteLoadingIds((prev) => [...prev, resultId]);

    try {
      const res = await axios.delete(
        `${API_URL}/api/school/student/result/deleteResult`,
        {
          data: { studentId, resultId, schoolId },
        }
      );

      if (res.data?.success) {
        setResults((prev) => prev.filter((r) => r._id !== resultId));
        Alert.alert("সফল", "ফলাফল মুছে ফেলা হয়েছে।");
      } else {
        Alert.alert("ত্রুটি", "ফলাফল মুছতে ব্যর্থ।");
      }
    } catch (err) {
      console.error("❌ Delete error:", err?.response?.data || err.message);
      Alert.alert("ত্রুটি", "ফলাফল মুছতে সমস্যা হয়েছে।");
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
          onPress={() =>
            router.push(`/PrincipalDashboardScreen?schoolId=${schoolId}`)
          }
        />

        <Text style={styles.header}>শিক্ষার্থীর ফলাফল</Text>

        {/* ------------------ PICKER ------------------ */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>পরীক্ষার ধরন নির্বাচন করুন</Text>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={examType}
              onValueChange={setExamType}
              style={styles.picker}
              dropdownIconColor="#1591d4ff"
            >
              <Picker.Item label="পরীক্ষার ধরন নির্বাচন করুন" value="" />
              <Picker.Item label="১ম সাময়িক" value="১ম সাময়িক" />
              <Picker.Item label="২য় সাময়িক" value="২য় সাময়িক" />
              <Picker.Item label="৩য় সাময়িক" value="৩য় সাময়িক" />
              <Picker.Item
                label="টিউটোরিয়াল পরীক্ষা"
                value="টিউটোরিয়াল পরীক্ষা"
              />
              <Picker.Item label="বার্ষিক পরীক্ষা" value="বার্ষিক পরীক্ষা" />
            </Picker>
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={btnLoading}
          >
            <LinearGradient
              colors={["#4ca6f5ff", "#2014d0ff"]}
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

        {/* ------------------ RESULTS ------------------ */}
        {!loading && results.length > 0 ? (
          <View style={styles.resultsSection}>
            <Text style={styles.subheader}>ফলাফল</Text>

            {results.map((result) => {
              const resultArray = Array.isArray(result.results)
                ? result.results
                : [];

              const hasFail = resultArray.some(
                (i) => i.grade === "F" || i.mark < i.passingMarks
              );

              const displayGpa = hasFail ? "F" : result.gpa;

              return (
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

                  {/* TABLE */}
                  <View style={styles.table}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>
                        বিষয়
                      </Text>
                      <Text style={[styles.cell, styles.headerCell]}>নম্বর</Text>
                      <Text style={[styles.cell, styles.headerCell]}>ম্যাক্স</Text>
                      <Text style={[styles.cell, styles.headerCell]}>পাশ</Text>
                      <Text style={[styles.cell, styles.headerCell]}>গ্রেড</Text>
                    </View>

                    {resultArray.map((item, index) => {
                      const isFailed =
                        item.grade === "F" ||
                        item.mark < item.passingMarks;

                      return (
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
                          <Text style={styles.cell}>{item.maxMarks}</Text>
                          <Text style={styles.cell}>
                            {item.passingMarks}
                          </Text>
                          <Text
                            style={[
                              styles.cell,
                              isFailed && {
                                color: "#d11a2a",
                                fontWeight: "700",
                              },
                            ]}
                          >
                            {item.grade}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* SUMMARY */}
                  <View style={styles.summaryCard}>
                    <View style={styles.gradeBox}>
                      <Text style={styles.gradeTitle}>GPA</Text>
                      <Text style={styles.gradeValue}>{displayGpa}</Text>
                      {displayGpa !== "F" && (
                        <Text style={styles.finalGrade}>
                          {result.finalGrade}
                        </Text>
                      )}
                    </View>

                    <View style={styles.totalBox}>
                      <Text style={styles.totalLabel}>মোট নাম্বার</Text>
                      <Text style={styles.totalValue}>
                        {result.totalMarks}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          !loading && (
            <View style={styles.emptyState}>
              <Image
                style={styles.image}
                source={require("../../assets/image/empty.png")}
              />
            </View>
          )
        )}
      </ScrollView>
    </LinearGradient>
  );
}

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  homeButton: {
    position: "absolute",
    borderRadius: 30,
    top: 10,
    left: 15,
    elevation: 5,
    marginTop: 10,
  },
  container: { padding: 18, paddingBottom: 60 },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 15,
  },
  inputSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    elevation: 3,
    marginBottom: 16,
  },
  label: { fontSize: 15, color: "#374151", marginBottom: 6 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },
  picker: { color: "#144073ff", backgroundColor: "#fff" },
  searchButton: { borderRadius: 12, overflow: "hidden" },
  searchButtonInner: {
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonContent: { flexDirection: "row", gap: 6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  resultsSection: { marginTop: 10 },
  subheader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#115891ff",
    marginBottom: 10,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  examType: { fontSize: 16, fontWeight: "600", color: "#3673c3ff" },

  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#dce9fcff",
    paddingVertical: 6,
  },
  tableRow: { flexDirection: "row", paddingVertical: 6 },
  cell: { flex: 1, textAlign: "center", fontSize: 14 },
  headerCell: { fontWeight: "600", color: "#044a78ff" },

  summaryCard: {
    marginTop: 16,
    padding: 10,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gradeBox: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#f3f8ff",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  gradeTitle: { fontSize: 12, fontWeight: "600" },
  gradeValue: { fontSize: 22, fontWeight: "800" },
  finalGrade: { fontSize: 16, fontWeight: "700" },
  totalBox: {
    width: 120,
    backgroundColor: "#f0fdf4",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  totalLabel: { fontSize: 12, fontWeight: "600" },
  totalValue: { fontSize: 20, fontWeight: "800" },

  emptyState: { alignItems: "center", marginTop: 60 },
  image: { width: 220, height: 220, resizeMode: "contain" },
});
