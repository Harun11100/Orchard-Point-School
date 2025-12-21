import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

// ভ্যালিডেশন স্কিমা
const ResetPasswordSchema = Yup.object().shape({
  phone: Yup.string()
    .matches(/^[0-9]{10,15}$/, "ফোন নাম্বার সঠিক নয়")
    .required("ফোন নাম্বার প্রয়োজন"),
  email: Yup.string().email("সঠিক ইমেইল লিখুন").required("ইমেইল প্রয়োজন"),
});

export default function ResetPasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [schoolData, setSchoolData] = useState(null);

  // ১️⃣ Handle reset password request
  const handleReset = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/school/resetpass`, values);

      if (res.data.success) {
        setSchoolData(res.data.school);
        setOtpModalVisible(true); 
        Alert.alert("সফল", "আপনার OTP পাঠানো হয়েছে।");
      } else {
        Alert.alert("ত্রুটি", res.data.message || "কিছু ভুল হয়েছে");
      }
    } catch (error) {
      console.error("Reset error:", error.response || error);
      Alert.alert(
        "ত্রুটি",
        error.response?.data?.message || "কিছু ভুল হয়েছে"
      );
    } finally {
      setLoading(false);
    }
  };

  // ২️⃣ Verify OTP
  const verifyLoginOtp = async () => {
    if (!otp.trim()) {
      Alert.alert("ত্রুটি", "অনুগ্রহ করে কোড লিখুন।");
      return;
    }

    setVerifying(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/school/resetPassOtpVerify`,
        { schoolId: schoolData._id, passOTP: otp }
      );

      if (response.data.success) {
        setOtpModalVisible(false);
        Alert.alert("সফল", "রিসেট অনুরোধ সফলভাবে জমা দেওয়া হয়েছে!");
        router.push(
          `/NewPasswordForm?schoolId=${schoolData._id}&phone=${schoolData.phone}`
        );
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
    <LinearGradient colors={["#f9faff", "#eef2ff"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
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
                  style={[
                    styles.verifyButton,
                    verifying && { opacity: 0.6 },
                  ]}
                  onPress={verifyLoginOtp}
                  disabled={verifying}
                >
                  <LinearGradient
                    colors={["#3d64b3ff", "#17306eff"]}
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

          <Text style={styles.title}>পাসওয়ার্ড রিসেট</Text>

          <Formik
            initialValues={{ phone: "", email: "" }}
            validationSchema={ResetPasswordSchema}
            onSubmit={handleReset}
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
                <Text style={styles.label}>ফোন নাম্বার</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ফোন নাম্বার"
                  keyboardType="phone-pad"
                  onChangeText={handleChange("phone")}
                  onBlur={handleBlur("phone")}
                  value={values.phone}
                />
                {errors.phone && touched.phone && (
                  <Text style={styles.error}>{errors.phone}</Text>
                )}

                <Text style={styles.label}>ইমেইল</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ইমেইল (Gmail)"
                  keyboardType="email-address"
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  value={values.email}
                  autoCapitalize="none"
                />
                {errors.email && touched.email && (
                  <Text style={styles.error}>{errors.email}</Text>
                )}

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>পাসওয়ার্ড রিসেট করুন</Text>
                  )}
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
    color: "#24336aff",
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
    backgroundColor: "#234798ff",
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
    width: "100%",
    marginBottom: 15,
  },
  verifyButton: {
    width: "100%",
    borderRadius: 12,
    marginBottom: 10,
  },
  verifyButtonGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
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
  },
});
