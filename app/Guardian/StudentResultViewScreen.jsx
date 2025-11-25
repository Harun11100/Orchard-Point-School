import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;


const ResultCard = React.memo(({ result, calculateFinalGrade }) => {
  return (
    <View style={styles.resultCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.examType}>{result.examType}</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>বিষয়</Text>
          <Text style={[styles.cell, styles.headerCell]}>নাম্বার</Text>
          {result.examType !== "টিউটোরিয়াল পরীক্ষা" && (
            <Text style={[styles.cell, styles.headerCell]}>গ্রেড</Text>
          )}
        </View>

        {result.results?.map((item, index) => {
          const isFailed = item.mark < 33 || item.grade === "F";
          return (
            <View
              key={index}
              style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? "#F9FAFB" : "#FFFFFF" },
              ]}
            >
              <Text style={[styles.cell, { flex: 2 }]}>{item.subject}</Text>
              <Text style={styles.cell}>{item.mark}</Text>
              {result.examType !== "টিউটোরিয়াল পরীক্ষা" && (
                <Text style={[styles.cell, isFailed && { color: "#d11a2a", fontWeight: "700" }]}>
                  {item.grade}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        {result.examType !== "টিউটোরিয়াল পরীক্ষা" && (
          <View style={styles.gradeBox}>
            <Text style={styles.gradeTitle}>GPA</Text>
            <Text style={styles.gradeValue}>{result.averageGrade}</Text>
            <Text style={styles.finalGrade}>{calculateFinalGrade(result.averageGrade)}</Text>
          </View>
        )}

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>মোট নাম্বার</Text>
          <Text style={styles.totalValue}>{result.totalMarks}</Text>
        </View>
      </View>
    </View>
  );
});

ResultCard.displayName = "ResultCard";

export default function StudentResultView() {
  const { schoolId, studentId } = useLocalSearchParams();
  const [examType, setExamType] = useState("");
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [results, setResults] = useState([]);

  const router = useRouter();

  const calculateFinalGrade = useCallback((avg) => {
    if (avg === 5) return "A+";
    if (avg >= 4) return "A";
    if (avg >= 3.5) return "A-";
    if (avg >= 3) return "B+";
    if (avg >= 2.5) return "B";
    return "C";
  }, []);

  const fetchStudentResults = useCallback(
    async (type) => {
      if (!type) return;

      setLoading(true);
      try {
        const res = await axios.get(
          `${API_URL}/api/school/student/result/getResult?schoolId=${schoolId}&studentId=${studentId}&examType=${type}`
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
    },
    [schoolId, studentId]
  );

  const handleSearch = async () => {
    if (!examType) {
      Alert.alert("ত্রুটি", "দয়া করে পরীক্ষার ধরন নির্বাচন করুন!");
      return;
    }
    setBtnLoading(true);
    setResults([]); // Clear previous results
    await fetchStudentResults(examType);
  };

  return (
    <LinearGradient colors={["#f8fcffff", "#e8f1f8ff"]} style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 18 }}>
        {/* Header */}
        <Text style={styles.header}>শিক্ষার্থীর ফলাফল</Text>

        {/* Exam Type Selector */}
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
              <Picker.Item label="টিউটোরিয়াল পরীক্ষা" value="টিউটোরিয়াল পরীক্ষা" />
              <Picker.Item label="বার্ষিক পরীক্ষা" value="বার্ষিক পরীক্ষা" />
            </Picker>
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={btnLoading}>
            <LinearGradient colors={["#4ca6f5ff", "#144cd0ff"]} style={styles.searchButtonInner}>
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

        {/* Results */}
        {loading && results.length === 0 ? (
          <ActivityIndicator size="large" color="#115bb5ff" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id || Math.random().toString()}
            renderItem={({ item }) => <ResultCard result={item} calculateFinalGrade={calculateFinalGrade} />}
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyState}>
                  <Image style={styles.image} source={require("../../assets/image/empty.png")} />
                  <Text style={styles.emptyText}>কোন ফলাফল পাওয়া যায়নি</Text>
                </View>
              )
            }
          />
        )}
      </View>
    </LinearGradient>
  );
}

// -------------------- Styles --------------------
const styles = StyleSheet.create({
  container: {},
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e3a8a",
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
  label: { fontSize: 15, color: "#374151", marginBottom: 6 },
  pickerWrapper: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, overflow: "hidden", marginBottom: 14 },
  picker: { color: "#144073ff", backgroundColor: "#fff" },
  searchButton: { borderRadius: 12, overflow: "hidden" },
  searchButtonInner: { paddingVertical: 12, alignItems: "center", justifyContent: "center" },
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  buttonText: { color: "#fff", fontWeight: "600" },
  resultCard: { backgroundColor: "#fff", borderRadius: 14, padding: 12, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  examType: { fontSize: 16, fontWeight: "600", color: "#3673c3ff" },
  tableHeader: { flexDirection: "row", backgroundColor: "#dce9fcff", paddingVertical: 6, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  tableRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 4 },
  cell: { flex: 1, textAlign: "center", fontSize: 14, color: "#374151" },
  headerCell: { fontWeight: "600", color: "#044a78ff" },
  summaryCard: { marginTop: 16, padding: 10, borderRadius: 18, backgroundColor: "#ffffff", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gradeBox: { flex: 1, marginRight: 10, backgroundColor: "#f3f8ff", padding: 12, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#dbe7ff" },
  gradeTitle: { fontSize: 12, color: "#4b5563", fontWeight: "600", marginBottom: 4 },
  gradeValue: { fontSize: 22, fontWeight: "800", color: "#2563eb" },
  finalGrade: { marginTop: 4, fontSize: 16, fontWeight: "700", color: "#1e3a8a" },
  totalBox: { width: 120, backgroundColor: "#f0fdf4", padding: 12, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: "#c7f0d2" },
  totalLabel: { fontSize: 12, color: "#065f46", fontWeight: "600" },
  totalValue: { marginTop: 4, fontSize: 20, fontWeight: "800", color: "#047857" },
  emptyState: { alignItems: "center", marginTop: 60 },
  image: { width: 220, height: 220, resizeMode: "contain" },
  emptyText: { marginTop: 10, color: "#6B7280", fontSize: 16 },
});
