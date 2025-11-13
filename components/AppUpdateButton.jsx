import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from "react-native";

export default function AppUpdateButton({updateUrl}) {
  
  const handleUpdate = async () => {
    try {
      if (updateUrl) await Linking.openURL(updateUrl);
    } catch (err) {
      console.error("আপডেট লিংক খোলার সময় সমস্যা হয়েছে:", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <Text style={styles.title}>
          🚀 নতুন ভার্সন পাওয়া গেছে! অনুগ্রহ করে আপনার অ্যাপটি আপডেট করুন।
        </Text>
        <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
          <Text style={styles.btnText}>এখনই আপডেট করুন</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "#5433d7ff",
    paddingVertical: 12,
    borderRadius: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  btn: {
    backgroundColor: "#facc15",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  btnText: {
    color: "#1e3a8a",
    fontWeight: "bold",
    fontSize: 14,
  },
});
