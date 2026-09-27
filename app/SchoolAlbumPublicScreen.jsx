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
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ImageViewing from "react-native-image-viewing";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";

const API_URL = Constants.expoConfig.extra?.API_URL;
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 44) / 2;
const PAGE_LIMIT = 30;

export default function SchoolAlbumScreen() {
  const { schoolId } = useLocalSearchParams();
  const router = useRouter();

  const [albums, setAlbums] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [flatPhotos, setFlatPhotos] = useState([]);

  const fetchAlbums = useCallback(
    async (reset = false) => {
      if (!schoolId || (!hasMore && !reset)) return;

      if (reset) {
        setPage(1);
        setHasMore(true);
      }

      setFetching(true);
      try {
        const { data } = await axios.get(
          `${API_URL}/api/school/Album/getAlbum?schoolId=${schoolId}&page=${
            reset ? 1 : page
          }&limit=${PAGE_LIMIT}`
        );

        if (data.success && data.photos?.length > 0) {
          const newAlbums = reset ? data.photos : [...albums, ...data.photos];
          setAlbums(newAlbums);
          setFlatPhotos(
            newAlbums.map((photo) => ({ uri: photo.url, ...photo }))
          );
          setHasMore(data.photos.length === PAGE_LIMIT);
          if (!reset) setPage(page + 1);
        } else if (reset) {
          setAlbums([]);
          setFlatPhotos([]);
          setHasMore(false);
        }
      } catch (err) {
        console.error("Fetch albums error:", err);
      } finally {
        setFetching(false);
        if (reset) setRefreshing(false);
      }
    },
    [schoolId, page, albums, hasMore]
  );

  useEffect(() => {
    fetchAlbums(true);
  }, [schoolId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlbums(true);
  }, [schoolId]);

  const handleLoadMore = () => {
    if (!fetching && hasMore) fetchAlbums();
  };

  /* Render Single Photo Card */
  const renderPhotoCard = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => {
        setSelectedIndex(index);
        setViewerVisible(true);
      }}
      style={styles.cardContainer}
    >
      <Image source={{ uri: item.url }} style={styles.cardImage} />

      {/* Dynamic Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(15, 23, 42, 0.85)"]}
        style={styles.cardOverlay}
      >
        <Text style={styles.eventName} numberOfLines={1}>
          {item.eventName || "স্মৃতির ফটো"}
        </Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={11} color="#CBD5E1" />
          <Text style={styles.dateText}>
            {new Date(item.uploadedAt).toLocaleDateString()}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LinearGradient colors={["#F8FAFC", "#EEF2FF"]} style={{ flex: 1 }}>
        {/* Modern Top Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>স্কুল অ্যালবাম</Text>
            <Text style={styles.headerSubtitle}>
              বিদ্যালয়ের আনন্দের মুহূর্তসমূহ
            </Text>
          </View>
          <View style={styles.headerIconBadge}>
            <Ionicons name="images-outline" size={18} color="#4F46E5" />
          </View>
        </View>

        {/* Album Photo Grid */}
        <FlatList
          data={albums}
          numColumns={2}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F46E5"]}
              tintColor="#4F46E5"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          renderItem={renderPhotoCard}
          ListFooterComponent={
            fetching && !refreshing && albums.length > 0 ? (
              <ActivityIndicator
                size="small"
                color="#4F46E5"
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            fetching && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.loadingText}>ছবি লোড হচ্ছে...</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Image
                  style={styles.emptyImage}
                  source={require("../assets/image/empty.png")}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>
                  কোনো অ্যালবাম পাওয়া যায়নি
                </Text>
                <Text style={styles.emptySubText}>
                  বিদ্যালয়ের কোনো ছবি এখনো আপলোড করা হয়নি।
                </Text>
              </View>
            )
          }
        />

        {/* Fullscreen Image Viewer Modal */}
        <ImageViewing
          images={flatPhotos}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
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
  headerIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Album Card */
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.25,
    borderRadius: 18,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingTop: 28,
  },
  eventName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  dateText: {
    color: "#CBD5E1",
    fontSize: 10,
    marginLeft: 4,
    fontWeight: "500",
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
    marginTop: 16,
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