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
import Constants from "expo-constants";

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
  const [editingHomework, setEditingHomework] = useState(null);

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/teacher/Homework/getHomework?schoolId=${schoolId}&classId=${classId}`
        );
        const data = await res.json();
        if (data.success) {
          setHomework(data.homework);
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data.homework)
          );
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHomework();
  }, [schoolId, classId]);

  // 🗑 Delete Homework
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
              const updated = homework.filter((h) => h._id !== homeworkId);
              setHomework(updated);
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updated)
              );
              Alert.alert("সফল", "বাড়ির কাজ মুছে ফেলা হয়েছে।");
            }
          } catch (err) {
            Alert.alert("ত্রুটি", "মুছে ফেলতে ব্যর্থ হয়েছে।");
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={["#EEF2FF", "#F9FAFB"]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>📚 বাড়ির কাজ</Text>

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
          setLoading(true);
          try {
            let res;

            if (editingHomework) {
              // ✏️ Update (PUT)
              res = await axios.put(
                `${API_URL}/api/teacher/Homework/updateHomework/${editingHomework._id}`,
                {
                  title: values.title,
                  description: values.description,
                  dueDate: values.dueDate.toISOString(),
                  schoolId,
                  classId,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
            } else {
              // ➕ Create (POST) using FormData
              const formData = new FormData();
              formData.append("schoolId", schoolId);
              formData.append("classId", classId);
              formData.append("title", values.title);
              formData.append("description", values.description);
              formData.append("dueDate", values.dueDate.toISOString());

              res = await axios.post(`${API_URL}/api/teacher/Homework/addHomework`, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              });
            }

            if (res.data.success) {
              if (editingHomework) {
                setHomework((prev) =>
                  prev.map((h) => (h._id === editingHomework._id ? res.data.homework : h))
                );
              } else {
                setHomework((prev) => [res.data.homework, ...prev]);
              }

              Alert.alert(
                "সফল",
                editingHomework ? "বাড়ির কাজ আপডেট হয়েছে।" : "বাড়ির কাজ যুক্ত হয়েছে।"
              );

              resetForm();
              setEditingHomework(null);
            }
          } catch (err) {
            console.error(err);
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
              <TextInput
                label="বিষয়"
                value={values.title}
                onChangeText={handleChange("title")}
                mode="outlined"
                style={styles.input}
              />
              {touched.title && errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}

              <TextInput
                label="বিস্তারিত"
                value={values.description}
                onChangeText={handleChange("description")}
                mode="outlined"
                multiline
                numberOfLines={5}
                style={styles.input}
              />
              {touched.description && errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}

              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setDatePickerVisible(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                <Text style={styles.dateText}>
                  {values.dueDate
                    ? values.dueDate.toDateString()
                    : "তারিখ নির্বাচন করুন"}
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

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#2563EB", "#1D4ED8"]}
                  style={styles.gradientButton}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {editingHomework ? "আপডেট করুন" : "সংরক্ষণ করুন"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {editingHomework && (
                <TouchableOpacity
                  onPress={() => setEditingHomework(null)}
                  style={{ marginTop: 10, alignItems: "center" }}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "600" }}>
                    এডিট বাতিল করুন
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Formik>

        {/* Homework List */}
        <View style={{ marginTop: 20 }}>
          {homework.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image
                source={require("../assets/image/empty.png")}
                style={styles.image}
              />
              <Text style={styles.emptyText}>
                কোন বাড়ির কাজ পাওয়া যায়নি
              </Text>
            </View>
          ) : (
            homework.map((h) => (
              <Card key={h._id} style={styles.homeworkCard}>
                <Card.Content style={styles.cardContent}>
                  <Ionicons name="book-outline" size={22} color="#2563EB" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.homeworkTitle}>{h.title}</Text>
                    <Text style={styles.homeworkDesc}>{h.description}</Text>
                    <Text style={styles.homeworkDate}>
                      📅 {new Date(h.dueDate).toDateString()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity onPress={() => setEditingHomework(h)}>
                      <Ionicons
                        name="create-outline"
                        size={22}
                        color="#2563EB"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteHomework(h._id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={22}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
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
  container: { padding: 16, paddingBottom: 40 },
  header: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#1E3A8A",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  input: {
    marginBottom: 10,
    backgroundColor: "#F9FAFB",
  },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 12,
  },
  dateText: { marginLeft: 8, color: "#334155" },
  submitButton: { marginTop: 16 },
  gradientButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  errorText: { color: "#EF4444", fontSize: 13, marginBottom: 6 },
  homeworkCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 6,
    elevation: 2,
  },
  cardContent: { flexDirection: "row", alignItems: "flex-start" },
  homeworkTitle: { fontWeight: "700", fontSize: 16 },
  homeworkDesc: { color: "#475569", marginVertical: 4 },
  homeworkDate: { color: "#64748B", fontSize: 13 },
  image: { width: 180, height: 180 },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyText: { color: "#6B7280" },
});
