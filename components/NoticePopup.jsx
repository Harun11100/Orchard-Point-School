import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet } from "react-native";

export default function NoticePopup({ notice }) {
  const [visible, setVisible] = useState(!!notice);
  const slideAnim = new Animated.Value(-100); // start off-screen

  useEffect(() => {
    if (notice) {
      setVisible(true);
      // slide down animation
      Animated.timing(slideAnim, {
        toValue: 50, // position from top
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [notice]);

  const closePopup = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 500,
      useNativeDriver: false,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.popup, { top: slideAnim }]}>
      <View style={styles.content}>
        <Text style={styles.title}>📢 জরুরী ঘোষণা</Text>
        <Text style={styles.noticeTitle}>{notice.title}</Text>
        <Text style={styles.noticeMsg}>{notice.message}</Text>

        <TouchableOpacity onPress={closePopup} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>❌</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: "absolute",
    left: 15,
    right: 15,
    zIndex: 1000,
  },
  content: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  noticeTitle: { fontSize: 16, fontWeight: "600" },
  noticeMsg: { fontSize: 14, color: "#555", marginTop: 4 },
  closeBtn: { position: "absolute", top: 10, right: 10 },
  closeTxt: { fontSize: 16, fontWeight: "bold", color: "#EF4444" },
});
