import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { getProfile, updateProfile } from "../api";
import type { Profile } from "../types";

type Props = { token: string; onLogout: () => void };

export default function ProfileScreen({ token, onLogout }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [goalCal, setGoalCal] = useState("");
  const [goalW, setGoalW] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const p = await getProfile(token);
      setProfile(p); setName(p.name); setGoalCal(String(p.goalCalories)); setGoalW(String(p.goalWorkoutsPerWeek));
    } catch {}
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    try {
      const p = await updateProfile(token, { name, goalCalories: Number(goalCal), goalWorkoutsPerWeek: Number(goalW) });
      setProfile(p);
      Alert.alert("Success", "Profile updated!");
    } catch (err) { Alert.alert("Error", String(err)); } finally { setSaving(false); }
  }

  return (
    <ScrollView style={s.container}>
      <Text style={s.title}>Profile</Text>
      <View style={s.card}>
        <Text style={s.label}>Display Name</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor={Colors.textMuted} />
        <Text style={s.label}>Daily Calorie Goal</Text>
        <TextInput style={s.input} value={goalCal} onChangeText={setGoalCal} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
        <Text style={s.label}>Workouts per Week Goal</Text>
        <TextInput style={s.input} value={goalW} onChangeText={setGoalW} keyboardType="numeric" placeholderTextColor={Colors.textMuted} />
        <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <Text style={s.btnText}>{saving ? "Saving..." : "Save Profile"}</Text>
        </TouchableOpacity>
        {profile && <Text style={s.updated}>Last updated: {new Date(profile.updatedAt).toLocaleString()}</Text>}
      </View>
      <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.md },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600" },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md },
  btn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center", marginTop: Spacing.sm },
  btnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.md },
  updated: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: "center" },
  logoutBtn: { backgroundColor: Colors.danger, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center", marginTop: Spacing.xl },
  logoutText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.md },
});
