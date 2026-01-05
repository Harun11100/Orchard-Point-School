import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { uploadImages } from "../request/UploadImages";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
// ✅ Validation Schema
const validationSchema = Yup.object().shape({
  studentName: Yup.string().required("শিক্ষার্থীর নাম আবশ্যক"),
  studentRoll: Yup.string().required("রোল/আইডি আবশ্যক"),
  sessionYear: Yup.string().required("সেশন বছর আবশ্যক"),
  achievementTitle: Yup.string().required("শিরোনাম আবশ্যক"),
  achievementName: Yup.string().required("অর্জনের নাম আবশ্যক"),
});

export default function SchoolAchievementUpload() {
  const { schoolId } = useLocalSearchParams();
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("অনুমতি প্রয়োজন", "গ্যালারি অ্যাক্সেস করতে অনুমতি দিন");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmitForm = async (values, { resetForm }) => {
    if (!photoUri) {
      Alert.alert("ত্রুটি", "শিক্ষার্থীর ছবি নির্বাচন করুন");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", {
        uri: photoUri,
        name: "student_photo.jpg",
        type: "image/jpeg",
      });

      const [uploadedPhoto] = await uploadImages(formData);

      const payload = { ...values,image: uploadedPhoto,schoolId };



      await axios.post(
        `${API_URL}/api/school/achivement/uploadAchievement`,
        payload
      );

      Alert.alert("✅ সফলভাবে আপলোড হয়েছে");
      resetForm();
      setPhotoUri(null);
    } catch (err) {
      console.error(err);
      Alert.alert("ত্রুটি", "কিছু ভুল হয়েছে, আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#EEF2FF", "#FFFFFF"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* 🌟 Header */}
          <LinearGradient
            colors={["#558ddbff", "#0c7fd1ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>🎓 স্কুলের অর্জন আপলোড</Text>
            <Text style={styles.headerSubtitle}>
              শিক্ষার্থীর তথ্য ও অর্জনের বিবরণ দিন
            </Text>
          </LinearGradient>

          {/* 🧾 Form Section */}
          <Formik
            initialValues={{
              studentName: "",
              studentRoll: "",
              batch: "",
              sessionYear: "",
              achievementTitle: "",
              achievementName: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmitForm}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={styles.formCard}>
                {/* 📸 Image Picker */}
                <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
                  <LinearGradient
                    colors={["#4a82d1ff", "#176cb5ff"]}
                    style={styles.imageWrapper}
                  >
                    <Image
                      source={{
                        uri:
                          photoUri ||
                          "https://cdn-icons-png.flaticon.com/512/847/847969.png",
                      }}
                      style={styles.photo}
                    />
                  </LinearGradient>
                  <Text style={styles.imageText}>শিক্ষার্থীর ছবি নির্বাচন করুন</Text>
                </TouchableOpacity>

                {/* Input Fields */}
                {[
                  { name: "studentName", label: "শিক্ষার্থীর নাম", placeholder: "নাম লিখুন" },
                  { name: "studentRoll", label: "রোল/আইডি", placeholder: "রোল/আইডি লিখুন"},
                  { name: "batch", label: "ব্যাচ", placeholder: "ব্যাচ লিখুন" },
                  { name: "sessionYear", label: "সেশন বছর", placeholder: "যেমনঃ ২০২৪-২০২৫" },
                  { name: "achievementTitle", label: "শিরোনাম", placeholder: "যেমনঃ জাতীয় পুরস্কার" },
                  { name: "achievementName", label: "অর্জনের নাম", placeholder: "যেমনঃ প্রথম স্থান বিজ্ঞান মেলা" },
                ].map((field, index) => (
                  <View style={styles.inputGroup} key={index}>
                    <Text style={styles.label}>{field.label}</Text>
                    <TextInput
                      style={styles.input}
                      placeholder={field.placeholder}
                      keyboardType={field.type || "default"}
                      value={values[field.name]}
                      onChangeText={handleChange(field.name)}
                      onBlur={handleBlur(field.name)}
                    />
                    {errors[field.name] && touched[field.name] && (
                      <Text style={styles.error}>{errors[field.name]}</Text>
                    )}
                  </View>
                ))}

                {/* Submit */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[styles.submitButton, loading && { opacity: 0.7 }]}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>📤 আপলোড করুন</Text>
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
    padding: 20,

  },
  header: {
    paddingVertical: 25,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E0E7FF",
    marginTop: 5,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    marginBottom:30
  },
  imageBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageWrapper: {
    borderRadius: 100,
    padding: 4,
  },
  photo: {
    width: 130,
    height: 130,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#fff",
  },
  imageText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#111827",
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#4976d5ff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
