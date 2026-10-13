import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "../../theme";
import { AiGuidanceResponse } from "@truenorth/shared";

export default function AnalysisResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resultJson?: string; rawThought?: string }>();

  let guidance: AiGuidanceResponse | null = null;
  try {
    if (params.resultJson) {
      guidance = JSON.parse(params.resultJson);
    }
  } catch (e) {
    console.error("Failed to parse guidance JSON", e);
  }

  if (!guidance) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No analysis result found.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(app)/thought-capture")}
        >
          <Text style={styles.backBtnText}>Return to Thought Capture</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAligned = guidance.alignmentStatus === "ALIGNED";
  const statusColor = isAligned ? theme.colors.success : theme.colors.warning;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Alignment Score & Status Header */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View
            style={[
              styles.statusChip,
              { backgroundColor: `${statusColor}22` }
            ]}
          >
            <Text style={[styles.statusChipText, { color: statusColor }]}>
              {guidance.alignmentStatus}
            </Text>
          </View>
          <Text style={styles.scoreText}>
            Alignment Score: {guidance.alignmentScore}%
          </Text>
        </View>

        <View style={styles.categoryRow}>
          {guidance.categories.map((cat) => (
            <View key={cat} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{cat}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Direct Reasoning */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Direct Reasoning</Text>
        <Text style={styles.sectionBody}>{guidance.directReasoning}</Text>
      </View>

      {/* Non-Shaming Insight */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Non-Shaming Insight</Text>
        <Text style={styles.sectionBody}>{guidance.nonShamingInsight}</Text>
      </View>

      {/* Faith Reflection (If applicable) */}
      {guidance.faithReflection && (
        <View style={[styles.card, styles.faithCard]}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            Personal Faith Reflection
          </Text>
          <Text style={styles.sectionBody}>{guidance.faithReflection}</Text>
        </View>
      )}

      {/* Recommended Next Actions */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Recommended Actions</Text>
        {guidance.recommendedActions.map((action, idx) => (
          <View key={idx} style={styles.actionItem}>
            <Text style={styles.actionBullet}>•</Text>
            <Text style={styles.actionText}>{action}</Text>
          </View>
        ))}
      </View>

      {/* Navigation Footer */}
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => router.replace("/(app)")}
      >
        <Text style={styles.doneBtnText}>Return to Today's Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.md,
    gap: theme.spacing.md
  },
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    marginBottom: theme.spacing.md
  },
  backBtn: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md
  },
  backBtnText: {
    color: theme.colors.primary,
    fontWeight: "700"
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  statusChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm
  },
  statusChipText: {
    fontWeight: "800",
    fontSize: 12
  },
  scoreText: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 15
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md
  },
  categoryChip: {
    backgroundColor: theme.colors.background,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  categoryChipText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "600"
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  faithCard: {
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 6
  },
  sectionBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs
  },
  actionBullet: {
    color: theme.colors.primary,
    fontSize: 16
  },
  actionText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 19
  },
  doneBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginTop: theme.spacing.sm
  },
  doneBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 15
  }
});
