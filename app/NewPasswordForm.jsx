import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const NewPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
    .required("নতুন পাসওয়ার্ড প্রয়োজন"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "পাসওয়ার্ড মিলছে না")
    .required("কনফার্ম পাসওয়ার্ড প্রয়োজন"),
});

export default function NewPasswordForm() {
   const [loading, setLoading] = useState(false);
  const router = useRouter();
  const {schoolId, phone } = useLocalSearchParams();

  const handleNewPassword = async (values) => {
    setLoading(true)
    try {
      const res = await axios.post(
        `${API_URL}/api/school/newpass`,
        {
          schoolId,   
          phone,     
          password: values.password,
        }
      );

      Alert.alert("সফল", "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      router.push(
        `/PrincipalDashboardScreen?phone=${res.data.school.phone}&schoolId=${res.data.school._id}`
      );
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("ত্রুটি", "কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>নতুন পাসওয়ার্ড সেট করুন</Text>

      <Formik
        initialValues={{ password: "", confirmPassword: "" }}
        validationSchema={NewPasswordSchema}
        onSubmit={handleNewPassword}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.form}>
          <Text>নতুন পাসওয়ার্ড</Text>
            <TextInput
              style={styles.input}
              placeholder="নতুন পাসওয়ার্ড"
              secureTextEntry
              onChangeText={handleChange("password")}
              onBlur={handleBlur("password")}
              value={values.password}
            />
            {errors.password && touched.password && (
              <Text style={styles.error}>{errors.password}</Text>
            )}
           <Text>কনফার্ম পাসওয়ার্ড</Text>
            <TextInput
              style={styles.input}
              placeholder="কনফার্ম পাসওয়ার্ড"
              secureTextEntry
              onChangeText={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              value={values.confirmPassword}
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <Text style={styles.error}>{errors.confirmPassword}</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
               {loading ? <ActivityIndicator color="#fff" /> :<Text style={styles.buttonText}>পাসওয়ার্ড আপডেট করুন</Text>}
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </View>
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
  title: { fontSize: 24, fontWeight: "700", color: "#2a2a8aff", marginBottom: 25, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    color:'#272727ff'
  },
  button: { backgroundColor: "#1d2c8dff", paddingVertical: 14, borderRadius: 12, marginTop: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#EF4444", marginBottom: 8, marginLeft: 5 },
});
