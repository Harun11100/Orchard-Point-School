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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

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
                  <Picker.Item label="টিউটোরিয়াল" value="টিউটোরিয়াল" />
                  <Picker.Item label="বার্ষিক" value="বার্ষিক" />
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
                    style={styles.uploadButton}
                    onPress={handleSubmit}
                     disabled={loading}
                  >
                    <LinearGradient colors={["#46af81", "#0f6943"]} style={styles.uploadInner}>
                      <MaterialIcons name="add" size={22} color="#fff" />
                      <Text style={styles.uploadText}>
                      {loading ? "আপলোড হচ্ছে..." : "ফলাফল আপলোড করুন"}
                      </Text>
                    </LinearGradient>
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
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
    paddingHorizontal: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 18,
    color: "#1f2937",
  },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },

  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    backgroundColor: "#f9fafb",
  },

  picker: {
    height: 50,
  },

  pickerSmall: {
    height: 53,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
  },

  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  markInput: {
    width: 80,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 16,
  },

  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },

  removeText: {
    fontSize: 22,
    color: "#b91c1c",
    fontWeight: "700",
    marginTop: -2,
  },

  addBtn: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#ecf2fdff",
    alignItems: "center",
  },

  addText: {
    color: "#1d63aeff",
    fontWeight: "600",
    fontSize: 15,
  },

  uploadButton: {
    marginTop: 24,
    marginBottom: 30,
  },

  uploadInner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },

  uploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  error: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 4,
  },
});
