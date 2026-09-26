import React, { useState } from "react";
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
  Modal,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig.extra.API_URL;

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("শিক্ষকের নাম অবশ্যক"),

  email: Yup.string()
    .email("সঠিক ইমেইল লিখুন")
    .required("ইমেইল অবশ্যক"),

  phone: Yup.string()
    .matches(
      /^[0-9]{11}$/,
      "ফোন নম্বর অবশ্যই ১১ ডিজিট হতে হবে"
    )
    .required("ফোন নম্বর অবশ্যক"),

  password: Yup.string()
    .min(
      6,
      "লগইন পিন কমপক্ষে ৬ অক্ষর হতে হবে"
    )
    .required("লগইন পিন অবশ্যক"),

  subjects: Yup.string()
    .required("অন্তত একটি বিষয় অবশ্যক"),

  role: Yup.string()
    .required("দায়িত্ব নির্বাচন করুন"),
});

export default function AddTeacherScreen() {
  const { schoolId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [roleModalVisible, setRoleModalVisible] =
    useState(false);

  const roleOptions = [
    {
      value: "teacher",
      label: "শিক্ষক",
      icon: "school-outline",
    },
    {
      value: "accountant",
      label: "হিসাবরক্ষক",
      icon: "calculator-outline",
    },
    {
      value: "admin",
      label: "অ্যাডমিন",
      icon: "shield-checkmark-outline",
    },
  ];

  const handleSubmit = async (values, resetForm) => {
    setLoading(true);

    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password.trim(),

        subjects: values.subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),

        role: values.role,

        address: values.address.trim(),

        schoolId,
      };

      const res = await axios.post(
        `${API_URL}/api/school/createTeacher`,
        payload
      );

      if (res.data.success) {
        Alert.alert(
          "সফল হয়েছে",
          "স্টাফ সফলভাবে যুক্ত হয়েছে"
        );

        resetForm();
      } else {
        Alert.alert(
          "ত্রুটি",
          res.data.message ||
            "স্টাফ যুক্ত করতে সমস্যা হয়েছে"
        );
      }
    } catch (error) {
      console.error(
        "Create teacher error:",
        error?.response?.data || error
      );

      Alert.alert(
        "ত্রুটি",
        error?.response?.data?.message ||
          "কিছু সমস্যা হয়েছে, পুনরায় চেষ্টা করুন"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <LinearGradient
        colors={["#F8FAFF", "#EEF4FF"]}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="person-add-outline"
                size={28}
                color="#4F46E5"
              />
            </View>

            <Text style={styles.title}>
              নতুন স্টাফ যুক্ত করুন
            </Text>

            <Text style={styles.subtitle}>
              প্রতিষ্ঠানের নতুন সদস্যের তথ্য প্রদান করুন
            </Text>
          </View>

          <Formik
            initialValues={{
              name: "",
              email: "",
              phone: "",
              password: "",
              subjects: "",
              role: "",
              address: "",
            }}
            validationSchema={validationSchema}
            onSubmit={(values, { resetForm }) =>
              handleSubmit(values, resetForm)
            }
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
            }) => (
              <View style={styles.form}>
                {/* Personal Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    ব্যক্তিগত তথ্য
                  </Text>

                  {/* Name */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      নাম
                    </Text>

                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#64748B"
                      />

                      <TextInput
                        style={styles.input}
                        placeholder="স্টাফের নাম লিখুন"
                        placeholderTextColor="#94A3B8"
                        value={values.name}
                        onChangeText={handleChange(
                          "name"
                        )}
                        onBlur={handleBlur("name")}
                        editable={!loading}
                      />
                    </View>

                    {errors.name &&
                      touched.name && (
                        <Text style={styles.error}>
                          {errors.name}
                        </Text>
                      )}
                  </View>

                  {/* Email */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      ইমেইল
                    </Text>

                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#64748B"
                      />

                      <TextInput
                        style={styles.input}
                        placeholder="example@mail.com"
                        placeholderTextColor="#94A3B8"
                        value={values.email}
                        onChangeText={handleChange(
                          "email"
                        )}
                        onBlur={handleBlur("email")}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>

                    {errors.email &&
                      touched.email && (
                        <Text style={styles.error}>
                          {errors.email}
                        </Text>
                      )}
                  </View>

                  {/* Phone */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      ফোন নম্বর
                    </Text>

                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="call-outline"
                        size={20}
                        color="#64748B"
                      />

                      <TextInput
                        style={styles.input}
                        placeholder="01XXXXXXXXX"
                        placeholderTextColor="#94A3B8"
                        value={values.phone}
                        onChangeText={handleChange(
                          "phone"
                        )}
                        onBlur={handleBlur("phone")}
                        keyboardType="phone-pad"
                        maxLength={11}
                        editable={!loading}
                      />
                    </View>

                    {errors.phone &&
                      touched.phone && (
                        <Text style={styles.error}>
                          {errors.phone}
                        </Text>
                      )}
                  </View>
                </View>

                {/* Account Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    অ্যাকাউন্ট তথ্য
                  </Text>

                  {/* Password */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      লগইন পিন
                    </Text>

                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#64748B"
                      />

                      <TextInput
                        style={styles.input}
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        placeholderTextColor="#94A3B8"
                        value={values.password}
                        onChangeText={handleChange(
                          "password"
                        )}
                        onBlur={handleBlur("password")}
                        secureTextEntry
                        editable={!loading}
                      />
                    </View>

                    {errors.password &&
                      touched.password && (
                        <Text style={styles.error}>
                          {errors.password}
                        </Text>
                      )}
                  </View>

                  {/* Role */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      দায়িত্ব
                    </Text>

                    <TouchableOpacity
                      style={styles.selectContainer}
                      activeOpacity={0.8}
                      onPress={() =>
                        setRoleModalVisible(true)
                      }
                      disabled={loading}
                    >
                      <View
                        style={
                          styles.selectLeft
                        }
                      >
                        <Ionicons
                          name="briefcase-outline"
                          size={20}
                          color="#64748B"
                        />

                        <Text
                          style={[
                            styles.selectText,
                            !values.role &&
                              styles.placeholder,
                          ]}
                        >
                          {values.role
                            ? roleOptions.find(
                                (item) =>
                                  item.value ===
                                  values.role
                              )?.label
                            : "দায়িত্ব নির্বাচন করুন"}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>

                    {errors.role &&
                      touched.role && (
                        <Text style={styles.error}>
                          {errors.role}
                        </Text>
                      )}
                  </View>

                  {/* Subjects */}
                  <View style={styles.field}>
                    <Text style={styles.label}>
                      বিষয়
                    </Text>

                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="book-outline"
                        size={20}
                        color="#64748B"
                      />

                      <TextInput
                        style={styles.input}
                        placeholder="Math, Science, English"
                        placeholderTextColor="#94A3B8"
                        value={values.subjects}
                        onChangeText={handleChange(
                          "subjects"
                        )}
                        onBlur={handleBlur("subjects")}
                        editable={!loading}
                      />
                    </View>

                    <Text style={styles.helperText}>
                      একাধিক বিষয় হলে কমা দিয়ে আলাদা
                      করুন
                    </Text>

                    {errors.subjects &&
                      touched.subjects && (
                        <Text style={styles.error}>
                          {errors.subjects}
                        </Text>
                      )}
                  </View>
                </View>

                {/* Address */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    যোগাযোগের তথ্য
                  </Text>

                  <View style={styles.field}>
                    <Text style={styles.label}>
                      ঠিকানা
                    </Text>

                    <View
                      style={[
                        styles.inputContainer,
                        styles.textAreaContainer,
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color="#64748B"
                        style={styles.textAreaIcon}
                      />

                      <TextInput
                        style={[
                          styles.input,
                          styles.textArea,
                        ]}
                        placeholder="ঠিকানা লিখুন"
                        placeholderTextColor="#94A3B8"
                        value={values.address}
                        onChangeText={handleChange(
                          "address"
                        )}
                        onBlur={handleBlur("address")}
                        multiline
                        textAlignVertical="top"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading &&
                      styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[
                      "#4F46E5",
                      "#6366F1",
                    ]}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <>
                        <ActivityIndicator
                          color="#fff"
                        />

                        <Text
                          style={
                            styles.submitText
                          }
                        >
                          যুক্ত করা হচ্ছে...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name="person-add-outline"
                          size={21}
                          color="#fff"
                        />

                        <Text
                          style={
                            styles.submitText
                          }
                        >
                          স্টাফ যুক্ত করুন
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.bottomSpace} />

                {/* Role Modal */}
                <Modal
                  visible={roleModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() =>
                    setRoleModalVisible(false)
                  }
                >
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() =>
                      setRoleModalVisible(false)
                    }
                  >
                    <View
                      style={styles.roleModal}
                      onStartShouldSetResponder={() =>
                        true
                      }
                    >
                      <View
                        style={styles.modalHeader}
                      >
                        <View>
                          <Text
                            style={
                              styles.modalTitle
                            }
                          >
                            দায়িত্ব নির্বাচন করুন
                          </Text>

                          <Text
                            style={
                              styles.modalSubtitle
                            }
                          >
                            স্টাফের দায়িত্ব নির্বাচন করুন
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() =>
                            setRoleModalVisible(
                              false
                            )
                          }
                        >
                          <Ionicons
                            name="close-circle"
                            size={28}
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      </View>

                      {roleOptions.map((role) => (
                        <TouchableOpacity
                          key={role.value}
                          style={[
                            styles.roleOption,
                            values.role ===
                              role.value &&
                              styles.selectedRole,
                          ]}
                          onPress={() => {
                            setFieldValue(
                              "role",
                              role.value
                            );
                            setRoleModalVisible(
                              false
                            );
                          }}
                        >
                          <View
                            style={[
                              styles.roleIcon,
                              values.role ===
                                role.value &&
                                styles.selectedRoleIcon,
                            ]}
                          >
                            <Ionicons
                              name={role.icon}
                              size={22}
                              color={
                                values.role ===
                                role.value
                                  ? "#fff"
                                  : "#4F46E5"
                              }
                            />
                          </View>

                          <Text
                            style={
                              styles.roleLabel
                            }
                          >
                            {role.label}
                          </Text>

                          {values.role ===
                            role.value && (
                            <Ionicons
                              name="checkmark-circle"
                              size={23}
                              color="#4F46E5"
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>
            )}
          </Formik>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  gradient: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 18,
    paddingTop: 28,
    flexGrow: 1,
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
  },

  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#172554",
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },

  form: {
    flex: 1,
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,

    elevation: 3,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 18,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E2E8F0",

    borderRadius: 14,
    paddingHorizontal: 14,

    backgroundColor: "#F8FAFC",
  },

  input: {
    flex: 1,
    height: 50,
    marginLeft: 10,

    fontSize: 14,
    color: "#0F172A",
  },

  selectContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderWidth: 1,
    borderColor: "#E2E8F0",

    borderRadius: 14,
    paddingHorizontal: 14,

    backgroundColor: "#F8FAFC",
  },

  selectLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  selectText: {
    fontSize: 14,
    color: "#0F172A",
    marginLeft: 10,
    fontWeight: "600",
  },

  placeholder: {
    color: "#94A3B8",
    fontWeight: "400",
  },

  textAreaContainer: {
    alignItems: "flex-start",
    paddingTop: 12,
    minHeight: 100,
  },

  textAreaIcon: {
    marginTop: 2,
  },

  textArea: {
    height: 85,
    paddingTop: 0,
  },

  helperText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 6,
    marginLeft: 3,
  },

  error: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 5,
    marginLeft: 3,
  },

  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,

    shadowColor: "#4F46E5",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,

    elevation: 5,
  },

  disabledButton: {
    opacity: 0.7,
  },

  gradientButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  bottomSpace: {
    height: 50,
  },

  // Modal

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },

  roleModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 35,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#172554",
  },

  modalSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  roleOption: {
    flexDirection: "row",
    alignItems: "center",

    minHeight: 64,

    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,

    paddingHorizontal: 14,
    marginBottom: 10,

    backgroundColor: "#FFFFFF",
  },

  selectedRole: {
    borderColor: "#818CF8",
    backgroundColor: "#EEF2FF",
  },

  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#EEF2FF",
    marginRight: 12,
  },

  selectedRoleIcon: {
    backgroundColor: "#4F46E5",
  },

  roleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
});