import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.API_URL;
const DeleteAccountModal = ({ visible, onClose }) => {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

const handleDelete = async () => {
  if (!password) {
    Alert.alert("ত্রুটি", "পাসওয়ার্ড দিন।");
    return;
  }

  Alert.alert(
    "একাউন্ট ডিলিট নিশ্চিত করুন",
    "একবার একাউন্ট মুছে ফেলার জন্য আবেদন করলে এটি ৭ দিনের মধ্যে স্থায়ীভাবে মুছে যাবে। আপনি কি নিশ্চিত?",
    [
      { text: "বাতিল", style: "cancel" },
      {
        text: "হ্যাঁ, আবেদন করুন",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            // Step 1: Load owner data
            const data = await AsyncStorage.getItem("ownerData");
            if (!data) throw new Error("Owner data not found");

            const owner = JSON.parse(data);
            const { _id: ownerId, email } = owner;

            // Step 2: Verify password
            const verifyRes = await axios.post(
              `${API_URL}/api/owner/verify-password`,
              { ownerId, password },
              { headers: { "Content-Type": "application/json" } }
            );

            if (!verifyRes.data.success) {
              Alert.alert("ত্রুটি", "ভুল পাসওয়ার্ড!");
              return;
            }

            // Step 3: Submit delete application
            const reason = "Owner requested account deletion";
            const res = await axios.post(
              `${API_URL}/api/owner/account/delete-request`,
              { ownerId, reason },
              { headers: { "Content-Type": "application/json" } }
            );

            if (res.data.success) {
              await AsyncStorage.removeItem("ownerData");
              Alert.alert(
                "আবেদন গৃহীত হয়েছে",
                "আপনার একাউন্ট ডিলিটের আবেদন সফলভাবে জমা হয়েছে। ৭ দিনের মধ্যে একাউন্টটি মুছে ফেলা হবে।"
              );
              onClose();
              router.replace("/ChooseRoleScreen");
            } else {
              Alert.alert("ত্রুটি", "আবেদন জমা দিতে ব্যর্থ হয়েছে।");
            }
          } catch (error) {
            console.error(error);
            Alert.alert("ত্রুটি", "সার্ভারে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
          } finally {
            setLoading(false);
            setPassword("");
          }
        },
      },
    ]
  );
};


  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>একাউন্ট ডিলিট করুন</Text>
          <Text style={styles.modalMessage}>
            আপনার পাসওয়ার্ড লিখে নিশ্চিত করুন
          </Text>

          <TextInput
            placeholder="পাসওয়ার্ড লিখুন"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          
          <TextInput
            placeholder="ডিলিট করার কারন লিখুন"
            secureTextEntry
            value={reason}
            onChangeText={setReason}
            style={styles.input}
          />

          {loading && <ActivityIndicator size="small" color="#4a90e2" />}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setPassword("");
                onClose();
              }}
            >
              <Text style={styles.cancelText}>বাতিল</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteText}>ডিলিট</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteAccountModal;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 8,
    marginRight: 5,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
    marginLeft: 5,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
