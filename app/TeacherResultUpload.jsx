// ResultUploadScreen.jsx
import React, { useEffect, useState } from "react";
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
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const ResultSchema = Yup.object().shape({
  examType: Yup.string().required("পরীক্ষার ধরন নির্বাচন করুন"),
  results: Yup.array()
    .of(
      Yup.object().shape({
        subject: Yup.string().required("বিষয় নির্বাচন করুন"),
        mark: Yup.number()
          .required("নম্বর দিন")
          .min(0, "নম্বর 0 এর চেয়ে কম হতে পারবে না")
          .max(100, "নম্বর 100 এর চেয়ে বেশি হতে পারবে না"),
      })
    )
    .min(1, "কমপক্ষে একটি বিষয় যোগ করুন"),
});

const ResultUploadScreen = () => {

  const { schoolId, studentId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
 
  useEffect(() => {
    if (schoolId) fetchSubjects();
  }, [schoolId]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/school/subject/getSubject?schoolId=${schoolId}`
      );
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
      } else {
        Alert.alert("ত্রুটি", res.data.message || "বিষয়গুলি লোড করতে ব্যর্থ");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("ত্রুটি", "বিষয়গুলি লোড করতে ব্যর্থ");
    } finally {
      setLoading(false);
    }
  };

  const submitToServer = async (values, { resetForm }) => {
    try {
      setLoading(true);
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

      if (res?.data?.success) {
        Alert.alert("সাফল্য", "ফলাফল সফলভাবে আপলোড হয়েছে");
        resetForm();
      } else {
        Alert.alert("ত্রুটি", res?.data?.message || "কিছু ভুল হয়েছে");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("ত্রুটি", err.message || "নেটওয়ার্ক ত্রুটি");
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
          results: [{ subject: "", mark: "", maxMarks: 100, passingMarks: 33 }],
        }}
        validationSchema={ResultSchema}
        onSubmit={submitToServer}
      >
        {({ handleSubmit, values, errors, touched, setFieldValue }) => (
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
                  <Text style={styles.sectionTitle}>📚 বিষয় ও নম্বর</Text>
                  {values.results.map((result, index) => (
                    <View key={index} style={styles.subjectRow}>
                      <View style={{ flex: 1 }}>
                      <Picker
                      selectedValue={result.subject}
                      style={styles.pickerSmall}
                      onValueChange={(val) => {
                        const selected = subjects.find((s) => s.name === val); // match by name
                        setFieldValue(`results[${index}]`, {
                          subject: val, // store name
                          mark: "", // reset mark
                          maxMarks: selected?.maxMarks || 100,
                          passingMarks: selected?.passingMarks || 33,
                        });
                      }}
                    >
                      <Picker.Item label="বিষয় নির্বাচন করুন" value="" />
                      {subjects.map((s, i) => (
                        <Picker.Item key={i} label={s.name} value={s.name} /> // use name here
                      ))}
                    </Picker>


                      </View>

                      <TextInput
                        placeholder="নম্বর"
                        keyboardType="numeric"
                        style={styles.markInput}
                        value={result.mark === "" ? "" : String(result.mark)}
                        onChangeText={(val) => setFieldValue(`results[${index}].mark`, val)}
                      />

                      <TouchableOpacity
                        onPress={() => {
                          if (values.results.length === 1) {
                            setFieldValue(`results[0]`, {
                              subject: "",
                              mark: "",
                              maxMarks: 100,
                              passingMarks: 33,
                            });
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

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => push({ subject: "", mark: "", maxMarks: 100, passingMarks: 33 })}
                  >
                    <Text style={styles.addText}>+ বিষয় যুক্ত করুন</Text>
                  </TouchableOpacity>

                  {typeof errors.results === "string" && (
                    <Text style={styles.error}>{errors.results}</Text>
                  )}
                </View>
              )}
            </FieldArray>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              disabled={loading}
            >
              <Text style={styles.submitText}>{loading ? "আপলোড হচ্ছে..." : "ফলাফল আপলোড করুন"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

export default ResultUploadScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ffff", padding: 15 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#164e84ff", textAlign: "center" },
  error: { color: "red", fontSize: 12, marginTop: 6 },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, color: "#2e3a59" },
  pickerContainer: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, overflow: "hidden", backgroundColor: "#f3f3f3ff" },
  picker: { width: "100%", height: 53, color: "#333" },
  pickerSmall: { width: "100%", height: 53, color: "#333" },
  subjectRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, backgroundColor: "#fefefe", borderRadius: 12, borderWidth: 1, borderColor: "#e1e1e1", padding: 8 },
  markInput: { width: 70, height: 44, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, textAlign: "center", backgroundColor: "#fff", marginHorizontal: 8, fontSize: 16, fontWeight: "600", color: "#333" },
  addBtn: { backgroundColor: "#0567cfff", borderRadius: 12, paddingVertical: 10, alignItems: "center", marginTop: 10 },
  addText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  removeBtn: { backgroundColor: "#dc3545", borderRadius: 50, width: 30, height: 30, alignItems: "center", justifyContent: "center", marginLeft: 8 },
  removeText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  submitBtn: { backgroundColor: "#2f8b58ff", borderRadius: 12, paddingVertical: 12, alignItems: "center", elevation: 3, marginBottom: 30 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 },
});
