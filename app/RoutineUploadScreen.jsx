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
  ScrollView,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadImages } from "../request/UploadImages";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from 'expo-constants';

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
      Alert.alert("Permission denied", "Cannot access gallery without permission");
      return;
    }
    try {
      setProcessing(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
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
      console.error("pickImage error:", err);
      Alert.alert("Error", "Could not process the selected image.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !imageUri) {
      return Alert.alert("Missing Fields", "Please enter a title and select an image");
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
      const res = await axios.post(
        `${API_URL}/api/school/Routine/upload`,
        {
          title,
          schoolId,
          imageUrl: uploadedRoutine.url,
          publicId: uploadedRoutine.public_id,
        }
      );

      if (res.data.success) {
        Alert.alert("Success", "Routine uploaded successfully!");
        setTitle("");
        setImageUri(null);
        fetchRoutines();
      } else {
        Alert.alert("Error", res.data.message || "Failed to save to database");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload routine");
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (id) => {
    Alert.alert("নিশ্চিত করুন ", " আপনি কি রুটিন মুছে ফেলতে চান ?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(
              `${API_URL}/api/school/Routine/deleteRoutine/${id}`
            );
            fetchRoutines();
          } catch (err) {
            console.error("Delete routine error:", err);
            Alert.alert("Error", "Failed to delete routine");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchRoutines();
  }, [schoolId]);

  return (
 <FlatList
  data={routines}
  keyExtractor={(item) => item._id}
  ListHeaderComponent={
    <>
      <Text style={styles.header}>রুটিন আপলোড</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="শিরোনাম লিখুন"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
      </View>

      <TouchableOpacity
        onPress={pickImage}
        style={[styles.imagePicker, imageUri && { backgroundColor: "#265abbff" }]}
        disabled={processing}
      >
        <Text style={styles.imagePickerText}>
          {processing ? "প্রোসেসিং..." : imageUri ? "পরিবর্তন করুন" : " ছবি নির্বাচন করুন"}
        </Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUpload}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadButtonText}>আপলোড</Text>}
      </TouchableOpacity>

      <Text style={styles.subHeader}>সকল রুটিন</Text>
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
        <Text style={styles.deleteButtonText}>মুছুন</Text>
      </TouchableOpacity>
    </View>
  )}
  ListEmptyComponent={() =>
    fetching ? (
      <ActivityIndicator size="large" color="#0a3679ff" />
    ) : (
      <View style={styles.emptyContainer}>
      <Image
        style={styles.emptyImage}
        source={require("../assets/image/empty.png")}
      />
      <Text style={styles.emptyText}>কোন রুটিন পাওয়া যায়নি.</Text>
      </View>
      
    )
  } 
  contentContainerStyle={{ padding: 16 }}/>

  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f7f9ffff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2b5dc8ff",
    textAlign: "center",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  imagePicker: {
    backgroundColor: "#2e80c7ff",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  imagePickerText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  previewImage: {
    width: "100%",
    height: 220,
    marginBottom: 12,
    borderRadius: 16,
  },
  uploadButton: {
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  uploadButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  subHeader: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#1b4181ff" },
  card: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardImage: { width: "100%", height: 200, borderRadius: 16, marginBottom: 8 },
  cardTitle: { fontWeight: "700", fontSize: 16, marginBottom: 8, color: "#111827" },
  deleteButton: { backgroundColor: "#ef4444", paddingVertical: 6, paddingHorizontal: 20, borderRadius: 12 },
  deleteButtonText: { color: "#fff", fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#6b7280", marginVertical: 10 },
  emptyImage:{ width:250, height:250, alignSelf:"center"}
});
