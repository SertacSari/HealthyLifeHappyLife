import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { AppCard } from "../components/AppCard";
import { colors } from "../theme/colors";

const posts = [
  {
    id: 1,
    user: "Sarah Johnson",
    type: "recipe",
    title: "High Protein Burrito Bowl",
    description:
      "42g protein meal prep bowl with chicken, rice, avocado, and black beans.",
    likes: 124,
  },

  {
    id: 2,
    user: "Michael Lee",
    type: "workout",
    title: "Leg Day Routine",
    description:
      "Heavy squats + RDL focused lower body workout.",
    likes: 89,
  },

  {
    id: 3,
    user: "Emma Wilson",
    type: "recipe",
    title: "Healthy Overnight Oats",
    description:
      "Quick breakfast recipe with berries and chia seeds.",
    likes: 201,
  },
];

export function SocialScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      <View style={styles.header}>
        <Text style={styles.title}>
          Community
        </Text>

        <Text style={styles.subtitle}>
          Explore recipes & workouts
        </Text>
      </View>

      {posts.map((post) => (
        <AppCard key={post.id}>

          <View style={styles.postHeader}>

            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={20}
                color="white"
              />
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.username}>
                {post.user}
              </Text>

              <Text style={styles.postType}>
                {post.type === "recipe"
                  ? "Shared Recipe"
                  : "Shared Workout"}
              </Text>
            </View>

          </View>

          <Text style={styles.postTitle}>
            {post.title}
          </Text>

          <Text style={styles.postDescription}>
            {post.description}
          </Text>

          <View style={styles.actionsRow}>

            <View style={styles.action}>
              <Ionicons
                name="heart"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.actionText}>
                {post.likes}
              </Text>
            </View>

            <View style={styles.action}>
              <Ionicons
                name="chatbubble"
                size={18}
                color={colors.textLight}
              />

              <Text style={styles.actionText}>
                Comment
              </Text>
            </View>

            <View style={styles.action}>
              <Ionicons
                name="share-social"
                size={18}
                color={colors.textLight}
              />

              <Text style={styles.actionText}>
                Share
              </Text>
            </View>

          </View>

        </AppCard>
      ))}

    </ScrollView>
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

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textLight,
  },

  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  userInfo: {
    flex: 1,
  },

  username: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },

  postType: {
    marginTop: 2,
    color: colors.textLight,
    fontSize: 13,
  },

  postTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },

  postDescription: {
    color: colors.textLight,
    lineHeight: 22,
    marginBottom: 18,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  actionText: {
    color: colors.text,
    fontWeight: "600",
  },

});