import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import Constants from "expo-constants";
import { useLocalSearchParams } from "expo-router";

const API_URL = Constants.expoConfig.extra.API_URL;

// ✅ Yup ভ্যালিডেশন স্কিমা
const subjectSchema = Yup.object().shape({
  name: Yup.string().required("বিষয়ের নাম প্রয়োজন"),
  code: Yup.string().required("বিষয় কোড প্রয়োজন"),
  creditHours: Yup.number()
    .typeError("ক্রেডিট ঘণ্টা সংখ্যা হতে হবে")
    .optional(),
  maxMarks: Yup.number()
    .typeError("সর্বোচ্চ নম্বর সংখ্যা হতে হবে")
    .optional(),
  passingMarks: Yup.number()
    .typeError("পাশ নম্বর সংখ্যা হতে হবে")
    .optional(),
});

export default function CreateSubjectForm() {
  const [loading, setLoading] = useState(false);
    const {schoolId,classId} = useLocalSearchParams();

  const handleSubmitForm = async (values, { resetForm }) => {
    setLoading(true);
    try {
      const payload = { ...values, schoolId,classId };
    
      const res = await axios.post(`${API_URL}/api/school/subject/createSubject`, payload);

      if (res.data.success) {
        Alert.alert("✅ সফল!", "নতুন বিষয় সফলভাবে তৈরি হয়েছে!");
        resetForm();
      } else {
        Alert.alert("⚠️ ত্রুটি", res.data.message || "কিছু ভুল হয়েছে");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("ত্রুটি", "সার্ভার সংযোগ ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>নতুন বিষয় তৈরি করুন</Text>
        </View>

        <Formik
          initialValues={{
            name: "",
            code: "",
            creditHours: "",
            maxMarks: 100,
            passingMarks: 33,
          }}
          validationSchema={subjectSchema}
          onSubmit={handleSubmitForm}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <Text style={styles.label}>বিষয়ের নাম</Text>
              <TextInput
                style={styles.input}
                placeholder="বিষয়ের নাম লিখুন"
                value={values.name}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
              />
              {touched.name && errors.name && <Text style={styles.error}>{errors.name}</Text>}

              <Text style={styles.label}>বিষয় কোড</Text>
              <TextInput
                style={styles.input}
                placeholder="বিষয় কোড লিখুন"
                autoCapitalize="characters"
                value={values.code}
                onChangeText={(text) => handleChange("code")(text.toUpperCase())}
                onBlur={handleBlur("code")}
              />
              {touched.code && errors.code && <Text style={styles.error}>{errors.code}</Text>}

              <Text style={styles.label}>ক্রেডিট ঘণ্টা (optional)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={values.creditHours}
                onChangeText={handleChange("creditHours")}
                onBlur={handleBlur("creditHours")}
              />
              {touched.creditHours && errors.creditHours && (
                <Text style={styles.error}>{errors.creditHours}</Text>
              )}

              <Text style={styles.label}>সর্বোচ্চ নম্বর</Text>
              <TextInput
                style={styles.input}
                // placeholder="সর্বোচ্চ নম্বর লিখুন"
                keyboardType="numeric"
                value={values.maxMarks}
                onChangeText={handleChange("maxMarks")}
                onBlur={handleBlur("maxMarks")}
              />
              {touched.maxMarks && errors.maxMarks && (
                <Text style={styles.error}>{errors.maxMarks}</Text>
              )}

              <Text style={styles.label}>পাশ নম্বর</Text>
              <TextInput
                style={styles.input}
                // placeholder="পাশ নম্বর লিখুন"
                keyboardType="numeric"
                value={values.passingMarks}
                onChangeText={handleChange("passingMarks")}
                onBlur={handleBlur("passingMarks")}
              />
              {touched.passingMarks && errors.passingMarks && (
                <Text style={styles.error}>{errors.passingMarks}</Text>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#8693f6ff", "#1139b9ff"]}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>বিষয় তৈরি করুন</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ✅ স্টাইল
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafeff" },
  header: { paddingVertical: 10, alignItems: "center" },
  headerText: { color: "#2d499dff", fontSize: 22, fontWeight: "700" },
  form: { marginTop: 20, paddingHorizontal: 20 },
  label: { fontSize: 15, color: "#1E3A8A", fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  error: { color: "red", fontSize: 13, marginBottom: 10 },
  submitButton: { marginTop: 20, borderRadius: 12, overflow: "hidden", marginBottom: 60 },
  gradientButton: { paddingVertical: 14, alignItems: "center", borderRadius: 12 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
