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
import { TaskStatus } from "@truenorth/shared";

interface MobileTask {
  id: string;
  title: string;
  originalScheduledDate: string;
  scheduledDate: string;
  status: TaskStatus;
  isRequiredForUnlock: boolean;
  rescheduleCount: number;
}

export default function TasksScreen() {
  const [tasks, setTasks] = useState<MobileTask[]>([
    {
      id: "t1",
      title: "Write Prisma & Database Migration Specs",
      originalScheduledDate: "2026-10-13",
      scheduledDate: "2026-10-13",
      status: "COMPLETED",
      isRequiredForUnlock: true,
      rescheduleCount: 0
    },
    {
      id: "t2",
      title: "Implement Timezone-Aware Task History Service",
      originalScheduledDate: "2026-10-13",
      scheduledDate: "2026-10-13",
      status: "PLANNED",
      isRequiredForUnlock: true,
      rescheduleCount: 0
    },
    {
      id: "t3",
      title: "Focus Lock Native Feasibility Whitepaper",
      originalScheduledDate: "2026-10-12",
      scheduledDate: "2026-10-13",
      status: "PLANNED",
      isRequiredForUnlock: false,
      rescheduleCount: 1
    }
  ]);

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MobileTask | null>(null);
  const [newDateInput, setNewDateInput] = useState("2026-10-14");
  const [reasonInput, setReasonInput] = useState("");

  function toggleTaskCompletion(task: MobileTask) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === task.id) {
          const nextStatus = t.status === "COMPLETED" ? "PLANNED" : "COMPLETED";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  }

  function handleOpenReschedule(task: MobileTask) {
    setSelectedTask(task);
    setReasonInput("");
    setRescheduleModalVisible(true);
  }

  function confirmReschedule() {
    if (!selectedTask || !reasonInput.trim()) return;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === selectedTask.id) {
          return {
            ...t,
            scheduledDate: newDateInput,
            rescheduleCount: t.rescheduleCount + 1
          };
        }
        return t;
      })
    );

    setRescheduleModalVisible(false);
    setSelectedTask(null);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Prototype & Historical Integrity Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Historical Integrity Active</Text>
          <Text style={styles.bannerBody}>
            Tasks track immutable audit trails. Rescheduling preserves original dates without rewriting yesterday’s reports.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Today's Task Register (2026-10-13)</Text>

        {tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={() => toggleTaskCompletion(task)}
              >
                <Text style={styles.checkbox}>
                  {task.status === "COMPLETED" ? "☑" : "☐"}
                </Text>
              </TouchableOpacity>

              <View style={styles.taskDetails}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.status === "COMPLETED" && styles.taskCompletedText
                  ]}
                >
                  {task.title}
                </Text>

                <View style={styles.badgeRow}>
                  {task.isRequiredForUnlock && (
                    <View style={styles.requiredChip}>
                      <Text style={styles.requiredText}>Focus Lock Req</Text>
                    </View>
                  )}
                  {task.rescheduleCount > 0 && (
                    <View style={styles.rescheduleChip}>
                      <Text style={styles.rescheduleText}>
                        Rescheduled ({task.rescheduleCount}x)
                      </Text>
                    </View>
                  )}
                  <Text style={styles.originalDateText}>
                    Planned: {task.originalScheduledDate}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsFooter}>
              <TouchableOpacity
                style={styles.rescheduleBtn}
                onPress={() => handleOpenReschedule(task)}
              >
                <Text style={styles.rescheduleBtnText}>Reschedule →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Task</Text>
            <Text style={styles.modalSubtitle}>
              {selectedTask?.title}
            </Text>

            <Text style={styles.inputLabel}>New Target Date (YYYY-MM-DD):</Text>
            <TextInput
              style={styles.input}
              value={newDateInput}
              onChangeText={setNewDateInput}
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={styles.inputLabel}>Mandatory Reason for Audit Log:</Text>
            <TextInput
              style={[styles.input, styles.reasonInput]}
              value={reasonInput}
              onChangeText={setReasonInput}
              placeholder="e.g., Blocked on dependencies; reprioritized"
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRescheduleModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, !reasonInput.trim() && styles.disabledBtn]}
                disabled={!reasonInput.trim()}
                onPress={confirmReschedule}
              >
                <Text style={styles.confirmBtnText}>Save & Log Audit</Text>
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
  banner: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderColor: "rgba(56, 189, 248, 0.3)",
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 2
  },
  bannerBody: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  taskCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm
  },
  checkboxTouch: {
    paddingTop: 2
  },
  checkbox: {
    fontSize: 22,
    color: theme.colors.primary
  },
  taskDetails: {
    flex: 1
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary
  },
  taskCompletedText: {
    textDecorationLine: "line-through",
    color: theme.colors.textMuted
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
    alignItems: "center"
  },
  requiredChip: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm
  },
  requiredText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.warning
  },
  rescheduleChip: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm
  },
  rescheduleText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.accent
  },
  originalDateText: {
    fontSize: 11,
    color: theme.colors.textMuted
  },
  actionsFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder
  },
  rescheduleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  rescheduleBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
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
    color: theme.colors.textPrimary
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.md
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: 14,
    marginBottom: theme.spacing.md
  },
  reasonInput: {
    height: 80,
    textAlignVertical: "top"
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm
  },
  cancelBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: "600"
  },
  confirmBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md
  },
  disabledBtn: {
    opacity: 0.5
  },
  confirmBtnText: {
    color: "#0F172A",
    fontWeight: "700"
  }
});
