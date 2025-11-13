
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TeacherLoginScreen from "../app/TeacherLoginScreen";
import AccountsScreen from "../app/AccountsScreen";
import ChooseRoleScreen from "../app/ChooseRoleScreen";


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RoleScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="TeacherLogin" component={TeacherLoginScreen} />
      <Stack.Screen name="Account" component={AccountsScreen} />
      <Stack.Screen name="RoleScreen" component={ChooseRoleScreen} />
    </Stack.Navigator>
  );
}
