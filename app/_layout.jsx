
import React from "react";
import { Stack } from "expo-router";
import CustomHeader from "../components/CustomHeader";


export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,

        header: ({ options }) => (
          <CustomHeader
            title={options.title || ""}
          />
        ),

        animation: "slide_from_right",
      }}
    />
  );
}

