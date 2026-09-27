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
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { uploadImages } from "../request/UploadImages";

const API_URL = Constants.expoConfig.extra?.API_URL;

/* ---------------- Validation ---------------- */
const validationSchema = Yup.object().shape({
  name: Yup.string().required("শিক্ষকের নাম আবশ্যক"),
  email: Yup.string().email("সঠিক ইমেইল লিখুন").required("ইমেইল আবশ্যক"),
  phone: Yup.string()
    .matches(/^[0-9]{11}$/, "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে")
    .required("ফোন নম্বর আবশ্যক"),
  subjects: Yup.string().required("অন্তত একটি বিষয় আবশ্যক"),
  role: Yup.string().required("দায়িত্ব আবশ্যক"),
});

export default function EditTeacherScreen() {
  const { teacherData } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [teacher, setTeacher] = useState(null);

  // ✅ Image handled OUTSIDE formik
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
      setSelectedImage(result.assets[0]);
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

  if (loading || !teacher) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>তথ্য লোড হচ্ছে...</Text>
      </SafeAreaView>
    );
  }

  const formFields = [
    {
      field: "name",
      label: "শিক্ষকের নাম",
      placeholder: "সম্পূর্ণ নাম লিখুন",
      icon: "person-outline",
      keyboardType: "default",
    },
    {
      field: "email",
      label: "ইমেইল অ্যাড্রেস",
      placeholder: "example@domain.com",
      icon: "mail-outline",
      keyboardType: "email-address",
    },
    {
      field: "phone",
      label: "ফোন নম্বর",
      placeholder: "017XXXXXXXX",
      icon: "call-outline",
      keyboardType: "numeric",
    },
    {
      field: "subjects",
      label: "বিষয়সমূহ (কমা দিয়ে আলাদা করুন)",
      placeholder: "গণিত, পদার্থবিজ্ঞান, রসায়ন",
      icon: "book-outline",
      keyboardType: "default",
    },
    {
      field: "role",
      label: "দায়িত্ব / পদবী",
      placeholder: "যেমন: সহকারী শিক্ষক",
      icon: "briefcase-outline",
      keyboardType: "default",
    },
    {
      field: "experience",
      label: "অভিজ্ঞতা (বছরে)",
      placeholder: "যেমন: ৫",
      icon: "ribbon-outline",
      keyboardType: "numeric",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LinearGradient colors={["#F8FAFC", "#EEF2FF"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Top Bar */}
            <View style={styles.headerContainer}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color="#0F172A" />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.headerTitle}>শিক্ষকের তথ্য সম্পাদনা</Text>
                <Text style={styles.headerSubtitle}>
                  প্রোফাইল তথ্য ও ছবি পরিবর্তন করুন
                </Text>
              </View>
            </View>

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
                <View style={styles.formCard}>
                  {/* Avatar Picker Card */}
                  <View style={styles.profileCard}>
                    <TouchableOpacity
                      onPress={pickProfileImage}
                      activeOpacity={0.85}
                      style={styles.avatarWrapper}
                    >
                      <Image
                        source={{
                          uri:
                            selectedImage?.uri ||
                            values.imageUrl ||
                            "https://via.placeholder.com/150",
                        }}
                        style={styles.avatar}
                      />
                      <LinearGradient
                        colors={["#4F46E5", "#3730A3"]}
                        style={styles.editBadge}
                      >
                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>
                      ছবি পরিবর্তন করতে ক্লিক করুন
                    </Text>
                  </View>

                  {/* Dynamic Form Fields */}
                  {formFields.map(
                    ({ field, label, placeholder, icon, keyboardType }) => (
                      <View key={field} style={styles.inputGroup}>
                        <Text style={styles.label}>{label}</Text>
                        <View
                          style={[
                            styles.inputContainer,
                            touched[field] &&
                              errors[field] &&
                              styles.inputError,
                          ]}
                        >
                          <Ionicons
                            name={icon}
                            size={18}
                            color="#64748B"
                            style={styles.inputIcon}
                          />
                          <TextInput
                            style={styles.input}
                            value={String(values[field] || "")}
                            onChangeText={handleChange(field)}
                            onBlur={handleBlur(field)}
                            placeholder={placeholder}
                            placeholderTextColor="#94A3B8"
                            keyboardType={keyboardType}
                          />
                        </View>
                        {errors[field] && touched[field] && (
                          <View style={styles.errorContainer}>
                            <Ionicons
                              name="alert-circle"
                              size={14}
                              color="#EF4444"
                            />
                            <Text style={styles.errorText}>
                              {errors[field]}
                            </Text>
                          </View>
                        )}
                      </View>
                    )
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={updating}
                    activeOpacity={0.85}
                    style={styles.submitButtonContainer}
                  >
                    <LinearGradient
                      colors={["#4F46E5", "#3730A3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}
                    >
                      {updating ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color="#FFFFFF"
                          />
                          <Text style={styles.submitText}>
                            তথ্য আপডেট করুন
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },

  /* Header Bar */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  /* Form Card */
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  /* Avatar Section */
  profileCard: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
    padding: 4,
    borderRadius: 65,
    backgroundColor: "#FFFFFF",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#F1F5F9",
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    borderRadius: 18,
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  avatarHint: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    fontWeight: "500",
  },

  /* Input Fields */
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginLeft: 4,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },

  /* Submit Button */
  submitButtonContainer: {
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },
});