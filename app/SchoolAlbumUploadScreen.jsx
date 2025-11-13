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

const API_URL = Constants.expoConfig.extra.API_URL;

// ✅ Validation schema
const validationSchema = Yup.object().shape({
  eventName: Yup.string().required("আবশ্যক"),
  caption: Yup.string().required("আবশ্যক"),
});

export default function SchoolAlbumUploadScreen() {
  const { schoolId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  // 🖼️ Pick an image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Cannot access gallery without permission");
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) setPhotoUri(result.assets[0].uri);
    } catch (err) {
      console.error("pickImage error:", err);
      Alert.alert("Error", "Could not process the selected image.");
    }
  };

  // 📅 Date selection
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  // 🚀 Form submission
// 🚀 Form submission
const onFormSubmit = async (values, { resetForm }) => {
  if (!photoUri) {
    Alert.alert("ত্রুটি", "ফটো নির্বাচন করুন");
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

    const uploadedPhotos = await uploadImages(formData); // single photo object
    const uploadedPhoto = uploadedPhotos[0];
    // Construct payload with single photo object
   const payload = {
    caption: values.caption,
    eventName: values.eventName,
    uploadedAt: date, // or new Date()
    schoolId,
    photo: uploadedPhoto, // uploadedPhoto = { public_id, url }
  };


    await axios.post(`${API_URL}/api/school/Album/uploadAlbum`, payload);

    Alert.alert("সফল", "অ্যালবামটি সফলভাবে আপলোড হয়েছে!");
    resetForm();
    setPhotoUri(null);
  } catch (error) {
    console.error("upload error:", error.response || error);
    Alert.alert(
      "ত্রুটি",
      error.response?.data?.message || "কিছু ভুল হয়েছে, আবার চেষ্টা করুন"
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <LinearGradient colors={["#EEF2FF", "#E0E7FF"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        
          <Text style={styles.title}>🏫 স্কুল অ্যালবাম আপলোড</Text>
          <Text style={styles.subtitle}>ইভেন্টের ছবি যুক্ত করুন</Text>

          <Formik
            initialValues={{ eventName: "", caption: "" }}
            validationSchema={validationSchema}
            onSubmit={onFormSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <View style={styles.form}>
                {/* 📸 Image Picker */}
                <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
                  <LinearGradient
                    colors={["#318acaff", "#417adcff"]}
                    style={styles.imageWrapper}
                  >
                    {photoUri ? (
                      <Image source={{ uri: photoUri }} style={styles.photo} />
                    ) : (
                      <Image
                        source={require("../assets/image/no-image.jpg")}
                        style={styles.photo}
                      />
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* 📝 Event Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ইভেন্টের নাম</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Event Name লিখুন"
                    value={values.eventName}
                    onChangeText={handleChange("eventName")}
                    onBlur={handleBlur("eventName")}
                    returnKeyType="next"
                  />
                  {errors.eventName && touched.eventName && (
                    <Text style={styles.error}>{errors.eventName}</Text>
                  )}
                </View>

                {/* ✏️ Caption */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ক্যাপশন</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Caption লিখুন"
                    value={values.caption}
                    onChangeText={handleChange("caption")}
                    onBlur={handleBlur("caption")}
                    multiline
                  />
                  {errors.caption && touched.caption && (
                    <Text style={styles.error}>{errors.caption}</Text>
                  )}
                </View>

                {/* 📅 Date Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>তারিখ</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: date ? "#000" : "#9ca3af" }}>
                      {date ? date.toLocaleDateString() : "তারিখ নির্বাচন করুন"}
                    </Text>
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

                {/* 🚀 Submit */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
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
    padding: 15,
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    color: "#3055bcff",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 25,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 50,
  },
  imageBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageWrapper: {
    borderRadius: 16,
    padding: 4,
  },
  photo: {
    width: 200,
    height: 180,
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dateInput: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  error: {
    color: "red",
    fontSize: 13,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: "#397edeff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
