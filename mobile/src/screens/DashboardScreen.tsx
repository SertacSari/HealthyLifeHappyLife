import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, Animated } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { getSummary, getWeeklySummary, getStreak as fetchStreak, getWaterToday } from "../api";

const screenWidth = Dimensions.get("window").width;

type Props = { token: string };

function Skeleton() {
  const anim = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, height: 120, marginBottom: Spacing.sm }} />
  );
}

function ProgressRing({ value, max, size, color, label }: { value: number; max: number; size: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const pctText = Math.round(pct * 100);
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 6, borderColor: Colors.surfaceLight, justifyContent: "center", alignItems: "center", position: "relative" }}>
        <View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: 6, borderColor: color, borderTopColor: pct >= 0.25 ? color : "transparent", borderRightColor: pct >= 0.5 ? color : "transparent", borderBottomColor: pct >= 0.75 ? color : "transparent", borderLeftColor: pct >= 1 ? color : "transparent", transform: [{ rotate: "-90deg" }] }} />
        <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: "800" }}>{pctText}%</Text>
      </View>
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function StatCard({ label, value, unit, icon, color }: { label: string; value: number | string; unit?: string; icon: string; color?: string }) {
  return (
    <View style={sc.card}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={sc.value}><Text style={{ color: color || Colors.text }}>{value}</Text>{unit ? <Text style={sc.unit}> {unit}</Text> : null}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: "center", gap: 2 },
  value: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  unit: { fontSize: FontSize.xs, color: Colors.textMuted },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary },
});

export default function DashboardScreen({ token }: Props) {
  const [summary, setSummary] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [water, setWater] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  async function load() {
    try {
      const [s, w, st, wt] = await Promise.all([
        getSummary(token), getWeeklySummary(token), fetchStreak(token), getWaterToday(token)
      ]);
      setSummary(s); setWeekly(w); setStreak(st); setWater(wt);
    } catch {} finally { 
      setRefreshing(false);
      setInitialLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const goalCal = summary?.goals?.goalCalories || 2000;

  const chartData = {
    labels: weekly.length ? weekly.map(d => d.dayName) : ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    datasets: [{ data: weekly.length ? weekly.map(d => d.caloriesIn) : [0,0,0,0,0,0,0] }]
  };

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Dashboard</Text>
          <Text style={s.subtitle}>{new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}</Text>
        </View>
        {!initialLoading && (
          <View style={s.streakBadge}>
            <Text style={s.streakIcon}>🔥</Text>
            <Text style={s.streakNum}>{streak}</Text>
            <Text style={s.streakLabel}>gün</Text>
          </View>
        )}
      </View>

      {initialLoading ? (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      ) : summary && (
        <>
          {/* Progress rings */}
          <View style={s.ringRow}>
            <ProgressRing value={summary.totalCaloriesIn} max={goalCal} size={80} color={Colors.accent} label="Kalori" />
            <ProgressRing value={water?.totalMl || 0} max={water?.goalMl || 2500} size={80} color="#60A5FA" label="Su" />
            <ProgressRing value={summary.workoutsCount} max={summary.goals?.goalWorkoutsPerWeek || 3} size={80} color={Colors.primaryLight} label="Antrenman" />
          </View>

          {/* Stat cards */}
          <View style={s.row}>
            <StatCard icon="🍽️" label="Alınan" value={summary.totalCaloriesIn} unit="kcal" color={Colors.accent} />
            <StatCard icon="🔥" label="Yakılan" value={summary.totalCaloriesOut} unit="kcal" color={Colors.danger} />
            <StatCard icon="⚖️" label="Net" value={summary.netCalories} unit="kcal" color={summary.netCalories >= 0 ? Colors.accent : Colors.danger} />
          </View>

          {/* Macros */}
          <View style={s.macroCard}>
            <Text style={s.sectionTitle}>Makrolar</Text>
            <View style={s.macroRow}>
              <View style={s.macroItem}>
                <View style={[s.macroDot, { backgroundColor: "#60A5FA" }]} />
                <Text style={s.macroValue}>{summary.macros.protein}g</Text>
                <Text style={s.macroLabel}>Protein</Text>
              </View>
              <View style={s.macroItem}>
                <View style={[s.macroDot, { backgroundColor: "#FBBF24" }]} />
                <Text style={s.macroValue}>{summary.macros.carbs}g</Text>
                <Text style={s.macroLabel}>Karb</Text>
              </View>
              <View style={s.macroItem}>
                <View style={[s.macroDot, { backgroundColor: "#F87171" }]} />
                <Text style={s.macroValue}>{summary.macros.fats}g</Text>
                <Text style={s.macroLabel}>Yağ</Text>
              </View>
            </View>
          </View>

          {/* Water quick display */}
          {water && (
            <View style={s.waterCard}>
              <Text style={{ fontSize: 22 }}>💧</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.waterText}>{water.totalMl} / {water.goalMl} ml</Text>
                <View style={s.waterTrack}>
                  <View style={[s.waterFill, { width: `${Math.min(water.totalMl / water.goalMl, 1) * 100}%` }]} />
                </View>
              </View>
            </View>
          )}

          {/* Line Chart */}
          <View style={s.weeklyCard}>
            <Text style={s.sectionTitle}>Haftalık Kalori Trendi</Text>
            <LineChart
              data={chartData}
              width={screenWidth - Spacing.lg * 2 - Spacing.md * 2} // width of card
              height={220}
              chartConfig={{
                backgroundColor: Colors.surface,
                backgroundGradientFrom: Colors.surface,
                backgroundGradientTo: Colors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // primary color
                labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: "5", strokeWidth: "2", stroke: Colors.primary }
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>
        </>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  streakBadge: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.sm, alignItems: "center", minWidth: 60 },
  streakIcon: { fontSize: 22 },
  streakNum: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.warning },
  streakLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  ringRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg },
  row: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  macroCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.text, fontWeight: "700", fontSize: FontSize.lg, marginBottom: Spacing.md },
  macroRow: { flexDirection: "row", justifyContent: "space-around" },
  macroItem: { alignItems: "center", gap: 4 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroValue: { fontSize: FontSize.xl, fontWeight: "700", color: Colors.text },
  macroLabel: { color: Colors.textSecondary, fontSize: FontSize.xs },
  waterCard: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm, alignItems: "center", gap: Spacing.md },
  waterText: { color: Colors.text, fontWeight: "600", fontSize: FontSize.md },
  waterTrack: { height: 8, backgroundColor: Colors.surfaceLight, borderRadius: 4, overflow: "hidden", marginTop: 4 },
  waterFill: { height: "100%", backgroundColor: "#60A5FA", borderRadius: 4 },
  weeklyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, marginBottom: Spacing.sm },
});
