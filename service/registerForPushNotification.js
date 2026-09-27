// service/registerForPushNotification.js

import * as Device from "expo-device";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  // --------------------------------------------------
  // 1. Expo Go check
  // --------------------------------------------------

  if (Constants.executionEnvironment === "storeClient") {
 

    return null;
  }

  // --------------------------------------------------
  // 2. Physical device check
  // --------------------------------------------------

  if (!Device.isDevice) {
    Alert.alert(
      "সতর্কতা",
      "পুশ নোটিফিকেশনের জন্য ফিজিক্যাল ডিভাইস ব্যবহার করুন"
    );

    return null;
  }

  // --------------------------------------------------
  // 3. Load expo-notifications only when needed
  // --------------------------------------------------

  const Notifications = await import("expo-notifications");

  // --------------------------------------------------
  // 4. Notification handler
  // --------------------------------------------------

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBadge: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  try {
    // ------------------------------------------------
    // 5. Check permission
    // ------------------------------------------------

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // ------------------------------------------------
    // 6. Request permission
    // ------------------------------------------------

    if (existingStatus !== "granted") {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "অনুমতি নেই",
        "পুশ নোটিফিকেশনের জন্য অনুমতি দেওয়া হয়নি!"
      );

      return null;
    }

    // ------------------------------------------------
    // 7. Android notification channel
    // ------------------------------------------------

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "default",
        {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        }
      );
    }

    // ------------------------------------------------
    // 8. Get Expo Push Token
    // ------------------------------------------------

    const tokenResponse =
      await Notifications.getExpoPushTokenAsync({
        projectId:
          "5e809309-171e-4f6b-a09d-d423118f2876",
      });

    const token = tokenResponse.data;

    return token;

  } catch (error) {
    console.error(
      "Failed to register for push notifications:",
      error
    );

    return null;
  }
}