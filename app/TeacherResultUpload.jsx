import React, { useEffect, useState } from "react";
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
import { Formik } from "formik";
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
  results: Yup.array().of(
    Yup.object().shape({
      subject: Yup.string().required(),
      mark: Yup.number()
        .transform((_, v) => (v === "" ? undefined : Number(v)))
        .typeError("নম্বর সংখ্যা হতে হবে")
        .min(0)
        .max(100)
        .required("নম্বর দিন"),
    })
  ),
});

/* ================= Helper ================= */
const mapSubjectToResult = (s) => ({
  subject: s.name,
  mark: "",
  maxMarks: s.maxMarks ?? 100,
  passingMarks: s.passingMarks ?? 33,
});

export default function ResultUploadScreen() {
  const { schoolId, studentId, classId } = useLocalSearchParams();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/school/subject/getSubject?classId=${classId}`
        );

        if (res.data?.success) {
          setSubjects(res.data.subjects || []);
        } else {
          Alert.alert("ত্রুটি", "বিষয় লোড করা যায়নি");
        }
      } catch {
        Alert.alert("ত্রুটি", "নেটওয়ার্ক সমস্যা");
      } finally {
        setLoading(false);
      }
    };

    if (classId) fetchSubjects();
  }, [classId]);

  const submitResult = async (values) => {
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
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8 }}>বিষয় লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ফলাফল আপলোড</Text>
        <Text style={styles.headerSubtitle}>
          পরীক্ষার ধরন নির্বাচন করে নম্বর দিন
        </Text>
      </View>

      <Formik
        enableReinitialize
        initialValues={{
          examType: "",
          results: subjects.map(mapSubjectToResult),
        }}
        validationSchema={ResultSchema}
        onSubmit={submitResult}
      >
        {({ values, handleSubmit, setFieldValue }) => (
          <>
            {/* Exam Type */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🧾 পরীক্ষার ধরন</Text>
              <View style={styles.pickerWrap}>
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
            </View>

            {/* Subjects */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📚 বিষয় ও নম্বর</Text>

              {values.results.map((item, index) => (
                <View key={index} style={styles.subjectItem}>
                  <Text style={styles.subjectText}>{item.subject}</Text>

                  <TextInput
                    style={styles.markInput}
                    keyboardType="numeric"
                    placeholder="নম্বর"
                    placeholderTextColor="#94a3b8"
                    value={item.mark}
                    onChangeText={(v) =>
                      setFieldValue(`results.${index}.mark`, v)
                    }
                  />
                </View>
              ))}
            </View>

            {/* Submit */}
         <TouchableOpacity
  activeOpacity={0.85}
  onPress={handleSubmit}
  disabled={submitting}
  style={{ marginBottom: 30, marginHorizontal: 16 }}
>
  <LinearGradient
    colors={
      submitting
        ? ["#94a3b8", "#64748b"]
        : ["#22c55e", "#16a34a"]
    }
    style={[
      styles.submitBtn,
      submitting && { opacity: 0.85 },
    ]}
  >
    <MaterialIcons
      name={submitting ? "hourglass-top" : "cloud-upload"}
      size={20}
      color="#fff"
    />

    <Text style={styles.submitText}>
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

/* ================= Modern Styles ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },

  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
header: {
  paddingHorizontal: 16,
  paddingVertical: 18,
  backgroundColor: "#ffffff",
  borderBottomWidth: 1,
  borderBottomColor: "#e5e7eb",
},

headerTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#0f172a",
},

headerSubtitle: {
  marginTop: 4,
  fontSize: 13,
  color: "#64748b",
},


  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#0f172a",
  },

  pickerWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },

  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },

  subjectText: {
    flex: 1,
    fontWeight: "600",
    color: "#1e3a8a",
  },

  markInput: {
    width: 80,
    height: 38,
    borderRadius: 999,
    backgroundColor: "#f8fafc",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
submitBtn: {
  paddingVertical: 16,
  borderRadius: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,

  // modern depth
  shadowColor: "#16a34a",
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 5,
},

submitText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "700",
  letterSpacing: 0.3,
},

});
