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
} from "react-native";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import ImageViewing from "react-native-image-viewing";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function TeacherClassRoutine() {
  const { schoolId } = useLocalSearchParams();
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
      if (res.data.success) setRoutines(res.data.routines);
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

  const images = routines.filter(r => r.imageUrl).map(r => ({ uri: r.imageUrl }));

  return (
    <View>
     <View  style={styles.header}>
        <Text style={styles.headerTitle}>📘 সকল রুটিন</Text>
        <Text style={styles.subHeader}>প্রতিদিনের তালিকা দেখুন</Text>
      </View>
   
      <FlatList
        data={routines}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              const index = images.findIndex(img => img.uri === item.imageUrl);
              setSelectedIndex(index >= 0 ? index : 0);
              setViewerVisible(true);
            }}
          >
            <LinearGradient
              colors={["#72aaf3ff", "#205ee4ff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
                {item.imageUrl && (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() =>
          fetching ? (
 
            <ActivityIndicator size="large" color="#115bb5ff"  style={{ marginTop: 60 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.emptyImage}
                source={require("../../assets/image/empty.png")}
              />
              <Text style={styles.emptyText}>কোন রুটিন পাওয়া যায়নি</Text>
            </View>
          )
        }
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3353e1ff"]} />
        }
      />
      <ImageViewing
        images={images}
        imageIndex={selectedIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
   header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
   color: "#315cb2ff",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subHeader: {
    color: "#7f7f7fff",
    fontSize: 14,
    marginTop: 4,
  },
  cardGradient: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    overflow: "hidden",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 220,
  },
  textOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    padding: 12,
  },
  title: {
    padding:10,
    fontWeight: "700",
    fontSize: 18,
    color: "#f1f1f1ff",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 60 },
  emptyImage: { width: 250, height: 250, marginBottom: 16, resizeMode: "contain" },
  emptyText: { textAlign: "center", color: "#6b7280", fontSize: 16 },
});
