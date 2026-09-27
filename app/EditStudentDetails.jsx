import React, { useEffect, useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

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
  address: Yup.string().required("ঠিকানা প্রয়োজন"),
});

export default function EditStudentDetails() {
  const router = useRouter();
  const { schoolId, student, studentId } = useLocalSearchParams();
  const studentData = student ? JSON.parse(student) : null;

  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (schoolId) fetchClassesFromDb();
  }, [schoolId]);

  const fetchClassesFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/class/getClass?schoolId=${schoolId}`
      );
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("Error fetching classes:", err);
      Alert.alert("ত্রুটি", "শ্রেণীর তালিকা আনতে ব্যর্থ হয়েছে।");
    }
  };

  const handleUpdate = async (values, { setSubmitting }) => {
    try {
      const payload = {
        ...values,
        schoolId,
      };
      const res = await axios.put(
        `${API_URL}/api/school/student/updateStudent/${studentId}`,
        payload
      );

      if (res.data.success) {
        Alert.alert("✅ সফল!", "শিক্ষার্থীর তথ্য সফলভাবে আপডেট হয়েছে!");
        router.back();
      } else {
        Alert.alert("⚠️ ত্রুটি", res.data.message || "আপডেট ব্যর্থ হয়েছে");
      }
    } catch (error) {
      console.error("Update failed:", error);
      Alert.alert("❌ ত্রুটি", "সার্ভার সংযোগ ব্যর্থ হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  if (!studentData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>শিক্ষার্থীর তথ্য পাওয়া যায়নি।</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>ফিরে যান</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Modern Top Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.iconCircle}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>তথ্য আপডেট করুন</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Formik
          initialValues={{
            name: studentData.name || studentData.studentName || "",
            roll: studentData.roll?.toString() || "",
            classId: studentData.classId || "",
            className: studentData.className || "",
            section: studentData.section || "",
            gender: studentData.gender || "",
            guardianPhone: studentData.guardianPhone || "",
            guardianName: studentData.guardianName || "",
            tuitionFee: studentData.tuitionFee?.toString() || "",
            coachingFee: studentData.coachingFee?.toString() || "",
            address: studentData.address || "",
            bloodGroup: studentData.bloodGroup || "",
            remarks: studentData.remarks || "",
            dateOfBirth: studentData.dateOfBirth || "",
          }}
          validationSchema={studentSchema}
          onSubmit={handleUpdate}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
            isSubmitting,
          }) => (
            <View style={styles.formContainer}>
              {/* Card 1: Academic Info */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="school" size={20} color="#4F46E5" />
                  <Text style={styles.cardTitle}>একাডেমিক তথ্য</Text>
                </View>

                {/* Name */}
                <CustomInput
                  label="শিক্ষার্থীর নাম *"
                  icon="person-outline"
                  placeholder="ছাত্রের পূর্ণ নাম লিখুন"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  error={touched.name && errors.name}
                />

                {/* Roll */}
                <CustomInput
                  label="রোল নম্বর *"
                  icon="format-list-numbered"
                  placeholder="রোল নম্বর লিখুন"
                  keyboardType="numeric"
                  value={values.roll}
                  onChangeText={handleChange("roll")}
                  onBlur={handleBlur("roll")}
                  error={touched.roll && errors.roll}
                />

                {/* Class Selector */}
                <Text style={styles.fieldLabel}>শ্রেণী নির্বাচন করুন *</Text>
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
                        activeOpacity={0.8}
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
                          {item.className} {item.sectionName ? `(${item.sectionName})` : ""}
                        </Text>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color="#4F46E5"
                            style={{ marginLeft: 4 }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {touched.classId && errors.classId && (
                  <Text style={styles.errorTextMsg}>{errors.classId}</Text>
                )}
              </View>

              {/* Card 2: Personal Details */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="person" size={20} color="#4F46E5" />
                  <Text style={styles.cardTitle}>ব্যক্তিগত তথ্য</Text>
                </View>

                {/* Gender */}
                <Text style={styles.fieldLabel}>লিঙ্গ নির্বাচন করুন *</Text>
                <View style={styles.genderRow}>
                  {[
                    { id: "male", label: "ছেলে", icon: "male-outline", color: "#2563EB" },
                    { id: "female", label: "মেয়ে", icon: "female-outline", color: "#EC4899" },
                  ].map((g) => {
                    const isSelected = values.gender === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        activeOpacity={0.8}
                        style={[
                          styles.genderCard,
                          isSelected && {
                            borderColor: g.color,
                            backgroundColor: `${g.color}10`,
                          },
                        ]}
                        onPress={() => setFieldValue("gender", g.id)}
                      >
                        <Ionicons
                          name={g.icon}
                          size={22}
                          color={isSelected ? g.color : "#64748B"}
                        />
                        <Text
                          style={[
                            styles.genderLabel,
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
                  <Text style={styles.errorTextMsg}>{errors.gender}</Text>
                )}

                {/* Date of Birth */}
                <CustomInput
                  label="জন্ম তারিখ"
                  icon="calendar-today"
                  placeholder="DD-MM-YYYY"
                  value={values.dateOfBirth}
                  onChangeText={handleChange("dateOfBirth")}
                  onBlur={handleBlur("dateOfBirth")}
                />

                {/* Blood Group */}
                <CustomInput
                  label="রক্তের গ্রুপ"
                  icon="opacity"
                  placeholder="যেমন: A+, O+, B-"
                  value={values.bloodGroup}
                  onChangeText={handleChange("bloodGroup")}
                  onBlur={handleBlur("bloodGroup")}
                />

                {/* Address */}
                <CustomInput
                  label="ঠিকানা *"
                  icon="place"
                  placeholder="পূর্ণ ঠিকানা লিখুন"
                  multiline
                  numberOfLines={3}
                  value={values.address}
                  onChangeText={handleChange("address")}
                  onBlur={handleBlur("address")}
                  error={touched.address && errors.address}
                />
              </View>

              {/* Card 3: Guardian Details */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="family-restroom" size={20} color="#4F46E5" />
                  <Text style={styles.cardTitle}>অভিভাবকের তথ্য</Text>
                </View>

                {/* Guardian Name */}
                <CustomInput
                  label="অভিভাবকের নাম"
                  icon="person-outline"
                  placeholder="অভিভাবকের পূর্ণ নাম"
                  value={values.guardianName}
                  onChangeText={handleChange("guardianName")}
                  onBlur={handleBlur("guardianName")}
                />

                {/* Guardian Phone */}
                <CustomInput
                  label="অভিভাবকের মোবাইল নম্বর *"
                  icon="phone"
                  placeholder="যেমন: 017xxxxxxxx"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={values.guardianPhone}
                  onChangeText={handleChange("guardianPhone")}
                  onBlur={handleBlur("guardianPhone")}
                  error={touched.guardianPhone && errors.guardianPhone}
                />
              </View>

              {/* Card 4: Fee Structure */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="payments" size={20} color="#4F46E5" />
                  <Text style={styles.cardTitle}>ফি ও খরচের বিবরণ</Text>
                </View>

                {/* Tuition Fee */}
                <CustomInput
                  label="টিউশন ফি (৳) *"
                  icon="attach-money"
                  placeholder="যেমন: ৫০০"
                  keyboardType="numeric"
                  value={values.tuitionFee}
                  onChangeText={handleChange("tuitionFee")}
                  onBlur={handleBlur("tuitionFee")}
                  error={touched.tuitionFee && errors.tuitionFee}
                />

                {/* Coaching Fee */}
                <CustomInput
                  label="কোচিং ফি (৳) *"
                  icon="account-balance-wallet"
                  placeholder="যেমন: ৩০০"
                  keyboardType="numeric"
                  value={values.coachingFee}
                  onChangeText={handleChange("coachingFee")}
                  onBlur={handleBlur("coachingFee")}
                  error={touched.coachingFee && errors.coachingFee}
                />
              </View>

              {/* Card 5: Remarks */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="notes" size={20} color="#4F46E5" />
                  <Text style={styles.cardTitle}>অতিরিক্ত তথ্য ও মন্তব্য</Text>
                </View>

                <CustomInput
                  label="মন্তব্য (Remarks)"
                  icon="comment"
                  placeholder="প্রয়োজনে অতিরিক্ত কোনো মন্তব্য লিখুন"
                  multiline
                  numberOfLines={2}
                  value={values.remarks}
                  onChangeText={handleChange("remarks")}
                  onBlur={handleBlur("remarks")}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.submitBtnWrapper}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={["#6366F1", "#4F46E5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientSubmitBtn}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>তথ্য আপডেট করুন</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Custom Reusable Input Field Component
const CustomInput = ({
  label,
  icon,
  error,
  multiline,
  numberOfLines,
  ...props
}) => (
  <View style={styles.inputGroup}>
    {label && <Text style={styles.fieldLabel}>{label}</Text>}
    <View
      style={[
        styles.inputWrapper,
        error && styles.inputWrapperError,
        multiline && { height: "auto", alignItems: "flex-start", paddingTop: 10 },
      ]}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={20}
          color="#64748B"
          style={styles.inputIcon}
        />
      )}
      <TextInput
        style={[
          styles.textInput,
          multiline && { height: (numberOfLines || 2) * 24, textAlignVertical: "top" },
        ]}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...props}
      />
    </View>
    {error && <Text style={styles.errorTextMsg}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    paddingVertical: 11,
  },
  errorTextMsg: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    fontWeight: "500",
  },
  classScrollView: {
    flexDirection: "row",
    marginBottom: 10,
  },
  classChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  selectedClassChip: {
    backgroundColor: "#EEF2FF",
    borderColor: "#6366F1",
  },
  classChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  selectedClassChipText: {
    color: "#4F46E5",
    fontWeight: "700",
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  genderCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  submitBtnWrapper: {
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientSubmitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 12,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});