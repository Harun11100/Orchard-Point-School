import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uploadImages } from "../request/UploadImages";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
// ✅ Validation schema
const validationSchema = Yup.object().shape({
  schoolName: Yup.string().required("প্রতিষ্ঠানের নাম আবশ্যক"),
  principalName: Yup.string().required("মালিকের নাম আবশ্যক"),
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নাম্বার ১১ সংখ্যার হতে হবে")
    .required("ফোন নাম্বার আবশ্যক"),
  contactNumber: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নাম্বার ১১ সংখ্যার হতে হবে")
    .required("যোগাযোগ নাম্বার আবশ্যক"),
});

export default function SchoolSettingsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [schoolData, setSchoolData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logoUri, setLogoUri] = useState(null);
  const [coverUri, setCoverUri] = useState(null);
  const [processingLogo, setProcessingLogo] = useState(false);
  const [processingCover, setProcessingCover] = useState(false);

  // ✅ Load school data from params
  useEffect(() => {
    if (params.schoolData) {
      try {
        const parsed = JSON.parse(params.schoolData);
        setSchoolData(parsed);
        setLogoUri(parsed.logo?.url || null);
        setCoverUri(parsed.cover?.url || null);
      } catch (err) {
        console.error("Failed to parse schoolData:", err);
      }
    }
  }, [params.schoolData]);

  // ✅ Image picker handler
  const pickImage = async (type = "cover") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Cannot access gallery without permission");
      return;
    }

    try {
      if (type === "logo") setProcessingLogo(true);
      else setProcessingCover(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;
      const picked = result.assets[0];

      const manipulated = await ImageManipulator.manipulateAsync(
        picked.uri,
        [{ resize: { width: type === "logo" ? 800 : 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      if (type === "logo") setLogoUri(manipulated.uri);
      else setCoverUri(manipulated.uri);
    } catch (err) {
      console.error("pickImage error:", err);
      Alert.alert("Error", "Could not process the selected image.");
    } finally {
      if (type === "logo") setProcessingLogo(false);
      else setProcessingCover(false);
    }
  };

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("schoolData");
      await AsyncStorage.removeItem("schoolDetails");
      console.log("✅ School data removed successfully.");
      router.push("/ChooseRoleScreen");
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  };

  // ✅ Form submit
  const onFormSubmit = async (values) => {
    setLoading(true);
    try {
      let logoUrl = logoUri;
      let coverUrl = coverUri;

      // Upload logo if it's new
      if (logoUri && !logoUri.startsWith("http")) {
        const formData = new FormData();
        formData.append("file", {
          uri: logoUri,
          type: "image/jpeg",
          name: "logo.jpg",
        });
        const [uploadedLogo] = await uploadImages(formData);
        logoUrl = uploadedLogo;
      }

      // Upload cover if it's new
      if (coverUri && !coverUri.startsWith("http")) {
        const formData = new FormData();
        formData.append("file", {
          uri: coverUri,
          type: "image/jpeg",
          name: "cover.jpg",
        });
        const [uploadedCover] = await uploadImages(formData);
        coverUrl = uploadedCover;
      }

      const payload = {
        ...values,
        logo: logoUrl,
        cover: coverUrl,
        schoolId: schoolData._id,
      };

      await axios.put(`${API_URL}/api/school/updateSchool`, payload);

      Alert.alert("✅ Success", "ডেটা সফলভাবে আপডেট হয়েছে!");
    } catch (error) {
      console.error("Update error:", error.response || error);
      Alert.alert("❌ ত্রুটি", error.response?.data?.message || "কিছু ভুল হয়েছে, আবার চেষ্টা করুন");
    } finally {
      setLoading(false);
    }
  };

  if (!schoolData)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1b3569ff" />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={handleLogout} style={styles.logout}>
          <MaterialIcons name="logout" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>প্রোফাইল সেটিংস</Text>

        <Formik
          initialValues={{
            principalName: schoolData.principalName || "",
            schoolName: schoolData.schoolName || "",
             email:schoolData.email ||"", 
            phone: schoolData.phone || "",
            contactNumber: schoolData.contactNumber || "",
          }}
          validationSchema={validationSchema}
          onSubmit={onFormSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              {/* ✅ Cover Image */}
              <TouchableOpacity style={styles.imageBox} onPress={() => pickImage("cover")}>
                {processingCover ? (
                  <View style={[styles.coverPlaceholder, styles.processing]}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                ) : coverUri ? (
                  <Image source={{ uri: coverUri }} style={styles.coverImage} />
                ) : (
                  <Image
                    source={require("../assets/icons/bidyaloy.png")}
                    style={styles.coverImage}
                  />
                )}
              </TouchableOpacity>

              {/* ✅ Logo */}
              <TouchableOpacity style={styles.logoBox} onPress={() => pickImage("logo")}>
                {processingLogo ? (
                  <View style={[styles.logoPlaceholder, styles.processing]}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImage} />
                ) : (
                  <Image
                    source={require("../assets/icons/bidyaloy.png")}
                    style={styles.logoImage}
                  />
                )}
              </TouchableOpacity>

              {/* ✅ Input Fields */}
              {[
                { label: "প্রতিষ্ঠানের নাম", field: "schoolName" },
                { label: "মালিকের নাম", field: "principalName" },
                { label: "ইমেইল ঠিকানা", field: "email" },
                { label: "ফোন নাম্বার", field: "phone", keyboard: "phone-pad" },
                { label: "যোগাযোগ নাম্বার", field: "contactNumber", keyboard: "phone-pad" },
              ].map((item) => (
                <View style={styles.inputGroup} key={item.field}>
                  <Text style={styles.label}>{item.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={`${item.label} লিখুন`}
                    value={values[item.field]}
                    onChangeText={handleChange(item.field)}
                    onBlur={handleBlur(item.field)}
                    keyboardType={item.keyboard || "default"}
                  />
                  {errors[item.field] && touched[item.field] && (
                    <Text style={styles.error}>{errors[item.field]}</Text>
                  )}
                </View>
              ))}

              {/* ✅ Submit Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>আপডেট করুন</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#F3F4F6", flexGrow: 1 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15, color: "#1d4aa5ff", textAlign: "center" },
  form: { flex: 1 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#3c3c3cff",
  },
  error: { color: "#EF4444", fontSize: 13, marginTop: 4 },
  imageBox: { marginVertical: 10, alignItems: "center" },
  coverImage: { width: "100%", height: 150, borderRadius: 10, resizeMode: "cover" },
  coverPlaceholder: { width: "100%", height: 150, borderRadius: 10, backgroundColor: "#d0dfd7ff", alignItems: "center", justifyContent: "center" },
  logoBox: { marginVertical: 8, alignItems: "center" },
  logoImage: { width: 110, height: 110, borderRadius: 55, resizeMode: "cover", marginTop: -75, borderColor: "#145eb8ff", borderWidth: 4 },
  logoPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#d0dfd7ff", alignItems: "center", justifyContent: "center" },
  processing: { opacity: 0.9, backgroundColor: "#00000066" },
  submitButton: { marginTop: 20,marginBottom:40, backgroundColor: "#2d6ecfff", padding: 15, borderRadius: 12, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  logout: { position: "absolute", top: 10, right: 20, backgroundColor: "#256cbeff", padding: 8, borderRadius: 30, zIndex: 10 },
  branding: { textAlign: "center", color: "#aaa", fontSize: 12, marginTop: 30 },
});
