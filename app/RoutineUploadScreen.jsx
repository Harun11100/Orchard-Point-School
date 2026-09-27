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
  Dimensions,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { uploadImages } from "../request/UploadImages";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = Constants.expoConfig?.extra?.API_URL;
const { width } = Dimensions.get("window");

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
      return Alert.alert("অনুমতি প্রয়োজন", "গ্যালারি ব্যবহারের অনুমতি প্রদান করুন।");
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
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );

      setImageUri(manipulated.uri);
    } catch (err) {
      Alert.alert("ত্রুটি", "ছবি প্রক্রিয়াকরণ করা সম্ভব হয়নি");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !imageUri) {
      return Alert.alert("অসম্পূর্ণ তথ্য", "দয়া করে শিরোনাম এবং একটি ছবি নির্বাচন করুন।");
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
        title: title.trim(),
        schoolId,
        imageUrl: uploadedRoutine.url,
        publicId: uploadedRoutine.public_id,
      });

      if (res.data?.success) {
        Alert.alert("সফল!", "রুটিনটি সফলভাবে আপলোড হয়েছে।");
        setTitle("");
        setImageUri(null);
        fetchRoutines();
      }
    } catch (err) {
      Alert.alert("আপলোড ব্যর্থ হয়েছে", "পুনরায় চেষ্টা করুন।");
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
      if (res.data?.success) setRoutines(res.data.routines || []);
    } catch (err) {
      console.error("Fetch routines error:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("রুটিন ডিলিট", "আপনি কি নিশ্চিত যে আপনি এই রুটিনটি মুছে ফেলতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "ডিলিট করুন",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/api/school/Routine/deleteRoutine/${id}`);
            fetchRoutines();
          } catch (err) {
            Alert.alert("ত্রুটি", "রুটিন ডিলিট করতে সমস্যা হয়েছে");
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const isFormValid = title.trim().length > 0 && imageUri !== null;

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <FlatList
        data={routines}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top + 12, 24),
            paddingBottom: Math.max(insets.bottom + 24, 40),
          },
        ]}
        ListHeaderComponent={
          <View>
            {/* Navigation / Screen Header */}
            <View style={styles.headerBar}>
              <View style={styles.headerIconWrapper}>
                <Ionicons name="calendar" size={22} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.headerTitle}>রুটিন ম্যানেজমেন্ট</Text>
                <Text style={styles.headerSubtitle}>ক্লাস ও পরীক্ষা রুটিন আপডেট করুন</Text>
              </View>
            </View>

            {/* Creation Card */}
            <View style={styles.uploadCard}>
              <Text style={styles.cardSectionTitle}>নতুন রুটিন যুক্ত করুন</Text>

              {/* Title Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="text-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="রুটিনের শিরোনাম (যেমন: বার্ষিক পরীক্ষা ২০২৬)"
                  placeholderTextColor="#94A3B8"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.textInput}
                />
              </View>

              {/* Image Uploader Area */}
              {imageUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <LinearGradient
                    colors={["rgba(0,0,0,0.6)", "transparent"]}
                    style={styles.previewOverlay}
                  >
                    <TouchableOpacity
                      style={styles.changeImageBadge}
                      onPress={pickImage}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera-reverse" size={16} color="#FFFFFF" />
                      <Text style={styles.changeImageText}>পরিবর্তন করুন</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.closeImageBadge}
                      onPress={() => setImageUri(null)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickImage}
                  disabled={processing}
                  activeOpacity={0.7}
                  style={styles.dropZone}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#2563EB" />
                  ) : (
                    <>
                      <View style={styles.uploadIconBadge}>
                        <Ionicons name="cloud-upload" size={26} color="#2563EB" />
                      </View>
                      <Text style={styles.dropZonePrimaryText}>
                        রুটিনের ছবি সিলেক্ট করুন
                      </Text>
                      <Text style={styles.dropZoneSecondaryText}>
                        JPG, PNG (সর্বোচ্চ ১২০০px সাইজ)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Upload Button */}
              <TouchableOpacity
                onPress={handleUpload}
                disabled={loading || !isFormValid}
                activeOpacity={0.85}
                style={[
                  styles.submitButton,
                  (!isFormValid || loading) && styles.submitButtonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <LinearGradient
                    colors={isFormValid ? ["#2563EB", "#1D4ED8"] : ["#CBD5E1", "#CBD5E1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>পাবলিশ করুন</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>

            {/* List Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="folder-multiple-image" size={20} color="#1E293B" />
                <Text style={styles.sectionTitle}>প্রকাশিত রুটিনসমূহ</Text>
              </View>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{routines.length}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.routineCard}>
            <View style={styles.routineHeader}>
              <View style={styles.routineTitleWrapper}>
                <Text style={styles.routineTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteIconButton}
                onPress={() => handleDelete(item._id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-bin-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.cardImageFrame}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.routineImage}
                resizeMode="cover"
              />
            </View>
          </View>
        )}
        ListEmptyComponent={() =>
          fetching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
              </View>
              <Text style={styles.emptyStateTitle}>কোনো রুটিন পাওয়া যায়নি</Text>
              <Text style={styles.emptyStateSub}>
                নতুন রুটিন যোগ করতে উপরের ফর্মটি ব্যবহার করুন।
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  
  /* Header */
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* Creation Card */
  uploadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 14,
  },

  /* Text Input */
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#0F172A",
  },

  /* Drag & Drop Zone */
  dropZone: {
    height: 130,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  dropZonePrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  dropZoneSecondaryText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },

  /* Image Preview */
  previewContainer: {
    position: "relative",
    height: 180,
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  changeImageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeImageText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  closeImageBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },

  /* Submit Button */
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  /* List Section Header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  badgeCount: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },

  /* Routine Cards */
  routineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  routineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routineTitleWrapper: {
    flex: 1,
    marginRight: 12,
  },
  routineTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  deleteIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  cardImageFrame: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  routineImage: {
    width: "100%",
    height: "100%",
  },

  /* Empty State */
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
  },
  emptyStateSub: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
    textAlign: "center",
  },
});