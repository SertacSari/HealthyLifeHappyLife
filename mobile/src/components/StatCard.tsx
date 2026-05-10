import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  label: string;
  value: string;
  color?: string;
};

export function StatCard({ label, value, color = colors.primary }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginBottom: 10,
  },
  label: {
    color: colors.textLight,
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
});