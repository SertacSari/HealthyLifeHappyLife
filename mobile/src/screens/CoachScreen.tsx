import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { getDailyRecommendations, getReminderSettings, updateReminderSettings } from "../api";
import type { DailyRecommendations, ReminderSettings } from "../types";

type Props = { token: string };

const areaColors: Record<string, string> = {
  nutrition: "#10B981", workout: "#818CF8", recovery: "#F59E0B", consistency: "#60A5FA",
};
const areaIcons: Record<string, string> = {
  nutrition: "🥗", workout: "💪", recovery: "😴", consistency: "🎯",
};

export default function CoachScreen({ token }: Props) {
  const [recs, setRecs] = useState<DailyRecommendations | null>(null);
  const [reminder, setReminder] = useState<ReminderSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("20:00");
  const [freq, setFreq] = useState("daily");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const [r, s] = await Promise.all([getDailyRecommendations(token), getReminderSettings(token)]);
      setRecs(r); setReminder(s); setEnabled(s.enabled); setTime(s.reminderTime); setFreq(s.frequency);
    } catch {} finally { setRefreshing(false); }
  }
  useEffect(() => { load(); }, []);

  async function saveReminder() {
    try {
      const s = await updateReminderSettings(token, { enabled, reminderTime: time, frequency: freq as any });
      setReminder(s);
    } catch {}
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />}>
      <Text style={s.title}>Coach</Text>
      {recs && <Text style={s.disclaimer}>{recs.disclaimer}</Text>}

      {recs?.tips.map((tip, i) => (
        <View key={i} style={[s.tipCard, { borderLeftColor: areaColors[tip.area] || Colors.primary }]}>
          <Text style={s.tipIcon}>{areaIcons[tip.area] || "💡"}</Text>
          <View style={s.tipContent}>
            <Text style={[s.tipArea, { color: areaColors[tip.area] || Colors.primary }]}>{tip.area.toUpperCase()}</Text>
            <Text style={s.tipTitle}>{tip.title}</Text>
            <Text style={s.tipMsg}>{tip.message}</Text>
          </View>
        </View>
      ))}

      <View style={s.card}>
        <Text style={s.cardTitle}>⏰ Reminder Settings</Text>
        <TouchableOpacity style={[s.toggle, enabled && s.toggleActive]} onPress={() => setEnabled(!enabled)}>
          <Text style={s.toggleText}>{enabled ? "Enabled ✅" : "Disabled"}</Text>
        </TouchableOpacity>
        <TextInput style={s.input} value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor={Colors.textMuted} />
        <View style={s.freqRow}>
          {["daily", "weekdays", "custom"].map(f => (
            <TouchableOpacity key={f} style={[s.freqBtn, freq === f && s.freqActive]} onPress={() => setFreq(f)}>
              <Text style={[s.freqText, freq === f && s.freqTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.saveBtn} onPress={saveReminder}>
          <Text style={s.saveBtnText}>Save Reminders</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, marginBottom: Spacing.sm },
  disclaimer: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.lg, fontStyle: "italic" },
  tipCard: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderLeftWidth: 4, gap: Spacing.sm },
  tipIcon: { fontSize: 28 },
  tipContent: { flex: 1 },
  tipArea: { fontSize: FontSize.xs, fontWeight: "700", marginBottom: 2 },
  tipTitle: { color: Colors.text, fontWeight: "600", fontSize: FontSize.md },
  tipMsg: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md, marginTop: Spacing.xl },
  cardTitle: { color: Colors.text, fontWeight: "700", fontSize: FontSize.lg },
  toggle: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, alignItems: "center" },
  toggleActive: { backgroundColor: Colors.accent },
  toggleText: { color: Colors.text, fontWeight: "600" },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text },
  freqRow: { flexDirection: "row", gap: Spacing.sm },
  freqBtn: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, alignItems: "center" },
  freqActive: { backgroundColor: Colors.primary },
  freqText: { color: Colors.textMuted, fontWeight: "600", fontSize: FontSize.sm },
  freqTextActive: { color: Colors.white },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
  saveBtnText: { color: Colors.white, fontWeight: "700" },
});
