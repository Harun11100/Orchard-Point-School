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
  StatusBar,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { uploadImages } from "../request/UploadImages";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";

const API_URL = Constants.expoConfig?.extra?.API_URL || "";

// Validation schema
const validationSchema = Yup.object().shape({
  schoolName: Yup.string().required("প্রতিষ্ঠানের নাম আবশ্যক"),
  principalName: Yup.string().required("প্রধান শিক্ষকের নাম আবশ্যক"),
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নাম্বার ১১ সংখ্যার হতে হবে")
    .required("ফোন নাম্বার আবশ্যক"),
  contactNumber: Yup.string()
    .matches(/^[0-9]{11}$/, "যোগাযোগ নাম্বার ১১ সংখ্যার হতে হবে")
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
  const [focusedField, setFocusedField] = useState(null);

  // Load school data from params
  useEffect(() => {
    if (params.schoolData) {
      try {
        const parsed = JSON.parse(params.schoolData);
        setSchoolData(parsed);
        setLogoUri(parsed.logo?.url || parsed.logo || null);
        setCoverUri(parsed.cover?.url || parsed.cover || null);
      } catch (err) {
        console.error("Failed to parse schoolData:", err);
      }
    }
  }, [params.schoolData]);

  // Image picker handler
  const pickImage = async (type = "cover") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("অনুমতি প্রয়োজন", "গ্যালারি অ্যাক্সেস করতে অনুমতি দিন");
      return;
    }

    try {
      if (type === "logo") setProcessingLogo(true);
      else setProcessingCover(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "logo" ? [1, 1] : [16, 9],
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
      Alert.alert("ত্রুটি", "ছবি প্রক্রিয়াকরণ করা সম্ভব হয়নি।");
    } finally {
      if (type === "logo") setProcessingLogo(false);
      else setProcessingCover(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "লগ আউট করুন?",
      "আপনি কি নিশ্চিত লগ আউট করতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "লগ আউট",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("schoolData");
              await AsyncStorage.removeItem("schoolDetails");
              await SecureStore.deleteItemAsync("auth_token");
              router.replace("/ChooseRoleScreen");
            } catch (error) {
              console.error("❌ Error during logout:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Form submit
  const onFormSubmit = async (values) => {
    setLoading(true);
    try {
      let logoUrl = logoUri;
      let coverUrl = coverUri;

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

      Alert.alert("🎉 সফল হয়েছে", "ডেটা সফলভাবে আপডেট করা হয়েছে!");
    } catch (error) {
      console.error("Update error:", error.response || error);
      Alert.alert(
        "❌ ত্রুটি",
        error.response?.data?.message || "কিছু ভুল হয়েছে, আবার চেষ্টা করুন"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!schoolData)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>তথ্য লোড হচ্ছে...</Text>
      </View>
    );

  const formFields = [
    {
      label: "প্রতিষ্ঠানের নাম",
      field: "schoolName",
      placeholder: "যেমন: ধানমন্ডি উচ্চ বিদ্যালয়",
      icon: "home",
    },
    {
      label: "প্রধান শিক্ষকের নাম",
      field: "principalName",
      placeholder: "যেমন: মো: রফিকুল ইসলাম",
      icon: "user",
    },
    {
      label: "ফোন নাম্বার",
      field: "phone",
      placeholder: "০১৭XXXXXXXX",
      icon: "phone",
      keyboard: "phone-pad",
    },
    {
      label: "যোগাযোগ নাম্বার",
      field: "contactNumber",
      placeholder: "০১৮XXXXXXXX",
      icon: "smartphone",
      keyboard: "phone-pad",
    },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Modern Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.topHeaderTitle}>প্রোফাইল সেটিংস</Text>

        <TouchableOpacity
          style={[styles.headerIconButton, styles.logoutBtn]}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Media Section (Cover + Logo) */}
          <View style={styles.mediaCard}>
            {/* Cover Picker */}
            <TouchableOpacity
              style={styles.coverBox}
              onPress={() => pickImage("cover")}
              activeOpacity={0.9}
            >
              {processingCover ? (
                <View style={styles.mediaLoader}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#94A3B8" />
                  <Text style={styles.coverPlaceholderText}>
                    কভার ছবি পরিবর্তন করুন
                  </Text>
                </View>
              )}

              <View style={styles.coverEditBadge}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Floating Logo Picker */}
            <View style={styles.logoWrapper}>
              <TouchableOpacity
                style={styles.logoBox}
                onPress={() => pickImage("logo")}
                activeOpacity={0.85}
              >
                {processingLogo ? (
                  <View style={styles.logoLoader}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                ) : logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImage} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Feather name="shield" size={30} color="#94A3B8" />
                  </View>
                )}

                <View style={styles.logoEditBadge}>
                  <Ionicons name="camera" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Card Section */}
          <Formik
            initialValues={{
              principalName: schoolData.principalName || "",
              schoolName: schoolData.schoolName || "",
              email: schoolData.email || "",
              phone: schoolData.phone || "",
              contactNumber: schoolData.contactNumber || "",
            }}
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
              <View style={styles.formCard}>
                <View style={styles.sectionHeader}>
                  <Feather name="edit-3" size={16} color="#2563EB" />
                  <Text style={styles.sectionTitle}>মূল তথ্য পরিবর্তন</Text>
                </View>

                {formFields.map((item) => {
                  const hasError = errors[item.field] && touched[item.field];
                  const isFocused = focusedField === item.field;

                  return (
                    <View style={styles.inputGroup} key={item.field}>
                      <Text style={styles.label}>{item.label}</Text>
                      <View
                        style={[
                          styles.inputWrapper,
                          isFocused && styles.inputWrapperFocused,
                          hasError && styles.inputWrapperError,
                        ]}
                      >
                        <Feather
                          name={item.icon}
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
                          placeholder={item.placeholder}
                          placeholderTextColor="#9CA3AF"
                          value={values[item.field]}
                          onChangeText={handleChange(item.field)}
                          onFocus={() => setFocusedField(item.field)}
                          onBlur={(e) => {
                            handleBlur(item.field)(e);
                            setFocusedField(null);
                          }}
                          keyboardType={item.keyboard || "default"}
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
                            {errors[item.field]}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.submitBtnWrapper}
                >
                  <LinearGradient
                    colors={
                      loading
                        ? ["#9CA3AF", "#6B7280"]
                        : ["#2563EB", "#1D4ED8"]
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
                          name="checkmark-circle-outline"
                          size={20}
                          color="#FFFFFF"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.submitText}>আপডেট করুন</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
  },
  /* Top App Bar */
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutBtn: {
    backgroundColor: "#FEF2F2",
  },
  /* Scroll Body */
  scrollContent: {
    paddingBottom: 40,
  },
  /* Media Card Header */
  mediaCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  coverBox: {
    height: 160,
    width: "100%",
    backgroundColor: "#E2E8F0",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  coverPlaceholderText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  coverEditBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaLoader: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  /* Floating Profile Logo */
  logoWrapper: {
    alignItems: "center",
    marginTop: -50,
    paddingBottom: 16,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
    resizeMode: "cover",
  },
  logoPlaceholder: {
    flex: 1,
    borderRadius: 50,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  logoLoader: {
    flex: 1,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#2563EB",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  /* Form Box */
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 8,
  },
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
  submitBtnWrapper: {
    marginTop: 12,
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