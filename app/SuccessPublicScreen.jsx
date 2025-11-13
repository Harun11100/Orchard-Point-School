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
import { MaterialIcons } from "@expo/vector-icons";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const { width } = Dimensions.get("window");

export default function SchoolAchievementScreen() {
  const { schoolId } = useLocalSearchParams();
  const [achievements, setAchievements] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  const fetchAchievements = async () => {
    if (!schoolId) return;
    setFetching(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/school/achivement/getAchievement?schoolId=${schoolId}`
      );
      if (data.success) setAchievements(data.achievements || []);
      else setAchievements([]);
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


  

  const images = achievements.map((item) => ({ uri: item.image.url }));

  return (
    <LinearGradient colors={["#EEF2FF", "#F8FAFC"]} style={{ flex: 1 }}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆আমাদের সাফল্য</Text>
        <Text style={styles.subHeader}>ছাত্রদের বিভিন্ন পুরস্কার ও অর্জনসমূহ</Text>
      </View>

      {/* Achievement List */}
      <FlatList
        data={achievements}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6366F1"]}
          />
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setSelectedIndex(index);
              setViewerVisible(true);
            }}
            style={styles.cardContainer}
          >
            <LinearGradient
              colors={["#6366F1", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <Image source={{ uri: item.image.url }} style={styles.cardImage} />

              <View style={styles.infoContainer}>
                <Text style={styles.achievementTitle}>{item.achievementTitle}</Text>
                <Text style={styles.achievementName}>{item.achievementName}</Text>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.label}>👦 ছাত্রের নাম: </Text>
                  <Text style={styles.value}>{item.studentName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>🎓 রোল: </Text>
                  <Text style={styles.value}>{item.studentRoll}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>📘 ব্যাচ: </Text>
                  <Text style={styles.value}>{item.batch}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.label}>📅 সেশন: </Text>
                  <Text style={styles.value}>{item.sessionYear}</Text>
                </View>

                <Text style={styles.dateText}>
                  আপলোড: {new Date(item.uploadedAt).toLocaleDateString()}
                </Text>
               
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() =>
          fetching ? (
        
            <ActivityIndicator size="large"  color="#115bb5ff" style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.emptyImage}
                source={require("../assets/image/empty.png")}
              />
              <Text style={styles.emptyText}>কোনো সাফল্যের তথ্য পাওয়া যায়নি</Text>
            </View>
          )
        }
      />

      {/* Image Viewer */}
      <ImageViewing
        images={images}
        imageIndex={selectedIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  addMore: {
    position: "absolute",
    right: 16,
    top: 10,
    zIndex: 10,
    backgroundColor: "#4F46E5",
    borderRadius: 50,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  header: {
    marginTop: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#245abeff",
   
  },
  subHeader: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
     marginBottom:10
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 2,
  },
  cardImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 14,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4680e5ff",
  },
  achievementName: {
    fontSize: 14,
    color: "#374151",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginVertical: 2,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  value: {
    fontSize: 13,
    color: "#111827",
    flexShrink: 1,
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "right",
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: "center",
  },
  emptyImage: {
    width: 220,
    height: 220,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
});
