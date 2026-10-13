import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal
} from "react-native";
import { theme } from "../../theme";
import { GoalPriority, GoalStatus } from "@truenorth/shared";

interface MobileGoal {
  id: string;
  title: string;
  description?: string;
  priority: GoalPriority;
  status: GoalStatus;
  targetDate?: string;
  category: string;
}

export default function GoalsScreen() {
  const [goals, setGoals] = useState<MobileGoal[]>([
    {
      id: "g1",
      title: "Master Mobile Engineering & Systems Architecture",
      description: "Build robust, verified cross-platform apps with rigorous safety boundaries.",
      priority: "CRITICAL",
      status: "ACTIVE",
      targetDate: "2026-12-31",
      category: "Career & Craft"
    },
    {
      id: "g2",
      title: "Cultivate Spiritual & Personal Discipline",
      description: "Daily self-reflection, integrity, and adherence to personal values.",
      priority: "HIGH",
      status: "ACTIVE",
      targetDate: "2026-11-30",
      category: "Personal Growth"
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Productivity");

  function handleCreateGoal() {
    if (!titleInput.trim()) return;

    const newGoal: MobileGoal = {
      id: `g-${Date.now()}`,
      title: titleInput.trim(),
      description: descInput.trim() || undefined,
      priority: "MEDIUM",
      status: "ACTIVE",
      category: categoryInput
    };

    setGoals((prev) => [newGoal, ...prev]);
    setTitleInput("");
    setDescInput("");
    setModalVisible(false);
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

        {goals.map((goal) => (
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
              <Text style={styles.categoryText}>{goal.category}</Text>
            </View>

            <Text style={styles.goalTitle}>{goal.title}</Text>
            {goal.description && (
              <Text style={styles.goalDescription}>{goal.description}</Text>
            )}

            {goal.targetDate && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Target: {goal.targetDate}</Text>
                <Text style={styles.statusActive}>● ACTIVE</Text>
              </View>
            )}
          </View>
        ))}
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

            <Text style={styles.label}>Category:</Text>
            <TextInput
              style={styles.input}
              value={categoryInput}
              onChangeText={setCategoryInput}
              placeholderTextColor={theme.colors.textMuted}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !titleInput.trim() && styles.disabledBtn]}
                disabled={!titleInput.trim()}
                onPress={handleCreateGoal}
              >
                <Text style={styles.saveText}>Create Goal</Text>
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
    borderRadius: theme.borderRadius.md
  },
  addBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 13
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
    height: 70,
    textAlignVertical: "top"
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
