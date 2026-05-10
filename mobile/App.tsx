import React, { useState } from "react";
import { StatusBar } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Colors } from "./src/theme";
import { logout as apiLogout } from "./src/api";

import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import MealsScreen from "./src/screens/MealsScreen";
import WorkoutsScreen from "./src/screens/WorkoutsScreen";
import WellnessScreen from "./src/screens/WellnessScreen";
import CoachScreen from "./src/screens/CoachScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Tab = createBottomTabNavigator();

const AppTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.accent,
  },
};

export default function App() {
  const [token, setToken] = useState("");

  function handleLogout() {
    if (token) apiLogout(token).catch(() => {});
    setToken("");
  }

  if (!token) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <AuthScreen onAuth={setToken} />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <NavigationContainer theme={AppTheme}>
        <Tab.Navigator
          id="MainTabs"
          screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border, paddingBottom: 4, height: 60 },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textMuted,
          }}
        >
          <Tab.Screen name="Ana Sayfa" options={{ tabBarIcon: () => null, tabBarLabel: "📊 Ana Sayfa" }}>
            {() => <DashboardScreen token={token} />}
          </Tab.Screen>
          <Tab.Screen name="Yemek" options={{ tabBarIcon: () => null, tabBarLabel: "🍽️ Yemek" }}>
            {() => <MealsScreen token={token} />}
          </Tab.Screen>
          <Tab.Screen name="Antrenman" options={{ tabBarIcon: () => null, tabBarLabel: "🏋️ Spor" }}>
            {() => <WorkoutsScreen token={token} />}
          </Tab.Screen>
          <Tab.Screen name="Sağlık" options={{ tabBarIcon: () => null, tabBarLabel: "💧 Sağlık" }}>
            {() => <WellnessScreen token={token} />}
          </Tab.Screen>
          <Tab.Screen name="Koç" options={{ tabBarIcon: () => null, tabBarLabel: "🧠 Koç" }}>
            {() => <CoachScreen token={token} />}
          </Tab.Screen>
          <Tab.Screen name="Profil" options={{ tabBarIcon: () => null, tabBarLabel: "👤 Profil" }}>
            {() => <ProfileScreen token={token} onLogout={handleLogout} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
