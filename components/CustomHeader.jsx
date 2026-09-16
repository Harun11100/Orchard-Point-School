
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function CustomHeader({ title = "" }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.rightSpace} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === "ios" ? 55 : 50,
    backgroundColor: "#09a86b",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 12,

    // iOS safe-area adjustment
    paddingTop: Platform.OS === "ios" ? 5 : 0,
  },

  backButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    flex: 1,

    textAlign: "center",

    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },

  rightSpace: {
    width: 40,
  },
});

