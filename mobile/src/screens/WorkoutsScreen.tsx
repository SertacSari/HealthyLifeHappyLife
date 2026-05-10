import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, Modal } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { createWorkout, listWorkouts, getWorkoutTemplates, logWorkoutFromTemplate } from "../api";
import type { Workout } from "../types";

type Props = { token: string };
type Template = { id: number; name: string; category: string; description: string; exercises: any[]; estimatedDuration: number; estimatedCalories: number };

function todayKey() { return new Date().toISOString().slice(0, 10); }

const catIcons: Record<string, string> = { Strength: "🏋️", Cardio: "🏃", Flexibility: "🧘", Core: "💪" };

export default function WorkoutsScreen({ token }: Props) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"templates" | "manual">("templates");
  const [detail, setDetail] = useState<Template | null>(null);
  // manual
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [cals, setCals] = useState("");

  async function load() {
    setRefreshing(true);
    try {
      const [w, t] = await Promise.all([listWorkouts(token, todayKey()), getWorkoutTemplates(token)]);
      setWorkouts(w); setTemplates(t);
    } catch {} finally { setRefreshing(false); }
  }
  useEffect(() => { load(); }, []);

  async function logTemplate(t: Template) {
    try {
      await logWorkoutFromTemplate(token, t.id);
      setDetail(null); load();
      Alert.alert("✅ Tamamlandı", `${t.name} loglandı!`);
    } catch (e) { Alert.alert("Hata", String(e)); }
  }

  async function addManual() {
    if (!name || !duration) { Alert.alert("Hata", "İsim ve süre gerekli"); return; }
    try {
      await createWorkout(token, { name, durationMinutes: Number(duration), caloriesBurned: Number(cals) || 0 });
      setName(""); setDuration(""); setCals(""); load();
    } catch (e) { Alert.alert("Hata", String(e)); }
  }

  const totalMin = workouts.reduce((s, w) => s + w.durationMinutes, 0);
  const totalBurned = workouts.reduce((s, w) => s + w.caloriesBurned, 0);

  return (
    <View style={s.container}>
      <Text style={s.title}>Antrenman</Text>
      <View style={s.summaryRow}>
        <View style={s.summaryItem}><Text style={s.summaryIcon}>⏱️</Text><Text style={s.summaryValue}>{totalMin}</Text><Text style={s.summaryLabel}>dakika</Text></View>
        <View style={s.summaryItem}><Text style={s.summaryIcon}>🔥</Text><Text style={[s.summaryValue, { color: Colors.danger }]}>{totalBurned}</Text><Text style={s.summaryLabel}>kcal yakıldı</Text></View>
        <View style={s.summaryItem}><Text style={s.summaryIcon}>💪</Text><Text style={s.summaryValue}>{workouts.length}</Text><Text style={s.summaryLabel}>antrenman</Text></View>
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === "templates" && s.tabActive]} onPress={() => setTab("templates")}>
          <Text style={[s.tabText, tab === "templates" && s.tabTextActive]}>📋 Şablonlar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "manual" && s.tabActive]} onPress={() => setTab("manual")}>
          <Text style={[s.tabText, tab === "manual" && s.tabTextActive]}>✏️ Manuel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />}>
        {tab === "templates" && templates.map(t => (
          <TouchableOpacity key={t.id} style={s.templateCard} onPress={() => setDetail(t)}>
            <Text style={s.templateIcon}>{catIcons[t.category] || "🏋️"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.templateName}>{t.name}</Text>
              <Text style={s.templateMeta}>{t.estimatedDuration} dk • ~{t.estimatedCalories} kcal • {t.category}</Text>
            </View>
            <Text style={s.templateArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {tab === "manual" && (
          <View style={s.card}>
            <TextInput style={s.input} placeholder="Antrenman adı" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
            <View style={s.rowInputs}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Dakika" placeholderTextColor={Colors.textMuted} value={duration} onChangeText={setDuration} keyboardType="numeric" />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Kcal yakıldı" placeholderTextColor={Colors.textMuted} value={cals} onChangeText={setCals} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={s.btn} onPress={addManual}><Text style={s.btnText}>＋ Ekle</Text></TouchableOpacity>
          </View>
        )}

        <Text style={s.sectionTitle}>Bugünkü Antrenmanlar ({workouts.length})</Text>
        {workouts.map(w => (
          <View key={w.id} style={s.workoutItem}>
            <View style={s.workoutHeader}><Text style={s.workoutName}>{w.name}</Text><Text style={s.workoutDur}>{w.durationMinutes} dk</Text></View>
            <Text style={s.workoutSub}>{w.caloriesBurned} kcal yakıldı</Text>
          </View>
        ))}
        {workouts.length === 0 && <Text style={s.empty}>Bugün antrenman yok</Text>}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Template detail modal */}
      <Modal visible={!!detail} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalIcon}>{catIcons[detail?.category || ""] || "🏋️"}</Text>
            <Text style={s.modalTitle}>{detail?.name}</Text>
            <Text style={s.modalDesc}>{detail?.description}</Text>
            <View style={s.modalStats}>
              <Text style={s.modalStat}>⏱️ {detail?.estimatedDuration} dk</Text>
              <Text style={s.modalStat}>🔥 ~{detail?.estimatedCalories} kcal</Text>
            </View>
            <Text style={s.exercisesTitle}>Egzersizler</Text>
            {detail?.exercises.map((e: any, i: number) => (
              <View key={i} style={s.exerciseItem}>
                <Text style={s.exerciseName}>{i + 1}. {e.name}</Text>
                <Text style={s.exerciseSets}>{e.sets}x{e.reps}</Text>
              </View>
            ))}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setDetail(null)}><Text style={s.cancelText}>Kapat</Text></TouchableOpacity>
              <TouchableOpacity style={s.logBtn} onPress={() => detail && logTemplate(detail)}><Text style={s.btnText}>✅ Tamamlandı</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg, paddingBottom: 0 },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md },
  summaryItem: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: "center" },
  summaryIcon: { fontSize: 18 },
  summaryValue: { fontSize: FontSize.lg, fontWeight: "800", color: Colors.text },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  tabRow: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.md },
  tab: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, alignItems: "center" },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: "600", fontSize: FontSize.sm },
  tabTextActive: { color: Colors.white },
  templateCard: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs, alignItems: "center", gap: Spacing.sm },
  templateIcon: { fontSize: 28 },
  templateName: { color: Colors.text, fontWeight: "600", fontSize: FontSize.md },
  templateMeta: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  templateArrow: { color: Colors.textMuted, fontSize: 22 },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text },
  rowInputs: { flexDirection: "row", gap: Spacing.sm },
  btn: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
  btnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.md },
  sectionTitle: { color: Colors.textSecondary, fontWeight: "600", fontSize: FontSize.md, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  empty: { color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.xxl },
  workoutItem: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs },
  workoutHeader: { flexDirection: "row", justifyContent: "space-between" },
  workoutName: { color: Colors.text, fontWeight: "600" },
  workoutDur: { color: Colors.primaryLight, fontWeight: "700" },
  workoutSub: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: Spacing.xl },
  modalCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, maxHeight: "80%" },
  modalIcon: { fontSize: 40, textAlign: "center" },
  modalTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: "700", textAlign: "center", marginTop: Spacing.sm },
  modalDesc: { color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.xs },
  modalStats: { flexDirection: "row", justifyContent: "center", gap: Spacing.xl, marginTop: Spacing.md },
  modalStat: { color: Colors.text, fontWeight: "600" },
  exercisesTitle: { color: Colors.text, fontWeight: "700", fontSize: FontSize.md, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  exerciseItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceLight },
  exerciseName: { color: Colors.text, fontSize: FontSize.sm },
  exerciseSets: { color: Colors.textSecondary, fontSize: FontSize.sm },
  modalActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.xl },
  cancelBtn: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
  cancelText: { color: Colors.textSecondary, fontWeight: "600" },
  logBtn: { flex: 1, backgroundColor: Colors.accent, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
});
