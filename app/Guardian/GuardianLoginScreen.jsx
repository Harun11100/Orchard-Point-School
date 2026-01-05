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
  Image,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { registerForPushNotificationsAsync } from "../../service/registerForPushNotification";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const validationSchema = Yup.object().shape({
  guardianPhone: Yup.string()
    .matches(/^[0-9]{11}$/, "Phone number must be 11 digits")
    .required("Phone number is required"),
  className: Yup.string().required("Class selection is required"),
  rollNumber: Yup.string().required("Roll number is required"),
});

const classes = [
  "প্লে-শ্রেণী", "নার্সারি-শ্রেণী", "প্রথম শ্রেণী", "দ্বিতীয় শ্রেণী",
  "তৃতীয় শ্রেণী", "চতুর্থ শ্রেণী", "পঞ্চম শ্রেণী", "ষষ্ঠ শ্রেণী",
  "সপ্তম শ্রেণী", "অষ্টম শ্রেণী", "নবম শ্রেণী", "দশম শ্রেণী"
];
const sections = ["A", "B", "C"];

export default function StudentLoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Auto-login if stored credentials exist
  useEffect(() => {
    const checkSavedLogin = async () => {
      try {
        const savedData = await SecureStore.getItemAsync("guardianLogin");
        if (savedData) {
          const user = JSON.parse(savedData);
          router.replace(
            `/GuardianDashboardScreen?schoolId=${user.schoolId}&classId=${user.classId}&studentId=${user.studentId}&phone=${user.phone}`
          );
        }
      } catch (err) {
        console.error("Auto-login check failed:", err);
      }
    };
    checkSavedLogin();
  }, []);

  const onFormSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        guardianPhone: values.guardianPhone.trim(),
        rollNumber: values.rollNumber.trim(),
        className: values.className,
        section: values.section,
      };

      // Check Internet Connection
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        Alert.alert("ত্রুটি", "ইন্টারনেট সংযোগ নেই। দয়া করে সংযুক্ত হোন।");
        return;
      }

      // Push Notification Token
      try {
        const expoToken = await registerForPushNotificationsAsync();
        if (expoToken) payload.expoToken = expoToken;
      } catch (tokenError) {
        console.warn("Push token error:", tokenError);
      }



      const res = await axios.post(`${API_URL}/api/guardian/login`, payload);
      const student = res.data?.student;

      if (student) {
        // Save login data locally
        await SecureStore.setItemAsync(
          "guardianLogin",
          JSON.stringify({
            schoolId: student.schoolId,
            classId: student.classId,
            studentId: student.studentId,
            phone: student.phone,
          })
        );

        router.replace(
          `/GuardianDashboardScreen?schoolId=${student.schoolId}&classId=${student.classId}&studentId=${student.studentId}&phone=${student.phone}`
        );
      } else {
        Alert.alert("ত্রুটি", "ভুল ফোন নম্বর বা রোল নম্বর।");
      }
    } catch (error) {
      console.error("Login error:", error?.response?.data || error.message);
      Alert.alert("ত্রুটি", "কিছু সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };
  return (
    <LinearGradient colors={["#E0EAFC", "#CFDEF3"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/icons/logo.png")}
              style={styles.logo}
            />
          <Text style={styles.title}> অভিভাবক লগইন</Text>
          <Text style={styles.subtitle}> আধুনিক স্কুল ব্যবস্থাপনা</Text>

          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Formik
              initialValues={{ guardianPhone: "", rollNumber: "", className: "", section: "" }}
              validationSchema={validationSchema}
              onSubmit={onFormSubmit}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                <>
                  {/* Phone Number */}
                   <Text style={styles.label}>অভিভাবকের মোবাইল নম্বর</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="call-outline" size={20} color="#6366F1" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="মোবাইল নম্বর লিখুন"
                      value={values.guardianPhone}
                      onChangeText={handleChange("guardianPhone")}
                      onBlur={handleBlur("guardianPhone")}
                      keyboardType="phone-pad"
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                  {errors.guardianPhone && touched.guardianPhone && (
                    <Text style={styles.error}>{errors.guardianPhone}</Text>
                  )}

                  {/* Class Selector */}
                  <Text style={styles.label}>শ্রেণী নির্বাচন করুন</Text>
                  <View style={styles.selectorContainer}>
                    {classes.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          styles.selectorButton,
                          values.className === c && styles.selectedButton,
                        ]}
                        onPress={() => setFieldValue("className", c)}
                      >
                        <Text
                          style={[
                            styles.selectorText,
                            values.className === c && styles.selectedText,
                          ]}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Section Selector */}
                  <Text style={styles.label}>সেকশন নির্বাচন করুন (যদি থাকে)</Text>
                  <View style={styles.selectorContainer}>
                    {sections.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.selectorButton,
                          values.section === s && styles.selectedButton,
                        ]}
                        onPress={() => setFieldValue("section", s)}
                      >
                        <Text
                          style={[
                            styles.selectorText,
                            values.section === s && styles.selectedText,
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Roll Number */}
                  <Text style={styles.label}>রোল নম্বর</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6366F1" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="রোল নম্বর লিখুন"
                      value={values.rollNumber}
                      onChangeText={handleChange("rollNumber")}
                      onBlur={handleBlur("rollNumber")}
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                  {errors.rollNumber && touched.rollNumber && (
                    <Text style={styles.error}>{errors.rollNumber}</Text>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                    <LinearGradient colors={["#6366F1", "#4F46E5"]} style={{ padding: 14, borderRadius: 12, alignItems: "center" }}>
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>লগইন</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </Formik>
          </View>

          <Text style={styles.footerText}>
          📚 অভিভাবকের জন্য সহজ লগইন অভিজ্ঞতা
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f6f9ffff" },
  container: { flexGrow: 1, justifyContent: "center", padding: 20 },
  header: { alignItems: "center", marginBottom: 10 },
  logo: { width: 120, height: 120, marginBottom: 8, resizeMode: "contain" },
  title: { fontSize: 24, fontWeight: "700", color: "#273ca5ff" },
  subtitle: { color: "#475569", fontSize: 14, marginTop: 2 },
  card: { backgroundColor: "rgba(246, 246, 246, 0.9)", padding:25, borderRadius: 20},
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#aab5c3ff", borderRadius: 12, paddingHorizontal: 10, marginBottom: 15, backgroundColor: "#F8FAFC" },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 45, color: "#111827" },
  selectorContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 15 },
  selectorButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#CBD5E1" },
  selectedButton: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  selectorText: { color: "#111827" },
  selectedText: { color: "#fff", fontWeight: "600" },
  submitButton: { marginTop: 10, borderRadius: 12, overflow: "hidden" },
  error: { color: "#DC2626", fontSize: 13, marginBottom: 10, marginLeft: 6 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  footerText: { textAlign: "center", color: "#475569", fontSize: 13, marginTop: 30,marginBottom:30 },
});
