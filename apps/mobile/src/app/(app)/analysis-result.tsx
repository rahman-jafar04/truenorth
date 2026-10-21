import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "../../theme";
import { AiGuidanceResponse } from "@truenorth/shared";
import { useCreateTask } from "../../hooks/useTasks";

export default function AnalysisResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resultJson?: string; rawThought?: string }>();
  const createTaskMutation = useCreateTask();

  const [addedTasks, setAddedTasks] = useState<Record<number, boolean>>({});

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
  const isMisaligned = guidance.alignmentStatus === "MISALIGNED";
  const statusColor = isAligned
    ? theme.colors.success
    : isMisaligned
    ? theme.colors.error
    : theme.colors.warning;

  async function handleAddActionAsTask(actionText: string, index: number) {
    if (addedTasks[index]) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    await createTaskMutation.mutateAsync({
      title: actionText,
      scheduledDate: todayStr,
      status: "PLANNED",
      isRequiredForUnlock: false
    });

    setAddedTasks((prev) => ({ ...prev, [index]: true }));
  }

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
            Alignment: {guidance.alignmentScore}/100
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
        <Text style={styles.sectionHeading}>Direct Objective Reasoning</Text>
        <Text style={styles.sectionBody}>{guidance.directReasoning}</Text>
      </View>

      {/* Non-Shaming Insight */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Non-Shaming Perspective</Text>
        <Text style={styles.sectionBody}>{guidance.nonShamingInsight}</Text>
      </View>

      {/* Faith Reflection (If applicable) */}
      {guidance.faithReflection && (
        <View style={[styles.card, styles.faithCard]}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            Personal Faith Perspective
          </Text>
          <Text style={styles.sectionBody}>{guidance.faithReflection}</Text>
          <View style={styles.guardrailTag}>
            <Text style={styles.guardrailTagText}>
              Theological Rule: Non-supernatural attribution. Rooted purely in personal stewardship and virtue.
            </Text>
          </View>
        </View>
      )}

      {/* Recommended Next Actions with 1-Tap Add to Tasks */}
      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Recommended Actions</Text>
        <Text style={styles.sectionSub}>Convert AI recommendations into daily commitments:</Text>

        {guidance.recommendedActions.map((action, idx) => (
          <View key={idx} style={styles.actionCard}>
            <View style={styles.actionLeft}>
              <Text style={styles.actionBullet}>•</Text>
              <Text style={styles.actionText}>{action}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.addTaskBtn,
                addedTasks[idx] && styles.addTaskBtnDone
              ]}
              disabled={addedTasks[idx] || createTaskMutation.isPending}
              onPress={() => handleAddActionAsTask(action, idx)}
            >
              <Text
                style={[
                  styles.addTaskBtnText,
                  addedTasks[idx] && styles.addTaskBtnTextDone
                ]}
              >
                {addedTasks[idx] ? "✓ Added" : "+ Add Task"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.reflectAnotherBtn}
          onPress={() => router.replace("/(app)/thought-capture")}
        >
          <Text style={styles.reflectAnotherText}>Reflect Another</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.replace("/(app)")}
        >
          <Text style={styles.doneBtnText}>Dashboard →</Text>
        </TouchableOpacity>
      </View>
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
    fontWeight: "800",
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
    fontSize: 10,
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
    marginBottom: 4
  },
  sectionSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm
  },
  sectionBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20
  },
  guardrailTag: {
    marginTop: theme.spacing.sm,
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    padding: 8,
    borderRadius: theme.borderRadius.sm
  },
  guardrailTagText: {
    fontSize: 11,
    color: theme.colors.primary,
    lineHeight: 15
  },
  actionCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xs
  },
  actionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4
  },
  actionBullet: {
    color: theme.colors.primary,
    fontSize: 14,
    paddingTop: 1
  },
  actionText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18
  },
  addTaskBtn: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm
  },
  addTaskBtnDone: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: theme.colors.success
  },
  addTaskBtnText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: "700"
  },
  addTaskBtnTextDone: {
    color: theme.colors.success
  },
  buttonsRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  reflectAnotherBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center"
  },
  reflectAnotherText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "700"
  },
  doneBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center"
  },
  doneBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14
  }
});
