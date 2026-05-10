import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, TextInput, Alert } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { addWater, getWaterToday, addMeasurement, listMeasurements } from "../api";

type Props = { token: string };

const waterPresets = [
  { label: "🥤 Bardak", ml: 200 },
  { label: "🍶 Şişe", ml: 500 },
  { label: "🫗 Büyük", ml: 750 },
  { label: "🧴 1L", ml: 1000 },
];

export default function WellnessScreen({ token }: Props) {
  const [tab, setTab] = useState<"water" | "body">("water");
  const [water, setWater] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setRefreshing(true);
    try {
      const [w, m] = await Promise.all([getWaterToday(token), listMeasurements(token)]);
      setWater(w); setMeasurements(m);
    } catch {} finally { setRefreshing(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleAddWater(ml: number) {
    try { await addWater(token, ml); load(); } catch (e) { Alert.alert("Hata", String(e)); }
  }

  async function handleAddMeasurement() {
    if (!weight && !height) { Alert.alert("Hata", "Kilo veya boy giriniz"); return; }
    try {
      await addMeasurement(token, { weightKg: weight ? Number(weight) : undefined, heightCm: height ? Number(height) : undefined, note: note || undefined });
      setWeight(""); setHeight(""); setNote("");
      load();
      Alert.alert("✅", "Ölçüm kaydedildi!");
    } catch (e) { Alert.alert("Hata", String(e)); }
  }

  const pct = water ? Math.min(water.totalMl / water.goalMl, 1) : 0;
  const latestWeight = measurements.find((m: any) => m.weightKg);

  return (
    <View style={s.container}>
      <Text style={s.title}>Sağlık</Text>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === "water" && s.tabActive]} onPress={() => setTab("water")}>
          <Text style={[s.tabText, tab === "water" && s.tabTextActive]}>💧 Su Takibi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "body" && s.tabActive]} onPress={() => setTab("body")}>
          <Text style={[s.tabText, tab === "body" && s.tabTextActive]}>⚖️ Vücut</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />}>
        {tab === "water" && (
          <>
            {/* Big water circle */}
            <View style={s.waterCircleContainer}>
              <View style={s.waterCircle}>
                <Text style={s.waterIcon}>💧</Text>
                <Text style={s.waterAmount}>{water?.totalMl || 0}</Text>
                <Text style={s.waterGoal}>/ {water?.goalMl || 2500} ml</Text>
                <Text style={s.waterPct}>{Math.round(pct * 100)}%</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={s.waterProgress}>
              <View style={[s.waterFill, { width: `${pct * 100}%` }]} />
            </View>

            {/* Quick add buttons */}
            <Text style={s.sectionTitle}>Hızlı Ekle</Text>
            <View style={s.presetRow}>
              {waterPresets.map(p => (
                <TouchableOpacity key={p.ml} style={s.presetBtn} onPress={() => handleAddWater(p.ml)}>
                  <Text style={s.presetLabel}>{p.label}</Text>
                  <Text style={s.presetMl}>{p.ml}ml</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Log list */}
            {water?.logs?.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Bugünkü Kayıtlar</Text>
                {water.logs.map((l: any) => (
                  <View key={l.id} style={s.logItem}>
                    <Text style={s.logAmount}>💧 {l.amountMl} ml</Text>
                    <Text style={s.logTime}>{new Date(l.loggedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {tab === "body" && (
          <>
            {/* Current stats */}
            {latestWeight && (
              <View style={s.bodyStatsRow}>
                <View style={s.bodyStatCard}>
                  <Text style={s.bodyStatIcon}>⚖️</Text>
                  <Text style={s.bodyStatValue}>{latestWeight.weightKg}</Text>
                  <Text style={s.bodyStatLabel}>kg</Text>
                </View>
                {latestWeight.bmi && (
                  <View style={s.bodyStatCard}>
                    <Text style={s.bodyStatIcon}>📊</Text>
                    <Text style={s.bodyStatValue}>{latestWeight.bmi}</Text>
                    <Text style={s.bodyStatLabel}>BMI</Text>
                  </View>
                )}
                {latestWeight.heightCm && (
                  <View style={s.bodyStatCard}>
                    <Text style={s.bodyStatIcon}>📏</Text>
                    <Text style={s.bodyStatValue}>{latestWeight.heightCm}</Text>
                    <Text style={s.bodyStatLabel}>cm</Text>
                  </View>
                )}
              </View>
            )}

            {/* Add measurement */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Yeni Ölçüm</Text>
              <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Kilo (kg)" placeholderTextColor={Colors.textMuted} value={weight} onChangeText={setWeight} keyboardType="numeric" />
                <TextInput style={[s.input, { flex: 1 }]} placeholder="Boy (cm)" placeholderTextColor={Colors.textMuted} value={height} onChangeText={setHeight} keyboardType="numeric" />
              </View>
              <TextInput style={s.input} placeholder="Not (opsiyonel)" placeholderTextColor={Colors.textMuted} value={note} onChangeText={setNote} />
              <TouchableOpacity style={s.addBtn} onPress={handleAddMeasurement}>
                <Text style={s.addBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>

            {/* History */}
            <Text style={s.sectionTitle}>Geçmiş Ölçümler</Text>
            {measurements.map((m: any) => (
              <View key={m.id} style={s.measureItem}>
                <View>
                  {m.weightKg && <Text style={s.measureWeight}>{m.weightKg} kg {m.bmi ? `(BMI: ${m.bmi})` : ""}</Text>}
                  {m.note && <Text style={s.measureNote}>{m.note}</Text>}
                </View>
                <Text style={s.measureDate}>{new Date(m.measuredAt).toLocaleDateString("tr-TR")}</Text>
              </View>
            ))}
            {measurements.length === 0 && <Text style={s.empty}>Henüz ölçüm yok</Text>}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg, paddingBottom: 0 },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, marginBottom: Spacing.sm },
  tabRow: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.lg },
  tab: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, alignItems: "center" },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: "600", fontSize: FontSize.sm },
  tabTextActive: { color: Colors.white },
  waterCircleContainer: { alignItems: "center", marginBottom: Spacing.lg },
  waterCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.surface, borderWidth: 6, borderColor: "#60A5FA", justifyContent: "center", alignItems: "center" },
  waterIcon: { fontSize: 28 },
  waterAmount: { fontSize: FontSize.hero, fontWeight: "800", color: Colors.text },
  waterGoal: { fontSize: FontSize.sm, color: Colors.textSecondary },
  waterPct: { fontSize: FontSize.xs, color: "#60A5FA", fontWeight: "700" },
  waterProgress: { height: 10, backgroundColor: Colors.surfaceLight, borderRadius: 5, overflow: "hidden", marginBottom: Spacing.lg },
  waterFill: { height: "100%", backgroundColor: "#60A5FA", borderRadius: 5 },
  sectionTitle: { color: Colors.textSecondary, fontWeight: "600", fontSize: FontSize.md, marginBottom: Spacing.sm, marginTop: Spacing.md },
  presetRow: { flexDirection: "row", gap: Spacing.sm },
  presetBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: "center" },
  presetLabel: { fontSize: 20 },
  presetMl: { color: Colors.text, fontWeight: "600", fontSize: FontSize.sm, marginTop: 4 },
  logItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.xs },
  logAmount: { color: Colors.text, fontWeight: "600" },
  logTime: { color: Colors.textMuted, fontSize: FontSize.sm },
  bodyStatsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  bodyStatCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.lg, alignItems: "center" },
  bodyStatIcon: { fontSize: 24 },
  bodyStatValue: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.text, marginTop: 4 },
  bodyStatLabel: { color: Colors.textSecondary, fontSize: FontSize.xs },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm },
  cardTitle: { color: Colors.text, fontWeight: "700", fontSize: FontSize.lg },
  inputRow: { flexDirection: "row", gap: Spacing.sm },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text },
  addBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
  addBtnText: { color: Colors.white, fontWeight: "700" },
  measureItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.xs, alignItems: "center" },
  measureWeight: { color: Colors.text, fontWeight: "600" },
  measureNote: { color: Colors.textMuted, fontSize: FontSize.xs },
  measureDate: { color: Colors.textSecondary, fontSize: FontSize.xs },
  empty: { color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.xxl },
});
