import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams } from "expo-router";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function OmrCheckScreen() {
  const {schoolId,teacherId} = useLocalSearchParams();
  const [answerKey, setAnswerKey] = useState("");
  const [image, setImage] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [result, setResult] = useState(null);

  const saveAnswerKey = async () => {
  if (!answerKey.trim()) {
    return Alert.alert("Error", "Please enter correct answers");
  }

  if (!teacherId) {
    return Alert.alert("Error", "Teacher ID missing");
  }

  setLoadingSave(true);
  try {
    const res = await fetch(`${API_URL}/api/teacher/save-answer-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, answerKey: answerKey.trim() }),
    });

    const data = await res.json();

    if (!data.success) {
      return Alert.alert("Error", data.message || "Failed to save answer key");
    }

    Alert.alert(
      "Success",
      `Answer key saved successfully (${data.totalQuestions} questions)`
    );
  } catch (err) {
    console.error(err);
    Alert.alert("Error", err.message || "Something went wrong");
  } finally {
    setLoadingSave(false);
  }
};


  /* ================= PICK IMAGE ================= */
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!res.canceled) {
      setImage(res.assets[0]);
      setResult(null);
    }
  };

  /* ================= CHECK OMR ================= */
 const checkOmr = async () => {
  if (!image) return Alert.alert("Error", "Please upload OMR sheet image");

  setLoadingCheck(true);

  try {
    const formData = new FormData();
    formData.append("teacherId", teacherId);
    formData.append("image", {
      uri: image.uri,
      name: "omr.jpg",
      type: "image/jpeg",
    });

    console.log("Submitting OMR check request with formData:", formData);

    const res = await fetch(`${API_URL}/api/omr/check`, {
      method: "POST",
      body: formData, // don't set Content-Type manually
    });

    const data = await res.json();

    if (!data.success) return Alert.alert("Error", data.message || "OMR check failed");

    setResult(data);
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Failed to process OMR");
  } finally {
    setLoadingCheck(false);
  }
};

  /* ================= RESET ================= */
  const resetForNext = () => {
    setImage(null);
    setResult(null);
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, padding: 16 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.header}>📝 OMR ফলাফল যাচাই</Text>

      {/* Answer Key */}
      <View style={styles.card}>
        <Text style={styles.label}>সঠিক উত্তরসমূহ</Text>
        <TextInput
          style={styles.input}
          placeholder="1. A, 2. B, 3. A, 4. C"
          value={answerKey}
          onChangeText={setAnswerKey}
          multiline
        />

        <TouchableOpacity onPress={saveAnswerKey} disabled={loadingSave}>
          <LinearGradient colors={["#4d73bfff", "#184c9fff"]} style={styles.button}>
            {loadingSave ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>উত্তরপত্র সংরক্ষণ করুন</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Image Upload */}
      <View style={styles.card}>
        <Text style={styles.label}>Upload Student OMR Sheet</Text>

        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} />
          ) : (
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={checkOmr} disabled={loadingCheck}>
          <LinearGradient colors={["#16A34A", "#15803D"]} style={styles.button}>
            {loadingCheck ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>OMR যাচাই করুন</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Result */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultText}>
            নম্বর: {result.score} / {result.total}
          </Text>

          <TouchableOpacity onPress={resetForNext}>
            <LinearGradient colors={["#2563EB", "#1E40AF"]} style={styles.button}>
              <Text style={styles.btnText}>পরবর্তী শিট যাচাই করুন</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#0a47a1",
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    minHeight: 60,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  imageBox: {
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  preview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  resultCard: {
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
    color: "#065F46",
  },
});
