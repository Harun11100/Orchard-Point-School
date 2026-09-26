import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Constants from "expo-constants";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const API_URL = Constants.expoConfig.extra.API_URL;

export default function CreateSemesterScreen() {
  const { schoolId } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState(
    new Date().getFullYear().toString()
  );

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [status, setStatus] = useState("upcoming");

  const [showStartPicker, setShowStartPicker] =
    useState(false);

  const [showEndPicker, setShowEndPicker] =
    useState(false);

  const [statusModalVisible, setStatusModalVisible] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const statusOptions = [
    {
      value: "upcoming",
      label: "Upcoming",
    },
    {
      value: "active",
      label: "Active",
    },
    {
      value: "completed",
      label: "Completed",
    },
  ];

  const formatDate = (date) => {
    if (!date) return "তারিখ নির্বাচন করুন";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const validateForm = () => {
    if (!schoolId) {
      Alert.alert(
        "Error",
        "School ID পাওয়া যায়নি।"
      );
      return false;
    }

    if (!name.trim()) {
      Alert.alert(
        "অসম্পূর্ণ তথ্য",
        "Semester name দিন।"
      );
      return false;
    }

    if (!academicYear.trim()) {
      Alert.alert(
        "অসম্পূর্ণ তথ্য",
        "Academic year দিন।"
      );
      return false;
    }

    if (!startDate) {
      Alert.alert(
        "অসম্পূর্ণ তথ্য",
        "Start date নির্বাচন করুন।"
      );
      return false;
    }

    if (!endDate) {
      Alert.alert(
        "অসম্পূর্ণ তথ্য",
        "End date নির্বাচন করুন।"
      );
      return false;
    }

    if (endDate < startDate) {
      Alert.alert(
        "ভুল তারিখ",
        "End date অবশ্যই Start date-এর পরে হতে হবে।"
      );
      return false;
    }

    return true;
  };

  const createSemester = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        academicYear: academicYear.trim(),
        schoolId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status,
      };

   

      const response = await axios.post(
        `${API_URL}/api/school/semester/addSemester`,
        payload
      );

      if (response.data?.success) {
        Alert.alert(
          "সফল হয়েছে",
          "Semester সফলভাবে তৈরি হয়েছে।",
          [
            {
              text: "ঠিক আছে",
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "ত্রুটি",
          response.data?.message ||
            "Semester তৈরি করা যায়নি।"
        );
      }
    } catch (error) {
      console.log(
        "Create semester error:",
        error?.response?.data || error
      );

      Alert.alert(
        "ত্রুটি",
        error?.response?.data?.message ||
          "Semester তৈরি করতে সমস্যা হয়েছে।"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialIcons
              name="event"
              size={25}
              color="#2563eb"
            />
          </View>

          <View>
            <Text style={styles.headerTitle}>
              Create Semester
            </Text>

            <Text style={styles.headerSubtitle}>
              নতুন semester তৈরি করুন
            </Text>
          </View>
        </View>

        {/* Form */}

        <View style={styles.card}>
          {/* Semester Name */}

          <Text style={styles.label}>
            Semester Name
          </Text>

          <View style={styles.inputWrapper}>
            <MaterialIcons
              name="school"
              size={21}
              color="#64748b"
            />

            <TextInput
              style={styles.input}
              placeholder="যেমন: First Semester"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Academic Year */}

          <Text style={styles.label}>
            Academic Year
          </Text>

          <View style={styles.inputWrapper}>
            <MaterialIcons
              name="calendar-today"
              size={20}
              color="#64748b"
            />

            <TextInput
              style={styles.input}
              placeholder="2026"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={academicYear}
              onChangeText={setAcademicYear}
            />
          </View>

          {/* Start Date */}

          <Text style={styles.label}>
            Start Date
          </Text>

          <TouchableOpacity
            style={styles.dateSelector}
            activeOpacity={0.8}
            onPress={() =>
              setShowStartPicker(true)
            }
          >
            <View style={styles.dateIcon}>
              <MaterialIcons
                name="event"
                size={21}
                color="#2563eb"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.dateText,
                  !startDate &&
                    styles.placeholderText,
                ]}
              >
                {formatDate(startDate)}
              </Text>

              {startDate && (
                <Text style={styles.dateLabel}>
                  Semester শুরু হবে
                </Text>
              )}
            </View>

            <MaterialIcons
              name="keyboard-arrow-down"
              size={24}
              color="#64748b"
            />
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);

                if (selectedDate) {
                  setStartDate(selectedDate);

                  // If end date is before start date,
                  // clear it.
                  if (
                    endDate &&
                    selectedDate > endDate
                  ) {
                    setEndDate(null);
                  }
                }
              }}
            />
          )}

          {/* End Date */}

          <Text style={styles.label}>
            End Date
          </Text>

          <TouchableOpacity
            style={styles.dateSelector}
            activeOpacity={0.8}
            onPress={() =>
              setShowEndPicker(true)
            }
          >
            <View style={styles.dateIcon}>
              <MaterialIcons
                name="event"
                size={21}
                color="#2563eb"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.dateText,
                  !endDate &&
                    styles.placeholderText,
                ]}
              >
                {formatDate(endDate)}
              </Text>

              {endDate && (
                <Text style={styles.dateLabel}>
                  Semester শেষ হবে
                </Text>
              )}
            </View>

            <MaterialIcons
              name="keyboard-arrow-down"
              size={24}
              color="#64748b"
            />
          </TouchableOpacity>

          {showEndPicker && (
            <DateTimePicker
              value={
                endDate ||
                startDate ||
                new Date()
              }
              minimumDate={
                startDate || undefined
              }
              mode="date"
              display={
                Platform.OS === "ios"
                  ? "spinner"
                  : "default"
              }
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);

                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}

          {/* Status */}

          <Text style={styles.label}>
            Status
          </Text>

          <TouchableOpacity
            style={styles.statusSelector}
            activeOpacity={0.8}
            onPress={() =>
              setStatusModalVisible(true)
            }
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    status === "active"
                      ? "#16a34a"
                      : status === "completed"
                      ? "#64748b"
                      : "#f59e0b",
                },
              ]}
            />

            <Text style={styles.statusText}>
              {statusOptions.find(
                (item) =>
                  item.value === status
              )?.label}
            </Text>

            <MaterialIcons
              name="keyboard-arrow-down"
              size={24}
              color="#64748b"
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>

        {/* Preview */}

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <MaterialIcons
              name="preview"
              size={20}
              color="#2563eb"
            />

            <Text style={styles.previewTitle}>
              Semester Preview
            </Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>
              Name
            </Text>

            <Text style={styles.previewValue}>
              {name || "Not selected"}
            </Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>
              Academic Year
            </Text>

            <Text style={styles.previewValue}>
              {academicYear || "Not selected"}
            </Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>
              Duration
            </Text>

            <Text style={styles.previewValue}>
              {startDate && endDate
                ? `${formatDate(
                    startDate
                  )} → ${formatDate(endDate)}`
                : "Not selected"}
            </Text>
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>
              Status
            </Text>

            <Text style={styles.previewValue}>
              {
                statusOptions.find(
                  (item) =>
                    item.value === status
                )?.label
              }
            </Text>
          </View>
        </View>

        {/* Submit */}

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={loading}
          onPress={createSemester}
          style={styles.submitWrapper}
        >
          <LinearGradient
            colors={
              loading
                ? ["#94a3b8", "#64748b"]
                : ["#2563eb", "#1d4ed8"]
            }
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#fff"
              />
            ) : (
              <MaterialIcons
                name="add-circle-outline"
                size={22}
                color="#fff"
              />
            )}

            <Text style={styles.submitText}>
              {loading
                ? "Creating Semester..."
                : "Create Semester"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Status Modal */}

      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setStatusModalVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Status
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setStatusModalVisible(false)
                }
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {statusOptions.map((item) => {
              const selected =
                status === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.statusOption,
                    selected &&
                      styles.statusOptionSelected,
                  ]}
                  onPress={() => {
                    setStatus(item.value);
                    setStatusModalVisible(false);
                  }}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          item.value === "active"
                            ? "#16a34a"
                            : item.value ===
                              "completed"
                            ? "#64748b"
                            : "#f59e0b",
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.statusOptionText,
                      selected &&
                        styles.statusOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {selected && (
                    <MaterialIcons
                      name="check"
                      size={22}
                      color="#2563eb"
                      style={{
                        marginLeft: "auto",
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },

  content: {
    paddingBottom: 20,
  },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#64748b",
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    padding: 17,
    borderRadius: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    marginTop: 5,
  },

  inputWrapper: {
    height: 52,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 13,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 10,
    marginBottom: 16,
  },

  input: {
    flex: 1,
    height: "100%",
    color: "#0f172a",
    fontSize: 15,
  },

  dateSelector: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 13,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 12,
    marginBottom: 16,
  },

  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  dateText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

  placeholderText: {
    color: "#94a3b8",
    fontWeight: "500",
  },

  dateLabel: {
    marginTop: 3,
    fontSize: 11,
    color: "#64748b",
  },

  statusSelector: {
    height: 55,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 13,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },

  statusDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },

  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },

  previewCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 17,
    borderRadius: 18,
    backgroundColor: "#eff6ff",
  },

  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  previewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e40af",
  },

  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
  },

  previewLabel: {
    fontSize: 13,
    color: "#64748b",
  },

  previewValue: {
    maxWidth: "60%",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },

  submitWrapper: {
    marginHorizontal: 16,
    marginTop: 18,
  },

  submitButton: {
    minHeight: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 5,
  },

  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },

  modalHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  statusOption: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  statusOptionSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
  },

  statusOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },

  statusOptionTextSelected: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
});