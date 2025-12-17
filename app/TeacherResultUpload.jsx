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

/* =======================
   ✅ Validation Schema
======================= */
const ResultSchema = Yup.object().shape({
  examType: Yup.string().required("পরীক্ষার ধরন নির্বাচন করুন"),
  results: Yup.array()
    .of(
      Yup.object().shape({
        subject: Yup.string().required("বিষয় নির্বাচন করুন"),
        mark: Yup.number()
          .transform((value, originalValue) =>
            originalValue === "" ? undefined : Number(originalValue)
          )
          .typeError("নম্বর অবশ্যই সংখ্যা হতে হবে")
          .min(0, "নম্বর 0 এর চেয়ে কম হতে পারবে না")
          .max(100, "নম্বর 100 এর চেয়ে বেশি হতে পারবে না")
          .required("নম্বর দিন"),
      })
    )
    .min(1, "কমপক্ষে একটি বিষয় যোগ করুন"),
});

const EMPTY_RESULT = {
  subject: "",
  mark: "",
  maxMarks: 100,
  passingMarks: 33,
};

const ResultUploadScreen = () => {
  const { schoolId, studentId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  /* =======================
     Fetch Subjects
  ======================= */
  useEffect(() => {
    if (!schoolId) return;
    fetchSubjects();
  }, [schoolId]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/school/subject/getSubject?schoolId=${schoolId}`
      );
      if (res.data?.success) {
        setSubjects(res.data.subjects || []);
      } else {
        Alert.alert("ত্রুটি", "বিষয় লোড করা যায়নি");
      }
    } catch (err) {
      Alert.alert("ত্রুটি", "নেটওয়ার্ক সমস্যা");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     Submit Result
  ======================= */
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
        Alert.alert("সাফল্য", "ফলাফল আপলোড হয়েছে");
        resetForm();
      } else {
        Alert.alert("ত্রুটি", res?.data?.message || "আপলোড ব্যর্থ");
      }
    } catch (err) {
      Alert.alert("ত্রুটি", "সার্ভার সমস্যা");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     UI
  ======================= */
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>ফলাফল আপলোড</Text>

      <Formik
        initialValues={{
          examType: "",
          results: [EMPTY_RESULT],
        }}
        validationSchema={ResultSchema}
        onSubmit={submitToServer}
      >
        {({ values, errors, touched, handleSubmit, setFieldValue }) => (
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
              {touched.examType && errors.examType && (
                <Text style={styles.error}>{errors.examType}</Text>
              )}
            </View>

            {/* Subjects */}
            <FieldArray name="results">
              {({ push, remove }) => (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>📚 বিষয় ও নম্বর</Text>

                  {values.results.map((item, index) => (
                    <View
                      key={`${index}-${item.subject}`}
                      style={styles.subjectRow}
                    >
                      <View style={{ flex: 1 }}>
                        <Picker
                          selectedValue={item.subject || ""}
                          style={styles.pickerSmall}
                          onValueChange={(val) => {
                            const selected = subjects.find(
                              (s) => s.name === val
                            );

                            setFieldValue(`results[${index}].subject`, val);
                            setFieldValue(`results[${index}].mark`, "");
                            setFieldValue(
                              `results[${index}].maxMarks`,
                              selected?.maxMarks ?? 100
                            );
                            setFieldValue(
                              `results[${index}].passingMarks`,
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
                        placeholder="নম্বর"
                        keyboardType="numeric"
                        style={styles.markInput}
                        value={item.mark === "" ? "" : String(item.mark)}
                        onChangeText={(val) =>
                          setFieldValue(`results[${index}].mark`, val)
                        }
                      />

                      <TouchableOpacity
                        style={styles.removeBtn}
                        onPress={() =>
                          values.results.length === 1
                            ? setFieldValue(`results[0]`, EMPTY_RESULT)
                            : remove(index)
                        }
                      >
                        <Text style={styles.removeText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => push(EMPTY_RESULT)}
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
              disabled={loading}
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            >
              <Text style={styles.submitText}>
                {loading ? "আপলোড হচ্ছে..." : "ফলাফল আপলোড করুন"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

export default ResultUploadScreen;

/* =======================
   Styles
======================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5ff", padding: 15 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#164e84" },
  error: { color: "red", fontSize: 12, marginTop: 6 },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, color: "#2e3a59" },
  pickerContainer: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, overflow: "hidden" },
  picker: { height: 52 },
  pickerSmall: { height: 52 },
  subjectRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  markInput: { width: 70, height: 44, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, textAlign: "center", marginHorizontal: 8 },
  addBtn: { backgroundColor: "#0567cf", borderRadius: 12, padding: 10, alignItems: "center" },
  addText: { color: "#fff", fontWeight: "600" },
  removeBtn: { backgroundColor: "#dc3545", width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  removeText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  submitBtn: { backgroundColor: "#2f8b58", borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 30 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
