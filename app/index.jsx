import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from '../navigation/AppNavigator';
import { registerForPushNotificationsAsync } from '../service/notification';


export default function App() {
  
  useEffect(() => {
    async function setupPush() {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        console.log("Push token received:", token);
        // You can send this token to your backend here
      }
    }

    setupPush();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
