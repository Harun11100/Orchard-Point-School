import React, { useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  View,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { TextInput } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL;
const STORAGE_KEY = "HomeworkData";

const homeworkSchema = Yup.object().shape({
  title: Yup.string().required("বিষয় বা শিরোনাম লিখুন"),
  description: Yup.string().required("বিস্তারিত বিবরণ লিখুন"),
  dueDate: Yup.date().required("জমা দেওয়ার তারিখ নির্বাচন করুন").nullable(),
});

export default function HomeworkUploadForm() {
  const { schoolId, classId, teacherId } = useLocalSearchParams();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/teacher/Homework/getHomework`,
          { params: { schoolId, classId } }
        );
        if (res.data?.success) {
          setHomework(res.data.homework);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(res.data.homework)
          );
        }
      } catch (err) {
        console.error("Error fetching homework:", err);
        const localData = await AsyncStorage.getItem(STORAGE_KEY);
        if (localData) {
          setHomework(JSON.parse(localData));
        }
      }
    };
    if (schoolId && classId) {
      fetchHomework();
    }
  }, [schoolId, classId]);

  // 🗑 Delete Homework
  const handleDeleteHomework = async (homeworkId, hTeacherId) => {
    // String cast guarantees type safety for ObjectId vs String comparisons
    if (String(hTeacherId) !== String(teacherId)) {
      Alert.alert("অনুমতি নেই", "আপনি এই বাড়ির কাজটি মুছে ফেলতে পারবেন না।");
      return;
    }

    Alert.alert("নিশ্চিত করুন", "আপনি কি এই বাড়ির কাজটি মুছে ফেলতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছে ফেলুন",
        style: "destructive",
        onPress: async () => {
          try {
            // Option A: Sending homeworkId via body AND query params for backend compatibility
            const res = await axios.delete(
              `${API_URL}/api/teacher/Homework/deleteHomework`,
              {
                data: { homeworkId, teacherId },
                params: { homeworkId, teacherId },
              }
            );

            if (res.data?.success || res.status === 200) {
              const updated = homework.filter((h) => h._id !== homeworkId);
              setHomework(updated);
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updated)
              );
              Alert.alert("সফল", "বাড়ির কাজ মুছে ফেলা হয়েছে।");
            } else {
              Alert.alert(
                "ত্রুটি",
                res.data?.message || "মুছে ফেলতে ব্যর্থ হয়েছে।"
              );
            }
          } catch (err) {
            console.error("Delete error:", err.response?.data || err.message);
            Alert.alert(
              "ত্রুটি",
              err.response?.data?.message || "মুছে ফেলতে ব্যর্থ হয়েছে।"
            );
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LinearGradient colors={["#F8FAFC", "#EEF2FF"]} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <View style={styles.headerContainer}>
            <View style={styles.headerIconBg}>
              <Ionicons name="book" size={24} color="#4F46E5" />
            </View>
            <View>
              <Text style={styles.headerTitle}>বাড়ির কাজ পরিচালনা</Text>
              <Text style={styles.headerSubtitle}>
                শিক্ষার্থীদের জন্য নতুন কাজ যুক্ত করুন অথবা আপডেট করুন
              </Text>
            </View>
          </View>

          {/* Edit State Badge */}
          {editingHomework && (
            <View style={styles.editingBanner}>
              <View style={styles.editingBannerLeft}>
                <Ionicons name="create-outline" size={18} color="#4F46E5" />
                <Text style={styles.editingBannerText}>
                  বাড়ির কাজ এডিট করা হচ্ছে
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditingHomework(null)}
                style={styles.cancelEditBtn}
              >
                <Ionicons name="close-circle" size={18} color="#EF4444" />
                <Text style={styles.cancelEditText}>বাতিল</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Form Container */}
          <Formik
            enableReinitialize
            initialValues={{
              title: editingHomework?.title || "",
              description: editingHomework?.description || "",
              dueDate: editingHomework
                ? new Date(editingHomework.dueDate)
                : null,
            }}
            validationSchema={homeworkSchema}
            onSubmit={async (values, { resetForm }) => {
              if (
                editingHomework &&
                String(editingHomework.teacherId) !== String(teacherId)
              ) {
                Alert.alert(
                  "অনুমতি নেই",
                  "আপনি এই বাড়ির কাজটি এডিট করতে পারবেন না।"
                );
                return;
              }

              setLoading(true);
              try {
                let res;
                const payload = {
                  title: values.title,
                  description: values.description,
                  dueDate: values.dueDate?.toISOString(),
                  schoolId,
                  classId,
                  teacherId,
                };

                if (editingHomework) {
                  res = await axios.put(
                    `${API_URL}/api/teacher/Homework/updateHomework/${editingHomework._id}`,
                    payload
                  );
                } else {
                  res = await axios.post(
                    `${API_URL}/api/teacher/Homework/addHomework`,
                    payload
                  );
                }

                if (res.data?.success) {
                  const returnedHomework = res.data.homework;

                  let updatedList;
                  if (editingHomework) {
                    updatedList = homework.map((h) =>
                      h._id === editingHomework._id ? returnedHomework : h
                    );
                  } else {
                    updatedList = [returnedHomework, ...homework];
                  }

                  setHomework(updatedList);
                  await AsyncStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(updatedList)
                  );

                  Alert.alert(
                    "সফল",
                    editingHomework
                      ? "বাড়ির কাজ আপডেট হয়েছে।"
                      : "বাড়ির কাজ যুক্ত হয়েছে।"
                  );

                  resetForm();
                  setEditingHomework(null);
                } else {
                  Alert.alert("ত্রুটি", "অপারেশনটি সফল হয়নি।");
                }
              } catch (err) {
                console.error("Form submit error:", err);
                Alert.alert("ত্রুটি", "অনুগ্রহ করে আবার চেষ্টা করুন।");
              } finally {
                setLoading(false);
              }
            }}
          >
            {({
              handleChange,
              handleSubmit,
              setFieldValue,
              values,
              errors,
              touched,
            }) => (
              <View style={styles.formCard}>
                <Text style={styles.formSectionTitle}>
                  {editingHomework ? "তথ্য সংশোধন করুন" : "নতুন কাজ তৈরি করুন"}
                </Text>

                {/* Title Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="বিষয় / শিরোনাম"
                    value={values.title}
                    onChangeText={handleChange("title")}
                    mode="outlined"
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#4F46E5"
                    style={styles.input}
                    theme={{ roundness: 12 }}
                  />
                  {touched.title && errors.title && (
                    <Text style={styles.errorText}>{errors.title}</Text>
                  )}
                </View>

                {/* Description Input */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    label="বিস্তারিত বিবরণ"
                    value={values.description}
                    onChangeText={handleChange("description")}
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    outlineColor="#E2E8F0"
                    activeOutlineColor="#4F46E5"
                    style={styles.input}
                    theme={{ roundness: 12 }}
                  />
                  {touched.description && errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}
                </View>

                {/* Date Picker Button */}
                <View style={styles.inputWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.datePicker,
                      touched.dueDate &&
                        errors.dueDate &&
                        styles.datePickerError,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setDatePickerVisible(true)}
                  >
                    <View style={styles.datePickerLeft}>
                      <Ionicons
                        name="calendar-clear-outline"
                        size={20}
                        color="#4F46E5"
                      />
                      <Text
                        style={[
                          styles.dateText,
                          !values.dueDate && styles.datePlaceholderText,
                        ]}
                      >
                        {values.dueDate
                          ? new Date(values.dueDate).toLocaleDateString(
                              "bn-BD",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "জমা দেওয়ার শেষ তারিখ নির্বাচন করুন"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                  {touched.dueDate && errors.dueDate && (
                    <Text style={styles.errorText}>
                      {String(errors.dueDate)}
                    </Text>
                  )}
                </View>

                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="date"
                  onConfirm={(date) => {
                    setFieldValue("dueDate", date);
                    setDatePickerVisible(false);
                  }}
                  onCancel={() => setDatePickerVisible(false)}
                />

                {/* Submit Action Button */}
                <TouchableOpacity
                  style={styles.submitButtonContainer}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#4F46E5", "#3730A3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <View style={styles.btnContent}>
                        <Ionicons
                          name={
                            editingHomework
                              ? "checkmark-circle-outline"
                              : "cloud-upload-outline"
                          }
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.submitText}>
                          {editingHomework
                            ? "আপডেট নিশ্চিত করুন"
                            : "বাড়ির কাজ প্রকাশ করুন"}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Formik>

          {/* Homework List Section */}
          <View style={styles.listSection}>
            <View style={styles.listHeader}>
              <Text style={styles.listSectionTitle}>প্রকাশিত বাড়ির কাজ</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{homework.length}</Text>
              </View>
            </View>

            {homework.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={require("../assets/image/empty.png")}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>কোনো বাড়ির কাজ নেই</Text>
                <Text style={styles.emptySubText}>
                  এখনো পর্যন্ত এই ক্লাসে কোনো বাড়ির কাজ যুক্ত করা হয়নি।
                </Text>
              </View>
            ) : (
              homework.map((item) => (
                <View key={item._id} style={styles.homeworkCard}>
                  <View style={styles.cardAccentBar} />
                  <View style={styles.cardMainContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.homeworkTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                          style={styles.iconBtnEdit}
                          onPress={() => {
                            if (String(item.teacherId) !== String(teacherId)) {
                              Alert.alert(
                                "অনুমতি নেই",
                                "আপনি কেবল নিজের তৈরি বাড়ির কাজ এডিট করতে পারবেন।"
                              );
                              return;
                            }
                            setEditingHomework(item);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="pencil"
                            size={16}
                            color="#4F46E5"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtnDelete}
                          onPress={() =>
                            handleDeleteHomework(item._id, item.teacherId)
                          }
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.homeworkDesc} numberOfLines={3}>
                      {item.description}
                    </Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.dateBadge}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#64748B"
                        />
                        <Text style={styles.homeworkDate}>
                          শেষ তারিখ:{" "}
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString(
                                "bn-BD",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 6,
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
  editingBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  editingBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  editingBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4338CA",
    marginLeft: 6,
  },
  cancelEditBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelEditText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  datePickerError: {
    borderColor: "#EF4444",
  },
  datePickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateText: {
    marginLeft: 10,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "500",
  },
  datePlaceholderText: {
    color: "#94A3B8",
    fontWeight: "400",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButtonContainer: {
    marginTop: 6,
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
  listSection: {
    marginTop: 4,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  listSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  countBadge: {
    backgroundColor: "#E0E7FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4338CA",
  },
  homeworkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccentBar: {
    width: 5,
    backgroundColor: "#4F46E5",
  },
  cardMainContent: {
    flex: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  homeworkTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  iconBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  homeworkDesc: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 8,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  homeworkDate: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 8,
  },
  emptyImage: {
    width: 130,
    height: 130,
    opacity: 0.85,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});