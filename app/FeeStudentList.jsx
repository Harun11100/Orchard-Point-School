import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TextInput,
  StatusBar,
} from "react-native";

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function FeeStudentListScreen() {
  const { schoolId, classId, classes } = useLocalSearchParams();

  const router = useRouter();

  const classData = classes ? JSON.parse(classes) : null;

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");


  // --------------------- -----------------------------
  // Fetch Students
  // --------------------------------------------------

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_URL}/api/school/student/getStudents?schoolId=${schoolId}&classId=${classId}`
      );

      if (res.data?.success) {
        const fetchedStudents = res.data.data || [];

        setStudents(fetchedStudents);
        setFilteredStudents(fetchedStudents);
      } else {
        setStudents([]);
        setFilteredStudents([]);

        Alert.alert(
          "No Students",
          "No students were found for this class."
        );
      }
    } catch (error) {
      console.error(
        "Error fetching students:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Error",
        "Failed to fetch students from server."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Initial Load
  // --------------------------------------------------

  useEffect(() => {
    if (schoolId && classId) {
      fetchStudents();
    }
  }, [schoolId, classId]);

  // --------------------------------------------------
  // Search Students
  // --------------------------------------------------

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter((student) => {
      const name = String(student.name || "").toLowerCase();
      const roll = String(student.roll || "").toLowerCase();
      const phone = String(student.guardianPhone || "").toLowerCase();

      return (
        name.includes(query) ||
        roll.includes(query) ||
        phone.includes(query)
      );
    });

    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  // --------------------------------------------------
  // Navigate to Fee Collection
  // --------------------------------------------------

  const openFeeCollection = (student) => {
    router.push({
      pathname: "/FeeCollection",
      params: {
        schoolId: schoolId,
        classId: classId,
        studentId: student._id,
        tutionFee:student.tuitionFee,
        coachingFee:student.coachingFee,

        // Passing basic student information
        // so FeeCollectionScreen can display it immediately
        studentName: student.name || "",
        roll: String(student.roll || ""),
        className:
          student.className ||
          classData?.className ||
          "",
        section:
          student.section ||
          classData?.sectionName ||
          "",
      },
    });
  };

  // --------------------------------------------------
  // Render Student
  // --------------------------------------------------

  const renderStudent = ({ item, index }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openFeeCollection(item)}
        style={styles.studentCard}
      >
        {/* Student Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase() || "S"}
          </Text>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <Text
            style={styles.studentName}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View style={styles.infoRow}>
            <MaterialIcons
              name="confirmation-number"
              size={15}
              color="#64748B"
            />

            <Text style={styles.infoText}>
              Roll: {item.roll}
            </Text>
          </View>

          {item.guardianPhone ? (
            <View style={styles.infoRow}>
              <MaterialIcons
                name="phone"
                size={15}
                color="#64748B"
              />

              <Text style={styles.infoText}>
                {item.guardianPhone}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons
            name="chevron-forward"
            size={22}
            color="#94A3B8"
          />
        </View>
      </TouchableOpacity>
    );
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar
          backgroundColor="#0866D8"
          barStyle="light-content"
        />

        <ActivityIndicator
          size="large"
          color="#0866D8"
        />

        <Text style={styles.loadingText}>
          Loading students...
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // Empty State
  // --------------------------------------------------

  if (!students.length) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar
          backgroundColor="#0866D8"
          barStyle="light-content"
        />

        <Image
          style={styles.emptyImage}
          source={require("../assets/image/empty.png")}
        />

        <Text style={styles.emptyTitle}>
          No Students Found
        </Text>

        <Text style={styles.emptySubtitle}>
          There are no students available in this class.
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchStudents}
        >
          <Ionicons
            name="refresh"
            size={18}
            color="#fff"
          />

          <Text style={styles.retryText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar
        backgroundColor="#0866D8"
        barStyle="light-content"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#fff"
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Fee Collection
          </Text>

          <Text style={styles.headerSubtitle}>
            Select a student
          </Text>
        </View>

        <View style={styles.studentCountBadge}>
          <Text style={styles.studentCountText}>
            {students.length}
          </Text>
        </View>
      </View>

      {/* Class Information */}
      <View style={styles.classHeader}>
        <View style={styles.classIcon}>
          <MaterialIcons
            name="school"
            size={22}
            color="#0866D8"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.className}>
            {classData?.className || "Class"}
            {classData?.sectionName
              ? ` - ${classData.sectionName}`
              : ""}
          </Text>

          <Text style={styles.classStudentCount}>
            {students.length} Students
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={21}
          color="#64748B"
        />

        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, roll or phone..."
          placeholderTextColor="#94A3B8"
          keyboardType="default"
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Result Count */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultText}>
          {filteredStudents.length} student
          {filteredStudents.length !== 1 ? "s" : ""}
        </Text>

        <Text style={styles.resultHint}>
          Tap a student to collect fee
        </Text>
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        renderItem={renderStudent}
        keyExtractor={(item) =>
          item._id?.toString()
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.noSearchResult}>
            <Ionicons
              name="search-outline"
              size={45}
              color="#CBD5E1"
            />

            <Text style={styles.noSearchTitle}>
              No student found
            </Text>

            <Text style={styles.noSearchText}>
              Try searching with another name or roll.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ======================================================
// Styles
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },

  // --------------------------------------------------
  // Header
  // --------------------------------------------------

  header: {
    height: 92,
    backgroundColor: "#0866D8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#DCEBFF",
    fontSize: 12,
    marginTop: 3,
  },

  studentCountBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  studentCountText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  // --------------------------------------------------
  // Class Header
  // --------------------------------------------------

  classHeader: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 15,
    padding: 14,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",

    elevation: 2,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },

  classIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  className: {
    fontSize: 17,
    fontWeight: "800",
    color: "#172B4D",
  },

  classStudentCount: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  // --------------------------------------------------
  // Search
  // --------------------------------------------------

  searchContainer: {
    height: 52,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 9,
    fontSize: 14,
    color: "#172B4D",
  },

  // --------------------------------------------------
  // Result Header
  // --------------------------------------------------

  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 17,
    marginTop: 15,
    marginBottom: 5,
  },

  resultText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
  },

  resultHint: {
    fontSize: 11,
    color: "#94A3B8",
  },

  // --------------------------------------------------
  // Student List
  // --------------------------------------------------

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 30,
  },

  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 14,
    marginVertical: 5,

    flexDirection: "row",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#EEF2F7",

    elevation: 2,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EAF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0866D8",
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#172B4D",
    marginBottom: 5,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  infoText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 5,
  },

  arrowContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  // --------------------------------------------------
  // Empty / Loading
  // --------------------------------------------------

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F8FC",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: "#F5F8FC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyImage: {
    width: 220,
    height: 220,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#334155",
  },

  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: "#0866D8",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // --------------------------------------------------
  // Search Empty
  // --------------------------------------------------

  noSearchResult: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
  },

  noSearchTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#475569",
    marginTop: 12,
  },

  noSearchText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 5,
    textAlign: "center",
  },
});