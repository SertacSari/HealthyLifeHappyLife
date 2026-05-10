import { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import { colors } from "../theme/colors";

type Props = {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
};

export function AppButton({
  title,
  onPress,
  icon,
}: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      {icon}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",
    gap: 8,
  },

  text: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});