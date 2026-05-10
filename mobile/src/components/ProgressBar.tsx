import { StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  progress: number;
  color?: string;
};

export function ProgressBar({ progress, color = colors.primary }: Props) {
  const width = `${Math.min(Math.max(progress, 0), 1) * 100}%`;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});