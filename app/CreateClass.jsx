import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import {
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";

import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;

// =====================================================
// Available Classes
// =====================================================

const availableClasses = [
  "প্লে-শ্রেণী",
  "নার্সারি-শ্রেণী",
  "প্রথম শ্রেণী",
  "দ্বিতীয় শ্রেণী",
  "তৃতীয় শ্রেণী",
  "চতুর্থ শ্রেণী",
  "পঞ্চম শ্রেণী",
  "ষষ্ঠ শ্রেণী",
  "সপ্তম শ্রেণী",
  "অষ্টম শ্রেণী",
  "নবম শ্রেণী",
  "দশম শ্রেণী",
];

// =====================================================
// Available Sections
// =====================================================

const availableSections = ["A", "B", "C"];

export default function ClassList() {
  // ===================================================
  // State
  // ===================================================

  const [classes, setClasses] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const [totalSubject, setTotalSubject] = useState("");

  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [loadingDelete, setLoadingDelete] = useState(null);

  // ===================================================
  // School ID
  // ===================================================

  const { schoolId } = useLocalSearchParams();

  // ===================================================
  // Storage Key
  // ===================================================

  const STORAGE_KEY = `classes_${schoolId}`;

  // ===================================================
  // Load Classes
  //
  // AsyncStorage = cache
  // Database = source of truth
  // ===================================================

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadClasses = async () => {
        try {
          // ------------------------------------------------
          // 1. Load cached classes first
          // ------------------------------------------------

          const storedData =
            await AsyncStorage.getItem(STORAGE_KEY);

          if (storedData && !cancelled) {
            try {
              const cachedClasses =
                JSON.parse(storedData);

              if (Array.isArray(cachedClasses)) {
                setClasses(cachedClasses);
              }
            } catch (error) {
              console.error(
                "Invalid cached class data:",
                error
              );
            }
          }

          // ------------------------------------------------
          // 2. Fetch latest data from database
          // ------------------------------------------------

          const res = await axios.get(
            `${API_URL}/api/school/class/getClass?schoolId=${schoolId}`
          );

          if (cancelled) return;

          const fetchedClasses =
            res.data?.data || [];

          // ------------------------------------------------
          // 3. Update state
          // ------------------------------------------------

          setClasses(fetchedClasses);

          // ------------------------------------------------
          // 4. Update cache
          // ------------------------------------------------

          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(fetchedClasses)
          );
        } catch (err) {
          console.error(
            "Error loading classes:",
            err?.response?.data || err
          );

          if (!cancelled) {
            // Don't show an error if cached data
            // was already displayed.
            const storedData =
              await AsyncStorage.getItem(
                STORAGE_KEY
              );

            if (!storedData) {
              Alert.alert(
                "Error",
                "Failed to load classes from server."
              );
            }
          }
        } finally {
          if (!cancelled) {
            setInitialLoad(false);
          }
        }
      };

      // Don't run if schoolId is missing
      if (schoolId) {
        loadClasses();
      } else {
        setInitialLoad(false);
      }

      // ------------------------------------------------
      // Cleanup
      // ------------------------------------------------

      return () => {
        cancelled = true;
      };
    }, [schoolId, STORAGE_KEY])
  );

  // ===================================================
  // Add Class
  // ===================================================

  const addClass = async () => {
    // ------------------------------------------------
    // Validate class
    // ------------------------------------------------

    if (!selectedClass) {
      return Alert.alert(
        "Warning",
        "দয়া করে শ্রেণী নির্বাচন করুন"
      );
    }
   

    // ------------------------------------------------
    // Validate total subject
    // ------------------------------------------------

    if (!totalSubject) {
      return Alert.alert(
        "Warning",
        "দয়া করে মোট বিষয়ের সংখ্যা দিন"
      );
    }

    const subjectCount = Number(totalSubject);

    if (
      !Number.isInteger(subjectCount) ||
      subjectCount <= 0
    ) {
      return Alert.alert(
        "Warning",
        "বিষয়ের সংখ্যা অবশ্যই ১ বা তার বেশি পূর্ণ সংখ্যা হতে হবে"
      );
    }

    // ------------------------------------------------
    // Start loading
    // ------------------------------------------------

    setLoading(true);

    try {
      const payload = {
        schoolId,
        className: selectedClass,
        sectionName: selectedSection,
        totalSubject: subjectCount,
      };

      // ------------------------------------------------
      // Create class
      // ------------------------------------------------

      const res = await axios.post(
        `${API_URL}/api/school/class/addClass`,
        payload
      );

      // ------------------------------------------------
      // Success
      // ------------------------------------------------

      if (res.data?.success) {
        // Clear form
        setSelectedClass("");
        setSelectedSection("");
        setTotalSubject("");

        // ------------------------------------------------
        // Fetch latest class list
        // ------------------------------------------------

        const latestRes = await axios.get(
          `${API_URL}/api/school/class/getClass?schoolId=${schoolId}`
        );

        const fetchedClasses =
          latestRes.data?.data || [];

        setClasses(fetchedClasses);

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(fetchedClasses)
        );

        Alert.alert(
          "Success",
          "ক্লাস সফলভাবে যুক্ত হয়েছে!"
        );
      } else {
        Alert.alert(
          "Warning",
          res.data?.message ||
            "ক্লাস তৈরি করা যায়নি"
        );
      }
    } catch (err) {
      console.error(
        "Add class error:",
        err?.response?.data || err
      );

      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "ক্লাস যোগ করতে ব্যর্থ হয়েছে"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // Delete Confirmation
  // ===================================================

  const handleDeleteNotice = (classId) => {
    Alert.alert(
      "নিশ্চিত করুন",
      "আপনি কি এই ক্লাসটি মুছে ফেলতে চান?",
      [
        {
          text: "বাতিল",
          style: "cancel",
        },
        {
          text: "মুছে ফেলুন",
          style: "destructive",
          onPress: () =>
            deleteClass(classId),
        },
      ]
    );
  };

  // ===================================================
  // Delete Class
  // ===================================================

  const deleteClass = async (classId) => {
    const previousClasses = [...classes];

    // ------------------------------------------------
    // Optimistic UI update
    // ------------------------------------------------

    const updatedClasses =
      previousClasses.filter(
        (item) => item._id !== classId
      );

    setClasses(updatedClasses);
    setLoadingDelete(classId);

    try {
      const res = await fetch(
        `${API_URL}/api/school/class/deleteClass?classId=${classId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      // ------------------------------------------------
      // Delete failed
      // ------------------------------------------------

      if (!data.success) {
        setClasses(previousClasses);

        Alert.alert(
          "ত্রুটি",
          data.message ||
            "ক্লাস মুছে ফেলা যায়নি।"
        );

        return;
      }

      // ------------------------------------------------
      // Delete successful
      // ------------------------------------------------

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedClasses)
      );

      Alert.alert(
        "সফল",
        "ক্লাস সফলভাবে মুছে ফেলা হয়েছে।"
      );
    } catch (err) {
      console.error(
        "Delete class error:",
        err
      );

      // ------------------------------------------------
      // Restore previous state
      // ------------------------------------------------

      setClasses(previousClasses);

      Alert.alert(
        "ত্রুটি",
        "ক্লাস মুছে ফেলা যায়নি।"
      );
    } finally {
      setLoadingDelete(null);
    }
  };

  // ===================================================
  // Render
  // ===================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 40,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ============================================= */}
      {/* Header */}
      {/* ============================================= */}

      <Text style={styles.header}>
        ক্লাস যোগ করুন
      </Text>

      {/* ============================================= */}
      {/* Class Selector */}
      {/* ============================================= */}

      <Text style={styles.label}>
        শ্রেণী নির্বাচন করুন
      </Text>

      <View style={styles.selectorContainer}>
        {availableClasses.map((className) => (
          <TouchableOpacity
            key={className}
            style={[
              styles.selectorButton,
              selectedClass === className &&
                styles.selectedButton,
            ]}
            onPress={() =>
              setSelectedClass(className)
            }
          >
            <Text
              style={[
                styles.selectorText,
                selectedClass === className &&
                  styles.selectedText,
              ]}
            >
              {className}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ============================================= */}
      {/* Section Selector */}
      {/* ============================================= */}

      <Text style={styles.label}>
        শাখা নির্বাচন করুন
      </Text>

      <View style={styles.selectorContainer}>
        {availableSections.map((section) => (
          <TouchableOpacity
            key={section}
            style={[
              styles.selectorButton,
              selectedSection === section &&
                styles.selectedButton,
            ]}
            onPress={() =>
              setSelectedSection(section)
            }
          >
            <Text
              style={[
                styles.selectorText,
                selectedSection === section &&
                  styles.selectedText,
              ]}
            >
              {section}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ============================================= */}
      {/* Total Subject */}
      {/* ============================================= */}

      <Text style={styles.label}>
        মোট বিষয়ের সংখ্যা
      </Text>

      <TextInput
        style={styles.subjectInput}
        placeholder="যেমন: ৮"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        value={totalSubject}
        onChangeText={setTotalSubject}
      />

      <Text style={styles.helperText}>
        এই শ্রেণিতে মোট কতটি বিষয় থাকবে তা দিন।
      </Text>

      {/* ============================================= */}
      {/* Add Button */}
      {/* ============================================= */}

      <TouchableOpacity
        style={[
          styles.addButton,
          loading && styles.disabledButton,
        ]}
        onPress={addClass}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons
              name="add-circle-outline"
              size={26}
              color="#fff"
            />

            <Text style={styles.addButtonText}>
              ক্লাস যোগ করুন
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ============================================= */}
      {/* Class List Header */}
      {/* ============================================= */}

      <Text
        style={[
          styles.header,
          {
            marginTop: 20,
          },
        ]}
      >
        ক্লাসের তালিকা
      </Text>

      {/* ============================================= */}
      {/* Class List */}
      {/* ============================================= */}

      <View style={styles.listContainer}>
        {initialLoad ? (
          <ActivityIndicator
            size="large"
            color="#2462B4"
            style={styles.loadingIndicator}
          />
        ) : classes.length === 0 ? (
          <Text style={styles.emptyText}>
            এখনও কোনো ক্লাস যোগ করা হয়নি।
          </Text>
        ) : (
          classes.map((item) => (
            <View
              key={item._id}
              style={styles.cardWrapper}
            >
              <View style={styles.cardContent}>
                {/* ----------------------------------- */}
                {/* Class Information */}
                {/* ----------------------------------- */}

                <View style={styles.leftSection}>
                  <View style={styles.iconBox}>
                    <Ionicons
                      name="school-outline"
                      size={22}
                      color="#2557BB"
                    />
                  </View>

                  <View style={styles.infoContainer}>
                    <Text style={styles.cardTitle}>
                      {item.className}

                      {item.sectionName
                        ? ` - ${item.sectionName}`
                        : ""}
                    </Text>

                    <Text style={styles.cardInfo}>
                      বিষয়:{" "}
                      {item.totalSubject ?? 0}
                      {"  •  "}
                      শিক্ষার্থী:{" "}
                      {item.studentCount ?? 0}
                    </Text>
                  </View>
                </View>

                {/* ----------------------------------- */}
                {/* Delete Button */}
                {/* ----------------------------------- */}

                <TouchableOpacity
                  disabled={
                    loadingDelete === item._id
                  }
                  onPress={() =>
                    handleDeleteNotice(item._id)
                  }
                  style={[
                    styles.deleteButton,
                    loadingDelete === item._id &&
                      styles.deleteButtonDisabled,
                  ]}
                >
                  {loadingDelete === item._id ? (
                    <ActivityIndicator
                      size="small"
                      color="#EF4444"
                    />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color="#EF4444"
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
  },

  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#1E3A8A",
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1E3A8A",
  },

  selectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  selectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    margin: 5,
  },

  selectedButton: {
    backgroundColor: "#E0E7FF",
    borderColor: "#6366F1",
  },

  selectorText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },

  selectedText: {
    fontWeight: "700",
    color: "#1E3A8A",
  },

  subjectInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: "#111827",
    marginBottom: 5,
  },

  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 15,
  },

  addButton: {
    backgroundColor: "#1B56D6",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  disabledButton: {
    opacity: 0.7,
  },

  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  listContainer: {
    marginBottom: 40,
  },

  loadingIndicator: {
    marginTop: 20,
  },

  cardWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E8EEF8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  infoContainer: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  cardInfo: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5,
  },

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#FEECEC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  deleteButtonDisabled: {
    opacity: 0.6,
  },

  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 15,
    marginTop: 10,
  },
});
