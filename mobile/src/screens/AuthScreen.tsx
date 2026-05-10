import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { checkBackend as pingBackend, signup, login } from "../api";

type Props = { onAuth: (token: string) => void };

export default function AuthScreen({ onAuth }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleSubmit() {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const data = isLogin
        ? await login(email, password)
        : await signup(email, password, name);
      onAuth(data.token);
    } catch (err) {
      Alert.alert("Error", String(err));
    } finally {
      setLoading(false);
    }
  }

  async function checkHealth() {
    try {
      setStatus("Checking...");
      const h = await pingBackend();
      setStatus(`✅ ${h.service}`);
    } catch (err) {
      setStatus(`❌ ${String(err)}`);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <Text style={s.logo}>🏋️</Text>
          <Text style={s.title}>HealthyLife</Text>
          <Text style={s.subtitle}>Your fitness journey starts here</Text>
        </View>

        <View style={s.card}>
          <View style={s.tabRow}>
            <TouchableOpacity style={[s.tab, isLogin && s.tabActive]} onPress={() => setIsLogin(true)}>
              <Text style={[s.tabText, isLogin && s.tabTextActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.tab, !isLogin && s.tabActive]} onPress={() => setIsLogin(false)}>
              <Text style={[s.tabText, !isLogin && s.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={Colors.textMuted}
              value={name} onChangeText={setName} />
          )}
          <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.textMuted}
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={s.input} placeholder="Password" placeholderTextColor={Colors.textMuted}
            value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
            <Text style={s.btnText}>{loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.healthBtn} onPress={checkHealth}>
          <Text style={s.healthBtnText}>Check Backend Connection</Text>
        </TouchableOpacity>
        {status ? <Text style={s.status}>{status}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: "center", padding: Spacing.xl },
  header: { alignItems: "center", marginBottom: Spacing.xxxl },
  logo: { fontSize: 56, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.hero, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl, gap: Spacing.md },
  tabRow: { flexDirection: "row", backgroundColor: Colors.background, borderRadius: BorderRadius.sm, padding: 3 },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: "center", borderRadius: BorderRadius.sm - 2 },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: "600", fontSize: FontSize.md },
  tabTextActive: { color: Colors.white },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md },
  btn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.lg },
  healthBtn: { marginTop: Spacing.xl, alignItems: "center" },
  healthBtnText: { color: Colors.primaryLight, fontSize: FontSize.sm },
  status: { color: Colors.textSecondary, textAlign: "center", marginTop: Spacing.sm, fontSize: FontSize.xs },
});
