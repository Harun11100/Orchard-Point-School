import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import {SafeAreaView}from 'react-native-safe-area-context';
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig?.extra?.API_URL;

/* =========================================================
   Validation Schema
========================================================= */

const ResultSchema = Yup.object().shape({
  results: Yup.array().of(
    Yup.object().shape({
      studentId: Yup.string().required(),
      mark: Yup.number()
        .transform((_, value) => (value === "" ? undefined : Number(value)))
        .typeError("নম্বর সংখ্যা হতে হবে")
        .min(0, "নম্বর ০-এর কম হতে পারবে না")
        .required("নম্বর দিন"),
    })
  ),
});

/* =========================================================
   Main Component
========================================================= */

export default function ResultUploadScreen() {
  const { schoolId, classId, teacherId } = useLocalSearchParams();
  
  /* =========================================================
  States
  ========================================================= */
  
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [semesterModalVisible, setSemesterModalVisible] = useState(false);

  // Search states inside Modals
  const [subjectSearch, setSubjectSearch] = useState("");
  const [semesterSearch, setSemesterSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* =========================================================
     Fetch Initial Data
  ========================================================= */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [studentsRes, subjectsRes, semestersRes] = await Promise.all([
          axios.get(
            `${API_URL}/api/school/student/getStudents?schoolId=${schoolId}&classId=${classId}`
          ),
          axios.get(
            `${API_URL}/api/school/subject/getSubjects?classId=${classId}`
          ),
          axios.get(
            `${API_URL}/api/school/semester/getSemesters?schoolId=${schoolId}`
          ),
        ]);

        if (studentsRes.data?.success) {
          setStudents(
            studentsRes.data.data || studentsRes.data.students || []
          );
        } else {
          Alert.alert("ত্রুটি", "শিক্ষার্থীদের তথ্য লোড করা যায়নি।");
        }

        if (subjectsRes.data?.success) {
          setSubjects(
            subjectsRes.data.data || subjectsRes.data.subjects || []
          );
        } else {
          Alert.alert("ত্রুটি", "বিষয়ের তথ্য লোড করা যায়নি।");
        }

        if (semestersRes.data?.success) {
          setSemesters(
            semestersRes.data.data || semestersRes.data.semesters || []
          );
        } else {
          Alert.alert("ত্রুটি", "সেমিস্টারের তথ্য লোড করা যায়নি।");
        }
      } catch (error) {
        console.log(
          "Result page fetch error:",
          error?.response?.data || error
        );
        Alert.alert("ত্রুটি", "তথ্য লোড করতে সমস্যা হয়েছে।");
      } finally {
        setLoading(false);
      }
    };

    if (schoolId && classId) {
      fetchData();
    }
  }, [schoolId, classId]);

  /* =========================================================
     Form Initial Values
  ========================================================= */

  const initialValues = useMemo(
    () => ({
      results: students.map((student) => ({
        studentId: student._id,
        studentName: student.name,
        roll: student.roll,
        mark: "",
      })),
    }),
    [students]
  );

  /* =========================================================
     Filtered Lists for Modals
  ========================================================= */

  const filteredSemesters = useMemo(() => {
    return semesters.filter((item) =>
      item.name?.toLowerCase().includes(semesterSearch.toLowerCase())
    );
  }, [semesters, semesterSearch]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((item) =>
      item.name?.toLowerCase().includes(subjectSearch.toLowerCase())
    );
  }, [subjects, subjectSearch]);

  /* =========================================================
     Submit Handler
  ========================================================= */

  const submitResult = async (values) => {
    if (!selectedSemester) {
      Alert.alert(
        "সেমিস্টার নির্বাচন করুন",
        "ফলাফল আপলোড করার আগে একটি সেমিস্টার নির্বাচন করুন।"
      );
      return;
    }

    if (!selectedSubject) {
      Alert.alert(
        "বিষয় নির্বাচন করুন",
        "ফলাফল আপলোড করার আগে একটি বিষয় নির্বাচন করুন।"
      );
      return;
    }

    try {
      setSubmitting(true);

      const incompleteStudents = values.results.filter(
        (item) => item.mark === "" || item.mark === null || item.mark === undefined
      );

      if (incompleteStudents.length > 0) {
        Alert.alert(
          "অসম্পূর্ণ ফলাফল",
          `${incompleteStudents.length} জন শিক্ষার্থীর নম্বর দেওয়া হয়নি।`
        );
        setSubmitting(false);
        return;
      }

      const maxMarks = selectedSubject?.maxMarks ?? 100;
      const invalidStudents = values.results.filter(
        (item) => Number(item.mark) < 0 || Number(item.mark) > maxMarks
      );

      if (invalidStudents.length > 0) {
        Alert.alert(
          "ভুল নম্বর",
          `কোনো শিক্ষার্থীর নম্বর ${maxMarks}-এর বেশি হতে পারবে না।`
        );
        setSubmitting(false);
        return;
      }

      const payload = {
        schoolId,
        classId,
        teacherId,
        semesterId: selectedSemester._id,
        subjectId: selectedSubject._id,
        maxMarks: selectedSubject?.maxMarks ?? 100,
        passingMarks: selectedSubject?.passingMarks ?? 33,
        results: values.results.map((item) => ({
          studentId: item.studentId,
          mark: Number(item.mark),
        })),
      };

      console.log(payload)

      // const response = await axios.post(
      //   `${API_URL}/api/school/result/subject/upload`,
      //   payload
      // );

      // if (response.data?.success) {
      //   Alert.alert(
      //     "সাফল্য! 🎉",
      //     `${selectedSubject.name} বিষয়ের ফলাফল সফলভাবে আপলোড হয়েছে।`,
      //     [{ text: "ঠিক আছে" }]
      //   );
      // } else {
      //   Alert.alert(
      //     "ত্রুটি",
      //     response.data?.message || "ফলাফল আপলোড করা যায়নি।"
      //   );
      // }
    } catch (error) {
      console.log("Submit result error:", error?.response?.data || error);
      Alert.alert(
        "ত্রুটি",
        error?.response?.data?.message ||
          "সার্ভারে ফলাফল আপলোড করতে সমস্যা হয়েছে।"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================================================
     Loading View
  ========================================================= */

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>ফলাফল তথ্য লোড হচ্ছে...</Text>
      </View>
    );
  }

  /* =========================================================
     Main UI Render
  ========================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Bar */}
          <LinearGradient
            colors={["#ffffff", "#f1f5f9"]}
            style={styles.headerContainer}
          >
            <View style={styles.headerIconBg}>
              <MaterialIcons name="grade" size={26} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>ফলাফল ইনপুট ও আপলোড</Text>
              <Text style={styles.headerSubtitle}>
                শ্রেণী ও সেমিস্টার নির্বাচন করে মার্কস এন্টি করুন
              </Text>
            </View>
          </LinearGradient>

          {/* Controls Section */}
          <View style={styles.sectionContainer}>
            {/* Semester Selector Card */}
            <View style={styles.selectorCard}>
              <Text style={styles.fieldLabel}>সেমিস্টার</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.selectorButton,
                  selectedSemester && styles.selectorActiveBorder,
                ]}
                onPress={() => setSemesterModalVisible(true)}
              >
                <View style={styles.selectorLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="event-note" size={20} color="#4f46e5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.selectorText,
                        !selectedSemester && styles.placeholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedSemester?.name || "সেমিস্টার সিলেক্ট করুন"}
                    </Text>
                    {selectedSemester?.academicYear && (
                      <Text style={styles.selectorSubText}>
                        শিক্ষাবর্ষ: {selectedSemester.academicYear}
                      </Text>
                    )}
                  </View>
                </View>
                <MaterialIcons name="unfold-more" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Subject Selector Card */}
            <View style={styles.selectorCard}>
              <Text style={styles.fieldLabel}>বিষয়</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.selectorButton,
                  selectedSubject && styles.selectorActiveBorder,
                ]}
                onPress={() => setSubjectModalVisible(true)}
              >
                <View style={styles.selectorLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: "#e0e7ff" }]}>
                    <MaterialIcons name="auto-stories" size={20} color="#3730a3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.selectorText,
                        !selectedSubject && styles.placeholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedSubject?.name || "বিষয় সিলেক্ট করুন"}
                    </Text>
                    {selectedSubject && (
                      <Text style={styles.selectorSubText}>
                        পূর্ণমান: {selectedSubject.maxMarks ?? 100}  •  পাস: {selectedSubject.passingMarks ?? 33}
                      </Text>
                    )}
                  </View>
                </View>
                <MaterialIcons name="unfold-more" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content Area */}
          {!selectedSemester || !selectedSubject ? (
            <View style={styles.emptyPromptCard}>
              <View style={styles.emptyPromptIcon}>
                <MaterialIcons name="touch-app" size={32} color="#6366f1" />
              </View>
              <Text style={styles.emptyPromptTitle}>পদ্ধতি সূচনা করুন</Text>
              <Text style={styles.emptyPromptText}>
                শিক্ষার্থীদের নম্বর প্রবেশ করাতে প্রথমে উপরের সেমিস্টার এবং বিষয় নির্বাচন সম্পূর্ণ করুন।
              </Text>
            </View>
          ) : (
            <Formik
              enableReinitialize
              initialValues={initialValues}
              validationSchema={ResultSchema}
              onSubmit={submitResult}
            >
              {({ values, handleSubmit, setFieldValue }) => (
                <View style={styles.studentListSection}>
                  {/* Summary Bar */}
                  <View style={styles.summaryBar}>
                    <View>
                      <Text style={styles.summaryTitle}>{selectedSubject.name}</Text>
                      <Text style={styles.summarySub}>
                        মোট শিক্ষার্থী: {students.length} জন
                      </Text>
                    </View>
                    <View style={styles.badgeChip}>
                      <Text style={styles.badgeChipText}>
                        সর্বোচ্চ: {selectedSubject.maxMarks ?? 100}
                      </Text>
                    </View>
                  </View>

                  {/* Student Cards */}
                  {values.results.map((item, index) => {
                    const currentMark = Number(item.mark);
                    const maxMarks = selectedSubject.maxMarks ?? 100;
                    const passingMarks = selectedSubject.passingMarks ?? 33;
                    const isEntered = item.mark !== "";
                    const isPassed = isEntered && currentMark >= passingMarks && currentMark <= maxMarks;
                    const isFailed = isEntered && currentMark < passingMarks;
                    const isInvalid = isEntered && (currentMark > maxMarks || currentMark < 0);

                    return (
                      <View key={item.studentId} style={styles.studentCard}>
                        <View style={styles.rollBadge}>
                          <Text style={styles.rollLabel}>রোল</Text>
                          <Text style={styles.rollNumber}>{item.roll}</Text>
                        </View>

                        <View style={styles.studentInfo}>
                          <Text style={styles.studentNameText} numberOfLines={1}>
                            {item.studentName}
                          </Text>
                          <Text style={styles.statusHelperText}>
                            {!isEntered
                              ? "নম্বর দিন"
                              : isInvalid
                              ? "অবৈধ নম্বর"
                              : isPassed
                              ? "উত্তীর্ণ"
                              : "অনুত্তীর্ণ"}
                          </Text>
                        </View>

                        <View style={styles.inputWrapper}>
                          <TextInput
                            style={[
                              styles.markInput,
                              isEntered && isPassed && styles.inputSuccess,
                              isEntered && isFailed && styles.inputWarning,
                              isInvalid && styles.inputError,
                            ]}
                            keyboardType="numeric"
                            placeholder="00"
                            placeholderTextColor="#cbd5e1"
                            maxLength={3}
                            value={item.mark}
                            onChangeText={(val) =>
                              setFieldValue(`results.${index}.mark`, val)
                            }
                          />
                        </View>
                      </View>
                    );
                  })}

                  {/* Submit Action Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                    disabled={submitting}
                    style={styles.submitButtonWrapper}
                  >
                    <LinearGradient
                      colors={
                        submitting
                          ? ["#94a3b8", "#64748b"]
                          : ["#4f46e5", "#3730a3"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitGradient}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Ionicons name="cloud-upload-outline" size={22} color="#ffffff" />
                      )}
                      <Text style={styles.submitBtnText}>
                        {submitting
                          ? "আপলোড করা হচ্ছে..."
                          : `${selectedSubject.name} মার্কস সেভ করুন`}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.infoFooter}>
                    <MaterialIcons name="shield" size={16} color="#94a3b8" />
                    <Text style={styles.infoFooterText}>
                      ফলাফল আপলোড করার পর সিস্টেমের ডেটাবেজে তা স্থায়ীভাবে সংরক্ষণ করা হবে।
                    </Text>
                  </View>
                </View>
              )}
            </Formik>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* =========================================================
         Semester Selection Modal
      ========================================================= */}
      <Modal
        visible={semesterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSemesterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalHeaderTitle}>সেমিস্টার নির্বাচন</Text>
              <TouchableOpacity
                onPress={() => setSemesterModalVisible(false)}
                style={styles.closeIconButton}
              >
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Modal Search Bar */}
            <View style={styles.searchBarContainer}>
              <MaterialIcons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="সেমিস্টার খুঁজুন..."
                placeholderTextColor="#94a3b8"
                value={semesterSearch}
                onChangeText={setSemesterSearch}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredSemesters.length === 0 ? (
                <View style={styles.notFoundBox}>
                  <Text style={styles.notFoundText}>কোনো সেমিস্টার পাওয়া যায়নি</Text>
                </View>
              ) : (
                filteredSemesters.map((item) => {
                  const isSelected = selectedSemester?._id === item._id;
                  return (
                    <TouchableOpacity
                      key={item._id}
                      activeOpacity={0.7}
                      style={[
                        styles.modalOptionCard,
                        isSelected && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedSemester(item);
                        setSemesterModalVisible(false);
                      }}
                    >
                      <View
                        style={[
                          styles.optionRadio,
                          isSelected && styles.optionRadioActive,
                        ]}
                      >
                        {isSelected && (
                          <MaterialIcons name="check" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionTitle,
                            isSelected && styles.optionTitleSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        {item.academicYear && (
                          <Text style={styles.optionSub}>
                            শিক্ষাবর্ষ: {item.academicYear}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =========================================================
         Subject Selection Modal
      ========================================================= */}
      <Modal
        visible={subjectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSubjectModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTopBar}>
              <Text style={styles.modalHeaderTitle}>বিষয় নির্বাচন</Text>
              <TouchableOpacity
                onPress={() => setSubjectModalVisible(false)}
                style={styles.closeIconButton}
              >
                <MaterialIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <MaterialIcons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="বিষয় খুঁজুন..."
                placeholderTextColor="#94a3b8"
                value={subjectSearch}
                onChangeText={setSubjectSearch}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredSubjects.length === 0 ? (
                <View style={styles.notFoundBox}>
                  <Text style={styles.notFoundText}>কোনো বিষয় পাওয়া যায়নি</Text>
                </View>
              ) : (
                filteredSubjects.map((item) => {
                  const isSelected = selectedSubject?._id === item._id;
                  return (
                    <TouchableOpacity
                      key={item._id}
                      activeOpacity={0.7}
                      style={[
                        styles.modalOptionCard,
                        isSelected && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedSubject(item);
                        setSubjectModalVisible(false);
                      }}
                    >
                      <View
                        style={[
                          styles.optionRadio,
                          isSelected && styles.optionRadioActive,
                        ]}
                      >
                        {isSelected && (
                          <MaterialIcons name="check" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.optionTitle,
                            isSelected && styles.optionTitleSelected,
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.optionSub}>
                          পূর্ণমান: {item.maxMarks ?? 100}  •  পাস মার্কস: {item.passingMarks ?? 33}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================================
   Styles & Theme Tokens
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },

  /* Header Header */
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },

  /* Form Selectors */
  sectionContainer: {
    padding: 16,
    gap: 12,
  },
  selectorCard: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginLeft: 2,
  },
  selectorButton: {
    minHeight: 58,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  selectorActiveBorder: {
    borderColor: "#6366f1",
    backgroundColor: "#faf5ff",
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  selectorText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  placeholderText: {
    color: "#94a3b8",
    fontWeight: "500",
  },
  selectorSubText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },

  /* Empty State Prompt */
  emptyPromptCard: {
    margin: 16,
    padding: 24,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  emptyPromptIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eeef2015",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyPromptTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  emptyPromptText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },

  /* Student Mark Entry Section */
  studentListSection: {
    paddingHorizontal: 16,
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#312e81",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  summarySub: {
    fontSize: 12,
    color: "#c7d2fe",
    marginTop: 2,
  },
  badgeChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeChipText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },

  /* Individual Student Row Card */
  studentCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 3,
  },
  rollBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  rollLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rollNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },
  studentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  statusHelperText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },

  /* Input Elements */
  inputWrapper: {
    width: 70,
  },
  markInput: {
    height: 44,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  inputSuccess: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
    color: "#15803d",
  },
  inputWarning: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
    color: "#b45309",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
  },

  /* Submit Action */
  submitButtonWrapper: {
    marginTop: 16,
    borderRadius: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#4f46e5",
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitGradient: {
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  infoFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  infoFooterText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
  },

  /* Bottom Sheet Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  closeIconButton: {
    padding: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
  },

  /* Modal Search Bar */
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
  },

  /* Modal Options */
  modalOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
    gap: 12,
  },
  modalOptionSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#eeef2015",
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  optionRadioActive: {
    borderColor: "#6366f1",
    backgroundColor: "#6366f1",
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  optionTitleSelected: {
    color: "#4f46e5",
  },
  optionSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  notFoundBox: {
    padding: 20,
    alignItems: "center",
  },
  notFoundText: {
    fontSize: 13,
    color: "#94a3b8",
  },
});