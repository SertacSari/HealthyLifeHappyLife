import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { completeOnboarding } from "../api";

type Props = { 
  token: string;
  onComplete: () => void;
};

export default function OnboardingScreen({ token, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [gender, setGender] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [goal, setGoal] = useState("");

  async function handleFinish() {
    if (!gender || !birthYear || !heightCm || !weightKg || !activityLevel || !goal) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding(token, {
        gender,
        birthYear: Number(birthYear),
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        activityLevel,
        goal,
      });
      onComplete();
    } catch (e) {
      Alert.alert("Hata", String(e));
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Hedeflerini Belirleyelim 🚀</Text>
        <Text style={s.subtitle}>Sana özel kalori ve su hedefini hesaplayacağız.</Text>

        {step === 1 && (
          <View style={s.card}>
            <Text style={s.label}>Cinsiyetin</Text>
            <View style={s.row}>
              <TouchableOpacity style={[s.btn, gender === "male" && s.btnActive]} onPress={() => setGender("male")}>
                <Text style={[s.btnText, gender === "male" && s.btnTextActive]}>Erkek</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, gender === "female" && s.btnActive]} onPress={() => setGender("female")}>
                <Text style={[s.btnText, gender === "female" && s.btnTextActive]}>Kadın</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Doğum Yılı</Text>
            <TextInput style={s.input} keyboardType="numeric" placeholder="Örn: 1995" placeholderTextColor={Colors.textMuted} value={birthYear} onChangeText={setBirthYear} />

            <Text style={s.label}>Boy (cm)</Text>
            <TextInput style={s.input} keyboardType="numeric" placeholder="Örn: 175" placeholderTextColor={Colors.textMuted} value={heightCm} onChangeText={setHeightCm} />

            <Text style={s.label}>Kilo (kg)</Text>
            <TextInput style={s.input} keyboardType="numeric" placeholder="Örn: 70" placeholderTextColor={Colors.textMuted} value={weightKg} onChangeText={setWeightKg} />

            <TouchableOpacity style={s.primaryBtn} onPress={() => setStep(2)}>
              <Text style={s.primaryBtnText}>İleri</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={s.card}>
            <Text style={s.label}>Günlük Hareket Seviyen</Text>
            <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
              <TouchableOpacity style={[s.btn, activityLevel === "sedentary" && s.btnActive]} onPress={() => setActivityLevel("sedentary")}>
                <Text style={[s.btnText, activityLevel === "sedentary" && s.btnTextActive]}>Az Hareketli (Masa başı)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, activityLevel === "light" && s.btnActive]} onPress={() => setActivityLevel("light")}>
                <Text style={[s.btnText, activityLevel === "light" && s.btnTextActive]}>Hafif Hareketli (1-3 gün spor)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, activityLevel === "moderate" && s.btnActive]} onPress={() => setActivityLevel("moderate")}>
                <Text style={[s.btnText, activityLevel === "moderate" && s.btnTextActive]}>Orta Hareketli (3-5 gün spor)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, activityLevel === "active" && s.btnActive]} onPress={() => setActivityLevel("active")}>
                <Text style={[s.btnText, activityLevel === "active" && s.btnTextActive]}>Çok Hareketli (Her gün spor)</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.label}>Amacın Nedir?</Text>
            <View style={{ gap: Spacing.sm, marginBottom: Spacing.lg }}>
              <TouchableOpacity style={[s.btn, goal === "lose" && s.btnActive]} onPress={() => setGoal("lose")}>
                <Text style={[s.btnText, goal === "lose" && s.btnTextActive]}>Kilo Ver (Yağ Yak)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, goal === "maintain" && s.btnActive]} onPress={() => setGoal("maintain")}>
                <Text style={[s.btnText, goal === "maintain" && s.btnTextActive]}>Kilomu Koru (Fit Kal)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, goal === "gain" && s.btnActive]} onPress={() => setGoal("gain")}>
                <Text style={[s.btnText, goal === "gain" && s.btnTextActive]}>Kilo Al (Kas Yap)</Text>
              </TouchableOpacity>
            </View>

            <View style={s.row}>
              <TouchableOpacity style={[s.primaryBtn, { backgroundColor: Colors.surfaceLight, flex: 1 }]} onPress={() => setStep(1)}>
                <Text style={{ color: Colors.text, fontWeight: "700" }}>Geri</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.primaryBtn, { flex: 2, marginLeft: Spacing.sm }]} onPress={handleFinish} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={s.primaryBtnText}>Hesapla ve Başla</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, flexGrow: 1, justifyContent: "center" },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, textAlign: "center" },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: "center", marginBottom: Spacing.xl, marginTop: Spacing.sm },
  card: { backgroundColor: Colors.surface, padding: Spacing.xl, borderRadius: BorderRadius.lg },
  label: { color: Colors.textSecondary, fontWeight: "600", fontSize: FontSize.sm, marginBottom: Spacing.xs, marginTop: Spacing.md },
  row: { flexDirection: "row", gap: Spacing.sm },
  btn: { flex: 1, backgroundColor: Colors.inputBg, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: "center", borderWidth: 1, borderColor: Colors.inputBorder },
  btnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  btnText: { color: Colors.text, fontWeight: "600" },
  btnTextActive: { color: Colors.white },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md },
  primaryBtn: { backgroundColor: Colors.accent, padding: Spacing.md, borderRadius: BorderRadius.sm, alignItems: "center", marginTop: Spacing.xl },
  primaryBtnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.md },
});
