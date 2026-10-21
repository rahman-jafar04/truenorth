import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator
} from "react-native";
import { theme } from "../../theme";
import { GoalPriority, GoalStatus, GoalResponse } from "@truenorth/shared";
import { useGoals, useCreateGoal } from "../../hooks/useGoals";

export default function GoalsScreen() {
  const { data: goals = [], isLoading, isError, refetch } = useGoals();
  const createGoalMutation = useCreateGoal();

  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [priorityInput, setPriorityInput] = useState<GoalPriority>("MEDIUM");
  const [categoryInput, setCategoryInput] = useState("Productivity");
  const [targetDateInput, setTargetDateInput] = useState("");

  async function handleCreateGoal() {
    if (!titleInput.trim()) return;

    try {
      await createGoalMutation.mutateAsync({
        title: titleInput.trim(),
        description: descInput.trim() || undefined,
        priority: priorityInput,
        category: categoryInput.trim() || undefined,
        targetDate: targetDateInput.trim() || undefined
      });

      setTitleInput("");
      setDescInput("");
      setPriorityInput("MEDIUM");
      setCategoryInput("Productivity");
      setTargetDateInput("");
      setModalVisible(false);
    } catch {
      // Error handled by mutation state
    }
  }

  function getPriorityColor(priority: GoalPriority) {
    switch (priority) {
      case "CRITICAL":
        return theme.colors.error;
      case "HIGH":
        return theme.colors.warning;
      case "MEDIUM":
        return theme.colors.primary;
      default:
        return theme.colors.textMuted;
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Your Core Goals</Text>
            <Text style={styles.subtitle}>All daily tasks and thoughts anchor here.</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addBtnText}>+ New Goal</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading your core goals...</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not load goals</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No Goals Defined Yet</Text>
            <Text style={styles.emptyBody}>
              TrueNorth anchors your daily tasks and thoughts to your core long-term goals. Create your first goal to begin.
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addBtnText}>+ Create First Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: `${getPriorityColor(goal.priority)}22` }
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      { color: getPriorityColor(goal.priority) }
                    ]}
                  >
                    {goal.priority}
                  </Text>
                </View>
                <Text style={styles.categoryText}>{goal.category || "General"}</Text>
              </View>

              <Text style={styles.goalTitle}>{goal.title}</Text>
              {goal.description && (
                <Text style={styles.goalDescription}>{goal.description}</Text>
              )}

              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>
                  {goal.targetDate ? `Target: ${goal.targetDate}` : "Ongoing"}
                </Text>
                <Text style={styles.statusActive}>● {goal.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Define New Goal</Text>

            <Text style={styles.label}>Title:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Build TrueNorth Production Release"
              placeholderTextColor={theme.colors.textMuted}
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <Text style={styles.label}>Description:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Why does this matter? What is the standard?"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              value={descInput}
              onChangeText={setDescInput}
            />

            <Text style={styles.label}>Priority:</Text>
            <View style={styles.prioritySelector}>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as GoalPriority[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityChoice,
                    priorityInput === p && {
                      backgroundColor: `${getPriorityColor(p)}33`,
                      borderColor: getPriorityColor(p)
                    }
                  ]}
                  onPress={() => setPriorityInput(p)}
                >
                  <Text
                    style={[
                      styles.priorityChoiceText,
                      priorityInput === p && { color: getPriorityColor(p), fontWeight: "800" }
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Category:</Text>
            <TextInput
              style={styles.input}
              value={categoryInput}
              onChangeText={setCategoryInput}
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.label}>Target Date (YYYY-MM-DD, optional):</Text>
            <TextInput
              style={styles.input}
              value={targetDateInput}
              onChangeText={setTargetDateInput}
              placeholder="2026-12-31"
              placeholderTextColor={theme.colors.textMuted}
            />

            {createGoalMutation.isError && (
              <Text style={styles.mutationError}>
                Failed to create goal: {(createGoalMutation.error as Error).message}
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  (!titleInput.trim() || createGoalMutation.isPending) && styles.disabledBtn
                ]}
                disabled={!titleInput.trim() || createGoalMutation.isPending}
                onPress={handleCreateGoal}
              >
                {createGoalMutation.isPending ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <Text style={styles.saveText}>Create Goal</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    alignSelf: "flex-start"
  },
  addBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 13
  },
  centerBox: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13
  },
  errorBox: {
    padding: theme.spacing.lg,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    gap: theme.spacing.sm
  },
  errorTitle: {
    color: theme.colors.error,
    fontWeight: "700",
    fontSize: 14
  },
  retryBtn: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  retryBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: "600",
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: theme.spacing.sm
  },
  emptyIcon: {
    fontSize: 36
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  emptyBody: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: theme.spacing.sm
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "800"
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.textMuted
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 4
  },
  goalDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 18
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder
  },
  dateLabel: {
    fontSize: 12,
    color: theme.colors.textMuted
  },
  statusActive: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: "700"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: theme.spacing.md
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: 4
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md
  },
  textArea: {
    height: 60,
    textAlignVertical: "top"
  },
  prioritySelector: {
    flexDirection: "row",
    gap: 6,
    marginBottom: theme.spacing.md
  },
  priorityChoice: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    alignItems: "center"
  },
  priorityChoiceText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: "600"
  },
  mutationError: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: theme.spacing.sm
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontWeight: "600"
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md
  },
  disabledBtn: {
    opacity: 0.5
  },
  saveText: {
    color: "#0F172A",
    fontWeight: "700"
  }
});
