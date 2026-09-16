import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";

import { Formik } from "formik";
import * as Yup from "yup";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

import Checkbox from "expo-checkbox";

import { uploadImages } from "../request/UploadImages";

// ----------------------------------------------------
// API URL
// ----------------------------------------------------

const API_URL = Constants.expoConfig?.extra?.API_URL;

// ----------------------------------------------------
// Validation
// ----------------------------------------------------

const validationSchema = Yup.object().shape({
  schoolName: Yup.string()
    .trim()
    .required("স্কুলের নাম লিখুন"),

  principalName: Yup.string()
    .trim()
    .required("প্রধান শিক্ষকের নাম লিখুন"),

  email: Yup.string()
    .trim()
    .email("সঠিক ইমেইল দিন")
    .required("ইমেইল লিখুন"),

  phone: Yup.string()
    .trim()
    .matches(
      /^(?:\+8801|01)[3-9]\d{8}$/,
      "সঠিক মোবাইল নম্বর দিন"
    )
    .required("মোবাইল নম্বর লিখুন"),

  password: Yup.string()
    .min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
    .required("পাসওয়ার্ড লিখুন"),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "পাসওয়ার্ড মিলছে না")
    .required("পাসওয়ার্ড আবার লিখুন"),

  terms: Yup.boolean()
    .oneOf([true], "Terms & Conditions গ্রহণ করুন"),
});

// ----------------------------------------------------
// Component
// ----------------------------------------------------

