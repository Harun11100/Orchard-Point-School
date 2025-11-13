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
  Modal,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { registerForPushNotificationsAsync } from "../service/registerForPushNotification";
import { Ionicons } from "@expo/vector-icons";
import Constants from 'expo-constants';
import * as SecureStore from "expo-secure-store";

const API_URL = Constants.expoConfig.extra.API_URL;


const validationSchema = Yup.object().shape({
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে")
    .required("ফোন নম্বর অবশ্যক"),
  password: Yup.string().required("পাসওয়ার্ড অবশ্যক"),
});

export default function OwnerLoginScreen() {

  const [loading, setLoading] = useState(false);
  const [checkingStorage, setCheckingStorage] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const router = useRouter();
  const [schoolData,setSchoolInfo] =useState(null)

  // ✅ Auto login if already stored
  useEffect(() => {
    const checkStoredSchool = async () => {
      try {
        const storedSchool = await AsyncStorage.getItem("schoolDetails");
        if (storedSchool) {
          const school = JSON.parse(storedSchool);
         
         router.push(
      `/PrincipalDashboardScreen?phone=${school.phone}&schoolId=${school.schoolId}`
       );
        return;
        }
      } catch (error) {
        console.error("Error reading AsyncStorage:", error);
      } finally {
        setCheckingStorage(false);
      }
    };
    checkStoredSchool();
  }, []);
  
const onFormSubmit = async (values) => {
  let expoToken = null;
  try {
    expoToken = await registerForPushNotificationsAsync();
  } catch (e) {
    console.warn("Push token error:", e);
  }

  setLoading(true);
  try {
    const payload = {
      phone: values.phone,
      password: values.password,
      expoToken,
    };

    console.log(payload)

    const res = await axios.post(
      `${API_URL}/api/school/login`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    setSchoolInfo(res.data.school)
    setOtpModalVisible(true);

  } catch (error) {
    console.error("Login error:", error);

    const message =
      error.response?.data?.message || "লগইন ব্যর্থ হয়েছে, আবার চেষ্টা করুন";
    Alert.alert("Login Failed", message);
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
      `${API_URL}/api/school/verifyLoginOtp`,
      { schoolId: schoolData.schoolId, loginOTP: otp }
    );

    if (response.data.success) {
      // ✅ Store JWT securely
      await SecureStore.setItemAsync("auth_token", response.data.token);

      // ✅ Optionally store school info for quick access
      await AsyncStorage.setItem("schoolDetails", JSON.stringify(schoolData));

      router.push(
        `/PrincipalDashboardScreen?phone=${schoolData.phone}&schoolId=${schoolData.schoolId}&token=${response.data.token}`
      );
      
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


  if (checkingStorage) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
 <LinearGradient colors={["#f9faff", "#eef2ff"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}
           showsVerticalScrollIndicator={false}>
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
                       />
                       <TouchableOpacity
                         style={[styles.verifyButton, verifying && { opacity: 0.6 }]}
                         onPress={verifyLoginOtp}
                         disabled={verifying}
                       >
                         <LinearGradient
                           colors={["#225691ff", "#073d84ff"]}
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
            <Text style={styles.title}>প্রধান শিক্ষক লগইন</Text>
          <Formik
            initialValues={{ phone: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={onFormSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.form}>
                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ফোন নাম্বার</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    value={values.phone}
                    onChangeText={handleChange("phone")}
                    onBlur={handleBlur("phone")}
                    keyboardType="phone-pad"
                  />
                  {errors.phone && touched.phone && (
                    <Text style={styles.error}>{errors.phone}</Text>
                  )}
                </View>

                {/* Password with toggle */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>পাসওয়ার্ড</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Password"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={22}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && touched.password && (
                    <Text style={styles.error}>{errors.password}</Text>
                  )}
                </View>

                {/* Submit */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>লগইন করুন</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/ResetPasswordForm")}
                  style={{ marginTop: 20 }}
                >
                  <Text style={styles.resetText}>
                    পাসওয়ার্ড ভুলে গেছেন? এখানে রিসেট করুন
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

const styles = StyleSheet.create({
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
    color: "#17427fff",
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
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#4f46e5",
  },

  inputGroup: { marginBottom: 18 },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
  },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  resetText: {
    color: "#323c89ff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 14,
  },
});
