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
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { uploadImages } from "../request/UploadImages";

const API_URL = Constants.expoConfig?.extra?.API_URL || "";

// Validation Schema
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
  const [focusedField, setFocusedField] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("অনুমতি প্রয়োজন", "গ্যালারি অ্যাক্সেস করতে অনুমতি দিন");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmitForm = async (values, { resetForm }) => {
    if (!photoUri) {
      Alert.alert("ত্রুটি", "অনুগ্রহ করে শিক্ষার্থীর ছবি যুক্ত করুন");
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
      const payload = { ...values, image: uploadedPhoto, schoolId };

      await axios.post(
        `${API_URL}/api/school/achivement/uploadAchievement`,
        payload
      );

      Alert.alert("🎉 সফল হয়েছে", "অর্জনের তথ্য সফলভাবে আপলোড করা হয়েছে!");
      resetForm();
      setPhotoUri(null);
    } catch (err) {
      console.error(err);
      Alert.alert("ত্রুটি", "কিছু ভুল হয়েছে, আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    {
      section: "শিক্ষার্থীর তথ্য",
      icon: "person-outline",
      fields: [
        {
          name: "studentName",
          label: "শিক্ষার্থীর নাম",
          placeholder: "যেমন: আব্দুল্লাহ আল মামুন",
          icon: "user",
        },
        {
          name: "studentRoll",
          label: "রোল / আইডি",
          placeholder: "যেমন: ১০২৪",
          icon: "hash",
          type: "numeric",
        },
        {
          name: "batch",
          label: "ব্যাচ (ঐচ্ছিক)",
          placeholder: "যেমন: SSC-2024",
          icon: "users",
        },
        {
          name: "sessionYear",
          label: "সেশন বছর",
          placeholder: "যেমন: ২০২৪-২০২৫",
          icon: "calendar",
        },
      ],
    },
    {
      section: "অর্জনের বিবরণ",
      icon: "trophy-outline",
      fields: [
        {
          name: "achievementTitle",
          label: "শিরোনাম",
          placeholder: "যেমন: জাতীয় প্রতিযোগিতা / বার্ষিক ক্রীড়া",
          icon: "award",
        },
        {
          name: "achievementName",
          label: "অর্জনের নাম/স্থান",
          placeholder: "যেমন: ১ম স্থান - গণিত অলিম্পিয়াড",
          icon: "star",
        },
      ],
    },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Banner */}
          <LinearGradient
            colors={["#3B82F6", "#1D4ED8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBanner}
          >
            <View style={styles.headerIconBadge}>
              <Ionicons name="trophy" size={28} color="#FBBF24" />
            </View>
            <Text style={styles.headerTitle}>নতুন অর্জন যুক্ত করুন</Text>
            <Text style={styles.headerSubtitle}>
              শিক্ষার্থীর সাফল্য ও অর্জনের তথ্য লিপিবদ্ধ করুন
            </Text>
          </LinearGradient>

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
              <View style={styles.formContainer}>
                {/* 📸 Image Upload Card */}
                <View style={styles.imageCard}>
                  <TouchableOpacity
                    style={styles.avatarWrapper}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Feather name="user" size={42} color="#9CA3AF" />
                      </View>
                    )}

                    <View style={styles.cameraBadge}>
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.imageCardTitle}>
                    {photoUri ? "ছবি পরিবর্তন করুন" : "শিক্ষার্থীর ছবি আপলোড করুন"}
                  </Text>
                  <Text style={styles.imageCardSubtitle}>
                    স্পষ্ট পাসপোর্ট সাইজের ছবি নির্বাচন করুন
                  </Text>
                </View>

                {/* 🧾 Dynamic Sections */}
                {formFields.map((section, sIdx) => (
                  <View key={sIdx} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name={section.icon}
                        size={18}
                        color="#2563EB"
                        style={styles.sectionHeaderIcon}
                      />
                      <Text style={styles.sectionHeaderText}>
                        {section.section}
                      </Text>
                    </View>

                    {section.fields.map((field) => {
                      const hasError =
                        errors[field.name] && touched[field.name];
                      const isFocused = focusedField === field.name;

                      return (
                        <View style={styles.inputGroup} key={field.name}>
                          <Text style={styles.label}>{field.label}</Text>
                          <View
                            style={[
                              styles.inputWrapper,
                              isFocused && styles.inputWrapperFocused,
                              hasError && styles.inputWrapperError,
                            ]}
                          >
                            <Feather
                              name={field.icon}
                              size={18}
                              color={
                                hasError
                                  ? "#EF4444"
                                  : isFocused
                                  ? "#2563EB"
                                  : "#9CA3AF"
                              }
                              style={styles.fieldIcon}
                            />
                            <TextInput
                              style={styles.input}
                              placeholder={field.placeholder}
                              placeholderTextColor="#9CA3AF"
                              keyboardType={field.type || "default"}
                              value={values[field.name]}
                              onChangeText={handleChange(field.name)}
                              onFocus={() => setFocusedField(field.name)}
                              onBlur={(e) => {
                                handleBlur(field.name)(e);
                                setFocusedField(null);
                              }}
                            />
                          </View>
                          {hasError && (
                            <View style={styles.errorRow}>
                              <Ionicons
                                name="alert-circle"
                                size={13}
                                color="#EF4444"
                              />
                              <Text style={styles.errorText}>
                                {errors[field.name]}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}

                {/* 🚀 Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.submitBtnWrapper}
                >
                  <LinearGradient
                    colors={
                      loading ? ["#9CA3AF", "#6B7280"] : ["#2563EB", "#1D4ED8"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="cloud-upload-outline"
                          size={20}
                          color="#FFFFFF"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.submitText}>তথ্য জমা দিন</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  /* Header */
  headerBanner: {
    paddingTop: Platform.OS === "ios" ? 55 : 40,
    paddingBottom: 35,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
  },
  headerIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#DBEAFE",
    marginTop: 4,
    textAlign: "center",
  },
  /* Form Base */
  formContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  /* Image Upload Section */
  imageCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#2563EB",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#2563EB",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  imageCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  imageCardSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  /* Section Box */
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionHeaderIcon: {
    marginRight: 8,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  /* Input Fields */
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#334155",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperFocused: {
    borderColor: "#2563EB",
    backgroundColor: "#FFFFFF",
  },
  inputWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    height: "100%",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingLeft: 2,
  },
  errorText: {
    fontSize: 11,
    color: "#EF4444",
    marginLeft: 4,
  },
  /* Submit Button */
  submitBtnWrapper: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});