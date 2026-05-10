import { useAppData } from "../hooks/useAppData";
import { AuthScreen } from "./AuthScreen";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
} from "react-native";

import { colors } from "../theme/colors";

import {
  BottomTabBar,
  Tab,
} from "../components/BottomTabBar";

import { HomeScreen } from "./HomeScreen";

function MealsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>
        Meals Screen
      </Text>
    </View>
  );
}

function WorkoutsScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>
        Workouts Screen
      </Text>
    </View>
  );
}

function SocialScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>
        Social Screen
      </Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>
        Profile Screen
      </Text>
    </View>
  );
}

export function MainApp() {
  const data = useAppData();

  const [activeTab, setActiveTab] =
    useState<Tab>("home");

  if (!data.auth.token) {
  return (
    <AuthScreen
      email={data.auth.email}
      setEmail={data.auth.setEmail}
      password={data.auth.password}
      setPassword={data.auth.setPassword}
      name={data.auth.name}
      setName={data.auth.setName}
      runLogin={data.auth.runLogin}
      runSignup={data.auth.runSignup}
    />
  );
}

  
  function renderScreen() {
    switch (activeTab) {
      case "home":
        return <HomeScreen />;

      case "meals":
        return <MealsScreen />;

      case "workouts":
        return <WorkoutsScreen />;

      case "social":
        return <SocialScreen />;

      case "profile":
        return <ProfileScreen />;

      default:
        return (
  <HomeScreen
    summary={data.dashboard.summary}
  />
);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderScreen()}

      <BottomTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
});