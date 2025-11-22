// ResultUploadScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;

const subjects = [
  // Bengali
  { label: "বাংলা", value: "বাংলা" },
  { label: "বাংলা ১ম পত্র", value: "বাংলা ১ম পত্র" },
  { label: "বাংলা ২য় পত্র", value: "বাংলা ২য় পত্র" },

  // English
  { label: "ইংরেজি", value: "ইংরেজি" },
  { label: "ইংরেজি ১ম পত্র", value: "ইংরেজি ১ম পত্র" },
  { label: "ইংরেজি ২য় পত্র", value: "ইংরেজি ২য় পত্র" },

  // Mathematics
  { label: "গণিত", value: "গণিত" },
  { label: "উচ্চতর গণিত", value: "উচ্চতর গণিত" },
  { label: "হিসাব বিজ্ঞান", value: "হিসাব বিজ্ঞান" },

  // Science
  { label: "সাধারণ বিজ্ঞান", value: "সাধারণ বিজ্ঞান" },
  { label: "বিজ্ঞান", value: "বিজ্ঞান" },
  { label: "রসায়ন", value: "রসায়ন" },
  { label: "পদার্থ বিজ্ঞান", value: "পদার্থ বিজ্ঞান" },
  { label: "জীববিজ্ঞান", value: "জীববিজ্ঞান" },

  // Social Studies
  { label: "ইতিহাস", value: "ইতিহাস" },
  { label: "ভূগোল", value: "ভূগোল" },
  { label: "অর্থনীতি", value: "অর্থনীতি" },
  { label: "ব্যবসায় শিক্ষা", value: "ব্যবসায় শিক্ষা" },
  { label: "সাধারণ জ্ঞান", value: "সাধারণ জ্ঞান" },
  { label: "বাংলাদেশ ও বিশ্বপরিচয়", value: "বাংলাদেশ ও বিশ্বপরিচয়" }, // added

  // Religion & Moral
  { label: "ইসলাম শিক্ষা", value: "ইসলাম শিক্ষা" },
  { label: "হিন্দু ধর্ম শিক্ষা", value: "হিন্দু ধর্ম শিক্ষা" },
  { label: "খ্রিষ্টধর্ম শিক্ষা", value: "খ্রিষ্টধর্ম শিক্ষা" },
  { label: "নৈতিক শিক্ষা", value: "নৈতিক শিক্ষা" },

  // Technology & ICT
  { label: "আইসিটি", value: "আইসিটি" },
  { label: "কম্পিউটার", value: "কম্পিউটার" },

  // Arts
  { label: "চিত্রকলা", value: "চিত্রকলা" },
  { label: "সঙ্গীত", value: "সঙ্গীত" },
  { label: "শারীরিক শিক্ষা", value: "শারীরিক শিক্ষা" },

  // Additional / Electives
  { label: "পরিবেশ শিক্ষা", value: "পরিবেশ শিক্ষা" },
  { label: "উদ্যোক্তা শিক্ষা", value: "উদ্যোক্তা শিক্ষা" },
];


const gradingScale = [
  { min: 80, grade: "A+",point: 5.0 },
  { min: 70, grade: "A", point: 4.0 },
  { min: 60, grade: "B+",point: 3.5 },
  { min: 50, grade: "B", point: 3.0 },
  { min: 40, grade: "C", point: 2.0 },
  { min: 33, grade: "D", point: 1.0 },
  { min: 0,  grade: "F", point: 0.0 },
];

const ResultSchema = Yup.object().shape({
  studentId: Yup.string().required("Student ID is required"),
  schoolId: Yup.string().required("School ID is required"),
  examType: Yup.string().required("Exam type is required"),
  results: Yup.array()
    .of(
      Yup.object().shape({
        subject: Yup.string().required("Subject required"),
        mark: Yup.number().required("Mark required").min(0).max(100),
        grade: Yup.string().required("Grade required"),
      })
    )
    .min(1, "At least one subject required"),
});

