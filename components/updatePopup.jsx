import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function UpdateAlert({ availableAlert, alertTitle, alertMessage }) {
  const slideAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: availableAlert ? 60 : -200,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [availableAlert]);

  const closePopup = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Animated.View style={[styles.popup, { top: slideAnim }]}>
      <View style={styles.content}>

        {/* Header */}
        <LinearGradient
          colors={["#6d7bf7ff", "#583cf5ff"]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.header}
        >
          <Text style={styles.title}>জরুরী ঘোষণা</Text>

          <TouchableOpacity onPress={closePopup} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.AlertTitle}>{alertTitle}</Text>
          <Text style={styles.AlertMsg}>{alertMessage}</Text>
        </View>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: "absolute",
    left: 20,
    right: 20,
    top: -200,
    zIndex: 1000,
  },

  content: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { height: 6 },
    elevation: 12,
    overflow: "hidden",
  },

  header: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  closeTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  body: {
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
  },

  AlertTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
  },

  AlertMsg: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    opacity: 0.9,
  },
});
