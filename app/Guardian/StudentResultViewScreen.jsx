import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import Constants from "expo-constants";

/* ------------------ API URL ------------------ */

const API_URL =
  Constants.expoConfig?.extra?.API_URL || "";

export default function StudentResultView() {
  const params = useLocalSearchParams();
  const router = useRouter();

  /* ------------------ PARAMS ------------------ */

  const schoolId = Array.isArray(params.schoolId)
    ? params.schoolId[0]
    : params.schoolId;

  const studentId = Array.isArray(params.studentId)
    ? params.studentId[0]
    : params.studentId;

  const classId = Array.isArray(params.classId)
    ? params.classId[0]
    : params.classId;

  /* ------------------ STATE ------------------ */

  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] =
    useState("");

  const [result, setResult] = useState(null);

  const [semesterLoading, setSemesterLoading] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  /* =====================================================
     FETCH SEMESTERS
  ===================================================== */

  const fetchSemesters = async () => {
    if (!schoolId) return;

    setSemesterLoading(true);

    try {
      const res = await axios.get(
        `${API_URL}/api/school/semester/getSemesters`,
        {
          params: {
            schoolId,
          },
        }
      );

      const data = Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      setSemesters(data);

      if (data.length > 0) {
        setSelectedSemester(data[0]._id);
      }
    } catch (error) {
      console.error(
        "❌ Semester fetch error:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "ত্রুটি",
        "সেমিস্টারের তথ্য লোড করা যায়নি।"
      );
    } finally {
      setSemesterLoading(false);
    }
  };

  /* =====================================================
     FETCH STUDENT RESULT
  ===================================================== */

  const fetchStudentResult = async (semesterId) => {
    if (!schoolId || !studentId || !semesterId) {
      return;
    }

    setLoading(true);

    console.log(
      "SchoolId:",
      schoolId,
      "StudentId:",
      studentId,
      "SemesterId:",
      semesterId
    );

    try {
      const res = await axios.get(
        `${API_URL}/api/school/results/getSemesterResult`,
        {
          params: {
            schoolId,
            studentId,
            semesterId,
          },
        }
      );

      const fetchedResult = res.data?.data || null;

      setResult(fetchedResult);
    } catch (error) {
      console.error(
        "❌ Result fetch error:",
        error?.response?.data || error.message
      );

      setResult(null);

      if (error?.response?.status !== 404) {
        Alert.alert(
          "ত্রুটি",
          "ফলাফল লোড করা যায়নি।"
        );
      }
    } finally {
      setLoading(false);
      setBtnLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchSemesters();
  }, [schoolId]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const handleSearch = async () => {
    if (!selectedSemester) {
      Alert.alert(
        "ত্রুটি",
        "সেমিস্টার নির্বাচন করুন!"
      );
      return;
    }

    setBtnLoading(true);

    await fetchStudentResult(selectedSemester);
  };

  /* =====================================================
     SEMESTER CHANGE
  ===================================================== */

  const handleSemesterChange = (value) => {
    setSelectedSemester(value);

    setResult(null);
  };

  /* =====================================================
     SELECTED SEMESTER NAME
  ===================================================== */

  const selectedSemesterData = semesters.find(
    (semester) =>
      semester._id === selectedSemester
  );

  /* =====================================================
     SUBJECT RESULTS
  ===================================================== */

  const subjectResults = Array.isArray(
    result?.subjects
  )
    ? result.subjects
    : [];

  /* =====================================================
     CALCULATE TOTAL MARKS
  ===================================================== */

  const calculatedTotalMarks =
    subjectResults.reduce((total, subject) => {
      return (
        total +
        Number(subject.totalMarks ?? 0)
      );
    }, 0);

  /* =====================================================
     CALCULATE TOTAL POSSIBLE MARKS
  ===================================================== */

  const calculatedTotalPossibleMarks =
    subjectResults.reduce((total, subject) => {
      return (
        total +
        Number(subject.maxMarks ?? 0)
      );
    }, 0);

  /* =====================================================
     CALCULATE AVERAGE / PERCENTAGE
  ===================================================== */

  const calculatedAverage =
    calculatedTotalPossibleMarks > 0
      ? (calculatedTotalMarks /
          calculatedTotalPossibleMarks) *
        100
      : 0;

  /* =====================================================
     CALCULATE GPA
  ===================================================== */

  const calculatedGPA =
    subjectResults.length > 0
      ? subjectResults.reduce(
          (total, subject) => {
            return (
              total +
              Number(subject.gpa ?? 0)
            );
          },
          0
        ) / subjectResults.length
      : 0;

  console.log("Semester Result:", result);

  console.log(
    "Calculated Total:",
    calculatedTotalMarks
  );

  console.log(
    "Calculated Possible:",
    calculatedTotalPossibleMarks
  );

  console.log(
    "Calculated Average:",
    calculatedAverage
  );

  console.log(
    "Calculated GPA:",
    calculatedGPA
  );

  return (
    <LinearGradient
      colors={["#f8fcff", "#e8f1f8"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ------------------ HOME BUTTON ------------------ */}

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() =>
            router.push(
              `/PrincipalDashboardScreen?schoolId=${schoolId}`
            )
          }
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#1e3a8a"
          />
        </TouchableOpacity>

        {/* ------------------ HEADER ------------------ */}

        <View style={styles.headerContainer}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="school-outline"
              size={28}
              color="#2563eb"
            />
          </View>

          <Text style={styles.header}>
            শিক্ষার্থীর ফলাফল
          </Text>

          <Text style={styles.headerSubtitle}>
            সেমিস্টার ভিত্তিক ফলাফল দেখুন
          </Text>
        </View>

        {/* =================================================
            SEMESTER SELECTOR
        ================================================= */}

        <View style={styles.inputSection}>
          <View style={styles.labelRow}>
            <MaterialIcons
              name="event"
              size={20}
              color="#2563eb"
            />

            <Text style={styles.label}>
              সেমিস্টার নির্বাচন করুন
            </Text>
          </View>

          {semesterLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="small"
                color="#2563eb"
              />

              <Text style={styles.loadingText}>
                সেমিস্টার লোড হচ্ছে...
              </Text>
            </View>
          ) : semesters.length === 0 ? (
            <View style={styles.noSemesterBox}>
              <MaterialIcons
                name="info-outline"
                size={22}
                color="#64748b"
              />

              <Text style={styles.noSemesterText}>
                কোনো সেমিস্টার পাওয়া যায়নি।
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedSemester}
                  onValueChange={
                    handleSemesterChange
                  }
                  style={styles.picker}
                  dropdownIconColor="#1591d4"
                >
                  <Picker.Item
                    label="সেমিস্টার নির্বাচন করুন"
                    value=""
                  />

                  {semesters.map((semester) => (
                    <Picker.Item
                      key={semester._id}
                      label={`${semester.name} - ${semester.academicYear}`}
                      value={semester._id}
                    />
                  ))}
                </Picker>
              </View>

              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={btnLoading}
              >
                <LinearGradient
                  colors={[
                    "#4ca6f5",
                    "#2014d0",
                  ]}
                  style={styles.searchButtonInner}
                >
                  {btnLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <MaterialIcons
                        name="search"
                        size={22}
                        color="#fff"
                      />

                      <Text
                        style={styles.buttonText}
                      >
                        ফলাফল দেখুন
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <View style={styles.loadingResult}>
            <ActivityIndicator
              size="large"
              color="#2563eb"
            />

            <Text style={styles.loadingResultText}>
              ফলাফল লোড হচ্ছে...
            </Text>
          </View>
        )}

        {/* =================================================
            RESULT
        ================================================= */}

        {!loading && result && (
          <View style={styles.resultsSection}>
            {/* ------------------ RESULT HEADER ------------------ */}

            <View style={styles.resultHeaderCard}>
              <View>
                <Text style={styles.resultHeaderTitle}>
                  {selectedSemesterData?.name ||
                    "Semester Result"}
                </Text>

                <Text
                  style={styles.resultHeaderSubtitle}
                >
                  {selectedSemesterData?.academicYear ||
                    ""}
                </Text>
              </View>

              <View style={styles.resultStatus}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color="#16a34a"
                />

                <Text style={styles.resultStatusText}>
                  ফলাফল
                </Text>
              </View>
            </View>

            {/* =================================================
                SUBJECT TABLE
            ================================================= */}

            <View style={styles.resultCard}>
              <Text style={styles.sectionTitle}>
                বিষয়ভিত্তিক ফলাফল
              </Text>

              <View style={styles.table}>
                {/* TABLE HEADER */}

                <View style={styles.tableHeader}>
                  <Text
                    style={[
                      styles.cell,
                      styles.headerCell,
                      { flex: 2.2 },
                    ]}
                  >
                    বিষয়
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.headerCell,
                    ]}
                  >
                    নম্বর
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.headerCell,
                    ]}
                  >
                    সর্বোচ্চ
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.headerCell,
                    ]}
                  >
                    পাশ
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.headerCell,
                    ]}
                  >
                    গ্রেড
                  </Text>
                </View>

                {/* TABLE ROWS */}

                {subjectResults.map(
                  (item, index) => {
                    const mark = Number(
                      item.totalMarks ?? 0
                    );

                    const maxMarks = Number(
                      item.maxMarks ?? 0
                    );

                    const passingMarks = Number(
                      item.passingMarks ?? 0
                    );

                    const isFailed =
                      mark < passingMarks ||
                      item.grade === "F";

                    return (
                      <View
                        key={
                          item.subjectId?._id ||
                          item.subjectId ||
                          index
                        }
                        style={[
                          styles.tableRow,
                          {
                            backgroundColor:
                              index % 2 === 0
                                ? "#F9FAFB"
                                : "#FFFFFF",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cell,
                            {
                              flex: 2.2,
                              textAlign: "left",
                              paddingLeft: 8,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {item.subjectName ||
                            "বিষয়"}
                        </Text>

                        <Text
                          style={[
                            styles.cell,
                            isFailed &&
                              styles.failedText,
                          ]}
                        >
                          {mark}
                        </Text>

                        <Text style={styles.cell}>
                          {maxMarks}
                        </Text>

                        <Text style={styles.cell}>
                          {passingMarks}
                        </Text>

                        <Text
                          style={[
                            styles.cell,
                            isFailed &&
                              styles.failedText,
                          ]}
                        >
                          {item.grade || "-"}
                        </Text>
                      </View>
                    );
                  }
                )}

                {subjectResults.length === 0 && (
                  <View style={styles.noSubjectResult}>
                    <MaterialIcons
                      name="info-outline"
                      size={22}
                      color="#64748b"
                    />

                    <Text
                      style={
                        styles.noSubjectResultText
                      }
                    >
                      এখনো কোনো বিষয়ের ফলাফল
                      দেওয়া হয়নি।
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <View style={styles.summaryGrid}>
              {/* GPA */}

              <View
                style={[
                  styles.summaryBox,
                  styles.gpaBox,
                ]}
              >
                <MaterialCommunityIcons
                  name="chart-line"
                  size={24}
                  color="#2563eb"
                />

                <Text style={styles.summaryLabel}>
                  GPA
                </Text>

                <Text style={styles.summaryValue}>
                  {calculatedGPA.toFixed(2)}
                </Text>
              </View>

              {/* TOTAL */}

              <View
                style={[
                  styles.summaryBox,
                  styles.totalBox,
                ]}
              >
                <MaterialCommunityIcons
                  name="counter"
                  size={24}
                  color="#16a34a"
                />

                <Text style={styles.summaryLabel}>
                  মোট নম্বর
                </Text>

                <Text style={styles.summaryValue}>
                  {calculatedTotalMarks}
                </Text>

                <Text style={styles.possibleMarks}>
                  / {calculatedTotalPossibleMarks}
                </Text>
              </View>

              {/* AVERAGE */}

              <View
                style={[
                  styles.summaryBox,
                  styles.averageBox,
                ]}
              >
                <MaterialCommunityIcons
                  name="percent"
                  size={24}
                  color="#9333ea"
                />

                <Text style={styles.summaryLabel}>
                  গড় নম্বর
                </Text>

                <Text style={styles.summaryValue}>
                  {calculatedAverage.toFixed(2)}%
                </Text>
              </View>
            </View>

            {/* =================================================
                RESULT STATUS
            ================================================= */}

            <View style={styles.statusCard}>
              <MaterialCommunityIcons
                name={
                  result.status === "published"
                    ? "check-decagram"
                    : "clock-outline"
                }
                size={24}
                color={
                  result.status === "published"
                    ? "#16a34a"
                    : "#d97706"
                }
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>
                  {result.status === "published"
                    ? "ফলাফল প্রকাশিত"
                    : "ফলাফল এখনো প্রকাশিত হয়নি"}
                </Text>

                {result.publishedAt && (
                  <Text
                    style={styles.statusSubtitle}
                  >
                    প্রকাশের তারিখ:{" "}
                    {new Date(
                      result.publishedAt
                    ).toLocaleDateString("bn-BD")}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!loading &&
          !result &&
          !semesterLoading && (
            <View style={styles.emptyState}>
              <Image
                style={styles.image}
                source={require("../../assets/image/empty.png")}
              />

              <Text style={styles.emptyTitle}>
                কোনো ফলাফল পাওয়া যায়নি
              </Text>

              <Text style={styles.emptySubtitle}>
                একটি সেমিস্টার নির্বাচন করে
                ফলাফল দেখুন।
              </Text>
            </View>
          )}
      </ScrollView>
    </LinearGradient>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 60,
  },

  homeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    marginBottom: 8,
  },

  headerContainer: {
    alignItems: "center",
    marginBottom: 18,
  },

  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#e8f1ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e3a8a",
    textAlign: "center",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
  },

  inputSection: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 15,
    elevation: 3,
    marginBottom: 18,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },

  label: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },

  picker: {
    color: "#144073",
    backgroundColor: "#ffffff",
  },

  searchButton: {
    borderRadius: 12,
    overflow: "hidden",
  },

  searchButtonInner: {
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },

  loadingBox: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: "#64748b",
    fontSize: 14,
  },

  noSemesterBox: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  noSemesterText: {
    color: "#64748b",
    fontSize: 14,
  },

  loadingResult: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    elevation: 2,
  },

  loadingResultText: {
    marginTop: 10,
    color: "#64748b",
    fontSize: 14,
  },

  resultsSection: {
    marginTop: 2,
  },

  resultHeaderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },

  resultHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e3a8a",
  },

  resultHeaderSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 3,
  },

  resultStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },

  resultStatusText: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "700",
  },

  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e3a8a",
    marginBottom: 12,
  },

  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#dce9fc",
    paddingVertical: 9,
  },

  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
  },

  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    color: "#334155",
  },

  headerCell: {
    fontWeight: "800",
    color: "#044a78",
    fontSize: 12,
  },

  failedText: {
    color: "#dc2626",
    fontWeight: "800",
  },

  noSubjectResult: {
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  noSubjectResultText: {
    color: "#64748b",
    marginTop: 7,
    fontSize: 13,
    textAlign: "center",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  summaryBox: {
    width: "48%",
    minHeight: 125,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  gpaBox: {
    backgroundColor: "#eff6ff",
  },

  totalBox: {
    backgroundColor: "#f0fdf4",
  },

  averageBox: {
    backgroundColor: "#faf5ff",
  },

  positionBox: {
    backgroundColor: "#fffbeb",
  },

  summaryLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  summaryValue: {
    marginTop: 2,
    fontSize: 24,
    fontWeight: "900",
    color: "#1e293b",
  },

  possibleMarks: {
    fontSize: 11,
    color: "#64748b",
    marginTop: -2,
  },

  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },

  statusSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748b",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 45,
    paddingHorizontal: 20,
  },

  image: {
    width: 210,
    height: 210,
    resizeMode: "contain",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#334155",
    marginTop: 5,
  },

  emptySubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 5,
    textAlign: "center",
  },
});