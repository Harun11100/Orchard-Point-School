import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig.extra.API_URL;

const NewPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
    .required("নতুন পাসওয়ার্ড প্রয়োজন"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "পাসওয়ার্ড মিলছে না")
    .required("কনফার্ম পাসওয়ার্ড প্রয়োজন"),
});

export default function TeacherNewPasswordForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { teacherId, phone} = useLocalSearchParams();
  
  const handleNewPassword = async (values) => {

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/teacher/resetPassword`, {
        teacherId,
        password: values.password,
      });

      Alert.alert("সফল", "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      // router.push(
      //   `/TeacherDashboardScreen?phone=${phone}&schoolId=${res.data.schoolId}`
      // );
    } catch (error) {
      console.error("Password reset error:", error);
      Alert.alert("ত্রুটি", "কিছু সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>🔐 নতুন পাসওয়ার্ড সেট করুন</Text>

        <Formik
          initialValues={{ password: "", confirmPassword: "" }}
          validationSchema={NewPasswordSchema}
          onSubmit={handleNewPassword}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              {/* Password */}
              <Text style={styles.label}>নতুন পাসওয়ার্ড</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color="#0b448aff"
                />
                <TextInput
                  style={styles.input}
                  placeholder="নতুন পাসওয়ার্ড লিখুন"
                  secureTextEntry
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  value={values.password}
                />
              </View>
              {errors.password && touched.password && (
                <Text style={styles.error}>{errors.password}</Text>
              )}

              {/* Confirm Password */}
              <Text style={styles.label}>কনফার্ম পাসওয়ার্ড</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color="#054f90ff"
                />
                <TextInput
                  style={styles.input}
                  placeholder="আবার পাসওয়ার্ড লিখুন"
                  secureTextEntry
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  value={values.confirmPassword}
                />
              </View>
              {errors.confirmPassword && touched.confirmPassword && (
                <Text style={styles.error}>{errors.confirmPassword}</Text>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>পাসওয়ার্ড আপডেট করুন</Text>
                )}
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
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0849a9ff",
    textAlign: "center",
    marginBottom: 30,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 6,
    color: "#374151",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: "#f9fafb",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
    color: "#111827",
  },
  button: {
    backgroundColor: "#0d60d4ff",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  error: {
    color: "#dc2626",
    marginBottom: 8,
    marginLeft: 5,
    fontSize: 13,
  },
});
