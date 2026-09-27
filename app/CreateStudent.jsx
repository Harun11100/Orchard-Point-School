import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra?.API_URL;

// Yup Validation Schema
const studentSchema = Yup.object().shape({
  name: Yup.string().required("শিক্ষার্থীর নাম প্রয়োজন"),
  roll: Yup.string().required("রোল প্রয়োজন"),
  classId: Yup.string().required("শ্রেণী নির্বাচন করুন"),
  gender: Yup.string().required("লিঙ্গ নির্বাচন করুন"),
  guardianPhone: Yup.string()
    .matches(/^(01)[0-9]{9}$/, "বৈধ মোবাইল নম্বর লিখুন")
    .required("অভিভাবকের মোবাইল নম্বর প্রয়োজন"),
  tuitionFee: Yup.number()
    .typeError("টিউশন ফি সংখ্যা হতে হবে")
    .required("টিউশন ফি প্রয়োজন"),
  coachingFee: Yup.number()
    .typeError("কোচিং ফি সংখ্যা হতে হবে")
    .required("কোচিং ফি প্রয়োজন"),
  address: Yup.string(),
  guardianName: Yup.string(),
  bloodGroup: Yup.string(),
  remarks: Yup.string(),
  dateOfBirth: Yup.string(),
});

export default function AddStudentScreen() {
  const { schoolId } = useLocalSearchParams();
  const router = useRouter();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (schoolId) loadClasses();
  }, [schoolId]);

  const loadClasses = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/class/getClass?schoolId=${schoolId}`
      );
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("Error loading classes:", err);
      Alert.alert("ত্রুটি", "ক্লাস তথ্য লোড করা যায়নি।");
    }
  };

  const handleSubmitForm = async (values, { resetForm }) => {
    setLoading(true);
    try {
      const payload = { ...values, schoolId };
      const res = await axios.post(
        `${API_URL}/api/school/student/addStudent`,
        payload
      );
      if (res.data.success) {
        Alert.alert("✅ সফল!", `${values.name} সফলভাবে যুক্ত হয়েছে!`);
        resetForm();
      } else {
        Alert.alert("⚠️ ত্রুটি", res.data.message || "কিছু ভুল হয়েছে");
      }
    } catch (error) {
      console.error(
        "❌ Student creation failed:",
        error.response?.data || error.message
      );
      Alert.alert(
        "ত্রুটি",
        error.response?.data?.message || "সার্ভার সংযোগ ব্যর্থ হয়েছে"
      );
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header Bar */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>নতুন শিক্ষার্থী</Text>
            <Text style={styles.headerSubtitle}>শিক্ষার্থীর তথ্য পূরণ করুন</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="person-add-outline" size={18} color="#4F46E5" />
          </View>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Formik
            initialValues={{
              name: "",
              roll: "",
              classId: "",
              className: "",
              section: "",
              gender: "",
              guardianPhone: "",
              guardianName: "",
              tuitionFee: "",
              coachingFee: "",
              address: "",
              bloodGroup: "",
              remarks: "",
              dateOfBirth: "",
            }}
            validationSchema={studentSchema}
            onSubmit={handleSubmitForm}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
            }) => (
              <View style={styles.form}>
                {/* Section 1: Academic & Basic Info */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="person-outline" size={16} color="#4F46E5" />{" "}
                    ব্যক্তিগত ও শিক্ষাগত তথ্য
                  </Text>

                  {/* Class Selection */}
                  <Text style={styles.label}>
                    শ্রেণী ও শাখা <Text style={styles.required}>*</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.classScrollView}
                  >
                    {classes.map((item) => {
                      const isSelected = values.classId === item._id;
                      return (
                        <TouchableOpacity
                          key={item._id}
                          style={[
                            styles.classChip,
                            isSelected && styles.selectedClassChip,
                          ]}
                          onPress={() => {
                            setFieldValue("classId", item._id);
                            setFieldValue("className", item.className);
                            setFieldValue("section", item.sectionName);
                          }}
                        >
                          <Text
                            style={[
                              styles.classChipText,
                              isSelected && styles.selectedClassChipText,
                            ]}
                          >
                            {item.className} - {item.sectionName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {touched.classId && errors.classId && (
                    <Text style={styles.error}>{errors.classId}</Text>
                  )}

                  {/* Name */}
                  <Text style={styles.label}>
                    শিক্ষার্থীর নাম <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="যেমন: আব্দুর রহমান"
                    placeholderTextColor="#94A3B8"
                    value={values.name}
                    onChangeText={handleChange("name")}
                    onBlur={handleBlur("name")}
                  />
                  {touched.name && errors.name && (
                    <Text style={styles.error}>{errors.name}</Text>
                  )}

                  {/* Roll */}
                  <Text style={styles.label}>
                    আইডি / রোল নম্বর <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="যেমন: ১০১"
                    placeholderTextColor="#94A3B8"
                    value={values.roll}
                    onChangeText={handleChange("roll")}
                    onBlur={handleBlur("roll")}
                  />
                  {touched.roll && errors.roll && (
                    <Text style={styles.error}>{errors.roll}</Text>
                  )}

                  {/* Gender Toggle */}
                  <Text style={styles.label}>
                    লিঙ্গ <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.genderContainer}>
                    {[
                      { key: "male", label: "ছেলে", icon: "male-outline", color: "#2563EB" },
                      { key: "female", label: "মেয়ে", icon: "female-outline", color: "#DB2777" },
                    ].map((g) => {
                      const isSelected = values.gender === g.key;
                      return (
                        <TouchableOpacity
                          key={g.key}
                          style={[
                            styles.genderCard,
                            isSelected && {
                              borderColor: g.color,
                              backgroundColor: g.key === "male" ? "#EFF6FF" : "#FDF2F8",
                            },
                          ]}
                          onPress={() => setFieldValue("gender", g.key)}
                        >
                          <Ionicons
                            name={g.icon}
                            size={18}
                            color={isSelected ? g.color : "#64748B"}
                          />
                          <Text
                            style={[
                              styles.genderText,
                              isSelected && { color: g.color, fontWeight: "700" },
                            ]}
                          >
                            {g.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {touched.gender && errors.gender && (
                    <Text style={styles.error}>{errors.gender}</Text>
                  )}
                </View>

                {/* Section 2: Guardian Information */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="call-outline" size={16} color="#4F46E5" />{" "}
                    অভিভাবকের তথ্য
                  </Text>

                  <Text style={styles.label}>অভিভাবকের নাম</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="অভিভাবকের নাম লিখুন"
                    placeholderTextColor="#94A3B8"
                    value={values.guardianName}
                    onChangeText={handleChange("guardianName")}
                    onBlur={handleBlur("guardianName")}
                  />

                  <Text style={styles.label}>
                    অভিভাবকের নম্বর <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="০১৭xxxxxxxx"
                    keyboardType="phone-pad"
                    placeholderTextColor="#94A3B8"
                    value={values.guardianPhone}
                    onChangeText={handleChange("guardianPhone")}
                    onBlur={handleBlur("guardianPhone")}
                    maxLength={11}
                  />
                  {touched.guardianPhone && errors.guardianPhone && (
                    <Text style={styles.error}>{errors.guardianPhone}</Text>
                  )}
                </View>

                {/* Section 3: Financial Info */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="wallet-outline" size={16} color="#4F46E5" />{" "}
                    ফি সংক্রান্ত তথ্য
                  </Text>

                  <View style={styles.row}>
                    <View style={styles.flexHalf}>
                      <Text style={styles.label}>
                        টিউশন ফি (৳) <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="৫০০"
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                        value={values.tuitionFee}
                        onChangeText={handleChange("tuitionFee")}
                        onBlur={handleBlur("tuitionFee")}
                      />
                      {touched.tuitionFee && errors.tuitionFee && (
                        <Text style={styles.error}>{errors.tuitionFee}</Text>
                      )}
                    </View>

                    <View style={styles.flexHalf}>
                      <Text style={styles.label}>
                        কোচিং ফি (৳) <Text style={styles.required}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="৩০০"
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                        value={values.coachingFee}
                        onChangeText={handleChange("coachingFee")}
                        onBlur={handleBlur("coachingFee")}
                      />
                      {touched.coachingFee && errors.coachingFee && (
                        <Text style={styles.error}>{errors.coachingFee}</Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Section 4: Additional Information */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>
                    <Ionicons name="information-circle-outline" size={16} color="#4F46E5" />{" "}
                    অতিরিক্ত তথ্য
                  </Text>

                  <View style={styles.row}>
                    <View style={styles.flexHalf}>
                      <Text style={styles.label}>রক্তের গ্রুপ</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="যেমন: A+"
                        placeholderTextColor="#94A3B8"
                        value={values.bloodGroup}
                        onChangeText={handleChange("bloodGroup")}
                        onBlur={handleBlur("bloodGroup")}
                      />
                    </View>

                    <View style={styles.flexHalf}>
                      <Text style={styles.label}>জন্ম তারিখ</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="DD-MM-YYYY"
                        placeholderTextColor="#94A3B8"
                        value={values.dateOfBirth}
                        onChangeText={handleChange("dateOfBirth")}
                        onBlur={handleBlur("dateOfBirth")}
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>ঠিকানা</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="বর্তমান ঠিকানা লিখুন"
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#94A3B8"
                    value={values.address}
                    onChangeText={handleChange("address")}
                    onBlur={handleBlur("address")}
                  />

                  <Text style={styles.label}>মন্তব্য (ঐচ্ছিক)</Text>
                  <TextInput
                    style={[styles.input, styles.textAreaSmall]}
                    placeholder="অতিরিক্ত কোনো নোট লিখুন"
                    multiline
                    placeholderTextColor="#94A3B8"
                    value={values.remarks}
                    onChangeText={handleChange("remarks")}
                    onBlur={handleBlur("remarks")}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.submitBtnContainer}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#4F46E5", "#3730A3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <View style={styles.submitRow}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                        <Text style={styles.submitText}>শিক্ষার্থী সংরক্ষণ করুন</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Header Bar */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Form Layout */
  form: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },

  /* Inputs & Labels */
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    marginTop: 6,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 4,
  },
  textArea: {
    height: 70,
    textAlignVertical: "top",
  },
  textAreaSmall: {
    height: 54,
    textAlignVertical: "top",
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 6,
  },

  /* Row Helper */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  flexHalf: {
    flex: 1,
  },

  /* Class Select Chips */
  classScrollView: {
    marginBottom: 8,
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  selectedClassChip: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  classChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  selectedClassChipText: {
    color: "#4338CA",
    fontWeight: "700",
  },

  /* Gender Select Cards */
  genderContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  genderCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  genderText: {
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "600",
    color: "#64748B",
  },

  /* Submit Button */
  submitBtnContainer: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});