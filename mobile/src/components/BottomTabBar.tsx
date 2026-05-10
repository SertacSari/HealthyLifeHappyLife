import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../theme/colors";

export type Tab =
  | "home"
  | "meals"
  | "workouts"
  | "social"
  | "profile";

type Props = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

const tabs = [
  {
    key: "home",
    label: "Home",
    icon: "home",
  },
  {
    key: "meals",
    label: "Meals",
    icon: "restaurant",
  },
  {
    key: "workouts",
    label: "Workout",
    icon: "barbell",
  },
  {
    key: "social",
    label: "Social",
    icon: "people",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "person",
  },
] as const;

export function BottomTabBar({
  activeTab,
  onChange,
}: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={
                active
                  ? colors.primary
                  : colors.textLight
              }
            />

            <Text
              style={[
                styles.label,
                active && styles.activeLabel,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,

    flexDirection: "row",

    backgroundColor: "white",

    borderRadius: 24,

    paddingVertical: 14,

    justifyContent: "space-around",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 16,

    elevation: 10,
  },

  tab: {
    alignItems: "center",
    gap: 4,
  },

  label: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: "600",
  },

  activeLabel: {
    color: colors.primary,
  },
});