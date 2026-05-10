import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
};

export function AppCard({ children }: Props) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 4,

    marginBottom: 16,
  },
});