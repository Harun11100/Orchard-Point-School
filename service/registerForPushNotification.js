import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";



Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBadge: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (!Device.isDevice) {
    Alert.alert("সতর্কতা", "পুশ নোটিফিকেশনের জন্য ফিজিক্যাল ডিভাইস ব্যবহার করুন");
    return null;
  }

  // 1️⃣ Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("অনুমতি নেই", "পুশ নোটিফিকেশনের জন্য অনুমতি দেওয়া হয়নি!");
    return null;
  }

  try {
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: "34970aa4-17d1-4d20-a56a-87bcf61724eb",
      })
    ).data;

    console.log("📱 Expo Push Token:", token);
  } catch (err) {
    console.error("Failed to get Expo push token:", err);
   
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
