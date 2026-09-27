import React, {
  useCallback,
  useState,
} from "react";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";

import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import Constants from "expo-constants";

const API_URL =
  Constants.expoConfig.extra.API_URL;

export default function ClassListForResult() {
  // =====================================================
  // Params
  // =====================================================

  const {
    schoolId,
    teacherId,
  } = useLocalSearchParams();

  // =====================================================
  // State
  // =====================================================

  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // =====================================================
  // Storage Key
  // =====================================================

  const STORAGE_KEY = `classes_${schoolId}`;

  // =====================================================
  // Normalize Class Data
  // =====================================================

  const normalizeClassData = (cls) => ({
    _id: cls?._id,

    className: cls?.className || "",

    sectionName:
      cls?.sectionName ||
      cls?.sectionnName ||
      "",

    // New field
    totalSubject:
      Number(cls?.totalSubject) || 0,

    studentCount:
      Number(cls?.studentCount) ||
      Number(cls?.["studentCoun  nt"]) ||
      0,

    schoolId:
      cls?.schoolId || schoolId,

    guardianPhone:
      cls?.guardianPhone || null,
  });

  // =====================================================
  // Fetch Classes From Database
  // =====================================================

  const fetchClassesFromDb = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/school/class/getClass?schoolId=${schoolId}`
      );

      const fetchedData =
        res.data?.data || [];

      const fetchedClasses =
        fetchedData.map(normalizeClassData);

      setClasses(fetchedClasses);

      // Save latest data to cache
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(fetchedClasses)
      );

      return fetchedClasses;
    } catch (err) {
      console.error(
        "Error fetching classes:",
        err?.response?.data || err
      );

      throw err;
    }
  };

  // =====================================================
  // Load Classes
  //
  // 1. Show cached data immediately
  // 2. Fetch latest data from database
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadClasses = async () => {
        try {
          setLoading(true);

          // ---------------------------------------------
          // Load cached data first
          // ---------------------------------------------

          const storedData =
            await AsyncStorage.getItem(
              STORAGE_KEY
            );

          if (
            storedData &&
            !cancelled
          ) {
            try {
              const parsed =
                JSON.parse(storedData);

              if (Array.isArray(parsed)) {
                setClasses(
                  parsed.map(
                    normalizeClassData
                  )
                );
              }
            } catch (cacheError) {
              console.error(
                "Invalid cached class data:",
                cacheError
              );
            }
          }

          // ---------------------------------------------
          // Fetch fresh data
          // ---------------------------------------------

          const freshClasses =
            await fetchClassesFromDb();

          if (!cancelled) {
            setClasses(freshClasses);
          }
        } catch (err) {
          console.error(
            "Error loading classes:",
            err?.response?.data || err
          );

          // Only show error if there is
          // no cached data
          if (!cancelled) {
            const storedData =
              await AsyncStorage.getItem(
                STORAGE_KEY
              );

            if (!storedData) {
              Alert.alert(
                "Error",
                "Failed to fetch classes from server."
              );
            }
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

      if (schoolId) {
        loadClasses();
      } else {
        setLoading(false);
      }

      // ---------------------------------------------
      // Cleanup
      // ---------------------------------------------

      return () => {
        cancelled = true;
      };
    }, [schoolId])
  );

  // =====================================================
  // Render Class
  // =====================================================

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cardWrapper}
        onPress={() =>
          router.push({
            pathname:
              "/AdminSemisterResult",

            params: {
              classId: item._id,
              schoolId
            },
          })
        }
      >
        <LinearGradient
          colors={[
            "#fefeff",
            "#ffffff",
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={styles.card}
        >
          <View
            style={styles.cardContent}
          >
            {/* ===================================== */}
            {/* Class Information */}
            {/* ===================================== */}

            <View style={styles.leftContent}>
              <View style={styles.iconBox}>
                <Ionicons
                  name="school-outline"
                  size={24}
                  color="#1f6bf0"
                />
              </View>

              <View>
                <Text
                  style={styles.className}
                >
                  {item.className}

                  {item.sectionName
                    ? ` (${item.sectionName})`
                    : ""}
                </Text>

                <Text
                  style={styles.classInfo}
                >
                  বিষয়:{" "}
                  {item.totalSubject}
                  {"  •  "}
                  শিক্ষার্থী:{" "}
                  {item.studentCount}
                </Text>
              </View>
            </View>

            {/* ===================================== */}
            {/* Arrow */}
            {/* ===================================== */}

            <Ionicons
              name="arrow-forward-circle-outline"
              size={30}
              color="#1f6bf0"
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // =====================================================
  // Loading Screen
  // =====================================================

  if (loading && classes.length === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingContainer,
        ]}
      >
        <ActivityIndicator
          size="large"
          color="#115bb5"
        />

        <Text
          style={styles.loadingText}
        >
          শ্রেণীর তথ্য লোড হচ্ছে...
        </Text>
      </View>
    );
  }

  // =====================================================
  // Main UI
  // =====================================================

  return (
    <LinearGradient
      colors={[
        "#eef1ff",
        "#f9f9f9",
      ]}
      style={styles.container}
    >
      {/* ============================================= */}
      {/* Title */}
      {/* ============================================= */}

      <Text style={styles.title}>
        📚 শ্রেণী নির্বাচন করুন
      </Text>

      {/* ============================================= */}
      {/* Refresh Indicator */}
      {/* ============================================= */}

      {loading && (
        <ActivityIndicator
          size="small"
          color="#115bb5"
          style={styles.refreshIndicator}
        />
      )}

      {/* ============================================= */}
      {/* Empty State */}
      {/* ============================================= */}

      {!loading &&
      classes.length === 0 ? (
        <View
          style={styles.emptyContainer}
        >
          <Ionicons
            name="school-outline"
            size={50}
            color="#9CA3AF"
          />

          <Text
            style={styles.emptyText}
          >
            কোনো শ্রেণী পাওয়া যায়নি।
          </Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          renderItem={renderItem}
          keyExtractor={(item) =>
            item._id
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={{
            paddingBottom: 40,
          }}
        />
      )}
    </LinearGradient>
  );
}

// =====================================================
// Styles
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#315CB2",
    marginTop: 18,
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.6,
  },

  refreshIndicator: {
    marginBottom: 10,
  },

  cardWrapper: {
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 20,
  },

  card: {
    borderRadius: 15,
    padding: 15,
    margin: 2,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,

    elevation: 5,
  },

  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#E8F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  className: {
    fontSize: 18,
    fontWeight: "700",
    color: "#095097",
  },

  classInfo: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 5,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
});
