// ResultUploadScreen.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Formik, FieldArray } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig.extra.API_URL;

/* ================= Validation ================= */
const ResultSchema = Yup.object().shape({
  examType: Yup.string().required("পরীক্ষার ধরন নির্বাচন করুন"),
  results: Yup.array()
    .of(
      Yup.object().shape({
        subject: Yup.string().required("বিষয় নির্বাচন করুন"),
        mark: Yup.number()
          .transform((_, v) => (v === "" ? undefined : Number(v)))
          .typeError("নম্বর সংখ্যা হতে হবে")
          .min(0)
          .max(100)
          .required("নম্বর দিন"),
      })
    )
    .min(1),
});

/* ================= Helpers ================= */
const createEmptyResult = () => ({
  subject: "",
  mark: "",
  maxMarks: 100,
  passingMarks: 33,
});

export default function ResultUploadScreen() {
  const { schoolId, studentId } = useLocalSearchParams();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ================= Fetch Subjects ================= */
  const fetchSubjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/school/subject/getSubject?schoolId=${schoolId}`
      );
      if (res.data?.success) setSubjects(res.data.subjects || []);
      else Alert.alert("ত্রুটি", "বিষয় লোড করা যায়নি");
    } catch {
      Alert.alert("ত্রুটি", "নেটওয়ার্ক সমস্যা");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    if (schoolId) fetchSubjects();
  }, [schoolId, fetchSubjects]);

  /* ================= Submit ================= */
  const submitToServer = async (values, { resetForm }) => {
    try {
      setSubmitting(true);
      const payload = {
        examType: values.examType,
        schoolId,
        studentId,
        results: values.results.map((r) => ({
          subject: r.subject,
          mark: Number(r.mark),
          maxMarks: r.maxMarks,
          passingMarks: r.passingMarks,
        })),
      };

      const res = await axios.post(
        `${API_URL}/api/school/student/result/addResult`,
        payload
      );

      if (res.data?.success) {
        Alert.alert("সাফল্য", "ফলাফল আপলোড হয়েছে");
        resetForm({
          values: { examType: "", results: [createEmptyResult()] },
        });
      } else {
        Alert.alert("ত্রুটি", "আপলোড ব্যর্থ");
      }
    } catch {
      Alert.alert("ত্রুটি", "সার্ভার সমস্যা");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text>বিষয় লোড হচ্ছে...</Text>
      </View>
    );
  }

  /* ================= UI ================= */
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>ফলাফল আপলোড</Text>

      <Formik
        initialValues={{ examType: "", results: [createEmptyResult()] }}
        validationSchema={ResultSchema}
        onSubmit={submitToServer}
      >
        {({ values, handleSubmit, setFieldValue }) => (
          <>
            {/* Exam Type */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🧾 পরীক্ষার ধরন</Text>
              <Picker
                selectedValue={values.examType}
                onValueChange={(v) => setFieldValue("examType", v)}
              >
                <Picker.Item label="নির্বাচন করুন" value="" />
                <Picker.Item label="১ম সাময়িক" value="১ম সাময়িক" />
                <Picker.Item label="২য় সাময়িক" value="২য় সাময়িক" />
                <Picker.Item label="৩য় সাময়িক" value="৩য় সাময়িক" />
                <Picker.Item label="বার্ষিক" value="বার্ষিক" />
              </Picker>
            </View>

            {/* Subjects */}
            <FieldArray name="results">
              {({ push, remove }) => (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>📚 বিষয় ও নম্বর</Text>

                  {values.results.map((item, index) => (
                    <View key={index} style={styles.subjectRow}>
                      <View style={{ flex: 1 }}>
                        <Picker
                          selectedValue={item.subject}
                          onValueChange={(val) => {
                            const selected = subjects.find(
                              (s) => s.name === val
                            );

                            setFieldValue(`results.${index}.subject`, val);
                            setFieldValue(`results.${index}.mark`, "");
                            setFieldValue(
                              `results.${index}.maxMarks`,
                              selected?.maxMarks ?? 100
                            );
                            setFieldValue(
                              `results.${index}.passingMarks`,
                              selected?.passingMarks ?? 33
                            );
                          }}
                        >
                          <Picker.Item label="বিষয় নির্বাচন করুন" value="" />
                          {subjects.map((s) => (
                            <Picker.Item
                              key={s._id}
                              label={s.name}
                              value={s.name}
                            />
                          ))}
                        </Picker>
                      </View>

                      <TextInput
                        style={styles.markInput}
                        keyboardType="numeric"
                        value={item.mark}
                        onChangeText={(v) =>
                          setFieldValue(`results.${index}.mark`, v)
                        }
                        placeholder="নম্বর"
                      />

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() =>
                          values.results.length === 1
                            ? setFieldValue("results", [createEmptyResult()])
                            : remove(index)
                        }
                      >
                        <Text style={styles.removeText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => push(createEmptyResult())}
                  >
                    <Text style={styles.addText}>+ বিষয় যুক্ত করুন</Text>
                  </TouchableOpacity>
                </View>
              )}
            </FieldArray>

            {/* Submit */}
            <TouchableOpacity onPress={handleSubmit} disabled={submitting}>
              <LinearGradient
                colors={["#22c55e", "#15803d"]}
                style={styles.uploadInner}
              >
                <MaterialIcons name="upload" size={22} color="#fff" />
                <Text style={styles.uploadText}>
                  {submitting ? "আপলোড হচ্ছে..." : "ফলাফল আপলোড করুন"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
      </Formik>
    </ScrollView>
  );
}

/* ================= Styles ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7fb", padding: 14 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", margin: 18 },
  sectionCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  subjectRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  markInput: { width: 80, borderWidth: 1, borderRadius: 8, textAlign: "center" },
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  removeText: { fontSize: 22, color: "#b91c1c", fontWeight: "700" },
  addBtn: { padding: 10, backgroundColor: "#ecf2fd", borderRadius: 10, alignItems: "center" },
  addText: { fontWeight: "600", color: "#1d63ae" },
  uploadInner: { marginTop: 24, padding: 14, borderRadius: 14, flexDirection: "row", justifyContent: "center", gap: 8 },
  uploadText: { color: "#fff", fontWeight: "600" },
});
