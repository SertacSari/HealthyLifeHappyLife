import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert, FlatList, Modal } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { createMeal, listMeals, searchFoods, getFoodCategories, addMealFromCatalog, toggleFavorite, listFavorites } from "../api";
import type { Meal } from "../types";

type Props = { token: string };
type FoodItem = { id: number; name: string; category: string; calories: number; protein: number; carbs: number; fats: number; servingSize: string };

function todayKey() { return new Date().toISOString().slice(0, 10); }

export default function MealsScreen({ token }: Props) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"catalog" | "manual" | "favorites">("catalog");
  // Catalog
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selCategory, setSelCategory] = useState("");
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  // Manual
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  // Serving modal
  const [servingFood, setServingFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState("1");

  async function loadMeals() {
    try { setRefreshing(true); setMeals(await listMeals(token, todayKey())); } catch {} finally { setRefreshing(false); }
  }

  async function loadCatalog() {
    try {
      const [f, c, fv] = await Promise.all([searchFoods(token, query, selCategory), getFoodCategories(token), listFavorites(token)]);
      setFoods(f); setCategories(c); setFavIds(new Set(fv.map((x: FoodItem) => x.id)));
    } catch {}
  }

  useEffect(() => { loadMeals(); loadCatalog(); }, []);
  useEffect(() => { const t = setTimeout(() => loadCatalog(), 300); return () => clearTimeout(t); }, [query, selCategory]);

  async function addManual() {
    if (!name || !calories) { Alert.alert("Hata", "İsim ve kalori gerekli"); return; }
    try {
      await createMeal(token, { name, calories: Number(calories), protein: Number(protein) || 0, carbs: Number(carbs) || 0, fats: Number(fats) || 0 });
      setName(""); setCalories(""); setProtein(""); setCarbs(""); setFats("");
      loadMeals();
    } catch (e) { Alert.alert("Hata", String(e)); }
  }

  async function addFromCatalog() {
    if (!servingFood) return;
    try {
      await addMealFromCatalog(token, servingFood.id, Number(servings) || 1);
      setServingFood(null); setServings("1");
      loadMeals();
    } catch (e) { Alert.alert("Hata", String(e)); }
  }

  async function handleFav(foodId: number) {
    try {
      const res = await toggleFavorite(token, foodId);
      const next = new Set(favIds);
      if (res.favorited) next.add(foodId); else next.delete(foodId);
      setFavIds(next);
    } catch {}
  }

  const totalCal = meals.reduce((s, m) => s + m.calories, 0);

  return (
    <View style={s.container}>
      <Text style={s.title}>Yemekler</Text>

      {/* Today summary */}
      <View style={s.summaryRow}>
        <View style={s.summaryItem}><Text style={s.summaryValue}>{meals.length}</Text><Text style={s.summaryLabel}>öğün</Text></View>
        <View style={s.summaryItem}><Text style={[s.summaryValue, { color: Colors.accent }]}>{totalCal}</Text><Text style={s.summaryLabel}>kcal</Text></View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["catalog", "manual", "favorites"] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === "catalog" ? "🔍 Katalog" : t === "manual" ? "✏️ Manuel" : "⭐ Favori"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadMeals} tintColor={Colors.primary} />}>
        {tab === "catalog" && (
          <>
            <TextInput style={s.searchInput} placeholder="Yemek ara... (mercimek, döner, pilav)" placeholderTextColor={Colors.textMuted} value={query} onChangeText={setQuery} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm, maxHeight: 36 }}>
              <TouchableOpacity style={[s.catChip, !selCategory && s.catChipActive]} onPress={() => setSelCategory("")}>
                <Text style={[s.catChipText, !selCategory && s.catChipTextActive]}>Tümü</Text>
              </TouchableOpacity>
              {categories.map(c => (
                <TouchableOpacity key={c} style={[s.catChip, selCategory === c && s.catChipActive]} onPress={() => setSelCategory(selCategory === c ? "" : c)}>
                  <Text style={[s.catChipText, selCategory === c && s.catChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {foods.map(f => (
              <TouchableOpacity key={f.id} style={s.foodCard} onPress={() => { setServingFood(f); setServings("1"); }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.foodName}>{f.name}</Text>
                  <Text style={s.foodMeta}>{f.calories} kcal • P:{f.protein}g C:{f.carbs}g F:{f.fats}g</Text>
                  <Text style={s.foodServing}>{f.servingSize}</Text>
                </View>
                <TouchableOpacity onPress={() => handleFav(f.id)} style={s.favBtn}>
                  <Text style={{ fontSize: 20 }}>{favIds.has(f.id) ? "⭐" : "☆"}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {foods.length === 0 && <Text style={s.empty}>Sonuç bulunamadı</Text>}
          </>
        )}

        {tab === "favorites" && (
          <>
            {[...favIds].length === 0 ? <Text style={s.empty}>Henüz favori yemek eklenmedi</Text> : foods.filter(f => favIds.has(f.id)).map(f => (
              <TouchableOpacity key={f.id} style={s.foodCard} onPress={() => { setServingFood(f); setServings("1"); }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.foodName}>{f.name}</Text>
                  <Text style={s.foodMeta}>{f.calories} kcal • P:{f.protein}g C:{f.carbs}g F:{f.fats}g</Text>
                </View>
                <Text style={{ fontSize: 20 }}>⭐</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {tab === "manual" && (
          <View style={s.card}>
            <TextInput style={s.input} placeholder="Yemek adı" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} />
            <TextInput style={s.input} placeholder="Kalori" placeholderTextColor={Colors.textMuted} value={calories} onChangeText={setCalories} keyboardType="numeric" />
            <View style={s.rowInputs}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Protein" placeholderTextColor={Colors.textMuted} value={protein} onChangeText={setProtein} keyboardType="numeric" />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Karb" placeholderTextColor={Colors.textMuted} value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Yağ" placeholderTextColor={Colors.textMuted} value={fats} onChangeText={setFats} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={s.btn} onPress={addManual}><Text style={s.btnText}>＋ Ekle</Text></TouchableOpacity>
          </View>
        )}

        {/* Today's meals */}
        <Text style={s.sectionTitle}>Bugünkü Öğünler ({meals.length})</Text>
        {meals.map(m => (
          <View key={m.id} style={s.mealItem}>
            <View style={s.mealHeader}><Text style={s.mealName}>{m.name}</Text><Text style={s.mealCal}>{m.calories} kcal</Text></View>
            <Text style={s.mealMacros}>P: {m.protein}g • C: {m.carbs}g • F: {m.fats}g</Text>
          </View>
        ))}
        {meals.length === 0 && <Text style={s.empty}>Bugün henüz öğün eklenmedi</Text>}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Serving modal */}
      <Modal visible={!!servingFood} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{servingFood?.name}</Text>
            <Text style={s.modalInfo}>{servingFood?.calories} kcal / {servingFood?.servingSize}</Text>
            <Text style={s.label}>Porsiyon</Text>
            <View style={s.servingRow}>
              {[0.5, 1, 1.5, 2].map(v => (
                <TouchableOpacity key={v} style={[s.servingBtn, Number(servings) === v && s.servingBtnActive]} onPress={() => setServings(String(v))}>
                  <Text style={[s.servingBtnText, Number(servings) === v && { color: Colors.white }]}>{v}x</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.modalCalc}>{Math.round((servingFood?.calories || 0) * Number(servings))} kcal toplam</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setServingFood(null)}><Text style={s.cancelText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={s.addBtn} onPress={addFromCatalog}><Text style={s.btnText}>Ekle</Text></TouchableOpacity>
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
  summaryItem: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: "center" },
  summaryValue: { fontSize: FontSize.xl, fontWeight: "800", color: Colors.text },
  summaryLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  tabRow: { flexDirection: "row", gap: Spacing.xs, marginBottom: Spacing.md },
  tab: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, alignItems: "center" },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: "600", fontSize: FontSize.sm },
  tabTextActive: { color: Colors.white },
  searchInput: { backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  catChip: { backgroundColor: Colors.surface, borderRadius: BorderRadius.full, paddingVertical: 6, paddingHorizontal: 14, marginRight: 6 },
  catChipActive: { backgroundColor: Colors.primary },
  catChipText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: "600" },
  catChipTextActive: { color: Colors.white },
  foodCard: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs, alignItems: "center" },
  foodName: { color: Colors.text, fontWeight: "600", fontSize: FontSize.md },
  foodMeta: { color: Colors.textSecondary, fontSize: FontSize.xs, marginTop: 2 },
  foodServing: { color: Colors.textMuted, fontSize: FontSize.xs },
  favBtn: { padding: 8 },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.md },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md },
  rowInputs: { flexDirection: "row", gap: Spacing.sm },
  btn: { backgroundColor: Colors.accent, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
  btnText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.md },
  sectionTitle: { color: Colors.textSecondary, fontWeight: "600", fontSize: FontSize.md, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  empty: { color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.xxl },
  mealItem: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.xs },
  mealHeader: { flexDirection: "row", justifyContent: "space-between" },
  mealName: { color: Colors.text, fontWeight: "600" },
  mealCal: { color: Colors.accent, fontWeight: "700" },
  mealMacros: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: "600", marginTop: Spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: Spacing.xl },
  modalCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xl },
  modalTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: "700" },
  modalInfo: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 4 },
  servingRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  servingBtn: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, alignItems: "center" },
  servingBtnActive: { backgroundColor: Colors.primary },
  servingBtnText: { color: Colors.textMuted, fontWeight: "600" },
  modalCalc: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: "700", textAlign: "center", marginTop: Spacing.md },
  modalActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg },
  cancelBtn: { flex: 1, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
  cancelText: { color: Colors.textSecondary, fontWeight: "600" },
  addBtn: { flex: 1, backgroundColor: Colors.accent, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, alignItems: "center" },
});
