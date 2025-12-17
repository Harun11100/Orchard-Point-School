// AddStudentScreen.js
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;

// ✅ Yup Validation Schema
const studentSchema = Yup.object().shape({
  name: Yup.string().required("ছাত্রের নাম প্রয়োজন"),
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
  guardianName: Yup.string(),
  bloodGroup: Yup.string(),
  remarks: Yup.string(),
  dateOfBirth: Yup.date().nullable(),
});

export default function AddStudentScreen() {
  const { schoolId } = useLocalSearchParams();
  const [classes, setClasses] = useState([]);
  const [loading,setLoading]=useState(false)

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
      const res = await axios.post(`${API_URL}/api/school/student/addStudent`, payload);
      if (res.data.success) {
        Alert.alert("✅ সফল!", `${values.name} সফলভাবে যুক্ত হয়েছে!`);
        resetForm();
      } else {
        Alert.alert("⚠️ ত্রুটি", res.data.message || "কিছু ভুল হয়েছে");
      }
    } catch (error) {
      console.error("❌ Student creation failed:", error.response?.data || error.message);
      Alert.alert("ত্রুটি", error.response?.data?.message || "সার্ভার সংযোগ ব্যর্থ হয়েছে");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>নতুন শিক্ষার্থী যুক্ত করুন</Text>
        </View>

        <Formik
          initialValues={{
            name: "",
            roll: "",
            classId: "",
            className: "",
            section: "",
            gender: "",
            guardianPhone: "",
            guardianName:"",
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
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <View style={styles.form}>
              {/* Name */}
              <Text style={styles.label}> শিক্ষার্থীর নাম</Text>
              <TextInput style={styles.input} placeholder="শিক্ষার্থীর নাম লিখুন" value={values.name} onChangeText={handleChange("name")} onBlur={handleBlur("name")} />
              {touched.name && errors.name && <Text style={styles.error}>{errors.name}</Text>}

              {/* Roll */}
              <Text style={styles.label}>রোল নম্বর</Text>
              <TextInput style={styles.input} placeholder="রোল নম্বর লিখুন" value={values.roll} onChangeText={handleChange("roll")} onBlur={handleBlur("roll")} />
              {touched.roll && errors.roll && <Text style={styles.error}>{errors.roll}</Text>}

              {/* Class */}
              <Text style={styles.label}>শ্রেণী</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {classes.map((item) => (
                  <TouchableOpacity key={item._id} style={[styles.classButton, values.classId === item._id && styles.selectedClass]} onPress={() => {
                    setFieldValue("classId", item._id);
                    setFieldValue("className", item.className);
                    setFieldValue("section", item.sectionName);
                  }}>
                    <Text style={[styles.classText, values.classId === item._id && styles.selectedClassText]}>
                      {item.className} {item.sectionName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {touched.classId && errors.classId && <Text style={styles.error}>{errors.classId}</Text>}

              {/* Gender */}
              <Text style={{marginTop: 10,fontSize: 15, color: "#1E3A8A", fontWeight: "600",marginBottom:6}}>লিঙ্গ</Text>
              <View style={styles.genderContainer}>
                {["male","female"].map((g) => (
                  <TouchableOpacity key={g} style={[styles.genderButton, values.gender === g && styles.selectedGender]} onPress={() => setFieldValue("gender", g)}>
                    <Ionicons name={g === "male" ? "male-outline" : "female-outline"} size={20} color={g === "male" ? "#1E3A8A" : "#DB2777"} />
                    <Text style={styles.genderText}>{g === "male" ? "ছেলে" : "মেয়ে"}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {touched.gender && errors.gender && <Text style={styles.error}>{errors.gender}</Text>}

              {/* Guardian */}
              <Text style={styles.label}>অভিভাবকের নাম</Text>
              <TextInput style={styles.input} placeholder=" " value={values.guardianName} onChangeText={handleChange("guardianName")} onBlur={handleBlur("guardianName")} />
              {touched.guardianName && errors.guardianName && <Text style={styles.error}>{errors.guardianName}</Text>}

              <Text style={styles.label}>অভিভাবকের মোবাইল নম্বর</Text>
              <TextInput style={styles.input} placeholder="যেমন: ০১৭xxxxxxxx" keyboardType="phone-pad" value={values.guardianPhone} onChangeText={handleChange("guardianPhone")} onBlur={handleBlur("guardianPhone")} maxLength={11} />
              {touched.guardianPhone && errors.guardianPhone && <Text style={styles.error}>{errors.guardianPhone}</Text>}

              {/* Fees */}
              <Text style={styles.label}>টিউশন ফি (৳)</Text>
              <TextInput style={styles.input} placeholder="যেমন:500" keyboardType="numeric" value={values.tuitionFee} onChangeText={handleChange("tuitionFee")} onBlur={handleBlur("tuitionFee")} />
              {touched.tuitionFee && errors.tuitionFee && <Text style={styles.error}>{errors.tuitionFee}</Text>}

              <Text style={styles.label}>কোচিং ফি (৳)</Text>
              <TextInput style={styles.input} placeholder="যেমন:300" keyboardType="numeric" value={values.coachingFee} onChangeText={handleChange("coachingFee")} onBlur={handleBlur("coachingFee")} />
              {touched.coachingFee && errors.coachingFee && <Text style={styles.error}>{errors.coachingFee}</Text>}

              {/* Address */}
              <Text style={styles.label}>ঠিকানা</Text>
              <TextInput style={[styles.input, { height: 80 }]} placeholder="ঠিকানা লিখুন" multiline value={values.address} onChangeText={handleChange("address")} onBlur={handleBlur("address")} />
              {touched.address && errors.address && <Text style={styles.error}>{errors.address}</Text>}

              {/* Blood Group */}
              <Text style={styles.label}>রক্তের গ্রুপ</Text>
              <TextInput style={styles.input} placeholder="যেমন: A+, O-" value={values.bloodGroup} onChangeText={handleChange("bloodGroup")} onBlur={handleBlur("bloodGroup")} />

              {/* Remarks */}
              <Text style={styles.label}>মন্তব্য (optional)</Text>
              <TextInput style={[styles.input, { height: 60 }]} placeholder="কিছু মন্তব্য লিখুন" multiline value={values.remarks} onChangeText={handleChange("remarks")} onBlur={handleBlur("remarks")} />

              {/* Date of Birth */}
              <Text style={styles.label}>জন্ম তারিখ</Text>
              <TextInput style={styles.input} placeholder="DD-MM-YYYY" value={values.dateOfBirth} onChangeText={handleChange("dateOfBirth")} onBlur={handleBlur("dateOfBirth")} />

              {/* Submit */}
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                <LinearGradient colors={["#8693f6ff", "#1139b9ff"]} style={styles.gradientButton}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>যুক্ত করুন</Text>}
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
  header: { paddingVertical: 10, alignItems: "center" },
  headerText: { color: "#2d499dff", fontSize: 22, fontWeight: "700" },
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
  sectionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  selectedSection: {
    borderColor: "#6366F1",
    backgroundColor: "#E0E7FF",
  },
  sectionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  selectedSectionText: {
    fontWeight: "700",
    color: "#1E3A8A",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
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
   submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom:60
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
