import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig.extra?.API_URL;

export default function TeacherClassRoutine() {
  const { schoolId } = useLocalSearchParams();
  const router = useRouter();

  const [routines, setRoutines] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchRoutines = async () => {
    if (!schoolId) return;
    try {
      setFetching(true);
      const res = await axios.get(
        `${API_URL}/api/school/Routine/getRoutine?schoolId=${schoolId}`
      );
      if (res.data.success) setRoutines(res.data.routines || []);
    } catch (err) {
      console.error("Fetch routines error:", err);
    } finally {
      setFetching(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRoutines();
    setRefreshing(false);
  }, [schoolId]);

  useEffect(() => {
    fetchRoutines();
  }, [schoolId]);

  const images = routines
    .filter((r) => r.imageUrl)
    .map((r) => ({ uri: r.imageUrl }));

  const renderRoutineCard = ({ item }) => {
    const hasImage = Boolean(item.imageUrl);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={!hasImage}
        onPress={() => {
          if (!hasImage) return;
          const index = images.findIndex((img) => img.uri === item.imageUrl);
          setSelectedIndex(index >= 0 ? index : 0);
          setViewerVisible(true);
        }}
        style={styles.cardContainer}
      >
        <LinearGradient
          colors={["#FFFFFF", "#F8FAFC"]}
          style={styles.cardContent}
        >
          {/* Card Header Info */}
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Ionicons name="calendar-outline" size={18} color="#4F46E5" />
            </View>
            <View style={styles.cardTitleWrapper}>
              <Text style={styles.routineTitle}>{item.title}</Text>
              {item.createdAt && (
                <Text style={styles.routineDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              )}
            </View>
            {hasImage && (
              <View style={styles.expandBadge}>
                <Ionicons name="expand-outline" size={16} color="#6366F1" />
              </View>
            )}
          </View>

          {/* Routine Preview Image */}
          {hasImage && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["transparent", "rgba(15, 23, 42, 0.6)"]}
                style={styles.imageGradientOverlay}
              >
                <Text style={styles.zoomHintText}>
                  ট্যাপ করে সম্পূর্ণ রুটিন দেখুন
                </Text>
              </LinearGradient>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        {/* Modern Header Bar */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>সকল রুটিন</Text>
            <Text style={styles.headerSubtitle}>প্রতিদিনের সময়সূচী</Text>
          </View>

          <View style={styles.headerRightBadge}>
            <Ionicons name="book-outline" size={18} color="#4F46E5" />
          </View>
        </View>

        {/* Routine List */}
        <FlatList
          data={routines}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderRoutineCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F46E5"]}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={() =>
            fetching && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>রুটিন লোড হচ্ছে...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Image
                  style={styles.emptyImage}
                  source={require("../assets/image/empty.png")}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>কোনো রুটিন পাওয়া যায়নি</Text>
                <Text style={styles.emptySubText}>
                  বর্তমানে এই বিদ্যালয়ের কোনো রুটিন আপলোড করা হয়নি।
                </Text>
              </View>
            )
          }
        />

        {/* Fullscreen Image Preview */}
        <ImageViewing
          images={images}
          imageIndex={selectedIndex}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  /* Header Section */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 1,
  },
  headerRightBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Card Component */
  cardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardContent: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitleWrapper: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  routineDate: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  expandBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Card Image */
  imageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageGradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "flex-end",
  },
  zoomHintText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  /* Loading State */
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 20,
  },
  emptyImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
    opacity: 0.85,
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