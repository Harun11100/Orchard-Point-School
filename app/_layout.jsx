// app/_layout.jsx
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

function CustomHeader() {
  return (
    <LinearGradient
      colors={["#69a3efff", "#6893e3ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerContainer}
    >
    </LinearGradient>
  );
}

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: () => <CustomHeader />, 
        animation: "slide_from_right",
      }}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 39,
    justifyContent: "center",
    alignItems: "center",
  }
});
