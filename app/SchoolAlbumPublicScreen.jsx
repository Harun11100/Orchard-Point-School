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
  Alert,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ImageViewing from "react-native-image-viewing";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;
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
          `${API_URL}/api/school/Album/getAlbum?schoolId=${schoolId}&page=${reset ? 1 : page}&limit=${PAGE_LIMIT}`
        );

        if (data.success && data.photos?.length > 0) {
          const newAlbums = reset ? data.photos : [...albums, ...data.photos];
          setAlbums(newAlbums);
          setFlatPhotos(newAlbums.map((photo) => ({ uri: photo.url, ...photo })));
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

  return (
    <LinearGradient colors={["#EEF2FF", "#F8FAFC"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📸 স্কুল অ্যালবাম</Text>
        <Text style={styles.subHeader}>স্কুলের স্মৃতিগুলো একসাথে</Text>
      </View>

      {/* Album Grid */}
      <FlatList
        data={albums}
        numColumns={2}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#115bb5ff"]}
           
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setSelectedIndex(index);
              setViewerVisible(true);
            }}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={["#6366F1", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.card}>
                <Image source={{ uri: item.url }} style={styles.cardImage} />
                <View style={styles.overlay}>
                  <Text style={styles.eventName}>{item.eventName}</Text>
                  <Text style={styles.dateText}>
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() =>
          fetching ? (
            <ActivityIndicator size="large" color="#115bb5ff" style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.emptyImage}
                source={require("../assets/image/empty.png")}
              />
              <Text style={styles.emptyText}>কোনো অ্যালবাম পাওয়া যায়নি</Text>
            </View>
          )
        }
      />

      {/* Image Viewer */}
      <ImageViewing
        images={flatPhotos}
        imageIndex={selectedIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
     color: "#0776c1ff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  subHeader: {
    color: "#475569",
    fontSize: 15,
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  cardWrapper: {
    flex: 1,
    margin: 6,
    borderRadius: 18,
    overflow: "hidden",
  },
  cardGradient: {
    borderRadius: 18,
    padding: 2,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: CARD_WIDTH,
    borderRadius: 16,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  eventName: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  dateText: {
    color: "#E0E7FF",
    fontSize: 12,
  },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 60 },
  emptyImage: { width: 220, height: 220, resizeMode: "contain" },
  emptyText: {
    marginTop: 10,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 16,
  },
});

