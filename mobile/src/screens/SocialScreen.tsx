import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Alert } from "react-native";
import { Colors, Spacing, FontSize, BorderRadius } from "../theme";
import { API_URL } from "../api";

type Props = { token: string };
type UserItem = { userId: number; email: string; name: string };

async function apiRequest<T>(path: string, method: string, token: string, body?: object): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export default function SocialScreen({ token }: Props) {
  const [tab, setTab] = useState<"following" | "followers">("following");
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const [targetId, setTargetId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const [fing, fers] = await Promise.all([
        apiRequest<{ users: UserItem[] }>("/social/following", "GET", token),
        apiRequest<{ users: UserItem[] }>("/social/followers", "GET", token),
      ]);
      setFollowing(fing.users); setFollowers(fers.users);
    } catch {} finally { setRefreshing(false); }
  }
  useEffect(() => { load(); }, []);

  async function follow() {
    if (!targetId) return;
    try {
      await apiRequest("/social/follow", "POST", token, { targetUserId: Number(targetId) });
      setTargetId(""); await load();
      Alert.alert("Success", "User followed!");
    } catch (err) { Alert.alert("Error", String(err)); }
  }

  async function unfollow(id: number) {
    try {
      await apiRequest("/social/unfollow", "POST", token, { targetUserId: id });
      await load();
    } catch (err) { Alert.alert("Error", String(err)); }
  }

  const list = tab === "following" ? following : followers;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />}>
      <Text style={s.title}>Social</Text>

      <View style={s.card}>
        <Text style={s.cardTitle}>Follow a User</Text>
        <View style={s.row}>
          <TextInput style={[s.input, s.flex]} placeholder="User ID" placeholderTextColor={Colors.textMuted} value={targetId} onChangeText={setTargetId} keyboardType="numeric" />
          <TouchableOpacity style={s.followBtn} onPress={follow}>
            <Text style={s.followBtnText}>Follow</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === "following" && s.tabActive]} onPress={() => setTab("following")}>
          <Text style={[s.tabText, tab === "following" && s.tabTextActive]}>Following ({following.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === "followers" && s.tabActive]} onPress={() => setTab("followers")}>
          <Text style={[s.tabText, tab === "followers" && s.tabTextActive]}>Followers ({followers.length})</Text>
        </TouchableOpacity>
      </View>

      {list.length === 0 ? <Text style={s.empty}>{tab === "following" ? "Not following anyone yet." : "No followers yet."}</Text> : list.map(u => (
        <View key={u.userId} style={s.userCard}>
          <View style={s.avatar}><Text style={s.avatarText}>{(u.name || "U")[0].toUpperCase()}</Text></View>
          <View style={s.flex}>
            <Text style={s.userName}>{u.name}</Text>
            <Text style={s.userEmail}>{u.email}</Text>
          </View>
          {tab === "following" && (
            <TouchableOpacity style={s.unfollowBtn} onPress={() => unfollow(u.userId)}>
              <Text style={s.unfollowText}>Unfollow</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: "800", color: Colors.text, marginBottom: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, gap: Spacing.sm, marginBottom: Spacing.lg },
  cardTitle: { color: Colors.text, fontWeight: "700", fontSize: FontSize.lg },
  row: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
  flex: { flex: 1 },
  input: { backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: BorderRadius.sm, padding: Spacing.md, color: Colors.text },
  followBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
  followBtnText: { color: Colors.white, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: { flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.sm, paddingVertical: Spacing.sm, alignItems: "center" },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: "600" },
  tabTextActive: { color: Colors.white },
  empty: { color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.xxl },
  userCard: { flexDirection: "row", backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, alignItems: "center", gap: Spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  avatarText: { color: Colors.white, fontWeight: "700", fontSize: FontSize.lg },
  userName: { color: Colors.text, fontWeight: "600" },
  userEmail: { color: Colors.textSecondary, fontSize: FontSize.xs },
  unfollowBtn: { backgroundColor: Colors.danger, borderRadius: BorderRadius.sm, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },
  unfollowText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: "600" },
});
