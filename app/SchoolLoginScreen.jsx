import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

// =====================================================
// API URL
// =====================================================

const API_URL = Constants.expoConfig?.extra?.API_URL;

// =====================================================
// Validation
// =====================================================

const validationSchema = Yup.object().shape({
  phone: Yup.string()
    .matches(
      /^[0-9]{11}$/,
      "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে"
    )
    .required("ফোন নম্বর আবশ্যক"),

  password: Yup.string()
    .required("পাসওয়ার্ড আবশ্যক"),
});

// =====================================================
// Screen
// =====================================================

export default function SchoolLoginScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // ===================================================
  // Auto Login
  // ===================================================

  useEffect(() => {
    const checkStoredSchool = async () => {
      try {
        const storedSchool =
          await AsyncStorage.getItem("schoolDetails");

        const authToken =
          await SecureStore.getItemAsync("auth_token");

        if (storedSchool && authToken) {
          const school = JSON.parse(storedSchool);

          router.replace(
            `/PrincipalDashboardScreen?phone=${encodeURIComponent(
              school.phone
            )}&schoolId=${encodeURIComponent(
              school.schoolId
            )}`
          );

          return;
        }
      } catch (error) {
        console.error(
          "Error reading stored school:",
          error
        );
      } finally {
        setCheckingStorage(false);
      }
    };

    checkStoredSchool();
  }, []);

  // ===================================================
  // Login (Directly completes login & saves auth)
  // ===================================================

  const onFormSubmit = async (values) => {
    if (!API_URL) {
      Alert.alert(
        "Configuration Error",
        "API URL পাওয়া যায়নি। app.config.js অথবা app.json চেক করুন।"
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        phone: values.phone.trim(),
        password: values.password,
      };

      console.log("School login request:", {
        phone: payload.phone,
      });

      const response = await axios.post(
        `${API_URL}/api/school/login`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success === false) {
        Alert.alert(
          "Login Failed",
          response.data?.message ||
            "লগইন ব্যর্থ হয়েছে।"
        );
        return;
      }

      if (!response.data?.school) {
        Alert.alert(
          "Login Failed",
          "স্কুলের তথ্য পাওয়া যায়নি।"
        );
        return;
      }

      const schoolData = response.data.school;

      // -----------------------------------------------
      // Store JWT securely
      // -----------------------------------------------

      if (response.data?.token) {
        await SecureStore.setItemAsync(
          "auth_token",
          response.data.token
        );
      }

      // -----------------------------------------------
      // Store school information
      // -----------------------------------------------

      await AsyncStorage.setItem(
        "schoolDetails",
        JSON.stringify(schoolData)
      );

      // -----------------------------------------------
      // Navigate to dashboard
      // -----------------------------------------------

      router.replace(
        `/PrincipalDashboardScreen?phone=${encodeURIComponent(
          schoolData.phone
        )}&schoolId=${encodeURIComponent(
          schoolData.schoolId
        )}`
      );

    } catch (error) {
      console.error(
        "School login error:",
        error?.response?.data || error
      );

      const message =
        error?.response?.data?.message ||
        "লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।";

      Alert.alert(
        "Login Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // Loading Stored Login
  // ===================================================

  if (checkingStorage) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#6366F1"
        />

        <Text style={styles.loadingText}>
          অপেক্ষা করুন...
        </Text>
      </View>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <LinearGradient
      colors={["#f9faff", "#eef2ff"]}
      style={styles.screen}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ========================================= */}
          {/* LOGIN TITLE */}
          {/* ========================================= */}

          <Text style={styles.title}>
            প্রধান শিক্ষক লগইন
          </Text>

          <Text style={styles.subtitle}>
            আপনার স্কুলের অ্যাকাউন্টে লগইন করুন
          </Text>

          {/* ========================================= */}
          {/* FORM */}
          {/* ========================================= */}

          <Formik
            initialValues={{
              phone: "",
              password: "",
            }}
            validationSchema={validationSchema}
            onSubmit={onFormSubmit}
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

                {/* ================================= */}
                {/* Phone */}
                {/* ================================= */}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    ফোন নাম্বার
                  </Text>

                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#6B7280"
                      style={styles.inputIcon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="01XXXXXXXXX"
                      placeholderTextColor="#999"
                      value={values.phone}
                      onChangeText={handleChange(
                        "phone"
                      )}
                      onBlur={handleBlur("phone")}
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>

                  {errors.phone &&
                    touched.phone && (
                      <Text style={styles.error}>
                        {errors.phone}
                      </Text>
                    )}
                </View>

                {/* ================================= */}
                {/* Password */}
                {/* ================================= */}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    পাসওয়ার্ড
                  </Text>

                  <View style={styles.passwordContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6B7280"
                      style={styles.passwordIcon}
                    />

                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                      ]}
                      placeholder="পাসওয়ার্ড লিখুন"
                      placeholderTextColor="#999"
                      value={values.password}
                      onChangeText={handleChange(
                        "password"
                      )}
                      onBlur={handleBlur("password")}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={
                          showPassword
                            ? "eye-off"
                            : "eye"
                        }
                        size={22}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>

                  {errors.password &&
                    touched.password && (
                      <Text style={styles.error}>
                        {errors.password}
                      </Text>
                    )}
                </View>

                {/* ================================= */}
                {/* Login Button */}
                {/* ================================= */}

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading &&
                      styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator
                        color="#fff"
                      />

                      <Text
                        style={styles.submitText}
                      >
                        লগইন হচ্ছে...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.submitText}>
                      লগইন করুন
                    </Text>
                  )}
                </TouchableOpacity>

                {/* ================================= */}
                {/* Forgot Password */}
                {/* ================================= */}

                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      "/ResetPasswordForm"
                    )
                  }
                  style={styles.resetButton}
                >
                  <Text style={styles.resetText}>
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Text>
                </TouchableOpacity>

                {/* ================================= */}
                {/* Register */}
                {/* ================================= */}

                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      "/SchoolRegisterScreen"
                    )
                  }
                  style={styles.registerButton}
                >
                  <Text style={styles.registerText}>
                    নতুন স্কুল? নিবন্ধন করুন
                  </Text>
                </TouchableOpacity>

              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F9FC",
  },

  loadingText: {
    marginTop: 10,
    color: "#6366F1",
    fontSize: 14,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#17427F",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
  },

  form: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 7,
    color: "#333",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },

  inputIcon: {
    marginLeft: 13,
  },

  input: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#333",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
  },

  passwordIcon: {
    marginLeft: 13,
  },

  passwordInput: {
    paddingRight: 45,
  },

  eyeIcon: {
    position: "absolute",
    right: 14,
    padding: 5,
  },

  error: {
    color: "#EF4444",
    fontSize: 13,
    marginTop: 5,
  },

  submitButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#4F46E5",
  },

  disabledButton: {
    opacity: 0.65,
  },

  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  resetButton: {
    marginTop: 20,
    alignItems: "center",
  },

  resetText: {
    color: "#323C89",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
  },

  registerButton: {
    marginTop: 16,
    alignItems: "center",
  },

  registerText: {
    color: "#225691",
    fontWeight: "600",
    fontSize: 14,
  },
});