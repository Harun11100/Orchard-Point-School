import React from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RollFilter({
  value,
  onChange,
  placeholder = "রোল নম্বর ",
  style,
}) {
  return (
    <View style={[styles.container, style]}>
      {/* Search Icon */}
      <Ionicons name="search" size={16} color="#9CA3AF" />

      {/* Input */}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        style={styles.input}
      />

      {/* Clear Button */}
      {value ? (
        <TouchableOpacity
          onPress={() => onChange("")}
          style={styles.clearBtn}
          accessibilityLabel="Clear roll filter"
        >
          <Ionicons name="close" size={14} color="#6B7280" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    width: 70,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    borderRadius: 999,
  },
});
