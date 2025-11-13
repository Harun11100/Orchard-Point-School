import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
// ভ্যালিডেশন স্কিমা
const ResetPasswordSchema = Yup.object().shape({
  phone: Yup.string()
    .matches(/^[0-9]{10,15}$/, "ফোন নাম্বার সঠিক নয়")
    .required("ফোন নাম্বার প্রয়োজন"),
  email: Yup.string()
    .email("সঠিক ইমেইল লিখুন")
    .required("ইমেইল প্রয়োজন"),
});

export default function ResetPasswordForm() {
 const [loading, setLoading] = useState(false);
 
  const handleReset = async(values) => {
   setLoading(true);
    
     try {

      const res = await axios.post(
        `${API_URL}/api/school/resetpass`,
        values
      );

     Alert.alert("সফল", "রিসেট অনুরোধ সফলভাবে জমা দেওয়া হয়েছে!");
      router.push(
        `/NewPasswordForm?schoolId=${res.data.school._id}&phone=${res.data.school.phone}`
      );
    } catch (error) {
      console.error("Login error:", error.response || error);
      Alert.alert(
        "ত্রুটি",
        error.response?.data?.message || "কিছু ভুল হয়েছে"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#f9faff", "#eef2ff"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
      >
     <ScrollView 
     contentContainerStyle={styles.container}
     showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>পাসওয়ার্ড রিসেট</Text>

      <Formik
        initialValues={{ phone: "", email: "", secretName: "" }}
        validationSchema={ResetPasswordSchema}
        onSubmit={handleReset}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
            {/* ফোন নাম্বার */}
            <Text style={styles.label}>ফোন নাম্বার</Text>
            <TextInput
              style={styles.input}
              placeholder="ফোন নাম্বার"
              keyboardType="phone-pad"
              onChangeText={handleChange("phone")}
              onBlur={handleBlur("phone")}
              value={values.phone}
            />
            {errors.phone && touched.phone && <Text style={styles.error}>{errors.phone}</Text>}

            {/* ইমেইল */}
            <Text style={styles.label} >ইমেইল</Text>
            <TextInput
              style={styles.input}
              placeholder="ইমেইল (Gmail)"
              keyboardType="email-address"
              onChangeText={handleChange("email")}
              onBlur={handleBlur("email")}
              value={values.email}
              autoCapitalize="none"
            />
            {errors.email && touched.email && <Text style={styles.error}>{errors.email}</Text>}

            {/* সাবমিট বাটন */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
               {loading ? <ActivityIndicator color="#ffffff" /> :<Text style={styles.buttonText}>পাসওয়ার্ড রিসেট করুন</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
 label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
    color: "#333",
  },
   title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3139a2ff",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#2f2196ff",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  error: {
    color: "#EF4444",
    marginBottom: 8,
    marginLeft: 5,
  },
});
