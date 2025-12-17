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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

const studentSchema = Yup.object().shape({
  name: Yup.string().required("শিক্ষার্থীর নাম প্রয়োজন"),
  roll: Yup.string()
    .required("রোল প্রয়োজন"),
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

  const handleUpdate = async (values) => {
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
    }
  };

  if (!studentData) {
    return (
      <View>
        <Text style={{ color: "red" }}> শিক্ষার্থীর তথ্য পাওয়া যায়নি।</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>শিক্ষার্থীর তথ্য সম্পাদনা করুন</Text>
        </View>

        <Formik
          initialValues={{
            name: studentData.name || "",
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
            dateOfBirth: studentData.dateOfBirth
              ? new Date(studentData.dateOfBirth).toISOString().split("T")[0]
              : "",
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
          }) => (
            <View style={styles.form}>
              {/* Name */}
              <Text style={styles.label}>শিক্ষার্থীর নাম</Text>
              <TextInput
                style={styles.input}
                placeholder="ছাত্রের নাম লিখুন"
                value={values.name}
                onChangeText={handleChange("name")}
                onBlur={handleBlur("name")}
              />
              {touched.name && errors.name && (
                <Text style={styles.error}>{errors.name}</Text>
              )}

              {/* Roll */}
              <Text style={styles.label}>রোল নম্বর</Text>
              <TextInput
                style={styles.input}
                placeholder="রোল নম্বর লিখুন"
                value={values.roll}
                onChangeText={handleChange("roll")}
                onBlur={handleBlur("roll")}
              />
              {touched.roll && errors.roll && (
                <Text style={styles.error}>{errors.roll}</Text>
              )}

              {/* Class Selector */}
              <Text style={styles.label}>শ্রেণী</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {classes.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.classButton,
                      values.classId === item._id && styles.selectedClass,
                    ]}
                    onPress={() => {
                      setFieldValue("classId", item._id);
                      setFieldValue("className", item.className);
                      setFieldValue("section", item.sectionName);
                    }}
                  >
                    <Text
                      style={[
                        styles.classText,
                        values.classId === item._id && styles.selectedClassText,
                      ]}
                    >
                      {item.className} {item.sectionName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {touched.classId && errors.classId && (
                <Text style={styles.error}>{errors.classId}</Text>
              )}

              {/* Gender */}
              <Text style={styles.label}>লিঙ্গ</Text>
              <View style={styles.genderContainer}>
                {["male", "female"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      values.gender === g && styles.selectedGender,
                    ]}
                    onPress={() => setFieldValue("gender", g)}
                  >
                    <Ionicons
                      name={g === "male" ? "male-outline" : "female-outline"}
                      size={20}
                      color={g === "male" ? "#1E3A8A" : "#DB2777"}
                    />
                    <Text style={styles.genderText}>
                      {g === "male" ? "ছেলে" : "মেয়ে"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {touched.gender && errors.gender && (
                <Text style={styles.error}>{errors.gender}</Text>
              )}

              {/* Guardian Name */}
              <Text style={styles.label}>অভিভাবকের নাম</Text>
              <TextInput
                style={styles.input}
                placeholder="অভিভাবকের নাম"
                value={values.guardianName}
                onChangeText={handleChange("guardianName")}
                onBlur={handleBlur("guardianName")}
              />

              {/* Guardian Phone */}
              <Text style={styles.label}>অভিভাবকের মোবাইল নম্বর</Text>
              <TextInput
                style={styles.input}
                placeholder="যেমন: ০১৭xxxxxxxx"
                keyboardType="phone-pad"
                value={values.guardianPhone}
                onChangeText={handleChange("guardianPhone")}
                onBlur={handleBlur("guardianPhone")}
                maxLength={11}
              />
              {touched.guardianPhone && errors.guardianPhone && (
                <Text style={styles.error}>{errors.guardianPhone}</Text>
              )}

              {/* Tuition Fee */}
              <Text style={styles.label}>টিউশন ফি (৳)</Text>
              <TextInput
                style={styles.input}
                placeholder="যেমন: ৫০০"
                keyboardType="numeric"
                value={values.tuitionFee}
                onChangeText={handleChange("tuitionFee")}
                onBlur={handleBlur("tuitionFee")}
              />
              {touched.tuitionFee && errors.tuitionFee && (
                <Text style={styles.error}>{errors.tuitionFee}</Text>
              )}

              {/* Coaching Fee */}
              <Text style={styles.label}>কোচিং ফি (৳)</Text>
              <TextInput
                style={styles.input}
                placeholder="যেমন: ৩০০"
                keyboardType="numeric"
                value={values.coachingFee}
                onChangeText={handleChange("coachingFee")}
                onBlur={handleBlur("coachingFee")}
              />
              {touched.coachingFee && errors.coachingFee && (
                <Text style={styles.error}>{errors.coachingFee}</Text>
              )}

              {/* Address */}
              <Text style={styles.label}>ঠিকানা</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="ঠিকানা লিখুন"
                multiline
                value={values.address}
                onChangeText={handleChange("address")}
                onBlur={handleBlur("address")}
              />
              {touched.address && errors.address && (
                <Text style={styles.error}>{errors.address}</Text>
              )}

              {/* Blood Group */}
              <Text style={styles.label}>রক্তের গ্রুপ</Text>
              <TextInput
                style={styles.input}
                placeholder="যেমন: A+, O-"
                value={values.bloodGroup}
                onChangeText={handleChange("bloodGroup")}
              />

              {/* Remarks */}
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="কিছু মন্তব্য লিখুন"
                multiline
                value={values.remarks}
                onChangeText={handleChange("remarks")}
              />

              {/* Date of Birth */}
              <Text style={styles.label}>জন্ম তারিখ</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={values.dateOfBirth}
                onChangeText={handleChange("dateOfBirth")}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
              >
                <LinearGradient
                  colors={["#8693f6ff", "#1139b9ff"]}
                  style={styles.gradientButton}
                >
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveText}>তথ্য আপডেট করুন</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafeff" },
  header: { paddingVertical: 20, alignItems: "center", marginTop: 10 },
  headerText: { color: "#162e79ff", fontSize: 22, fontWeight: "700" },
  form: { marginTop: 20, paddingHorizontal: 20 },
  label: { fontSize: 15, color: "#1E3A8A", fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  error: { color: "red", fontSize: 13, marginBottom: 10 },
  genderContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  genderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectedGender: { borderColor: "#6366F1", backgroundColor: "#E0E7FF" },
  genderText: { fontSize: 15, marginLeft: 6, fontWeight: "600" },
  classButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  selectedClass: { backgroundColor: "#E0E7FF", borderColor: "#6366F1" },
  classText: { color: "#374151", fontWeight: "500" },
  selectedClassText: { color: "#1E3A8A", fontWeight: "700" },
  saveButton: { marginTop: 10, alignItems: "center" },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 8 },
});