const ResultUploadScreen = () => {
  // get params (may be undefined)
  const {schoolId,studentId} = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  // get grade + point safely
  const getGrade = (mark) => {
    const m = Number.isFinite(Number(mark)) ? Number(mark) : -1;
    for (let g of gradingScale) {
      if (m >= g.min) return { grade: g.grade, point: g.point };
    }
    return { grade: "F", point: 0.0 };
  };

  // calculate totals; defensive checks
  const calculateTotals = (results = []) => {
    if (!Array.isArray(results) || results.length === 0) return { total: 0, avg: "0.00" };

    const valid = results.filter((r) => r != null && r.mark !== "" && r.mark !== null && !isNaN(Number(r.mark)));
    const total = valid.reduce((s, r) => s + Number(r.mark || 0), 0);
    const pointsSum = valid.reduce((s, r) => s + getGrade(Number(r.mark || 0)).point, 0);
    const avg = valid.length ? (pointsSum / valid.length).toFixed(2) : "0.00";
    return { total, avg };
  };

  // submit to server (renamed to avoid shadowing)
  const submitToServer = async (values, { resetForm }) => {
    try {
      setLoading(true);
      const { total, avg } = calculateTotals(values.results);
      const payload = {
        ...values,
        totalMarks: total,
        averageGrade: avg,
        schoolId,
        studentId,

      };

      const res = await axios.post(`${API_URL}/api/school/student/result/addResult`, payload);
      if (res?.data?.success) {
        Alert.alert("Success", "Result uploaded successfully");
        resetForm();
      } else {
        const errMsg = res?.data?.error || "Something went wrong";
        Alert.alert("Error", errMsg);
      }
    } catch (err) {
      console.error("submitToServer error:", err);
      Alert.alert("Error", err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>ফলাফল আপলোড</Text>

      <Formik
      enableReinitialize
      initialValues={{
        examType: "",
        schoolId: schoolId || "",
        studentId: studentId || "",
        results: [{ subject: "", mark: "", grade: "" }],
      }}
      validationSchema={ResultSchema}
      onSubmit={submitToServer}
    >
        {({
          handleChange,
          handleBlur,
          handleSubmit: formikSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => {
          // recalc totals on each render
          const { total, avg } = calculateTotals(values.results);

          // helper to update marks safely (keeps mark as number when possible)
          const onChangeMark = (index, raw) => {
            // allow empty string to reset
            if (raw === "" || raw == null) {
              setFieldValue(`results[${index}].mark`, "");
              setFieldValue(`results[${index}].grade`, "");
              return;
            }
            // keep only digits and decimal
            const cleaned = raw.toString().replace(/[^\d.]/g, "");
            const num = cleaned === "" ? "" : Number(cleaned);
            setFieldValue(`results[${index}].mark`, num);
            if (num === "" || isNaN(num)) {
              setFieldValue(`results[${index}].grade`, "");
            } else {
              const { grade } = getGrade(num);
              setFieldValue(`results[${index}].grade`, grade);
            }
          };

          return (
            <View>
              {/* Exam Type */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🧾 পরীক্ষার ধরন</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={values.examType}
                    onValueChange={(val) => setFieldValue("examType", val)}
                    style={styles.picker}
                    mode={Platform.OS === "android" ? "dropdown" : "dialog"}
                  >
                    <Picker.Item label="পরীক্ষার ধরন নির্বাচন করুন" value="" />
                    <Picker.Item label="১ম সাময়িক" value="১ম সাময়িক" />
                    <Picker.Item label="২য় সাময়িক" value="২য় সাময়িক" />
                    <Picker.Item label="৩য় সাময়িক" value="৩য় সাময়িক" />
                    <Picker.Item label="টিউটোরিয়াল পরীক্ষা" value="টিউটোরিয়াল পরীক্ষা" />
                    <Picker.Item label="বার্ষিক পরীক্ষা" value="বার্ষিক পরীক্ষা" />
                  </Picker>
                </View>
                {errors.examType && touched.examType && (
                  <Text style={styles.error}>{errors.examType}</Text>
                )}
              </View>
              <FieldArray name="results">
                {({ push, remove }) => (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}> 📚 বিষয় ও নম্বর</Text>

                    {Array.isArray(values.results) &&
                      values.results.map((result = {}, index) => (
                        <View key={index} style={styles.subjectRow}>
                          <View style={{ flex: 1 }}>
                            <Picker
                              selectedValue={result.subject ?? ""}
                              style={styles.pickerSmall}
                              onValueChange={(val) => setFieldValue(`results[${index}].subject`, val)}
                            >
                              <Picker.Item label=" বিষয় নির্বাচন করুন" value="" />
                              {subjects.map((s, i) => (
                                <Picker.Item key={i} label={s.label} value={s.value} />
                              ))}
                            </Picker>
                          </View>

                          <TextInput
                            placeholder="নম্বর"
                            keyboardType="numeric"
                            style={styles.markInput}
                            value={
                              result.mark === "" || result.mark == null
                                ? ""
                                : String(result.mark)
                            }
                            onChangeText={(val) => onChangeMark(index, val)}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              // ensure at least one row remains
                              if (values.results.length === 1) {
                                // reset row instead of removing to keep form valid
                                setFieldValue(`results[0]`, { subject: "", mark: "", grade: "" });
                                return;
                              }
                              remove(index);
                            }}
                            style={styles.removeBtn}
                          >
                            <Text style={styles.removeText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}

                    {/* Add subject */}
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => push({ subject: "", mark: "", grade: "" })}
                    >
                      <Text style={styles.addText}>+ বিষয় যুক্ত করুন </Text>
                    </TouchableOpacity>

                    {/* show results-level error */}
                    {typeof errors.results === "string" && (
                      <Text style={styles.error}>{errors.results}</Text>
                    )}
                  </View>
                )}
              </FieldArray>

              {/* Totals */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>📊 সর্বমোট নম্বর: {total}</Text>
                <Text style={styles.summaryText}>⭐  GPA: {avg}</Text>
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={() => formikSubmit()}
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                disabled={loading}
              >
                <Text style={styles.submitText}>
                  {loading ? "আপলোডিং..." : " আপলোড ফলাফল  "}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      </Formik>
    </ScrollView>
  );
};

export default ResultUploadScreen;

/* Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ffff", padding: 15 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#164e84ff",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginTop: 6,
  },
  error: { color: "red", fontSize: 12, marginTop: 6 },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#2e3a59",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f3f3f3ff",
  },
  picker: {
    width: "100%",
    height: 53,
    color: "#333",
  },
  pickerSmall: {
    width: "100%",
    height: 53,
    color: "#333",
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#fefefe",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  markInput: {
    width: 70,
    height: 44,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    textAlign: "center",
    backgroundColor: "#fff",
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  gradeBox: {
    backgroundColor: "#eaf4ff",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  gradeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#076ad4ff",
  },
  addBtn: {
    backgroundColor: "#0567cfff",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  addText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  removeBtn: {
    backgroundColor: "#dc3545",
    borderRadius: 50,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  removeText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 25,
  },
  summaryText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2e3a59",
    marginBottom: 6,
  },
  submitBtn: {
    backgroundColor: "#2f8b58ff",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    elevation: 3,
    marginBottom: 30,
  },
   viewBtn: {
    backgroundColor: "#285fa7ff",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    elevation: 3,
    marginBottom: 30,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  label: { fontSize: 13, color: "#555", fontWeight: "600", marginBottom: 4 },
});
