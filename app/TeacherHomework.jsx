
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
} from "react-native";
import { TextInput, Card } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Formik } from "formik";
import * as Yup from "yup";
import { LinearGradient } from "expo-linear-gradient";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "HomeworkData";

const homeworkSchema = Yup.object().shape({
  title: Yup.string().required("বিষয় লিখুন"),
  description: Yup.string().required("বিস্তারিত লিখুন"),
  dueDate: Yup.date().required("জমা দেওয়ার তারিখ নির্বাচন করুন"),
});

export default function HomeworkUploadForm() {
  const { schoolId, classId } = useLocalSearchParams();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/teacher/Homework/getHomework?schoolId=${schoolId}&classId=${classId}`
        );
        const data = await res.json();
        if (data.success) {
          setHomework(data.homework);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.homework));
        }
      } catch (err) {
        console.error("বাড়ির কাজ আনার সময় ত্রুটি:", err);
      }
    };
    fetchHomework();
  }, [schoolId, classId]);

  // ✅ বাড়ির কাজ মুছে ফেলা
  const handleDeleteHomework = async (homeworkId) => {
    Alert.alert("নিশ্চিত করুন", "আপনি কি এই বাড়ির কাজটি মুছে ফেলতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছে ফেলুন",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `${API_URL}/api/teacher/Homework/deleteHomework`,
              {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ homeworkId }),
              }
            );
            const data = await res.json();
            if (data.success) {
              const updatedHomework = homework.filter((h) => h._id !== homeworkId);
              setHomework(updatedHomework);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHomework));
              Alert.alert("মুছে ফেলা হয়েছে", "বাড়ির কাজটি সফলভাবে মুছে ফেলা হয়েছে।");
            } else {
              Alert.alert("ত্রুটি", data.message || "বাড়ির কাজ মুছতে ব্যর্থ হয়েছে।");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("ত্রুটি", "বাড়ির কাজ মুছে ফেলতে ব্যর্থ হয়েছে।");
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={["#EEF2FF", "#F9FAFB"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>📚 বাড়ির কাজ আপলোড</Text>

        <Formik
          initialValues={{ title: "", description: "", dueDate: null }}
          validationSchema={homeworkSchema}
          onSubmit={async (values, { resetForm }) => {
            setLoading(true);
            try {
              const formData = new FormData();
              formData.append("title", values.title);
              formData.append("description", values.description);
              formData.append("dueDate", values.dueDate.toISOString());
              formData.append("schoolId", schoolId);
              formData.append("classId", classId);

              const res = await axios.post(
                `${API_URL}/api/teacher/Homework/addHomework`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
              );

              if (res.data.success) {
                Alert.alert("সফল", "বাড়ির কাজ সফলভাবে আপলোড হয়েছে।");
                setHomework([res.data.homework, ...homework]);
                resetForm();
              } else {
                Alert.alert("ত্রুটি", "কিছু ভুল হয়েছে, আবার চেষ্টা করুন।");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("ত্রুটি", "বাড়ির কাজ আপলোড ব্যর্থ হয়েছে।");
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ handleChange, handleSubmit, setFieldValue, values, errors, touched }) => (
            <View style={styles.formCard}>
              <TextInput
                label="বিষয় লিখুন"
                value={values.title}
                onChangeText={handleChange("title")}
                mode="outlined"
                style={styles.input}
                outlineColor="#CBD5E1"
                activeOutlineColor="#207bf3ff"
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}

              <TextInput
                label="বিস্তারিত লিখুন"
                value={values.description}
                onChangeText={handleChange("description")}
                mode="outlined"
                multiline
                numberOfLines={6}
                style={styles.input}
                outlineColor="#CBD5E1"
              activeOutlineColor="#207bf3ff"
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}

              {/* তারিখ নির্বাচন */}
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setDatePickerVisible(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#1e92f7ff" />
                <Text style={styles.dateText}>
                  {values.dueDate
                    ? values.dueDate.toDateString()
                    : "জমা দেওয়ার তারিখ নির্বাচন করুন"}
                </Text>
              </TouchableOpacity>
              {touched.dueDate && errors.dueDate && (
                <Text style={styles.errorText}>{errors.dueDate}</Text>
              )}

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={(date) => {
                  setFieldValue("dueDate", date);
                  setDatePickerVisible(false);
                }}
                onCancel={() => setDatePickerVisible(false)}
              />

              {/* সাবমিট বাটন */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#218ef4ff", "#2f71eaff"]}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>সংরক্ষণ করুন</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Formik>

        {/* বাড়ির কাজের তালিকা */}
        <View style={{ marginTop: 20 }}>
          {homework.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.image}
                source={require("../assets/image/empty.png")}
              />
              <Text style={styles.emptyText}>কোন বাড়ির কাজ পাওয়া যায়নি</Text>
            </View>
          ) : (
            homework.map((h) => (
              <Card key={h._id} style={styles.homeworkCard}>
                <Card.Content style={styles.cardContent}>
                  <Ionicons name="book-outline" size={22} color="#1070e5ff" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.homeworkTitle}>{h.title}</Text>
                    <Text style={styles.homeworkDesc}>{h.description}</Text>
                    <Text style={styles.homeworkDate}>
                      📅 জমা দেওয়ার তারিখ: {new Date(h.dueDate).toDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteHomework(h._id)}>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#315cb2ff",
    textAlign: "center",
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    marginBottom: 10,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  dateText: {
    marginLeft: 8,
    color: "#334155",
  },
  submitButton: {
    marginTop: 16,
  },
  gradientButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginBottom: 6,
  },
  homeworkCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  homeworkTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1E293B",
  },
  homeworkDesc: {
    color: "#475569",
    fontSize: 14,
    marginVertical: 4,
  },
  homeworkDate: {
    color: "#64748B",
    fontSize: 13,
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
