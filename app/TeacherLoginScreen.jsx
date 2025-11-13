
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
  Modal,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import { LinearGradient } from "expo-linear-gradient";
import { registerForPushNotificationsAsync } from "../service/registerForPushNotification";
import { Ionicons } from "@expo/vector-icons";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const validationSchema = Yup.object().shape({
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে")
    .required("ফোন নম্বর অবশ্যক"),
  password: Yup.string().required("পিন নম্বর অবশ্যক"),
});

export default function TeacherLoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [teacherInfo,setTeacherInfo]=useState(null)
  const router = useRouter();

  useEffect(() => {
    const checkStoredTeacher = async () => {
      try {
        const storedTeacher = await AsyncStorage.getItem("teacherInfo");
        if (storedTeacher) {
          const { phone,schoolId } = JSON.parse(storedTeacher);
          router.push(`/TeacherDashboardScreen?phone=${phone}&schoolId=${schoolId}`);
        }
      } catch (error) {
        console.error("Error reading AsyncStorage:", error);
      } finally {
        setCheckingStorage(false);
      }
    };
    checkStoredTeacher();
  }, []);

  const saveLoginData = async (teacherInfo) => {
    try {
      await AsyncStorage.setItem(
        "teacherInfo",
        JSON.stringify(teacherInfo)
      );
    } catch (error) {
      console.error("Failed to save login data:", error);
    }
  };

const onFormSubmit = async (values) => {
  setLoading(true);
  try {
    const payload = {
      phone: values.phone.trim(),
      password: values.password.trim(),
    };


      try {
        const expoToken = await registerForPushNotificationsAsync();
        if (expoToken) payload.expoToken = expoToken;
      } catch (tokenError) {
        console.warn("Push token error:", tokenError);
      }

      const res = await axios.post(
        `${API_URL}/api/teacher/login`,
        payload
      );
       

      const teacher = res.data?.teacher || res.data?.data?.teacher;
           setTeacherInfo(teacher)
           setOtpModalVisible(true);  

  } catch (error) {
    console.error("Login error:", error);
    Alert.alert("দুঃখিত", "কিছু সমস্যা হয়েছে। পুনারায় চেষ্টা করুন।");
  } finally {
    setLoading(false);
  }
};
const verifyLoginOtp = async () => {
  if (!otp.trim()) {
    Alert.alert("ত্রুটি", "অনুগ্রহ করে কোড লিখুন।");
    return;
  }
  
  setVerifying(true);
  try {
    const response = await axios.post(
      `${API_URL}/api/teacher/verifyLoginOtp`,
      { schoolId:teacherInfo.schoolId,teacherId:teacherInfo._id, loginOTP:otp }
    );
    if (response.data.success) {
         await saveLoginData(teacherInfo);
        router.replace(`/TeacherDashboardScreen?phone=${teacherInfo.phone}&schoolId=${teacherInfo.schoolId}`);
        setOtpModalVisible(false)
  
    } else {
      Alert.alert("❌ ভুল কোড", "কোডটি সঠিক নয়। আবার চেষ্টা করুন।");
    }

  } catch (err) {
    console.error("Error verifying OTP:", err);
    Alert.alert("ত্রুটি", "কোড যাচাই করতে ব্যর্থ হয়েছে।");
  } finally {
    setVerifying(false);
  }
  };
  
  return (
    <LinearGradient colors={["#E0EAFC", "#CFDEF3"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ✅ Modal outside ScrollView */}
        <Modal visible={otpModalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>ভেরিফিকেশন কোড দিন</Text>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                maxLength={6}
                placeholder="৬ সংখ্যার কোড লিখুন"
                placeholderTextColor="#A0AEC0"
              />
              <TouchableOpacity
                style={[styles.verifyButton, verifying && { opacity: 0.6 }]}
                onPress={verifyLoginOtp}
                disabled={verifying}
              >
                <LinearGradient
                  colors={["#3e5292ff", "#1d66edff"]}
                  style={styles.verifyButtonGradient}
                >
                  <Text style={styles.verifyButtonText}>
                    {verifying ? "যাচাই হচ্ছে..." : "যাচাই করুন"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setOtpModalVisible(false)}
              >
                <Text style={styles.cancelText}>বাতিল</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("../assets/icons/icon2.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>শিক্ষক লগইন</Text>
            <Text style={styles.subtitle}>আধুনিক স্কুল ব্যবস্থাপনা</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Formik
              initialValues={{ phone: "", password: "" }}
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
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color="#217cdeff"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="ফোন নাম্বার"
                      value={values.phone}
                      onChangeText={handleChange("phone")}
                      onBlur={handleBlur("phone")}
                      keyboardType="phone-pad"
                      editable={!loading}
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                  {errors.phone && touched.phone && (
                    <Text style={styles.error}>{errors.phone}</Text>
                  )}

                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#217cdeff"
                      style={styles.icon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="পিন নাম্বার"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      keyboardType="numeric"
                      secureTextEntry
                      editable={!loading}
                      placeholderTextColor="#A0AEC0"
                    />
                  </View>
                  {errors.password && touched.password && (
                    <Text style={styles.error}>{errors.password}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitText}>লগইন করুন</Text>
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

// ✅ Styles
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#193772ff",
    marginBottom: 12,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#0e296fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    width: "80%",
    letterSpacing: 6,
    marginBottom: 20,
  },
  verifyButton: {
    width: "80%",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  verifyButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 15,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 8,
    resizeMode: "contain",
  },
  title: {
    fontSize: 26,
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
    shadowOffset: { width: 0, height: 6 },
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
