import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from '../navigation/AppNavigator';
import { registerForPushNotificationsAsync } from '../service/notification';


export default function App() {
  
  useEffect(() => {
    async function setupPush() {
      const token = await registerForPushNotificationsAsync();

    }

    setupPush();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
