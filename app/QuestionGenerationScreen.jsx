import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { uploadImages } from "../request/UploadImages";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
export default function OCRScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const handleUpload = async () => {
    if (!image) return Alert.alert("অনুগ্রহ করে প্রথমে একটি ছবি নির্বাচন করুন।");

    try {
      setLoading(true);

      // Cloudinary তে আপলোড
      if (!image.uri) throw new Error("ছবির URI পাওয়া যায়নি।");
      const cloudForm = new FormData();
      cloudForm.append("file", {
        uri: image.uri,
        type: "image/jpeg",
        name: image.fileName || `question_${Date.now()}.jpg`,
      });

      const [uploadedQuestion] = await uploadImages(cloudForm);
      if (!uploadedQuestion?.url) throw new Error("Cloudinary আপলোড ব্যর্থ হয়েছে।");
      const questionUrl = uploadedQuestion.url;


      // OCR API তে পাঠানো
      const res = await fetch(
        `${API_URL}/api/ocr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: questionUrl }),
        }
      );

      if (!res.ok) throw new Error("OCR ব্যর্থ হয়েছে!");

      // Blob থেকে DOCX ফাইল তৈরি
      const blob = await res.blob();
      const base64Data = await blobToBase64(blob);
      const timestamp = Date.now();
      const fileUri = FileSystem.documentDirectory + `questions_${timestamp}.docx`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, { encoding: "base64" });

      Alert.alert("✅ সফল!", `ফাইল সংরক্ষিত হয়েছে: 'questions_${timestamp}.docx'`);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error("OCR আপলোড ত্রুটি:", error);
      Alert.alert("ত্রুটি", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📝 আপনার প্রশ্নের ছবি ওয়ার্ড ফাইলে রূপান্তর করুন সম্পাদনার জন্য</Text>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>
          {image ? "📸 ছবি পরিবর্তন করুন" : "📷 ছবি নির্বাচন করুন"}
        </Text>
      </TouchableOpacity>

      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        disabled={loading}
        onPress={handleUpload}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>আপলোড ও রূপান্তর করুন</Text>
        )}
      </TouchableOpacity>

      {image && (
        <Text style={styles.fileName}>
          নির্বাচিত: {image.fileName || "question.jpg"}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f4f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#1f2937",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#5f57f3ff",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  imagePreview: {
    width: 280,
    height: 280,
    resizeMode: "cover",
  },
  fileName: {
    marginTop: 12,
    fontSize: 13,
    color: "#475569",
  },
});
