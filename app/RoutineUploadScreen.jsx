import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadImages } from "../request/UploadImages";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function RoutineUploadScreen() {
  const { schoolId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [fetching, setFetching] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return Alert.alert("Permission needed", "Please allow gallery access.");
    }

    try {
      setProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: true,
      });

      if (result.canceled) return;

      const picked = result.assets[0];
      const manipulated = await ImageManipulator.manipulateAsync(
        picked.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setImageUri(manipulated.uri);
    } catch (err) {
      Alert.alert("Error", "Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !imageUri) {
      return Alert.alert("Missing fields", "Add title and image");
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "routine.jpg",
      });

      const [uploadedRoutine] = await uploadImages(formData);

      const res = await axios.post(`${API_URL}/api/school/Routine/upload`, {
        title,
        schoolId,
        imageUrl: uploadedRoutine.url,
        publicId: uploadedRoutine.public_id,
      });

      if (res.data.success) {
        Alert.alert("Success", "Routine uploaded!");
        setTitle("");
        setImageUri(null);
        fetchRoutines();
      }
    } catch (err) {
      Alert.alert("Upload Failed", "Try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutines = async () => {
    try {
      setFetching(true);
      const res = await axios.get(
        `${API_URL}/api/school/Routine/getRoutine?schoolId=${schoolId}`
      );
      if (res.data.success) setRoutines(res.data.routines);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Confirm", "Delete this routine?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/school/Routine/deleteRoutine/${id}`);
            fetchRoutines();
          } catch (err) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  return (
    <LinearGradient colors={["#f4f7fe", "#eef2ff"]} style={{ flex: 1 }}>
      <FlatList
        data={routines}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <View style={styles.headerContainer}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="document-text-outline" size={26} color="#3b82f6" />
              </View>
              <Text style={styles.header}>রুটিন আপলোড ম্যানেজমেন্ট</Text>
            </View>

            <View style={styles.glassCard}>
              <Text style={styles.cardSectionTitle}>নতুন রুটিন যোগ করুন</Text>
              
              <TextInput
                placeholder="রুটিনের শিরোনাম (যেমন: ২০২৬ রুটিন)"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <TouchableOpacity
                onPress={pickImage}
                style={styles.pickButton}
                disabled={processing}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={imageUri ? ["#3b82f6", "#1d4ed8"] : ["#eff6ff", "#dbeafe"]}
                  style={[
                    styles.pickBtnGradient,
                    !imageUri && styles.pickBtnGradientOutline,
                  ]}
                >
                  <Ionicons
                    name={imageUri ? "checkmark-circle-outline" : "cloud-upload-outline"}
                    size={20}
                    color={imageUri ? "#fff" : "#2563eb"}
                  />
                  <Text
                    style={[
                      styles.pickButtonText,
                      !imageUri && styles.pickButtonTextOutline,
                    ]}
                  >
                    {processing
                      ? "প্রসেসিং হচ্ছে..."
                      : imageUri
                      ? "ছবি পরিবর্তন করুন"
                      : "রুটিনের ছবি নির্বাচন করুন"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {imageUri && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                  <TouchableOpacity 
                    style={styles.removePreviewBtn} 
                    onPress={() => setImageUri(null)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUpload}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient colors={["#10b981", "#047857"]} style={styles.uploadGradient}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="arrow-up-circle-outline" size={20} color="#fff" />
                      <Text style={styles.uploadText}>আপলোড সম্পূর্ণ করুন</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.subHeaderContainer}>
              <MaterialIcons name="folder-open" size={22} color="#1e3a8a" />
              <Text style={styles.subHeader}>সকল আপলোডকৃত রুটিন</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item._id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.deleteText}>মুছুন</Text>
              </TouchableOpacity>
            </View>
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
          </View>
        )}
        ListEmptyComponent={() =>
          fetching ? (
            <View style={{ paddingVertical: 30 }}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.emptyImage}
                source={require("../assets/image/empty.png")}
              />
              <Text style={styles.emptyText}>কোনো রুটিন পাওয়া যায়নি</Text>
            </View>
          )
        }
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom + 20, 40), // Safe from 3-button navigation bars
        }}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 10,
    gap: 10,
  },
  headerIconContainer: {
    backgroundColor: "#dbeafe",
    padding: 8,
    borderRadius: 12,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: 20,
    borderRadius: 24,
    marginBottom: 25,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#1f2937",
  },
  pickButton: { marginBottom: 14 },
  pickBtnGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  pickBtnGradientOutline: {
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
  },
  pickButtonText: { fontSize: 15, color: "#fff", fontWeight: "600" },
  pickButtonTextOutline: { color: "#2563eb" },
  previewContainer: {
    position: "relative",
    marginBottom: 14,
  },
  preview: {
    height: 180,
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  removePreviewBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 20,
  },
  uploadButton: { width: "100%" },
  uploadGradient: {
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  subHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937", flex: 1 },
  cardImage: { width: "100%", height: 220, borderRadius: 14, backgroundColor: "#f3f4f6" },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef2f2",
    paddingVertical: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  deleteText: { color: "#ef4444", fontWeight: "600", fontSize: 13 },
  emptyContainer: { marginTop: 30, alignItems: "center" },
  emptyImage: { width: 200, height: 200, resizeMode: "contain" },
  emptyText: { marginTop: 8, color: "#9ca3af", fontSize: 15 },
});