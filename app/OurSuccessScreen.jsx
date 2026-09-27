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
  Alert,
  StatusBar,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import ImageViewing from "react-native-image-viewing";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = Constants.expoConfig?.extra?.API_URL;

export default function SchoolAchievementScreen() {
  const { schoolId } = useLocalSearchParams();
  const [achievements, setAchievements] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchAchievements = async () => {
    if (!schoolId) return;
    setFetching(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/school/achivement/getAchievement?schoolId=${schoolId}`
      );
      if (data?.success) {
        setAchievements(data.achievements || []);
      } else {
        setAchievements([]);
      }
    } catch (err) {
      console.error("Fetch achievement error:", err);
      setAchievements([]);
    } finally {
      setFetching(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAchievements();
    setRefreshing(false);
  }, [schoolId]);

  useEffect(() => {
    fetchAchievements();
  }, [schoolId]);

  const handleDelete = (achievementId) => {
    Alert.alert(
      "নিশ্চিত করুন",
      "আপনি কি এই অর্জনের তথ্যটি মুছে ফেলতে চান?",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "মুছে ফেলুন",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await axios.delete(
                `${API_URL}/api/school/achivement/deleteAchievement`,
                { data: { achievementId } }
              );
              if (res.data?.success) {
                // Optimistically remove from state
                setAchievements((prev) =>
                  prev.filter((item) => item._id !== achievementId)
                );
                Alert.alert("সফল!", "সাফল্যের তথ্য মুছে ফেলা হয়েছে।");
              } else {
                Alert.alert("ত্রুটি", res.data?.message || "মুছে ফেলা যায়নি।");
              }
            } catch (err) {
              console.error("Error deleting achievement:", err);
              Alert.alert("ত্রুটি", "মুছে ফেলার সময় একটি সমস্যা হয়েছে।");
            }
          },
        },
      ]
    );
  };

  const imageList = achievements
    .filter((item) => item?.image?.url)
    .map((item) => ({ uri: item.image.url }));

  const renderAchievementCard = ({ item, index }) => (
    <View style={styles.card}>
      {/* Achievement Image Container */}
      {item.image?.url && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            setSelectedIndex(index);
            setViewerVisible(true);
          }}
          style={styles.imageWrapper}
        >
          <Image
            source={{ uri: item.image.url }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.expandBadge}>
            <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Card Content Body */}
      <View style={styles.cardBody}>
        {/* Header Title & Action Bar */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.achievementTitle} numberOfLines={2}>
              {item.achievementTitle}
            </Text>
            {item.achievementName ? (
              <Text style={styles.achievementName}>{item.achievementName}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item._id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Student Meta Details */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={16} color="#2563EB" />
            <Text style={styles.metaLabel}>শিক্ষার্থী:</Text>
            <Text style={styles.metaValue}>{item.studentStudentName || item.studentName}</Text>
          </View>

          <View style={styles.tagsRow}>
            {item.studentRoll ? (
              <View style={styles.tagPill}>
                <Ionicons name="id-card-outline" size={13} color="#64748B" />
                <Text style={styles.tagText}>রোল: {item.studentRoll}</Text>
              </View>
            ) : null}

            {item.batch ? (
              <View style={styles.tagPill}>
                <Ionicons name="school-outline" size={13} color="#64748B" />
                <Text style={styles.tagText}>ব্যাচ: {item.batch}</Text>
              </View>
            ) : null}

            {item.sessionYear ? (
              <View style={styles.tagPill}>
                <Ionicons name="calendar-outline" size={13} color="#64748B" />
                <Text style={styles.tagText}>সেশন: {item.sessionYear}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Footer Timestamp */}
        {item.uploadedAt && (
          <View style={styles.cardFooter}>
            <Text style={styles.dateText}>
              আপলোড: {new Date(item.uploadedAt).toLocaleDateString("bn-BD")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Screen Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>🏆 কৃতি শিক্ষার্থীবৃন্দ</Text>
          <Text style={styles.subHeader}>প্রতিষ্ঠানের বিভিন্ন পুরস্কার ও অর্জনসমূহ</Text>
        </View>

        {/* Add New Achievement FAB */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            router.push({
              pathname: "/OurSuccessUpload",
              params: { schoolId },
            })
          }
          style={styles.addButton}
        >
          <MaterialIcons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>নতুন যোগ</Text>
        </TouchableOpacity>
      </View>

      {/* Achievements List */}
      <FlatList
        data={achievements}
        keyExtractor={(item, index) => item._id || index.toString()}
        renderItem={renderAchievementCard}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={() =>
          fetching ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.emptyImage}
                source={require("../assets/image/empty.png")}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>কোনো সাফল্য পাওয়া যায়নি</Text>
              <Text style={styles.emptySubtitle}>
                নতুন সাফল্যের তথ্য যোগ করতে উপরের "নতুন যোগ" বোতামে চাপ দিন।
              </Text>
            </View>
          )
        }
      />

      {/* Full-screen Image Modal */}
      <ImageViewing
        images={imageList}
        imageIndex={selectedIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  /* Header Styles */
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 14,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitleGroup: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  subHeader: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  /* List & Cards */
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#F1F5F9",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  expandBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    padding: 6,
    borderRadius: 20,
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#059669",
    marginTop: 2,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },

  /* Metadata Section */
  metaContainer: {
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  dateText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "right",
  },

  /* Empty & Loading States */
  loaderContainer: {
    marginTop: 80,
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});