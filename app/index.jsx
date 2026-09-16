import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Redirect } from 'expo-router';


export default function App() {


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Redirect href="/ChooseRoleScreen" />
      
    </GestureHandlerRootView>
  );
}