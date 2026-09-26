import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { registerForPushNotificationsAsync } from "../service/registerForPushNotification";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const validationSchema = Yup.object().shape({
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে")
    .required("ফোন নম্বর অবশ্যক"),

  password: Yup.string()
    .required("পিন নম্বর অবশ্যক"),
});

export default function TeacherLoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);

  const router = useRouter();

  // ==========================================
  // CHECK ALREADY LOGGED-IN TEACHER
  // ==========================================
  useEffect(() => {
    const checkStoredTeacher = async () => {
      try {
        const storedTeacher =
          await AsyncStorage.getItem("teacherInfo");

        if (storedTeacher) {
          const { phone, schoolId } = JSON.parse(
            storedTeacher
          );

          if (phone && schoolId) {
            router.replace(
              `/TeacherDashboardScreen?phone=${phone}&schoolId=${schoolId}`
            );
          } else {
            await AsyncStorage.removeItem("teacherInfo");
          }
        }
      } catch (error) {
        console.error(
          "Error reading AsyncStorage:",
          error
        );
      } finally {
        setCheckingStorage(false);
      }
    };

    checkStoredTeacher();
  }, []);

  // ==========================================
  // SAVE TEACHER LOGIN DATA
  // ==========================================
  const saveLoginData = async (teacherInfo) => {
    try {
      await AsyncStorage.setItem(
        "teacherInfo",
        JSON.stringify(teacherInfo)
      );
    } catch (error) {
      console.error(
        "Failed to save login data:",
        error
      );
    }
  };

  // ==========================================
  // TEACHER LOGIN
  // ==========================================
  const onFormSubmit = async (values) => {
    setLoading(true);

    try {
      const payload = {
        phone: values.phone.trim(),
        password: values.password.trim(),
      };

      // ==========================================
      // GET EXPO PUSH TOKEN
      // ==========================================
      try {
        const expoToken =
          await registerForPushNotificationsAsync();

        if (expoToken) {
          payload.expoToken = expoToken;
        }
      } catch (tokenError) {
        console.warn(
          "Push token error:",
          tokenError
        );
      }

      // ==========================================
      // LOGIN API
      // ==========================================
      const res = await axios.post(
        `${API_URL}/api/teacher/login`,
        payload
      );

      if (res.data?.success) {
        const teacher =
          res.data?.teacher ||
          res.data?.data?.teacher;

        if (!teacher) {
          Alert.alert(
            "ত্রুটি",
            "Teacher information পাওয়া যায়নি।"
          );
          return;
        }

        // Save teacher information
        await saveLoginData(teacher);

        // ==========================================
        // DIRECTLY GO TO TEACHER DASHBOARD
        // ==========================================
        router.replace(
          `/TeacherDashboardScreen?phone=${teacher.phone}&schoolId=${teacher.schoolId}`
        );
      } else {
        Alert.alert(
          "লগইন ব্যর্থ",
          res.data?.message ||
            "ফোন নম্বর অথবা পিন সঠিক নয়।"
        );
      }
    } catch (error) {
      console.error(
        "Login error:",
        error?.response?.data || error
      );

      Alert.alert(
        "লগইন ব্যর্থ",
        error?.response?.data?.message ||
          "ফোন নম্বর অথবা পিন সঠিক নয়।"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SHOW NOTHING WHILE CHECKING STORAGE
  // ==========================================
  if (checkingStorage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#6366F1"
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#E0EAFC", "#CFDEF3"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              শিক্ষক লগইন
            </Text>

            <Text style={styles.subtitle}>
              আধুনিক স্কুল ব্যবস্থাপনা
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
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
                <>
                  {/* Phone */}
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#217cde"
                      style={styles.icon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="ফোন নাম্বার"
                      value={values.phone}
                      onChangeText={handleChange(
                        "phone"
                      )}
                      onBlur={handleBlur("phone")}
                      keyboardType="phone-pad"
                      editable={!loading}
                      placeholderTextColor="#A0AEC0"
                      maxLength={11}
                    />
                  </View>

                  {errors.phone &&
                    touched.phone && (
                      <Text style={styles.error}>
                        {errors.phone}
                      </Text>
                    )}

                  {/* Password / PIN */}
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#217cde"
                      style={styles.icon}
                    />

                    <TextInput
                      style={styles.input}
                      placeholder="পিন নাম্বার"
                      value={values.password}
                      onChangeText={handleChange(
                        "password"
                      )}
                      onBlur={handleBlur("password")}
                      keyboardType="numeric"
                      secureTextEntry
                      editable={!loading}
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>

                  {errors.password &&
                    touched.password && (
                      <Text style={styles.error}>
                        {errors.password}
                      </Text>
                    )}

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      loading && {
                        opacity: 0.7,
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <View style={styles.loadingButton}>
                        <ActivityIndicator color="#fff" />
                        <Text
                          style={
                            styles.submitText
                          }
                        >
                          লগইন হচ্ছে...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={styles.submitText}
                      >
                        লগইন করুন
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0EAFC",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
  },

  subtitle: {
    color: "#475569",
    fontSize: 14,
    marginTop: 2,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 25,
    borderRadius: 20,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 6,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,

    paddingHorizontal: 10,
    marginBottom: 15,

    backgroundColor: "#F8FAFC",
  },

  icon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: 45,
    color: "#111827",
  },

  submitButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
    alignItems: "center",
  },

  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  error: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 6,
  },
});