export default function SchoolRegisterScreen() {
  const router = useRouter();

  const [logoUri, setLogoUri] = useState(null);
  const [coverUri, setCoverUri] = useState(null);

  const [processingLogo, setProcessingLogo] = useState(false);
  const [processingCover, setProcessingCover] = useState(false);

  // --------------------------------------------------
  // Pick Image
  // --------------------------------------------------

  const pickImage = async (type) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "অনুমতি প্রয়োজন",
          "ছবি নির্বাচন করার জন্য Gallery permission দিতে হবে।"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const selectedUri = result.assets[0].uri;

      if (type === "logo") {
        setProcessingLogo(true);

        const manipulated = await ImageManipulator.manipulateAsync(
          selectedUri,
          [
            {
              resize: {
                width: 800,
              },
            },
          ],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        setLogoUri(manipulated.uri);
        setProcessingLogo(false);
      }

      if (type === "cover") {
        setProcessingCover(true);

        const manipulated = await ImageManipulator.manipulateAsync(
          selectedUri,
          [
            {
              resize: {
                width: 1200,
              },
            },
          ],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        setCoverUri(manipulated.uri);
        setProcessingCover(false);
      }
    } catch (error) {
      console.error("Image picker error:", error);

      setProcessingLogo(false);
      setProcessingCover(false);

      Alert.alert(
        "ত্রুটি",
        "ছবি নির্বাচন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।"
      );
    }
  };

  // --------------------------------------------------
  // Submit
  // --------------------------------------------------

  const handleRegister = async (values, { setSubmitting, resetForm }) => {
    try {
      if (!API_URL) {
        throw new Error(
          "API URL পাওয়া যায়নি। app.config.js / app.json চেক করুন।"
        );
      }

      // ----------------------------------------------
      // Upload images
      // ----------------------------------------------

      let logoUrl = "";
      let coverUrl = "";

      if (logoUri || coverUri) {
        const formData = new FormData();

        if (logoUri) {
          formData.append("images", {
            uri: logoUri,
            name: "school-logo.jpg",
            type: "image/jpeg",
          });
        }

        if (coverUri) {
          formData.append("images", {
            uri: coverUri,
            name: "school-cover.jpg",
            type: "image/jpeg",
          });
        }

        const uploadedImages = await uploadImages(formData);

        if (!uploadedImages || !Array.isArray(uploadedImages)) {
          throw new Error("ছবি আপলোড করা যায়নি।");
        }

        if (logoUri && uploadedImages[0]) {
          logoUrl = uploadedImages[0];
        }

        if (coverUri) {
          if (logoUri && uploadedImages[1]) {
            coverUrl = uploadedImages[1];
          } else if (!logoUri && uploadedImages[0]) {
            coverUrl = uploadedImages[0];
          }
        }
      }

      // ----------------------------------------------
      // Registration payload
      // ----------------------------------------------

      const payload = {
        schoolName: values.schoolName.trim(),
        principalName: values.principalName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,

        logo: logoUrl,
        cover: coverUrl,

        terms: values.terms,
      };

      console.log("School registration payload:", payload);

      // ----------------------------------------------
      // API Request
      // ----------------------------------------------

      const response = await axios.post(
        `${API_URL}/api/school/register`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // ----------------------------------------------
      // Success
      // ----------------------------------------------

      if (response.data?.success) {
        resetForm();

        setLogoUri(null);
        setCoverUri(null);

        Alert.alert(
          "নিবন্ধন সফল",
          response.data?.message ||
            "স্কুল সফলভাবে নিবন্ধিত হয়েছে। এখন লগইন করতে পারবেন।",
          [
            {
              text: "ঠিক আছে",
              onPress: () => {
                router.replace("/SchoolLoginScreen");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "নিবন্ধন ব্যর্থ",
          response.data?.message || "নিবন্ধন করা যায়নি।"
        );
      }
    } catch (error) {
      console.error(
        "School registration error:",
        error?.response?.data || error
      );

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।";

      Alert.alert("নিবন্ধন ব্যর্থ", message);
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>স্কুল নিবন্ধন</Text>

          <Text style={styles.subtitle}>
            আপনার স্কুলের তথ্য দিয়ে একটি অ্যাকাউন্ট তৈরি করুন
          </Text>
        </View>

        <Formik
          initialValues={{
            schoolName: "",
            principalName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            terms: false,
          }}
          validationSchema={validationSchema}
          onSubmit={handleRegister}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldValue,
            isSubmitting,
          }) => (
            <View>
              {/* --------------------------------------- */}
              {/* School Name */}
              {/* --------------------------------------- */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>স্কুলের নাম *</Text>

                <TextInput
                  style={[
                    styles.input,
                    touched.schoolName &&
                      errors.schoolName &&
                      styles.inputError,
                  ]}
                  placeholder="স্কুলের নাম লিখুন"
                  placeholderTextColor="#999"
                  value={values.schoolName}
                  onChangeText={handleChange("schoolName")}
                  onBlur={handleBlur("schoolName")}
                />

                {touched.schoolName && errors.schoolName && (
                  <Text style={styles.errorText}>
                    {errors.schoolName}
                  </Text>
                )}
              </View>

              {/* --------------------------------------- */}
              {/* Principal Name */}
              {/* --------------------------------------- */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>প্রধান শিক্ষকের নাম *</Text>

                <TextInput
                  style={[
                    styles.input,
                    touched.principalName &&
                      errors.principalName &&
                      styles.inputError,
                  ]}
                  placeholder="প্রধান শিক্ষকের নাম লিখুন"
                  placeholderTextColor="#999"
                  value={values.principalName}
                  onChangeText={handleChange("principalName")}
                  onBlur={handleBlur("principalName")}
                />

                {touched.principalName && errors.principalName && (
                  <Text style={styles.errorText}>
                    {errors.principalName}
                  </Text>
                )}
              </View>

              {/* --------------------------------------- */}
              {/* Email */}
              {/* --------------------------------------- */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>ইমেইল *</Text>

                <TextInput
                  style={[
                    styles.input,
                    touched.email && errors.email && styles.inputError,
                  ]}
                  placeholder="school@example.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                />

                {touched.email && errors.email && (
                  <Text style={styles.errorText}>
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* --------------------------------------- */}
              {/* Phone */}
              {/* --------------------------------------- */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>মোবাইল নম্বর *</Text>

                <TextInput
                  style={[
                    styles.input,
                    touched.phone && errors.phone && styles.inputError,
                  ]}
                  placeholder="01XXXXXXXXX"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={values.phone}
                  onChangeText={handleChange("phone")}
                  onBlur={handleBlur("phone")}
                  maxLength={14}
                />

                {touched.phone && errors.phone && (
                  <Text style={styles.errorText}>
                    {errors.phone}
                  </Text>
                )}
              </View>

              {/* --------------------------------------- */}
              {/* Password */}
              {/* --------------------------------------- */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>পাসওয়ার্ড *</Text>

                <TextInput
                  style={[
                    styles.input,
                    touched.password &&
                      errors.password &&
                      styles.inputError,
                  ]}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                />

                {touched.password && errors.password && (
                  <Text style={styles.errorText}>
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* --------------------------------------- */}
              {/* Confirm Password */}
              {/* --------------------------------------- */}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>পাসওয়ার্ড নিশ্চিত করুন *</Text>

                <TextInput
                  style={[
                    styles.input,
                    touched.confirmPassword &&
                      errors.confirmPassword &&
                      styles.inputError,
                  ]}
                  placeholder="পাসওয়ার্ড আবার লিখুন"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  value={values.confirmPassword}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                />

                {touched.confirmPassword &&
                  errors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword}
                    </Text>
                  )}
              </View>

              {/* --------------------------------------- */}
              {/* School Logo */}
              {/* --------------------------------------- */}

              <View style={styles.imageSection}>
                <Text style={styles.label}>স্কুলের লোগো</Text>

                {logoUri && (
                  <Image
                    source={{ uri: logoUri }}
                    style={styles.logoPreview}
                  />
                )}

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => pickImage("logo")}
                  disabled={processingLogo || isSubmitting}
                >
                  {processingLogo ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.imageButtonText}>
                      {logoUri
                        ? "লোগো পরিবর্তন করুন"
                        : "লোগো নির্বাচন করুন"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* --------------------------------------- */}
              {/* School Cover */}
              {/* --------------------------------------- */}

              <View style={styles.imageSection}>
                <Text style={styles.label}>স্কুলের কভার ছবি</Text>

                {coverUri && (
                  <Image
                    source={{ uri: coverUri }}
                    style={styles.coverPreview}
                  />
                )}

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={() => pickImage("cover")}
                  disabled={processingCover || isSubmitting}
                >
                  {processingCover ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.imageButtonText}>
                      {coverUri
                        ? "কভার ছবি পরিবর্তন করুন"
                        : "কভার ছবি নির্বাচন করুন"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* --------------------------------------- */}
              {/* Terms */}
              {/* --------------------------------------- */}

              <View style={styles.termsContainer}>
                <Checkbox
                  value={values.terms}
                  onValueChange={(value) =>
                    setFieldValue("terms", value)
                  }
                  color={values.terms ? "#4F7CAC" : undefined}
                />

                <Text style={styles.termsText}>
                  আমি Terms & Conditions গ্রহণ করছি।
                </Text>
              </View>

              {touched.terms && errors.terms && (
                <Text style={styles.errorText}>
                  {errors.terms}
                </Text>
              )}

              {/* --------------------------------------- */}
              {/* Register Button */}
              {/* --------------------------------------- */}

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isSubmitting && styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" />

                    <Text style={styles.registerButtonText}>
                      নিবন্ধন হচ্ছে...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.registerButtonText}>
                    স্কুল নিবন্ধন করুন
                  </Text>
                )}
              </TouchableOpacity>

              {/* --------------------------------------- */}
              {/* Login */}
              {/* --------------------------------------- */}

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push("/SchoolLoginScreen")}
              >
                <Text style={styles.loginText}>
                  ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ----------------------------------------------------
// Styles
// ----------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 25,
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#263238",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
  },

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263238",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D5DCE5",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#222",
  },

  inputError: {
    borderColor: "#E53935",
  },

  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 5,
  },

  imageSection: {
    marginBottom: 22,
  },

  logoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 12,
    resizeMode: "contain",
    backgroundColor: "#EDEFF2",
  },

  coverPreview: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    resizeMode: "cover",
    backgroundColor: "#EDEFF2",
  },

  imageButton: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#4F7CAC",
    justifyContent: "center",
    alignItems: "center",
  },

  imageButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
  },

  termsText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },

  registerButton: {
    height: 54,
    borderRadius: 11,
    backgroundColor: "#2F80ED",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.7,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loginButton: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 10,
  },

  loginText: {
    color: "#2F80ED",
    fontSize: 14,
    fontWeight: "600",
  },
});