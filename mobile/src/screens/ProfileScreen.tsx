import { useState } from "react";

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { colors } from "../theme/colors";
import { AppCard } from "../components/AppCard";

type Props = {
  profile: any;

  runLogout: () => void;

  profileName: string;
  setProfileName: (value: string) => void;
  saveProfile: () => Promise<void> | void;
    goalCalories: string;
  setGoalCalories: (value: string) => void;

  goalWorkouts: string;
  setGoalWorkouts: (value: string) => void;
 
};

export function ProfileScreen({
  profile,
  runLogout,

  profileName,
  setProfileName,
  saveProfile,

    goalCalories,
  setGoalCalories,
  goalWorkouts,
  setGoalWorkouts,
}: Props) {
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [preferencesVisible, setPreferencesVisible] = useState(false);

  const [bio, setBio] = useState("Fitness enthusiast");

  const [activeSection, setActiveSection] = useState<
    "posts" | "followers" | "following"
  >("posts");

  async function handleSaveProfile() {
    await saveProfile();
    setEditVisible(false);
  }

  async function handleSavePreferences() {
    
    setPreferencesVisible(false);
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={54} color="white" />
          </View>

          <Text style={styles.name}>{profile?.name ?? "User"}</Text>

          <Text style={styles.username}>{bio}</Text>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => setActiveSection("posts")}
          >
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => setActiveSection("followers")}
          >
            <Text style={styles.statValue}>248</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => setActiveSection("following")}
          >
            <Text style={styles.statValue}>180</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditVisible(true)}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.postButton}>
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {activeSection === "posts" ? (
          <>
            <AppCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Posts</Text>
                <Ionicons name="grid" size={22} color={colors.primary} />
              </View>

              <Text style={styles.placeholderText}>
                No posts yet. Tap the + button to share a recipe, workout
                routine, or progress update.
              </Text>
            </AppCard>

            <AppCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Shared Recipes</Text>
                <Ionicons name="restaurant" size={22} color={colors.primary} />
              </View>

              <Text style={styles.placeholderText}>No recipes shared yet.</Text>
            </AppCard>

            <AppCard>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Shared Workouts</Text>
                <Ionicons name="barbell" size={22} color={colors.primary} />
              </View>

              <Text style={styles.placeholderText}>
                No workouts shared yet.
              </Text>
            </AppCard>
          </>
        ) : null}

        {activeSection === "followers" ? (
          <AppCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Followers</Text>
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>

            <Text style={styles.placeholderText}>
              Followers list will appear here once connected to the backend
              social endpoints.
            </Text>
          </AppCard>
        ) : null}

        {activeSection === "following" ? (
          <AppCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Following</Text>
              <Ionicons name="person-add" size={22} color={colors.primary} />
            </View>

            <Text style={styles.placeholderText}>
              Following list will appear here once connected to the backend
              social endpoints.
            </Text>
          </AppCard>
        ) : null}

        <AppCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Ionicons name="trophy" size={22} color={colors.primary} />
          </View>

          <View style={styles.achievementRow}>
            <View style={styles.achievementBadge}>
              <Ionicons name="flame" size={18} color={colors.orange} />
              <Text style={styles.achievementText}>7 Day Streak</Text>
            </View>

            <View style={styles.achievementBadge}>
              <Ionicons name="fitness" size={18} color={colors.primary} />
              <Text style={styles.achievementText}>50 Workouts</Text>
            </View>
          </View>
        </AppCard>
      </ScrollView>

      <Modal visible={settingsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setSettingsVisible(false);
                setPreferencesVisible(true);
              }}
            >
              <Ionicons name="notifications" size={20} color={colors.text} />
              <Text style={styles.modalButtonText}>Preferences</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton}>
              <Ionicons name="lock-closed" size={20} color={colors.text} />
              <Text style={styles.modalButtonText}>Privacy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() => {
                setSettingsVisible(false);
                runLogout();
              }}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <TextInput
              style={styles.input}
              placeholder="Profile Name"
              value={profileName}
              onChangeText={setProfileName}
            />

            <TextInput
              style={styles.input}
              placeholder="Bio"
              value={bio}
              onChangeText={setBio}
            />

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveProfile}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setEditVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={preferencesVisible} animationType="slide" transparent>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Preferences</Text>

      <Text style={styles.inputLabel}>Daily Calorie Goal</Text>
      <TextInput
        style={styles.input}
        placeholder="2200"
        keyboardType="numeric"
        value={goalCalories}
        onChangeText={setGoalCalories}
      />

      <Text style={styles.inputLabel}>Workouts Per Week</Text>
      <TextInput
        style={styles.input}
        placeholder="4"
        keyboardType="numeric"
        value={goalWorkouts}
        onChangeText={setGoalWorkouts}
      />

      <Text style={styles.inputLabel}>Protein Goal</Text>
      <TextInput
        style={styles.input}
        placeholder="Calculated from calories for now"
        editable={false}
      />

      <Text style={styles.inputLabel}>Carbs Goal</Text>
      <TextInput
        style={styles.input}
        placeholder="Calculated from calories for now"
        editable={false}
      />

      <Text style={styles.inputLabel}>Fat Goal</Text>
      <TextInput
        style={styles.input}
        placeholder="Calculated from calories for now"
        editable={false}
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={async () => {
          await saveProfile();
          setPreferencesVisible(false);
        }}
      >
        <Text style={styles.saveButtonText}>Save Preferences</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setPreferencesVisible(false)}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  settingsButton: {
    alignSelf: "flex-end",
    marginBottom: 12,
    backgroundColor: "white",
    width: 44,
    height: 44,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  name: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },

  username: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textLight,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  statBox: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
  },

  statLabel: {
    marginTop: 4,
    color: colors.textLight,
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },

  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },

  editButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  postButton: {
    width: 54,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },

  placeholderText: {
    color: colors.textLight,
    lineHeight: 22,
  },

  achievementRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },

  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  achievementText: {
    color: colors.text,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 20,
  },

  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },

  modalButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
  },

  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },

  logoutText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  cancelText: {
    marginTop: 18,
    textAlign: "center",
    color: colors.textLight,
    fontWeight: "600",
  },

  inputLabel: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },

  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },

  saveButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});