import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";
import { TextInput } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";

const API_URL = Constants.expoConfig.extra?.API_URL;

/* =========================================================
   HOMEWORK FORM
   IMPORTANT: This component is OUTSIDE HomeworkScreen.
   This prevents the form from remounting on every keystroke.
========================================================= */

function HomeworkForm({
  title,
  setTitle,
  description,
  setDescription,
  dueDate,
  setDueDate,
  homeworkId,
  loadingAdd,
  handleSubmit,
  handleCancelEdit,
}) {
  const [isDatePickerVisible, setDatePickerVisible] =
    useState(false);

  return (
    <>
      {/* EDITING BANNER */}
      {homeworkId && (
        <View style={styles.editingBanner}>
          <View style={styles.editingBannerLeft}>
            <Ionicons
              name="create-outline"
              size={18}
              color="#4F46E5"
            />

            <Text style={styles.editingBannerText}>
              বাড়ির কাজ সম্পাদনা করা হচ্ছে
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleCancelEdit}
            style={styles.cancelEditBtn}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color="#EF4444"
            />

            <Text style={styles.cancelEditText}>
              বাতিল
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FORM */}
      <View style={styles.formCard}>
        <Text style={styles.formSectionTitle}>
          {homeworkId
            ? "বাড়ির কাজ পরিবর্তন করুন"
            : "নতুন বাড়ির কাজ যোগ করুন"}
        </Text>

        {/* TITLE */}
        <View style={styles.inputWrapper}>
          <TextInput
            label="বিষয় / শিরোনাম"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            outlineColor="#E2E8F0"
            activeOutlineColor="#4F46E5"
            style={styles.input}
            theme={{ roundness: 12 }}
          />
        </View>

        {/* DESCRIPTION */}
        <View style={styles.inputWrapper}>
          <TextInput
            label="বিস্তারিত বিবরণ"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            outlineColor="#E2E8F0"
            activeOutlineColor="#4F46E5"
            style={styles.descriptionInput}
            theme={{ roundness: 12 }}
          />
        </View>

        {/* DATE */}
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={styles.datePicker}
            onPress={() => setDatePickerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.datePickerLeft}>
              <Ionicons
                name="calendar-clear-outline"
                size={20}
                color="#4F46E5"
              />

              <Text
                style={[
                  styles.dateText,
                  !dueDate && styles.datePlaceholderText,
                ]}
              >
                {dueDate
                  ? dueDate.toLocaleDateString("bn-BD", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "জমা দেওয়ার শেষ তারিখ নির্বাচন করুন"}
              </Text>
            </View>

            <Ionicons
              name="chevron-down"
              size={18}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* DATE PICKER */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          date={dueDate || new Date()}
          minimumDate={new Date()}
          onConfirm={(date) => {
     
            setDueDate(date);
            setDatePickerVisible(false);
          }}
          onCancel={() => setDatePickerVisible(false)}
        />

        {/* SUBMIT */}
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
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons
                  name={
                    homeworkId
                      ? "checkmark-circle-outline"
                      : "cloud-upload-outline"
                  }
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.submitText}>
                  {homeworkId
                    ? "আপডেট করুন"
                    : "বাড়ির কাজ প্রকাশ করুন"}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

/* =========================================================
   HOMEWORK SCREEN
========================================================= */

export default function HomeworkScreen() {
  const params = useLocalSearchParams();

  const schoolId = Array.isArray(params.schoolId)
    ? params.schoolId[0]
    : params.schoolId;

  const classId = Array.isArray(params.classId)
    ? params.classId[0]
    : params.classId;

  const teacherId = Array.isArray(params.teacherId)
    ? params.teacherId[0]
    : params.teacherId;

  const STORAGE_KEY = `HomeworkData_${schoolId}_${classId}`;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(null);

  const [homework, setHomework] = useState([]);
  const [homeworkId, setHomeworkId] = useState(null);

  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(null);
  const [fetching, setFetching] = useState(false);

  /* =========================================================
     FETCH HOMEWORK
  ========================================================= */

  const fetchHomework = async () => {
    if (!schoolId || !classId) return;

    setFetching(true);

    try {
      // Cache
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (saved) {
        setHomework(JSON.parse(saved));
      }

      // Server
      const res = await axios.get(
        `${API_URL}/api/teacher/Homework/getHomework`,
        {
          params: {
            schoolId,
            classId,
          },
        }
      );

      if (res.data?.success) {
        const data =
          res.data.homework ||
          res.data.data ||
          [];

        setHomework(data);

        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error(
        "Fetch homework error:",
        error.response?.data || error.message
      );
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [schoolId, classId]);

  /* =========================================================
     ADD / UPDATE
  ========================================================= */

  const handleSubmit = async () => {
    if (!title.trim()) {
      return Alert.alert(
        "ত্রুটি",
        "বাড়ির কাজের শিরোনাম লিখুন!"
      );
    }

    if (!description.trim()) {
      return Alert.alert(
        "ত্রুটি",
        "বাড়ির কাজের বিস্তারিত লিখুন!"
      );
    }

    if (!dueDate) {
      return Alert.alert(
        "ত্রুটি",
        "বাড়ির কাজ জমা দেওয়ার তারিখ নির্বাচন করুন!"
      );
    }

    if (!schoolId || !classId || !teacherId) {
      return Alert.alert(
        "ত্রুটি",
        "School, Class অথবা Teacher information পাওয়া যায়নি!"
      );
    }

    setLoadingAdd(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.toISOString(),
        schoolId,
        classId,
        teacherId,
      };


      const isUpdate = !!homeworkId;

      const url = isUpdate
        ? `${API_URL}/api/teacher/Homework/updateHomework/${homeworkId}`
        : `${API_URL}/api/teacher/Homework/addHomework`;

      const res = await axios({
        method: isUpdate ? "PUT" : "POST",
        url,
        data: payload,
      });

 
      if (!res.data?.success) {
        return Alert.alert(
          "ত্রুটি",
          res.data?.message ||
            "অপারেশন ব্যর্থ হয়েছে!"
        );
      }

      // Refresh list AFTER successful save
      await fetchHomework();

      Alert.alert(
        "সফল",
        isUpdate
          ? "বাড়ির কাজ আপডেট হয়েছে!"
          : "বাড়ির কাজ যুক্ত হয়েছে!"
      );

      handleCancelEdit();
    } catch (error) {
      console.error(
        "Homework submit error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "ত্রুটি",
        error.response?.data?.message ||
          "বাড়ির কাজ সংরক্ষণ করা যায়নি!"
      );
    } finally {
      setLoadingAdd(false);
    }
  };

  /* =========================================================
     EDIT
  ========================================================= */

  const handleEdit = (item) => {
    if (!item?._id) return;

    if (
      item.teacherId &&
      teacherId &&
      String(item.teacherId) !==
        String(teacherId)
    ) {
      return Alert.alert(
        "অনুমতি নেই",
        "আপনি কেবল নিজের তৈরি বাড়ির কাজ এডিট করতে পারবেন।"
      );
    }

    setHomeworkId(item._id);
    setTitle(item.title || "");
    setDescription(item.description || "");

    setDueDate(
      item.dueDate
        ? new Date(item.dueDate)
        : null
    );
  };

  /* =========================================================
     CANCEL EDIT
  ========================================================= */

  const handleCancelEdit = () => {
    setTitle("");
    setDescription("");
    setDueDate(null);
    setHomeworkId(null);
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const deleteHomework = async (item) => {
    if (!item?._id) return;

    if (
      item.teacherId &&
      teacherId &&
      String(item.teacherId) !==
        String(teacherId)
    ) {
      return Alert.alert(
        "অনুমতি নেই",
        "আপনি কেবল নিজের তৈরি বাড়ির কাজ মুছে ফেলতে পারবেন।"
      );
    }

    Alert.alert(
      "নিশ্চিত করুন",
      "আপনি কি এই বাড়ির কাজটি মুছে ফেলতে চান?",
      [
        {
          text: "বাতিল",
          style: "cancel",
        },
        {
          text: "মুছে ফেলুন",
          style: "destructive",

          onPress: async () => {
            setLoadingDelete(item._id);

            try {
              const res = await axios.delete(
                `${API_URL}/api/teacher/Homework/deleteHomework`,
                {
                  params: {
                    homeworkId: item._id,
                  },
                }
              );

              if (!res.data?.success) {
                return Alert.alert(
                  "ত্রুটি",
                  res.data?.message ||
                    "বাড়ির কাজ মুছে ফেলা যায়নি!"
                );
              }

              const updated = homework.filter(
                (homeworkItem) =>
                  String(homeworkItem._id) !==
                  String(item._id)
              );

              setHomework(updated);

              await AsyncStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updated)
              );

              Alert.alert(
                "সফল",
                "বাড়ির কাজ মুছে ফেলা হয়েছে!"
              );
            } catch (error) {
              console.error(
                "Delete homework error:",
                error.response?.data ||
                  error.message
              );

              Alert.alert(
                "ত্রুটি",
                error.response?.data?.message ||
                  "বাড়ির কাজ মুছে ফেলা যায়নি!"
              );
            } finally {
              setLoadingDelete(null);
            }
          },
        },
      ]
    );
  };

  /* =========================================================
     HOMEWORK ITEM
  ========================================================= */

  const renderItem = ({ item }) => (
    <View style={styles.homeworkCard}>
      <View style={styles.cardAccentBar} />

      <View style={styles.cardMainContent}>
        <View style={styles.cardHeaderRow}>
          <Text
            style={styles.homeworkTitle}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={styles.iconBtnEdit}
              activeOpacity={0.7}
            >
              <Ionicons
                name="pencil"
                size={16}
                color="#4F46E5"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                deleteHomework(item)
              }
              style={styles.iconBtnDelete}
              disabled={
                loadingDelete === item._id
              }
              activeOpacity={0.7}
            >
              {loadingDelete === item._id ? (
                <ActivityIndicator
                  size="small"
                  color="#EF4444"
                />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color="#EF4444"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={styles.homeworkDesc}
          numberOfLines={3}
        >
          {item.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.dateBadge}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#64748B"
            />

            <Text style={styles.homeworkDate}>
              শেষ তারিখ:{" "}
              {item.dueDate
                ? new Date(
                    item.dueDate
                  ).toLocaleDateString(
                    "bn-BD",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  /* =========================================================
     EMPTY
  ========================================================= */

  const EmptyComponent = () => {
    if (fetching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator
            size="small"
            color="#4F46E5"
          />

          <Text style={styles.emptyTitle}>
            বাড়ির কাজ লোড হচ্ছে...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="book-outline"
          size={48}
          color="#CBD5E1"
        />

        <Text style={styles.emptyTitle}>
          কোনো বাড়ির কাজ নেই
        </Text>

        <Text style={styles.emptySubText}>
          এখনো পর্যন্ত কোনো বাড়ির কাজ প্রকাশ করা হয়নি।
        </Text>
      </View>
    );
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <LinearGradient
        colors={["#F8FAFC", "#EEF2FF"]}
        style={{ flex: 1 }}
      >
        <FlatList
          data={homework}
          keyExtractor={(item) =>
            String(item._id)
          }
          renderItem={renderItem}
          ListHeaderComponent={
            <View>
              {/* PAGE HEADER */}

              <View style={styles.headerContainer}>
                <View style={styles.headerIconBg}>
                  <Ionicons
                    name="book-outline"
                    size={24}
                    color="#4F46E5"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>
                    বাড়ির কাজ পরিচালনা
                  </Text>

                  <Text
                    style={styles.headerSubtitle}
                  >
                    শিক্ষার্থীদের জন্য নতুন কাজ তৈরি ও ব্যবস্থাপনা করুন
                  </Text>
                </View>
              </View>

              {/* STABLE FORM COMPONENT */}

              <HomeworkForm
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                dueDate={dueDate}
                setDueDate={setDueDate}
                homeworkId={homeworkId}
                loadingAdd={loadingAdd}
                handleSubmit={handleSubmit}
                handleCancelEdit={
                  handleCancelEdit
                }
              />

              {/* LIST HEADER */}

              <View style={styles.listHeader}>
                <Text
                  style={styles.listSectionTitle}
                >
                  প্রকাশিত বাড়ির কাজ
                </Text>

                <View style={styles.countBadge}>
                  <Text
                    style={
                      styles.countBadgeText
                    }
                  >
                    {homework.length}
                  </Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={EmptyComponent}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchHomework}
          refreshing={fetching}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  /* HEADER */

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
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  /* EDIT */

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

  /* FORM */

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
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
    backgroundColor: "#FFFFFF",
    fontSize: 14,
  },

  descriptionInput: {
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    minHeight: 100,
  },

  /* DATE */

  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
  },

  datePickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  dateText: {
    marginLeft: 10,
    color: "#1E293B",
    fontSize: 14,
    fontWeight: "500",
  },

  datePlaceholderText: {
    color: "#94A3B8",
    fontWeight: "400",
  },

  /* BUTTON */

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

  /* LIST */

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

  /* HOMEWORK CARD */

  homeworkCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F5F9",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  homeworkTitle: {
    flex: 1,
    marginRight: 8,
    fontWeight: "700",
    fontSize: 16,
    color: "#1E293B",
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

  homeworkDesc: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },

  cardFooter: {
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
    alignSelf: "flex-start",
  },

  homeworkDate: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },

  /* EMPTY */

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
    paddingHorizontal: 20,
  },
});
