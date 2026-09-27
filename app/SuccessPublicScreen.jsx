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
  SafeAreaView,
  StatusBar,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ImageViewing from "react-native-image-viewing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig.extra?.API_URL;

export default function SchoolAchievementScreen() {
  const { schoolId } = useLocalSearchParams();
  const [achievements, setAchievements] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const STORAGE_KEY = `achievements_${schoolId}`;

  const fetchAchievements = async () => {
    if (!schoolId) return;
    setFetching(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/school/achivement/getAchievement?schoolId=${schoolId}`
      );
      if (data.success) {
        setAchievements(data.achievements || []);
        setOfflineMode(false);
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data.achievements || [])
        );
      } else {
        setAchievements([]);
      }
    } catch (err) {
      console.error("Fetch achievement error:", err);
      // Load from cache if network fails
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          setAchievements(JSON.parse(cached));
          setOfflineMode(true);
        }
      } catch (cacheErr) {
        console.error("Error loading cached achievements:", cacheErr);
      }
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAchievements();
  }, [schoolId]);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          setAchievements(JSON.parse(cached));
          setOfflineMode(true);
        }
      } catch (err) {
        console.error("Error loading cached achievements:", err);
      }
    };
    loadCache();
    fetchAchievements();
  }, [schoolId]);

  const images = achievements.map((item) => ({ uri: item.image.url }));

  /* Render Achievement Item */
  const renderAchievementCard = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        setSelectedIndex(index);
        setViewerVisible(true);
      }}
      style={styles.cardContainer}
    >
      {/* Card Header Image Area */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.image.url }} style={styles.cardImage} />
        <LinearGradient
          colors={["transparent", "rgba(15, 23, 42, 0.7)"]}
          style={styles.imageGradientOverlay}
        />
        <View style={styles.imageOverlayContent}>
          <View style={styles.previewTag}>
            <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
            <Text style={styles.previewTagText}>ছবিটি বড় করে দেখুন</Text>
          </View>
        </View>
      </View>

      {/* Card Body Info */}
      <View style={styles.infoContainer}>
        <View style={styles.titleSection}>
          <Text style={styles.achievementTitle} numberOfLines={2}>
            {item.achievementTitle}
          </Text>
          {item.achievementName ? (
            <Text style={styles.achievementName}>{item.achievementName}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Student Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={14} color="#4F46E5" />
            </View>
            <Text style={styles.label}>ছাত্রের নাম:</Text>
            <Text style={styles.value}>{item.studentName}</Text>
          </View>

          <View style={styles.tagsContainer}>
            <View style={styles.infoBadge}>
              <Ionicons name="id-card-outline" size={12} color="#6366F1" />
              <Text style={styles.infoBadgeText}>রোল: {item.studentRoll}</Text>
            </View>

            {item.batch ? (
              <View style={styles.infoBadge}>
                <Ionicons name="book-outline" size={12} color="#6366F1" />
                <Text style={styles.infoBadgeText}>ব্যাচ: {item.batch}</Text>
              </View>
            ) : null}

            {item.sessionYear ? (
              <View style={styles.infoBadge}>
                <Ionicons name="calendar-outline" size={12} color="#6366F1" />
                <Text style={styles.infoBadgeText}>
                  সেশন: {item.sessionYear}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.dateBadge}>
            <Ionicons name="time-outline" size={12} color="#94A3B8" />
            <Text style={styles.dateText}>
              আপলোড: {new Date(item.uploadedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LinearGradient colors={["#F8FAFC", "#EEF2FF"]} style={{ flex: 1 }}>
        <FlatList
          data={achievements}
          keyExtractor={(item, index) => item._id || index.toString()}
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
          ListHeaderComponent={
            <>
              {/* Header Title Banner */}
              <View style={styles.headerContainer}>
                <View style={styles.headerIconBg}>
                  <Ionicons name="trophy-outline" size={26} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>আমাদের সাফল্য</Text>
                  <Text style={styles.headerSubtitle}>
                    শিক্ষার্থীদের অর্জিত পুরস্কার ও স্বীকৃতিসমূহ
                  </Text>
                </View>
              </View>

              {/* Offline Warning Banner */}
              {offlineMode && (
                <View style={styles.offlineBadge}>
                  <Ionicons name="cloud-offline-outline" size={16} color="#D97706" />
                  <Text style={styles.offlineText}>
                    অফলাইন মোড: আগের সংরক্ষিত তথ্য দেখানো হচ্ছে
                  </Text>
                </View>
              )}

              {/* Section Header */}
              {achievements.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>সাফল্যের তালিকা</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {achievements.length}
                    </Text>
                  </View>
                </View>
              )}
            </>
          }
          renderItem={renderAchievementCard}
          ListEmptyComponent={
            fetching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>তথ্য লোড হচ্ছে...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Image
                  style={styles.emptyImage}
                  source={require("../assets/image/empty.png")}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>
                  কোনো সাফল্যের তথ্য পাওয়া যায়নি
                </Text>
                <Text style={styles.emptySubText}>
                  এখনো পর্যন্ত কোনো শিক্ষার্থীর অর্জনের রেকর্ড প্রকাশ করা হয়নি।
                </Text>
              </View>
            )
          }
        />

        {/* Fullscreen Image Viewer Modal */}
        <ImageViewing
          images={images}
          imageIndex={selectedIndex}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Header Section */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  headerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  /* Offline Warning Banner */
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  offlineText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  countBadge: {
    backgroundColor: "#E0E7FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4338CA",
  },

  /* Card Layout */
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
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
    height: "60%",
  },
  imageOverlayContent: {
    position: "absolute",
    right: 12,
    bottom: 12,
  },
  previewTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  previewTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },

  /* Info Container inside Card */
  infoContainer: {
    padding: 16,
  },
  titleSection: {
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 22,
  },
  achievementName: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },

  /* Details Grid */
  detailsGrid: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginRight: 6,
  },
  value: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "700",
    flexShrink: 1,
  },

  /* Tags & Badges */
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    marginLeft: 5,
  },

  /* Card Footer */
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginLeft: 4,
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
    paddingVertical: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 8,
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