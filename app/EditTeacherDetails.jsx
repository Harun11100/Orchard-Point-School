import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const validationSchema = Yup.object().shape({
  name: Yup.string().required("শিক্ষকের নাম অবশ্যক"),
  email: Yup.string().email("সঠিক ইমেইল লিখুন").required("ইমেইল অবশ্যক"),
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে")
    .required("ফোন নম্বর অবশ্যক"),
  subjects: Yup.string().required("অন্তত একটি বিষয় অবশ্যক"),
  role: Yup.string().required("দায়িত্ব অবশ্যক"),
  classTeacher: Yup.string().required("শ্রেণী শিক্ষক অবশ্যক"),
});

export default function EditTeacherScreen() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const { teacherData } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (teacherData) {
      try {
        const parsedData = JSON.parse(teacherData);
        setTeacher({
          ...parsedData,
          subjects: Array.isArray(parsedData.subjects)
            ? parsedData.subjects.join(", ")
            : parsedData.subjects || "",
        });
      } catch (error) {
        console.error("Invalid teacher data:", error);
        Alert.alert("ত্রুটি", "শিক্ষকের তথ্য লোড করতে সমস্যা হয়েছে");
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [teacherData]);

  const handleUpdate = async (values) => {
    setUpdating(true);
    try {
      const payload = {
        ...values,
        subjects: values.subjects.split(",").map((s) => s.trim()),
      };

      const res = await axios.put(
        `${API_URL}/api/school/editTeacher/${teacher._id}`,
        payload
      );

      if (res.data.success) {
        Alert.alert("সফল", "শিক্ষকের তথ্য আপডেট হয়েছে");
        router.back();
      } else {
        Alert.alert("ত্রুটি", res.data.message || "আপডেট ব্যর্থ হয়েছে");
      }
    } catch (error) {
      console.error("Update failed:", error);
      Alert.alert("ত্রুটি", "কিছু সমস্যা হয়েছে, পুনরায় চেষ্টা করুন");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2389efff" />
        <Text style={{ marginTop: 10, color: "#2871d6ff" }}>লোড হচ্ছে...</Text>
      </View>
    );
  }

  if (!teacher) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#f44336" }}>শিক্ষকের তথ্য পাওয়া যায়নি</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>শিক্ষকের তথ্য সম্পাদনা</Text>

        <Formik
          initialValues={teacher}
          validationSchema={validationSchema}
          onSubmit={handleUpdate}
          enableReinitialize
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
              {[
                {
                  field: "name",
                  label: "শিক্ষকের নাম",
                  keyboard: "default",
                },
                {
                  field: "email",
                  label: "ইমেইল",
                  keyboard: "email-address",
                },
                {
                  field: "phone",
                  label: "ফোন নম্বর",
                  keyboard: "phone-pad",
                },
                {
                  field: "subjects",
                  label: "বিষয় (কমা দ্বারা আলাদা)",
                  keyboard: "default",
                },
                {
                  field: "role",
                  label: "দায়িত্ব",
                  keyboard: "default",
                },
                {
                  field: "classTeacher",
                  label: "শ্রেণী শিক্ষক",
                  keyboard: "default",
                },
              ].map(({ field, label, keyboard }, idx) => (
                <View key={idx} style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType={keyboard}
                    value={values[field]}
                    onChangeText={handleChange(field)}
                    onBlur={handleBlur(field)}
                  />
                  {errors[field] && touched[field] && (
                    <Text style={styles.error}>{errors[field]}</Text>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={updating}
              >
                <LinearGradient
                  colors={["#3f9bddff", "#0b63bcff"]}
                  style={styles.gradientButton}
                >
                  {updating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>আপডেট করুন</Text>
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f9faff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#2280d7ff",
    alignSelf: "center",
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#333",
  },
  error: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9faff",
  },
});
