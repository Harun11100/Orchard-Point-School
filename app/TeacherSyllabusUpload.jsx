import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { TextInput, Card } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.API_URL;
const STORAGE_KEY = "SyllabusData";

export default function SyllabusUploadForm() {
  const { schoolId, classId } = useLocalSearchParams();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syllabusList, setSyllabusList] = useState([]);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  // Fetch syllabus data
  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/school/syllabus/getSyllabus?schoolId=${schoolId}&classId=${classId}`
        );
        const data = await res.json();
        if (data.success) {
          setSyllabusList(data.syllabus);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.syllabus));
        }
      } catch (err) {
        console.error("Error fetching syllabus:", err);
      }
    };
    fetchSyllabus();
  }, [schoolId, classId]);

  const handleDateConfirm = (selectedDate) => {
    setDate(selectedDate);
    setDatePickerVisible(false);
  };

  const handleSubmit = async () => {
    if (!subject || !description || !date) {
      Alert.alert("ত্রুটি", "অনুগ্রহ করে সব ঘর পূরণ করুন।");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/school/syllabus/upload`, {
        schoolId,
        classId,
        subject,
        description,
        date,
      });

      if (res.data.success) {
        Alert.alert("✅ সফল", "সিলেবাস সফলভাবে আপলোড করা হয়েছে!");
        setSubject("");
        setDescription("");
        setDate(null);
        const updatedList = [res.data.syllabus, ...syllabusList];
        setSyllabusList(updatedList);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      } else {
        Alert.alert("ত্রুটি", res.data.message || "কিছু ভুল হয়েছে।");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("ত্রুটি", "সিলেবাস আপলোড করতে ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSyllabus = async (syllabusId) => {
    Alert.alert("নিশ্চিত করুন", "আপনি কি সত্যিই এই সিলেবাসটি মুছে ফেলতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছে ফেলুন",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/school/syllabus/deleteSyllabus`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ syllabusId }),
            });
            const data = await res.json();
            if (data.success) {
              const updatedList = syllabusList.filter((item) => item._id !== syllabusId);
              setSyllabusList(updatedList);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
              Alert.alert("✅ সফলভাবে মুছে ফেলা হয়েছে", "সিলেবাসটি অপসারণ করা হয়েছে।");
            } else {
              Alert.alert("ত্রুটি", data.message || "সিলেবাস মুছে ফেলতে ব্যর্থ হয়েছে।");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("ত্রুটি", "সিলেবাস মুছে ফেলতে ব্যর্থ হয়েছে।");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>সিলেবাস আপলোড</Text>

      <Card style={styles.formCard}>
        <Card.Content>
          <TextInput
            label="বিষয় লিখুন"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
            mode="outlined"
            outlineColor="#CBD5E1"
            activeOutlineColor="#017de9ff"
          />
          <TextInput
            label="বিস্তারিত লিখুন"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={6}
            style={styles.input}
            outlineColor="#CBD5E1"
             activeOutlineColor="#017de9ff"
          />
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={styles.dateText}>
              {date ? date.toDateString() : "📅 তারিখ নির্বাচন করুন"}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setDatePickerVisible(false)}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient colors={["#3491eeff", "#0b71f7ff"]} style={styles.gradientButton}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>সংরক্ষণ করুন</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {syllabusList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image style={styles.image} source={require("../assets/image/empty.png")} />
          <Text style={styles.emptyText}>কোন সিলেবাস পাওয়া যায়নি</Text>
        </View>
      ) : (
        syllabusList.map((item) => (
          <Card key={item._id} style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Ionicons name="book-outline" size={22} color="#1489f6ff" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.title}>{item.subject}</Text>
                <Text style={styles.desc}>{item.description}</Text>
                <Text style={styles.date}>📅 তারিখ: {new Date(item.date).toDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteSyllabus(item._id)}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5faffff",
    paddingBottom: 40,
    height:"100%"
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#0585e0ff",
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  datePicker: {
    backgroundColor: "#EEF2FF",
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#0b85f0ff",
    fontWeight: "600",
  },
  submitButton: {
    marginTop: 8,
  },
  gradientButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  card: {
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  desc: {
    color: "#4B5563",
    marginVertical: 4,
  },
  date: {
    color: "#6B7280",
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 10,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
