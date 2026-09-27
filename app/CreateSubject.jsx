import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import Constants from "expo-constants";
import { useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = Constants.expoConfig?.extra?.API_URL;

// ✅ Yup Validation Schema
const subjectSchema = Yup.object().shape({
  name: Yup.string().required("বিষয়ের নাম আবশ্যক"),
  code: Yup.string().required("বিষয় কোড আবশ্যক"),
  creditHours: Yup.number()
    .typeError("ক্রেডিট ঘণ্টা একটি সংখ্যা হতে হবে")
    .optional(),
  maxMarks: Yup.number()
    .typeError("সর্বোচ্চ নম্বর একটি সংখ্যা হতে হবে")
    .optional(),
  passingMarks: Yup.number()
    .typeError("পাশ নম্বর একটি সংখ্যা হতে হবে")
    .optional(),
});

export default function CreateSubjectForm() {
  const [loading, setLoading] = useState(false);
  const { schoolId, classId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const handleSubmitForm = async (values, { resetForm }) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        schoolId,
        classId,
        creditHours: values.creditHours ? Number(values.creditHours) : null,
        maxMarks: Number(values.maxMarks),
        passingMarks: Number(values.passingMarks),
      };

      const res = await axios.post(`${API_URL}/api/school/subject/createSubject`, payload);

      if (res.data?.success) {
        Alert.alert("✅ সফল!", "নতুন বিষয় সফলভাবে তৈরি হয়েছে!");
        resetForm();
      } else {
        Alert.alert("⚠️ ত্রুটি", res.data?.message || "কিছু ভুল হয়েছে");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("ত্রুটি", "সার্ভার সংযোগ ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 12, 20),
            paddingBottom: Math.max(insets.bottom + 20, 40),
          },
        ]}
      >
        {/* Header Section */}
        <View style={styles.headerBar}>
          <View style={styles.headerIconWrapper}>
            <MaterialCommunityIcons name="book-plus-outline" size={24} color="#2563EB" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>নতুন বিষয় যোগ করুন</Text>
            <Text style={styles.headerSubtitle}>শ্রেণীর বিষয়সূচি ও নম্বর নির্ধারণ করুন</Text>
          </View>
        </View>

        {/* Main Form Card */}
        <View style={styles.formCard}>
          <Formik
            initialValues={{
              name: "",
              code: "",
              creditHours: "",
              maxMarks: "100",
              passingMarks: "33",
            }}
            validationSchema={subjectSchema}
            onSubmit={handleSubmitForm}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.formContent}>
                
                {/* Subject Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    বিষয়ের নাম <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      touched.name && errors.name && styles.inputWrapperError,
                    ]}
                  >
                    <Ionicons name="journal-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="যেমন: বাংলা প্রথম পত্র"
                      placeholderTextColor="#94A3B8"
                      value={values.name}
                      onChangeText={handleChange("name")}
                      onBlur={handleBlur("name")}
                    />
                  </View>
                  {touched.name && errors.name && (
                    <Text style={styles.errorText}>{errors.name}</Text>
                  )}
                </View>

                {/* Subject Code Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    বিষয় কোড <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      touched.code && errors.code && styles.inputWrapperError,
                    ]}
                  >
                    <Ionicons name="barcode-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="যেমন: BAN-101"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      value={values.code}
                      onChangeText={(text) => handleChange("code")(text.toUpperCase())}
                      onBlur={handleBlur("code")}
                    />
                  </View>
                  {touched.code && errors.code && (
                    <Text style={styles.errorText}>{errors.code}</Text>
                  )}
                </View>

                {/* Optional Field: Credit Hours */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ক্রেডিট ঘণ্টা (ঐচ্ছিক)</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      touched.creditHours && errors.creditHours && styles.inputWrapperError,
                    ]}
                  >
                    <Ionicons name="time-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="যেমন: ৩.০"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={String(values.creditHours)}
                      onChangeText={handleChange("creditHours")}
                      onBlur={handleBlur("creditHours")}
                    />
                  </View>
                  {touched.creditHours && errors.creditHours && (
                    <Text style={styles.errorText}>{errors.creditHours}</Text>
                  )}
                </View>

                {/* Two Column Row: Max Marks & Passing Marks */}
                <View style={styles.rowGroup}>
                  <View style={[styles.inputGroup, styles.flexColumn]}>
                    <Text style={styles.label}>সর্বোচ্চ নম্বর</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        touched.maxMarks && errors.maxMarks && styles.inputWrapperError,
                      ]}
                    >
                      <Ionicons name="trophy-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(values.maxMarks)}
                        onChangeText={handleChange("maxMarks")}
                        onBlur={handleBlur("maxMarks")}
                      />
                    </View>
                    {touched.maxMarks && errors.maxMarks && (
                      <Text style={styles.errorText}>{errors.maxMarks}</Text>
                    )}
                  </View>

                  <View style={[styles.inputGroup, styles.flexColumn]}>
                    <Text style={styles.label}>পাশ নম্বর</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        touched.passingMarks && errors.passingMarks && styles.inputWrapperError,
                      ]}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        value={String(values.passingMarks)}
                        onChangeText={handleChange("passingMarks")}
                        onBlur={handleBlur("passingMarks")}
                      />
                    </View>
                    {touched.passingMarks && errors.passingMarks && (
                      <Text style={styles.errorText}>{errors.passingMarks}</Text>
                    )}
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#2563EB", "#1D4ED8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.submitText}>বিষয় তৈরি করুন</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ✅ Design Styles
const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  /* Header */
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  headerIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* Form Container Card */
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  formContent: {
    gap: 16,
  },

  /* Inputs */
  inputGroup: {
    flexDirection: "column",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 6,
  },
  requiredStar: {
    color: "#EF4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 48,
  },
  inputWrapperError: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#0F172A",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },

  /* Layout Grids */
  rowGroup: {
    flexDirection: "row",
    gap: 12,
  },
  flexColumn: {
    flex: 1,
  },

  /* Submit Button */
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  gradientButton: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});