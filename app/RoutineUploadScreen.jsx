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

const API_URL = Constants.expoConfig.extra.API_URL;

export default function RoutineUploadScreen() {
  const { schoolId } = useLocalSearchParams();
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
    <LinearGradient colors={["#f0f4ff", "#ffffff"]} style={{ flex: 1 }}>
      <FlatList
        data={routines}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <Text style={styles.header}>📘 রুটিন আপলোড</Text>

            <View style={styles.glassCard}>
              <TextInput
                placeholder="শিরোনাম লিখুন"
                placeholderTextColor="#8a94a6"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <TouchableOpacity
                onPress={pickImage}
                style={styles.pickButton}
                disabled={processing}
              >
                <LinearGradient
                  colors={imageUri ? ["#4377e6", "#2850a7"] : ["#4e8cff", "#1e56d9"]}
                  style={styles.pickBtnGradient}
                >
                  <Text style={styles.pickButtonText}>
                    {processing
                      ? "প্রসেসিং..."
                      : imageUri
                      ? "ছবি পরিবর্তন করুন"
                      : "ছবি নির্বাচন করুন"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUpload}
                disabled={loading}
              >
                <LinearGradient colors={["#10b981", "#059669"]} style={styles.uploadGradient}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>আপলোড করুন</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.subHeader}>📂 সকল রুটিন</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item._id)}
            >
              <Text style={styles.deleteText}>মুছুন</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() =>
          fetching ? (
            <ActivityIndicator size="large" color="#3b5edb" />
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                style={styles.emptyImage}
                source={require("../assets/image/empty.png")}
              />
              <Text style={styles.emptyText}>কোনো রুটিন পাওয়া যায়নি</Text>
            </View>
          )
        }
        contentContainerStyle={{ padding: 18 }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
     color: "#315cb2ff",
  },

  glassCard: {
    backgroundColor: "rgba(255,255,255,0.75)",
    padding: 18,
    borderRadius: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },

  input: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 14,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  pickButton: { marginBottom: 15 },
  pickBtnGradient: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  pickButtonText: { fontSize: 16, color: "#fff", fontWeight: "700" },

  preview: {
    height: 220,
    width: "100%",
    borderRadius: 20,
    marginBottom: 15,
  },

  uploadButton: { width: "100%", marginBottom: 10 },
  uploadGradient: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  uploadText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },

  subHeader: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 14,
    color: "#243c8a",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 14,
    borderRadius: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  cardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  cardImage: { width: "100%", height: 200, borderRadius: 18, marginBottom: 12 },

  deleteButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-end",
    paddingHorizontal: 18,
  },
  deleteText: { color: "#fff", fontWeight: "700" },

  emptyContainer: { marginTop: 40, alignItems: "center" },
  emptyImage: { width: 240, height: 240 },
  emptyText: { marginTop: 10, color: "#6b7280", fontSize: 16 },
});
