import React, { useState, useEffect } from "react";
import { StatusBar, ActivityIndicator, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Colors } from "./src/theme";
import { logout as apiLogout, getProfile } from "./src/api";
import { registerForPushNotificationsAsync } from "./src/notifications";

import AuthScreen from "./src/screens/AuthScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import MealsScreen from "./src/screens/MealsScreen";
import WorkoutsScreen from "./src/screens/WorkoutsScreen";
import WellnessScreen from "./src/screens/WellnessScreen";
import CoachScreen from "./src/screens/CoachScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";

const Tab = createBottomTabNavigator();
const TOKEN_STORAGE_KEY = "healthylife.authToken";

function readStoredToken() {
  try {
    if (typeof globalThis.localStorage === "undefined") return "";
    return globalThis.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function storeToken(token: string) {
  try {
    if (typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {}
}

function clearStoredToken() {
  try {
    if (typeof globalThis.localStorage !== "undefined") {
      globalThis.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {}
}

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
  const [token, setToken] = useState(readStoredToken);
  const [loading, setLoading] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (token) {
      setLoading(true);
      getProfile(token).then(p => {
        setNeedsOnboarding(!p.onboardingCompleted);
        setLoading(false);
        registerForPushNotificationsAsync();
      }).catch(() => {
        clearStoredToken();
        setToken("");
        setLoading(false);
      });
    }
  }, [token]);

  function handleAuth(nextToken: string) {
    storeToken(nextToken);
    setToken(nextToken);
  }

  function handleLogout() {
    if (token) apiLogout(token).catch(() => {});
    clearStoredToken();
    setToken("");
    setNeedsOnboarding(false);
  }

  if (!token) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <AuthScreen onAuth={handleAuth} />
      </>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (needsOnboarding) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <OnboardingScreen token={token} onComplete={() => setNeedsOnboarding(false)} />
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
