import { useAppData } from "../hooks/useAppData";
import { MealsScreen } from "./MealsScreen";
import { AuthScreen } from "./AuthScreen";
import { WorkoutsScreen } from "./WorkoutsScreen";
import { createWorkout } from "../api";
import { ProfileScreen } from "./ProfileScreen";
import { SocialScreen } from "./SocialScreen";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
} from "react-native";

import { colors } from "../theme/colors";

import {
  BottomTabBar,
  Tab,
} from "../components/BottomTabBar";

import { HomeScreen } from "./HomeScreen";


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
  return (
    <HomeScreen
      summary={data.dashboard.summary}
    />
  );
      case "meals":
  return (
    <MealsScreen
      meals={data.meals.meals}
      token={data.auth.token}
      refreshMeals={data.meals.refreshMeals}
    />
  );

      case "workouts":
  return (
    <WorkoutsScreen
      workouts={data.workouts.workouts}
      token={data.auth.token}
      refreshWorkouts={
        data.workouts.refreshWorkouts
      }
      createWorkout={createWorkout}
    />
  );
      case "social":
        return <SocialScreen />;

      case "profile":
  return (
    <ProfileScreen
      profile={data.dashboard.profile}
      runLogout={data.auth.runLogout}

      profileName={data.profileSettings.profileName}
      setProfileName={data.profileSettings.setProfileName}
      saveProfile={data.profileSettings.saveProfile}

      goalCalories={data.profileSettings.goalCalories}
      setGoalCalories={data.profileSettings.setGoalCalories}
      goalWorkouts={data.profileSettings.goalWorkouts}
      setGoalWorkouts={data.profileSettings.setGoalWorkouts}
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