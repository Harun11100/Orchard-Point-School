import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const validationSchema = Yup.object().shape({
  name: Yup.string().required("শিক্ষকের নাম অবশ্যক"),
  email: Yup.string().email("সঠিক ইমেইল লিখুন").required("ইমেইল অবশ্যক"),
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে")
    .required("ফোন নম্বর অবশ্যক"),
  password: Yup.string()
    .min(6, "লগইন পিন কমপক্ষে ৬ অক্ষর হতে হবে")
    .required(" লগইন পিন অবশ্যক"),
  subjects: Yup.string().required("অন্তত একটি বিষয় অবশ্যক"),
  role: Yup.string().required("দায়িত্ব অবশ্যক"),
});

export default function AddTeacherScreen() {
  const { schoolId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values, resetForm) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        subjects: values.subjects.split(",").map((s) => s.trim()),
        schoolId,
      };

      const res = await axios.post(`${API_URL}/api/school/createTeacher`, payload);

      if (res.data.success) {
        Alert.alert("সফল", "শিক্ষক সফলভাবে যুক্ত হয়েছে");
        resetForm();
      } else {
        Alert.alert("ত্রুটি", res.data.message || "শিক্ষক যুক্ত করতে সমস্যা হয়েছে");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("ত্রুটি", "কিছু সমস্যা হয়েছে, পুনরায় চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>শিক্ষক যুক্ত করুন</Text>
        <Formik
          initialValues={{
            name: "",
            email: "",
            phone: "",
            password: "",
            subjects: "",
            role: "",
            classTeacher: "",
            gender: "male",
            address: "",
            bloodGroup: "",
            nid: "",
            userName: "",
          }}
          validationSchema={validationSchema}
          onSubmit={(values, { resetForm }) => handleSubmit(values, resetForm)}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              {[
                { field: "name", label: "শিক্ষকের নাম", placeholder: "নাম লিখুন" },
                { field: "email", label: "ইমেইল", placeholder: "example@mail.com" },
                { field: "phone", label: "ফোন নম্বর", placeholder: "01XXXXXXXXX" },
                { field: "password", label: "লগইন পিন ", placeholder: "লগইন পিন লিখুন" },
                { field: "subjects", label: "বিষয় (কমা দ্বারা আলাদা)", placeholder: "Math, Science" },
                { field: "role", label: "দায়িত্ব", placeholder: "যেমন: শিক্ষক" },
                { field: "classTeacher", label: "শ্রেণী শিক্ষক", placeholder: "যেমন: ৫ম শ্রেণী" },
                { field: "gender", label: "লিঙ্গ", placeholder: "male/female" },
                { field: "address", label: "ঠিকানা", placeholder: "ঠিকানা লিখুন" },
                { field: "bloodGroup", label: "রক্তের গ্রুপ", placeholder: "যেমন: A+" },
                { field: "nid", label: "জাতীয় পরিচয়পত্র নম্বর (Optional)", placeholder: "জাতীয় পরিচয়পত্র নম্বর" },
                { field: "userName", label: "ইউজারনেম", placeholder: "যেমন ঃ রহিম১২৩ " },
              ].map(({ field, label, placeholder }, idx) => (
                <View key={idx} style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={'#ababab'}
                    value={values[field]}
                    onChangeText={handleChange(field)}
                    onBlur={handleBlur(field)}
                  />
                  {errors[field] && touched[field] && <Text style={styles.error}>{errors[field]}</Text>}
                </View>
              ))}

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                <LinearGradient colors={["#4f46e5", "#6366f1"]} style={styles.gradientButton}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>যুক্ত করুন</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f9faff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1E3A8A",
    alignSelf: "center",
  },
  form: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 6, color: "#1E3A8A" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#333",
  },
  error: { fontSize: 12, color: "#f44336", marginTop: 4 },
  submitButton: { marginTop: 20, borderRadius: 12, overflow: "hidden", marginBottom: 60 },
  gradientButton: { paddingVertical: 14, alignItems: "center", borderRadius: 12 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
