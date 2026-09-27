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
import { Formik } from "formik";
import * as Yup from "yup";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { uploadImages } from "../request/UploadImages";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig?.extra?.API_URL;

// Validation Schema
const validationSchema = Yup.object().shape({
  eventName: Yup.string().required("ইভেন্টের নাম আবশ্যক"),
  caption: Yup.string().required("ক্যাপশন আবশ্যক"),
});

export default function SchoolAlbumUploadScreen() {
  const { schoolId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  // Pick Image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "অনুমতি প্রয়োজন",
        "গ্যালারি অ্যাক্সেস করতে অনুগ্রহ করে অনুমতি দিন।"
      );
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error("pickImage error:", err);
      Alert.alert("ত্রুটি", "ছবি নির্বাচন করতে ব্যর্থ হয়েছে।");
    }
  };

  // Date selection
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  // Form submission
  const onFormSubmit = async (values, { resetForm }) => {
    if (!photoUri) {
      Alert.alert("ছবি আবশ্যক", "অনুগ্রহ করে অ্যালবামটির জন্য একটি ছবি বেছে নিন।");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: photoUri,
        type: "image/jpeg",
        name: "photo.jpg",
      });

      const uploadedPhotos = await uploadImages(formData);
      const uploadedPhoto = uploadedPhotos[0];

      const payload = {
        caption: values.caption,
        eventName: values.eventName,
        uploadedAt: date,
        schoolId,
        photo: uploadedPhoto,
      };

      await axios.post(`${API_URL}/api/school/Album/uploadAlbum`, payload);

      Alert.alert("🎉 সফল!", "অ্যালবামটি সফলভাবে আপলোড হয়েছে!");
      resetForm();
      setPhotoUri(null);
      setDate(new Date());
    } catch (error) {
      console.error("upload error:", error.response || error);
      Alert.alert(
        "❌ ত্রুটি",
        error.response?.data?.message || "কিছু ভুল হয়েছে, আবার চেষ্টা করুন"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>গ্যালারি আপলোড</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Title Section */}
          <View style={styles.heroSection}>
            <Text style={styles.title}>🏫 স্কুল অ্যালবাম আপলোড</Text>
            <Text style={styles.subtitle}>
              স্মৃতিগুলো ধরে রাখতে নতুন ইভেন্টের ছবি যুক্ত করুন
            </Text>
          </View>

          <Formik
            initialValues={{ eventName: "", caption: "" }}
            validationSchema={validationSchema}
            onSubmit={onFormSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={styles.cardContainer}>
                {/* 📸 Image Picker Drop-Zone */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ইভেন্টের ছবি *</Text>
                  <TouchableOpacity
                    style={[
                      styles.imageUploadBox,
                      photoUri && styles.imageUploadBoxActive,
                    ]}
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    {photoUri ? (
                      <View style={styles.previewContainer}>
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.previewPhoto}
                        />
                        <TouchableOpacity
                          style={styles.changeBadge}
                          onPress={pickImage}
                        >
                          <Ionicons name="camera-reverse" size={16} color="#FFF" />
                          <Text style={styles.changeBadgeText}>পরিবর্তন</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <View style={styles.iconCircle}>
                          <Ionicons
                            name="cloud-upload-outline"
                            size={28}
                            color="#4F46E5"
                          />
                        </View>
                        <Text style={styles.uploadTitle}>
                          ছবি যুক্ত করতে এখানে ট্যাপ করুন
                        </Text>
                        <Text style={styles.uploadSubtext}>
                          PNG, JPG বা JPEG ফরম্যাট
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 📝 Event Name Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ইভেন্টের নাম *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      touched.eventName && errors.eventName && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="pricetag-outline"
                      size={20}
                      color="#64748B"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="যেমন: বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৬"
                      placeholderTextColor="#94A3B8"
                      value={values.eventName}
                      onChangeText={handleChange("eventName")}
                      onBlur={handleBlur("eventName")}
                      returnKeyType="next"
                    />
                  </View>
                  {touched.eventName && errors.eventName && (
                    <Text style={styles.errorText}>{errors.eventName}</Text>
                  )}
                </View>

                {/* ✏️ Caption Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ক্যাপশন *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      styles.multilineWrapper,
                      touched.caption && errors.caption && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={20}
                      color="#64748B"
                      style={[styles.inputIcon, { marginTop: 12 }]}
                    />
                    <TextInput
                      style={[styles.textInput, styles.multilineInput]}
                      placeholder="ছবিটির সম্পর্কে বিস্তারিত লিখুন..."
                      placeholderTextColor="#94A3B8"
                      value={values.caption}
                      onChangeText={handleChange("caption")}
                      onBlur={handleBlur("caption")}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  {touched.caption && errors.caption && (
                    <Text style={styles.errorText}>{errors.caption}</Text>
                  )}
                </View>

                {/* 📅 Date Picker Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ইভেন্টের তারিখ</Text>
                  <TouchableOpacity
                    style={styles.dateSelector}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="calendar-clear-outline"
                      size={20}
                      color="#4F46E5"
                    />
                    <Text style={styles.dateSelectorText}>
                      {date ? date.toLocaleDateString("bn-BD", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : "তারিখ নির্বাচন করুন"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="default"
                      onChange={onChangeDate}
                    />
                  )}
                </View>

                {/* 🚀 Gradient Submit Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.submitBtnContainer}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={["#6366F1", "#4F46E5"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientSubmitBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="cloud-upload"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.submitBtnText}>
                          অ্যালবাম আপলোড করুন
                        </Text>
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
  screenContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 42,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  /* Image Upload Area */
  imageUploadBox: {
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
    minHeight: 170,
    justifyContent: "center",
  },
  imageUploadBoxActive: {
    borderStyle: "solid",
    borderColor: "#6366F1",
    backgroundColor: "#FFFFFF",
  },
  uploadPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 2,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#94A3B8",
  },
  previewContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  previewPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  changeBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  changeBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  /* Form Inputs */
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  multilineWrapper: {
    alignItems: "flex-start",
  },
  inputError: {
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
    paddingVertical: 12,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    fontWeight: "500",
  },
  /* Date Selector */
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
    marginLeft: 10,
  },
  /* Submit Button */
  submitBtnContainer: {
    marginTop: 10,
    borderRadius: 14,
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
    paddingVertical: 15,
    gap: 8,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});