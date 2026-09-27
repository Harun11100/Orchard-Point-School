import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.API_URL || "";

const STATUS_OPTIONS = [
  {
    label: "আসন্ন", // Upcoming
    value: "upcoming",
  },
  {
    label: "চলমান", // Active
    value: "active",
  },
  {
    label: "সম্পন্ন", // Completed
    value: "completed",
  },
];

const FILTER_OPTIONS = [
  { label: "সব", value: "all" }, // All
  { label: "চলমান", value: "active" }, // Active
  { label: "আসন্ন", value: "upcoming" }, // Upcoming
  { label: "সম্পন্ন", value: "completed" }, // Completed
];

export default function SemesterListScreen() {
  const router = useRouter();
  const { schoolId } = useLocalSearchParams();

  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // প্রথম দর্শনে ডিফল্ট ফিল্টার 'active' হিসেবে সেট করুন
  const [selectedFilter, setSelectedFilter] = useState("active");

  // সেমিস্টার তৈরি করার স্ক্রিনে নেভিগেট করুন
  const handleCreateSemester = () => {
    router.push({
      pathname: "/CreateSemester",
      params: { schoolId },
    });
  };

  // ------------------------------------------
  // সেমিস্টার লোড করুন (FETCH SEMESTERS)
  // ------------------------------------------

  const fetchSemesters = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const res = await axios.get(
          `${API_URL}/api/school/semester/getSemesters`,
          {
            params: {
              schoolId,
            },
          }
        );

        if (res.data?.success) {
          setSemesters(res.data.data || []);
        } else {
          Alert.alert(
            "ত্রুটি", // Error
            res.data?.message || "সেমিস্টার লোড করতে ব্যর্থ হয়েছে।"
          );
        }
      } catch (error) {
        console.log(
          "Fetch semesters error:",
          error?.response?.data || error.message
        );

        Alert.alert(
          "ত্রুটি", // Error
          error?.response?.data?.message || "সেমিস্টার লোড করতে ব্যর্থ হয়েছে।"
        );
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [schoolId]
  );

  // ------------------------------------------
  // স্ক্রিন খুললে লোড করুন
  // ------------------------------------------

  useFocusEffect(
    useCallback(() => {
      if (schoolId) {
        fetchSemesters();
      }
    }, [schoolId, fetchSemesters])
  );

  // ------------------------------------------
  // স্মার্ট ফলব্যাক
  // যদি ডিফল্ট 'active' ফিল্টারে কোনো ফলাফল না পাওয়া যায়, তবে 'all'-এ ফিরে যান
  // ------------------------------------------
  useEffect(() => {
    if (!loading && semesters.length > 0) {
      const hasActiveSemester = semesters.some((s) => s.status === "active");
      if (!hasActiveSemester && selectedFilter === "active") {
        setSelectedFilter("all");
      }
    }
  }, [semesters, loading]);

  // ------------------------------------------
  // রিফ্রেশ করুন
  // ------------------------------------------

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchSemesters(false);
    } finally {
      setRefreshing(false);
    }
  };

  // ------------------------------------------
  // ফিল্টারিং লজিক ও গণনা
  // ------------------------------------------

  const filteredSemesters = useMemo(() => {
    if (selectedFilter === "all") return semesters;
    return semesters.filter((item) => item.status === selectedFilter);
  }, [semesters, selectedFilter]);

  const filterCounts = useMemo(() => {
    return {
      all: semesters.length,
      active: semesters.filter((s) => s.status === "active").length,
      upcoming: semesters.filter((s) => s.status === "upcoming").length,
      completed: semesters.filter((s) => s.status === "completed").length,
    };
  }, [semesters]);

  // ------------------------------------------
  // স্ট্যাটাস পরিবর্তন করুন
  // ------------------------------------------

  const changeSemesterStatus = (semester, newStatus) => {
    if (semester.status === newStatus) {
      return;
    }

    const statusTextMap = {
      upcoming: "আসন্ন",
      active: "চলমান",
      completed: "সম্পন্ন",
    };

    const statusText = statusTextMap[newStatus] || newStatus;

    if (newStatus === "active") {
      Alert.alert(
        "সেমিস্টার সক্রিয় করুন", // Activate Semester
        `আপনি কি নিশ্চিত যে আপনি "${semester.name}" সক্রিয় করতে চান?\n\nবর্তমানে সক্রিয় সেমিস্টারটি সম্পন্ন (completed) হিসেবে চিহ্নিত হবে।`,
        [
          {
            text: "বাতিল", // Cancel
            style: "cancel",
          },
          {
            text: "সক্রিয় করুন", // Activate
            onPress: () =>
              updateSemesterStatus(semester._id, newStatus),
          },
        ]
      );

      return;
    }

    Alert.alert(
      "সেমিস্টারের স্ট্যাটাস পরিবর্তন করুন", // Change Semester Status
      `"${semester.name}"-এর স্ট্যাটাস পরিবর্তন করে "${statusText}" করতে চান?`,
      [
        {
          text: "বাতিল", // Cancel
          style: "cancel",
        },
        {
          text: "নিশ্চিত করুন", // Confirm
          onPress: () =>
            updateSemesterStatus(semester._id, newStatus),
        },
      ]
    );
  };

  // ------------------------------------------
  // আপডেট স্ট্যাটাস API
  // ------------------------------------------

  const updateSemesterStatus = async (semesterId, status) => {
    try {
      setUpdatingId(semesterId);

      const res = await axios.patch(
        `${API_URL}/api/school/semester/status`,
        {
          schoolId,
          semesterId,
          status,
        }
      );

      if (res.data?.success) {
        setSemesters((prev) =>
          prev.map((semester) => {
            if (semester._id === semesterId) {
              return {
                ...semester,
                status,
              };
            }

            if (status === "active" && semester.status === "active") {
              return {
                ...semester,
                status: "completed",
              };
            }

            return semester;
          })
        );

        Alert.alert(
          "সফলতা", // Success
          "সেমিস্টারের স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।"
        );

        await fetchSemesters(false);
      } else {
        Alert.alert(
          "ত্রুটি", // Error
          res.data?.message || "সেমিস্টারের স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।"
        );
      }
    } catch (error) {
      console.log(
        "Update semester status error:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "ত্রুটি", // Error
        error?.response?.data?.message ||
          "সেমিস্টারের স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে।"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ------------------------------------------
  // স্ট্যাটাস কালার হেলপার
  // ------------------------------------------

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "#16A34A";
      case "upcoming":
        return "#2563EB";
      case "completed":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const getStatusBackground = (status) => {
    switch (status) {
      case "active":
        return "#DCFCE7";
      case "upcoming":
        return "#DBEAFE";
      case "completed":
        return "#F3F4F6";
      default:
        return "#F3F4F6";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "চলমান";
      case "upcoming":
        return "আসন্ন";
      case "completed":
        return "সম্পন্ন";
      default:
        return status;
    }
  };

  // ------------------------------------------
  // তারিখ ফরম্যাট হেলপার
  // ------------------------------------------

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleDateString("bn-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  // ------------------------------------------
  // ফিল্টার ট্যাব বার
  // ------------------------------------------

  const renderFilterBar = () => {
    return (
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_OPTIONS.map((tab) => {
            const isActive = selectedFilter === tab.value;
            const count = filterCounts[tab.value] || 0;

            return (
              <TouchableOpacity
                key={tab.value}
                activeOpacity={0.7}
                onPress={() => setSelectedFilter(tab.value)}
                style={[
                  styles.filterTab,
                  isActive && styles.filterTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.filterTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>

                <View
                  style={[
                    styles.badge,
                    isActive ? styles.badgeActive : styles.badgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isActive && styles.badgeTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ------------------------------------------
  // স্ট্যাটাস সিলেক্টর (কার্ডের ভেতর)
  // ------------------------------------------

  const renderStatusSelector = (semester) => {
    const isUpdating = updatingId === semester._id;

    return (
      <View style={styles.statusSelector}>
        {STATUS_OPTIONS.map((option) => {
          const selected = semester.status === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              disabled={isUpdating}
              onPress={() => changeSemesterStatus(semester, option.value)}
              style={[
                styles.statusButton,
                selected && {
                  backgroundColor: getStatusColor(option.value),
                  borderColor: getStatusColor(option.value),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  selected && styles.statusButtonTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ------------------------------------------
  // সেমিস্টার কার্ড
  // ------------------------------------------

  const renderSemester = ({ item }) => {
    const isUpdating = updatingId === item._id;

    return (
      <View style={styles.card}>
        {/* হেডার */}
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.semesterName}>{item.name}</Text>
            <Text style={styles.academicYear}>
              শিক্ষাবর্ষ: {item.academicYear}
            </Text>
          </View>

          {/* বর্তমান স্ট্যাটাস */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: getStatusBackground(item.status),
              },
            ]}
          >
            {isUpdating ? (
              <ActivityIndicator
                size="small"
                color={getStatusColor(item.status)}
              />
            ) : (
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: getStatusColor(item.status),
                  },
                ]}
              >
                {getStatusLabel(item.status)}
              </Text>
            )}
          </View>
        </View>

        {/* তারিখসমূহ */}
        <View style={styles.dateContainer}>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>শুরুর তারিখ</Text>
            <Text style={styles.dateValue}>{formatDate(item.startDate)}</Text>
          </View>

          <View style={styles.dateDivider} />

          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>শেষের তারিখ</Text>
            <Text style={styles.dateValue}>{formatDate(item.endDate)}</Text>
          </View>
        </View>

        {/* স্ট্যাটাস কন্ট্রোল */}
        <View style={styles.controlSection}>
          <Text style={styles.controlTitle}>স্ট্যাটাস পরিবর্তন করুন</Text>
          {renderStatusSelector(item)}
        </View>
      </View>
    );
  };

  // ------------------------------------------
  // খালি অবস্থা (EMPTY STATE)
  // ------------------------------------------

  const renderEmpty = () => {
    if (loading) return null;

    const isFiltered = selectedFilter !== "all";
    const filterLabelMap = {
      active: "চলমান",
      upcoming: "আসন্ন",
      completed: "সম্পন্ন",
    };

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>{isFiltered ? "🔍" : "📚"}</Text>
        <Text style={styles.emptyTitle}>
          {isFiltered
            ? `কোনো ${filterLabelMap[selectedFilter] || selectedFilter} সেমিস্টার নেই`
            : "কোনো সেমিস্টার পাওয়া যায়নি"}
        </Text>
        <Text style={styles.emptyText}>
          {isFiltered
            ? `বর্তমানে "${filterLabelMap[selectedFilter] || selectedFilter}" স্ট্যাটাসের কোনো সেমিস্টার নেই।`
            : "স্ট্যাটাস পরিচালনা করতে প্রথমে একটি সেমিস্টার তৈরি করুন।"}
        </Text>

        {!isFiltered ? (
          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={handleCreateSemester}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={styles.emptyCreateButtonText}>সেমিস্টার তৈরি করুন</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => setSelectedFilter("all")}
            activeOpacity={0.8}
          >
            <Text style={styles.clearFilterButtonText}>সব সেমিস্টার দেখুন</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ------------------------------------------
  // লোডিং
  // ------------------------------------------

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>সেমিস্টার লোড হচ্ছে...</Text>
      </View>
    );
  }

  // ------------------------------------------
  // প্রধান UI
  // ------------------------------------------

  return (
    <View style={styles.container}>
      {/* পেজ হেডার */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.headerTitle}>সেমিস্টার ব্যবস্থাপনা</Text>
          <Text style={styles.headerSubtitle}>
            একাডেমিক সেমিস্টার স্ট্যাটাস পরিচালনা করুন
          </Text>
        </View>

        {/* সেমিস্টার তৈরির বাটন */}
        <TouchableOpacity
          style={styles.createHeaderButton}
          onPress={handleCreateSemester}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createHeaderButtonText}>তৈরি করুন</Text>
        </TouchableOpacity>
      </View>

      {/* সক্রিয় সেমিস্টার ইনফো ব্যানার */}
      {semesters.some((item) => item.status === "active") && (
        <View style={styles.activeInfo}>
          <View style={styles.activeDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeTitle}>চলমান সেমিস্টার</Text>
            <Text style={styles.activeSemesterName}>
              {semesters.find((item) => item.status === "active")?.name}
            </Text>
          </View>
        </View>
      )}

      {/* স্ট্যাটাস ফিল্টার বার */}
      {renderFilterBar()}

      {/* তালিকা */}
      <FlatList
        data={filteredSemesters}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderSemester}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          filteredSemesters.length === 0
            ? styles.emptyList
            : styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      />
    </View>
  );
}

// ==================================================
// স্টাইলসমূহ (STYLES)
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  header: {
    paddingTop: 22,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0F172A",
  },
  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#64748B",
  },
  createHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 4,
  },
  createHeaderButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  activeInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  activeDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#16A34A",
    marginRight: 12,
  },
  activeTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#15803D",
    textTransform: "uppercase",
  },
  activeSemesterName: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "700",
    color: "#166534",
  },

  /* ফিল্টার বার স্টাইল */
  filterWrapper: {
    marginBottom: 14,
    marginHorizontal: -18,
  },
  filterContainer: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: "#2563EB",
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeInactive: {
    backgroundColor: "#CBD5E1",
  },
  badgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },
  badgeTextActive: {
    color: "#FFFFFF",
  },

  listContent: {
    paddingBottom: 30,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  semesterName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  academicYear: {
    marginTop: 5,
    fontSize: 13,
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 13,
    paddingHorizontal: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },
  dateBox: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  dateValue: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  dateDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  controlSection: {
    marginTop: 16,
  },
  controlTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 9,
  },
  statusSelector: {
    flexDirection: "row",
    gap: 7,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  statusButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  statusButtonTextSelected: {
    color: "#FFFFFF",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 45,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "#64748B",
  },
  emptyCreateButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  emptyCreateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  clearFilterButton: {
    marginTop: 18,
    backgroundColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  clearFilterButtonText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
});