import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {   SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra?.API_URL;

export default function NoticeScreen() {
  const { schoolId } = useLocalSearchParams();
  const STORAGE_KEY = `notices_list_${schoolId}`;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notices, setNotices] = useState([]);
  const [noticeId, setNoticeId] = useState(null);

  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(null);

  /* ================= LOAD FROM STORAGE ================= */
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setNotices(JSON.parse(saved));
    })();
  }, [schoolId]);

  /* ================= FETCH NOTICES ================= */
  const fetchNotices = async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/school/Notice/getNotice?schoolId=${schoolId}`
      );
      const data = await res.json();
      if (data.success) {
        setNotices(data.notices);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.notices));
      }
    } catch (err) {
      console.error("Error fetching notices:", err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      return Alert.alert("ত্রুটি", "শিরোনাম এবং বর্ণনা লিখুন!");
    }

    setLoadingAdd(true);

    try {
      const date = `${new Date().getDate()}-${
        new Date().getMonth() + 1
      }-${new Date().getFullYear()}`;
      const isUpdate = !!noticeId;

      const url = isUpdate
        ? `${API_URL}/api/school/Notice/updateNotice/${noticeId}`
        : `${API_URL}/api/school/Notice/postNotice`;

      const body = isUpdate
        ? { title, description }
        : { schoolId, title, description, date };

      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        return Alert.alert("ত্রুটি", data.message || "অপারেশন ব্যর্থ হয়েছে!");
      }

      await fetchNotices();

      Alert.alert(
        "সফল",
        isUpdate ? "নোটিশ আপডেট হয়েছে!" : "নোটিশ যুক্ত হয়েছে!"
      );

      // Reset form
      handleCancelEdit();
    } catch (err) {
      console.error(err);
      Alert.alert("ত্রুটি", "নোটিশ সংরক্ষণ ব্যর্থ হয়েছে!");
    } finally {
      setLoadingAdd(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (notice) => {
    if (!notice?._id) return;
    setNoticeId(notice._id);
    setTitle(notice.title);
    setDescription(notice.description);
  };

  const handleCancelEdit = () => {
    setTitle("");
    setDescription("");
    setNoticeId(null);
  };

  /* ================= DELETE ================= */
  const deleteNotice = async (id) => {
    Alert.alert("নিশ্চিত করুন", "আপনি কি এই নোটিশটি মুছে ফেলতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছে ফেলুন",
        style: "destructive",
        onPress: async () => {
          setLoadingDelete(id);
          const backup = [...notices];
          setNotices((prev) => prev.filter((n) => n._id !== id));

          try {
            const res = await fetch(
              `${API_URL}/api/school/Notice/deleteNotice/${id}`,
              { method: "DELETE" }
            );
            const data = await res.json();

            if (!data.success) {
              setNotices(backup);
              Alert.alert("ত্রুটি", data.message || "নোটিশ মুছে ফেলা যায়নি!");
            } else {
              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(backup.filter((n) => n._id !== id))
              );
            }
          } catch (err) {
            console.error(err);
            setNotices(backup);
          } finally {
            setLoadingDelete(null);
          }
        },
      },
    ]);
  };

  /* ================= RENDER ITEM ================= */
  const renderItem = ({ item }) => (
    <View style={styles.noticeCard}>
      <View style={styles.cardAccentBar} />
      <View style={styles.cardMainContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.noticeTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={styles.iconBtnEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={16} color="#4F46E5" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => deleteNotice(item._id)}
              style={styles.iconBtnDelete}
              activeOpacity={0.7}
            >
              {loadingDelete === item._id ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.noticeDesc}>{item.description}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateBadge}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.noticeDate}>{item.date}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <LinearGradient colors={["#F8FAFC", "#EEF2FF"]} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            data={notices}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {/* Header Title Banner */}
                <View style={styles.headerContainer}>
                  <View style={styles.headerIconBg}>
                    <Ionicons
                      name="megaphone-outline"
                      size={24}
                      color="#4F46E5"
                    />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>নোটিশ বোর্ড</Text>
                    <Text style={styles.headerSubtitle}>
                      নতুন নোটিশ তৈরি অথবা ব্যবস্থাপনা করুন
                    </Text>
                  </View>
                </View>

                {/* Edit Active Indicator Banner */}
                {noticeId && (
                  <View style={styles.editingBanner}>
                    <View style={styles.editingBannerLeft}>
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#4F46E5"
                      />
                      <Text style={styles.editingBannerText}>
                        নোটিশ সম্পাদনা করা হচ্ছে
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      style={styles.cancelEditBtn}
                    >
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                      <Text style={styles.cancelEditText}>বাতিল</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Form Card */}
                <View style={styles.formCard}>
                  <Text style={styles.formSectionTitle}>
                    {noticeId ? "নোটিশ পরিবর্তন করুন" : "নতুন নোটিশ যোগ করুন"}
                  </Text>

                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="নোটিশের শিরোনাম"
                      placeholderTextColor="#94A3B8"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="বিস্তারিত বিবরণ লিখুন..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      value={description}
                      onChangeText={setDescription}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loadingAdd}
                    activeOpacity={0.85}
                    style={styles.submitButtonContainer}
                  >
                    <LinearGradient
                      colors={["#4F46E5", "#3730A3"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}
                    >
                      {loadingAdd ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <View style={styles.btnContent}>
                          <Ionicons
                            name={
                              noticeId
                                ? "checkmark-circle-outline"
                                : "send-outline"
                            }
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text style={styles.submitText}>
                            {noticeId ? "আপডেট করুন" : "নোটিশ প্রকাশ করুন"}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Section Header for Notices List */}
                <View style={styles.listHeader}>
                  <Text style={styles.listSectionTitle}>প্রকাশিত নোটিশ</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{notices.length}</Text>
                  </View>
                </View>
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={48}
                  color="#CBD5E1"
                />
                <Text style={styles.emptyTitle}>কোনো নোটিশ পাওয়া যায়নি</Text>
                <Text style={styles.emptySubText}>
                  এখনো পর্যন্ত কোনো নোটিশ পোস্ট করা হয়নি।
                </Text>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  /* Header Section */
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 6,
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  /* Editing Active Banner */
  editingBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  editingBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  editingBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4338CA",
    marginLeft: 6,
  },
  cancelEditBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelEditText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 4,
  },

  /* Form Section */
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 14,
  },
  inputWrapper: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
  },
  textArea: {
    height: 100,
  },

  /* Submit Button */
  submitButtonContainer: {
    marginTop: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },

  /* List Section Header */
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  listSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
  },
  countBadge: {
    backgroundColor: "#E0E7FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4338CA",
  },

  /* Notice Cards */
  noticeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccentBar: {
    width: 5,
    backgroundColor: "#4F46E5",
  },
  cardMainContent: {
    flex: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  noticeTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtnEdit: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  iconBtnDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  noticeDesc: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 8,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noticeDate: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginTop: 8,
    marginBottom: 2,
  },
  emptySubText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },
});