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
  Image,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { uploadImages } from "../request/UploadImages";

const API_URL = Constants.expoConfig.extra.API_URL;

/* ---------------- Validation ---------------- */
const validationSchema = Yup.object().shape({
  name: Yup.string().required("শিক্ষকের নাম অবশ্যক"),
  email: Yup.string().email("সঠিক ইমেইল লিখুন").required("ইমেইল অবশ্যক"),
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে")
    .required("ফোন নম্বর অবশ্যক"),
  subjects: Yup.string().required("অন্তত একটি বিষয় অবশ্যক"),
  role: Yup.string().required("দায়িত্ব অবশ্যক"),
});

export default function EditTeacherScreen() {
  const { teacherData } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [teacher, setTeacher] = useState(null);

  // ✅ image handled OUTSIDE formik
  const [selectedImage, setSelectedImage] = useState(null);

  /* ---------------- Load Teacher ---------------- */
  useEffect(() => {
    if (!teacherData) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(teacherData);
      setTeacher({
        ...parsed,
        subjects: Array.isArray(parsed.subjects)
          ? parsed.subjects.join(", ")
          : parsed.subjects || "",
        imageUrl: parsed.imageUrl || "",
      });
    } catch {
      Alert.alert("ত্রুটি", "শিক্ষকের তথ্য লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  }, [teacherData]);

  /* ---------------- Pick Image (NO upload) ---------------- */
  const pickProfileImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("অনুমতি প্রয়োজন", "গ্যালারি অ্যাক্সেস দিন");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]); // ✅ safe
    }
  };

  /* ---------------- Update Teacher ---------------- */
  const handleUpdate = async (values) => {
    setUpdating(true);

    try {
      let imageUrl = teacher.imageUrl;

      // ✅ Upload ONLY if new image exists
      if (selectedImage) {
        const normalizedImage = {
          uri: selectedImage.uri,
          mimeType: "image/jpeg",
          fileName: `teacher_${Date.now()}.jpg`,
        };

        const urls = await uploadImages([normalizedImage]);
        imageUrl = urls[0].url;
      }

      const payload = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        role: values.role,
        experience: values.experience || "",
        imageUrl,
        subjects: values.subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await axios.put(
        `${API_URL}/api/school/editTeacher/${teacher._id}`,
        payload
      );

      if (res.data?.success) {
        Alert.alert("সফল", "শিক্ষকের তথ্য আপডেট হয়েছে");
        router.back();
      } else {
        Alert.alert("ত্রুটি", res.data?.message || "আপডেট ব্যর্থ");
      }
    } catch (err) {
      Alert.alert("ত্রুটি", "আপডেট ব্যর্থ হয়েছে");
    } finally {
      setUpdating(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading || !teacher) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e88e5" />
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
            <View>
              {/* ---------- Profile ---------- */}
              <View style={styles.profileCard}>
                <TouchableOpacity onPress={pickProfileImage}>
                  <Image
                    source={{
                      uri: selectedImage?.uri || values.imageUrl,
                    }}
                    style={styles.avatar}
                  />
                  <View style={styles.editBadge}>
                    <MaterialIcons name="edit" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* ---------- Inputs ---------- */}
              {[
                { field: "name", label: "শিক্ষকের নাম" },
                { field: "email", label: "ইমেইল" },
                { field: "phone", label: "ফোন নম্বর" },
                { field: "subjects", label: "বিষয় (কমা দিয়ে)" },
                { field: "role", label: "দায়িত্ব" },
                { field: "experience", label: "অভিজ্ঞতা (বছরে)" },
              ].map(({ field, label }) => (
                <View key={field} style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    value={values[field]}
                    onChangeText={handleChange(field)}
                    onBlur={handleBlur(field)}
                  />
                  {errors[field] && touched[field] && (
                    <Text style={styles.error}>{errors[field]}</Text>
                  )}
                </View>
              ))}

              <TouchableOpacity onPress={handleSubmit} disabled={updating}>
                <LinearGradient
                  colors={["#1e88e5", "#1565c0"]}
                  style={styles.submitButton}
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

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#f5f7fb" },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom:8 , color: "#0c4f8eff",},
  profileCard: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#1e88e5",
  },
  editBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#1e88e5",
    borderRadius: 16,
    padding: 6,
  },
  label: { fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  error: { color: "red", fontSize: 12 },
  submitButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginBottom:30
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
});
