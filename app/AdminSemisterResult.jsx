import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import axios from "axios";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function AdminSemesterResult() {
  // Params
  const { schoolId, classId } = useLocalSearchParams();

  // State
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publishingClassId, setPublishingClassId] = useState(null);

  // Active Semester State
  const [activeSemester, setActiveSemester] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesterLoading, setSemesterLoading] = useState(false);

  const semesterId = activeSemester?._id || selectedSemester;

  // Aggregate stats across all loaded class data
  const totalUploadedSubjects = classes.reduce(
    (sum, cls) => sum + (cls.uploadedSubjects || 0),
    0
  );

  const totalRemainingSubjects = classes.reduce(
    (sum, cls) => sum + (cls.remainingSubjects || 0),
    0
  );

  // 1. Fetch Active Semester
  const fetchActiveSemester = useCallback(async () => {
    if (!schoolId) return;

    setSemesterLoading(true);
   try {
  const res = await axios.get(
    `${API_URL}/api/school/semester/active`,
    {
      params: {
        schoolId,
      },
    }
  );

  const semester = res.data?.data;

  if (res.data?.active && semester) {
    setActiveSemester(semester);
  } else {
    setActiveSemester(null);

    Alert.alert(
      "No Active Semester",
      res.data?.message || "There is no active semester currently."
    );
  }
} catch (error) {
  // Axios treats 404 as an error
  if (error.response?.status === 404) {
    setActiveSemester(null);

    Alert.alert(
      "No Active Semester",
      error.response?.data?.message ||
        "There is no active semester currently."
    );

    return;
  }

  console.log(
    "Get active semester error:",
    error.response?.data || error.message
  );

  Alert.alert(
    "Error",
    "Failed to fetch active semester."
  );
}finally {
      setSemesterLoading(false);
    }
  }, [schoolId]);

  // 2. Fetch Result Status
  const fetchResultStatus = useCallback(
    async (showLoading = true) => {
      if (!schoolId || !semesterId || !classId) {
        console.log("Missing params:", { schoolId, semesterId, classId });
        return;
      }

      try {
        if (showLoading) setLoading(true);

        const response = await axios.get(
          `${API_URL}/api/school/semester/admin/status`,
          {
            params: { schoolId, semesterId, classId },
          }
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message || "Failed to load result status."
          );
        }

        const data = response.data?.data;
        // Handles both single class object response (data.class) and array response (data.classes)
        const classList = data?.classes
          ? data.classes
          : data?.class
          ? [data.class]
          : [];

        setClasses(classList);
      } catch (error) {
        console.error(
          "Result status error:",
          error?.response?.data || error.message
        );
        Alert.alert(
          "Error",
          error?.response?.data?.message ||
            error.message ||
            "Failed to load result status."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [schoolId, semesterId, classId]
  );

  // 3. Screen Focus Effect
  useFocusEffect(
    useCallback(() => {
      fetchActiveSemester();
      if (schoolId && semesterId && classId) {
        fetchResultStatus();
      }
    }, [fetchActiveSemester, schoolId, semesterId, classId, fetchResultStatus])
  );

  // 4. Refresh Handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActiveSemester();
    if (semesterId) {
      await fetchResultStatus(false);
    } else {
      setRefreshing(false);
    }
  };

  // Publish Helpers
  const getPublishBlockReason = (item) => {
    if (item.remainingSubjects > 0) {
      return `আরও ${item.remainingSubjects}টি বিষয়ের ফলাফল আপলোড করা বাকি।`;
    }
    if (!item.allStudentsPresent) {
      return "সব শিক্ষার্থীর জন্য ফলাফল তৈরি হয়নি।";
    }
    if (!item.allStudentsComplete) {
      return "কিছু শিক্ষার্থীর সব বিষয়ের ফলাফল আপলোড হয়নি।";
    }
    if (!item.allSubjectsSubmitted) {
      return "কিছু বিষয়ের ফলাফল এখনও submit করা হয়নি।";
    }
    if (item.isPublished) {
      return "এই ফলাফল ইতোমধ্যে প্রকাশিত হয়েছে।";
    }
    return "ফলাফল প্রকাশ করা যাবে না।";
  };

  const publishResult = async (item) => {
    try {
      setPublishingClassId(item.classId);

      const response = await axios.post(
        `${API_URL}/api/school/semester/admin/publish`,
        {
          schoolId,
          semesterId,
          classId: item.classId,
        }
      );

      if (!response.data?.success) {
        Alert.alert(
          "Cannot Publish",
          response.data?.message || "Result could not be published."
        );
        return;
      }

      Alert.alert("Success", "Result successfully published to guardians.");
      await fetchResultStatus(false);
    } catch (error) {
      console.error("Publish error:", error?.response?.data || error.message);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to publish result."
      );
    } finally {
      setPublishingClassId(null);
    }
  };

  const confirmPublish = (item) => {
    if (!item.canPublish) {
      Alert.alert("Cannot Publish", getPublishBlockReason(item));
      return;
    }

    Alert.alert(
      "Publish Result",
      `Are you sure you want to publish the result of ${item.className}${
        item.sectionName ? ` (${item.sectionName})` : ""
      } to guardians?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          style: "default",
          onPress: () => publishResult(item),
        },
      ]
    );
  };

  // Render Subject Row
  const renderSubject = (subject, index) => {
    const completed = subject.uploadedStudents || 0;
    const expected =
      classes.find((cls) =>
        cls.subjects?.some((s) => s.subjectId === subject.subjectId)
      )?.expectedStudents || 0;

    const complete = expected > 0 && completed === expected;

    return (
      <View key={subject.subjectId || index} style={styles.subjectRow}>
        <View style={styles.subjectLeft}>
          <View
            style={[
              styles.subjectIcon,
              complete && styles.subjectIconComplete,
            ]}
          >
            <Ionicons
              name={complete ? "checkmark" : "book-outline"}
              size={16}
              color={complete ? "#16A34A" : "#2563EB"}
            />
          </View>

          <View style={styles.subjectTextContainer}>
            <Text style={styles.subjectName}>{subject.subjectName}</Text>
            <Text style={styles.subjectStudentCount}>
              {completed} / {expected} students
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.subjectStatus,
            complete
              ? styles.subjectStatusComplete
              : styles.subjectStatusPending,
          ]}
        >
          <Text
            style={[
              styles.subjectStatusText,
              complete
                ? styles.subjectStatusTextComplete
                : styles.subjectStatusTextPending,
            ]}
          >
            {complete ? "Complete" : "Pending"}
          </Text>
        </View>
      </View>
    );
  };

  // Render Class Card
  const renderClass = ({ item }) => {
    const progress =
      item.expectedSubjects > 0
        ? Math.min(item.uploadedSubjects / item.expectedSubjects, 1)
        : 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.classInfoContainer}>
            <View style={styles.classIcon}>
              <Ionicons name="school-outline" size={24} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.className}>
                {item.className}
                {item.sectionName ? ` - ${item.sectionName}` : ""}
              </Text>
              <Text style={styles.studentCount}>
                {item.expectedStudents} Students
              </Text>
            </View>
          </View>

          {item.isPublished && (
            <View style={styles.publishedBadge}>
              <Ionicons name="checkmark-circle" size={15} color="#16A34A" />
              <Text style={styles.publishedText}>Published</Text>
            </View>
          )}
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Subject Upload Progress</Text>
            <Text style={styles.progressCount}>
              {item.uploadedSubjects} / {item.expectedSubjects}
            </Text>
          </View>

          <View style={styles.progressBackground}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress * 100}%` },
              ]}
            />
          </View>

          <View style={styles.remainingContainer}>
            <View style={styles.remainingLeft}>
              <Ionicons
                name={
                  item.remainingSubjects === 0
                    ? "checkmark-circle"
                    : "time-outline"
                }
                size={18}
                color={item.remainingSubjects === 0 ? "#16A34A" : "#F59E0B"}
              />
              <Text style={styles.remainingText}>
                {item.remainingSubjects === 0
                  ? "সব বিষয় আপলোড হয়েছে"
                  : `${item.remainingSubjects}টি বিষয় বাকি`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.studentProgress}>
          <View style={styles.studentProgressItem}>
            <Text style={styles.studentProgressNumber}>
              {item.studentsWithResults}
            </Text>
            <Text style={styles.studentProgressLabel}>Results Started</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.studentProgressItem}>
            <Text style={styles.studentProgressNumber}>
              {item.studentsCompleted}
            </Text>
            <Text style={styles.studentProgressLabel}>Complete</Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.studentProgressItem}>
            <Text
              style={[
                styles.studentProgressNumber,
                item.studentsIncomplete > 0 && styles.incompleteNumber,
              ]}
            >
              {item.studentsIncomplete}
            </Text>
            <Text style={styles.studentProgressLabel}>Incomplete</Text>
          </View>
        </View>

        {item.subjects?.length > 0 && (
          <View style={styles.subjectSection}>
            <Text style={styles.subjectSectionTitle}>Uploaded Subjects</Text>
            {item.subjects.map(renderSubject)}
          </View>
        )}

        {!item.isPublished && (
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={
              publishingClassId === item.classId || !item.canPublish
            }
            onPress={() => confirmPublish(item)}
            style={[
              styles.publishButton,
              !item.canPublish && styles.publishButtonDisabled,
              publishingClassId === item.classId && styles.publishButtonLoading,
            ]}
          >
            {publishingClassId === item.classId ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name={
                    item.canPublish
                      ? "cloud-upload-outline"
                      : "lock-closed-outline"
                  }
                  size={21}
                  color={item.canPublish ? "#FFFFFF" : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.publishButtonText,
                    !item.canPublish && styles.publishButtonTextDisabled,
                  ]}
                >
                  {item.canPublish
                    ? "Publish Result to Guardians"
                    : "Result Not Ready"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {!item.isPublished && !item.canPublish && (
          <Text style={styles.blockReason}>
            {getPublishBlockReason(item)}
          </Text>
        )}

        {item.isPublished && item.publishedAt && (
          <View style={styles.publishedDateContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            <Text style={styles.publishedDate}>
              Published on {new Date(item.publishedAt).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Loading Screen
  if ((loading || semesterLoading) && classes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>ফলাফলের তথ্য লোড হচ্ছে...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Semester Result</Text>
          <Text style={styles.subtitle}>Teacher Upload & Publish Control</Text>

          {/* Active Semester Name Chip */}
          <View style={styles.activeSemesterContainer}>
            <View style={styles.activeSemesterBadge}>
              <Ionicons name="calendar-outline" size={14} color="#2563EB" />
              <Text style={styles.activeSemesterText}>
                {activeSemester?.name ||
                  activeSemester?.semesterName ||
                  "No Active Semester"}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Summary Metrics: Displaying Uploaded vs Pending Subjects */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="book-outline" size={22} color="#2563EB" />
          <Text style={styles.summaryNumber}>{totalUploadedSubjects}</Text>
          <Text style={styles.summaryLabel}>Uploaded</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="hourglass-outline" size={22} color="#F59E0B" />
          <Text style={styles.summaryNumber}>{totalRemainingSubjects}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#16A34A" />
          <Text style={styles.summaryNumber}>
            {classes.filter((item) => item.isPublished).length}
          </Text>
          <Text style={styles.summaryLabel}>Published</Text>
        </View>
      </View>

      {/* Main List */}
      <FlatList
        data={classes}
        renderItem={renderClass}
        keyExtractor={(item) => String(item.classId)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={50} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No classes found</Text>
            <Text style={styles.emptyText}>
              No result information is available for this semester yet.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 18,
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#172554",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  activeSemesterContainer: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  activeSemesterBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F0FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  activeSemesterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
    marginLeft: 6,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#E8F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  classInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  classIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#E8F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  className: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E3A8A",
  },
  studentCount: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },
  publishedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },
  publishedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
    marginLeft: 4,
  },
  progressSection: {
    marginTop: 18,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  progressCount: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563EB",
  },
  progressBackground: {
    height: 9,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 10,
  },
  remainingContainer: {
    marginTop: 9,
  },
  remainingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  remainingText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 6,
  },
  studentProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#F8FAFC",
    borderRadius: 13,
    paddingVertical: 12,
    marginTop: 15,
  },
  studentProgressItem: {
    flex: 1,
    alignItems: "center",
  },
  studentProgressNumber: {
    fontSize: 19,
    fontWeight: "800",
    color: "#2563EB",
  },
  incompleteNumber: {
    color: "#DC2626",
  },
  studentProgressLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 3,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
  },
  subjectSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 13,
  },
  subjectSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 8,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifycontent: "space-between",
    paddingVertical: 8,
  },
  subjectLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  subjectIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E8F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },
  subjectIconComplete: {
    backgroundColor: "#DCFCE7",
  },
  subjectTextContainer: {
    flex: 1,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  subjectStudentCount: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  subjectStatus: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subjectStatusComplete: {
    backgroundColor: "#DCFCE7",
  },
  subjectStatusPending: {
    backgroundColor: "#FEF3C7",
  },
  subjectStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  subjectStatusTextComplete: {
    color: "#16A34A",
  },
  subjectStatusTextPending: {
    color: "#D97706",
  },
  publishButton: {
    height: 48,
    borderRadius: 13,
    backgroundColor: "#16A34A",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  publishButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  publishButtonLoading: {
    opacity: 0.7,
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },
  publishButtonTextDisabled: {
    color: "#9CA3AF",
  },
  blockReason: {
    textAlign: "center",
    fontSize: 11,
    color: "#DC2626",
    marginTop: 8,
    lineHeight: 16,
  },
  publishedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  publishedDate: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "600",
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 5,
    lineHeight: 19,
  },
});