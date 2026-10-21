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
import { TaskResponse, TaskStatus } from "@truenorth/shared";
import {
  useTasks,
  useCreateTask,
  useCompleteTask,
  useReopenTask,
  useRescheduleTask,
  useDeleteTask
} from "../../hooks/useTasks";
import { useGoals } from "../../hooks/useGoals";

export default function TasksScreen() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const { data: tasks = [], isLoading, isError, refetch } = useTasks(selectedDate);
  const { data: goals = [] } = useGoals();

  const createTaskMutation = useCreateTask();
  const completeTaskMutation = useCompleteTask();
  const reopenTaskMutation = useReopenTask();
  const rescheduleTaskMutation = useRescheduleTask();
  const deleteTaskMutation = useDeleteTask();

  // Create Task Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [isRequiredForUnlock, setIsRequiredForUnlock] = useState(false);

  // Reschedule Modal State
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);
  const [newDateInput, setNewDateInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");

  function handleOpenCreate() {
    setTitleInput("");
    setDescInput("");
    setSelectedGoalId(null);
    setEstimatedMinutes("");
    setIsRequiredForUnlock(false);
    setCreateModalVisible(true);
  }

  async function handleCreateTask() {
    if (!titleInput.trim()) return;

    await createTaskMutation.mutateAsync({
      title: titleInput.trim(),
      description: descInput.trim() || undefined,
      scheduledDate: selectedDate,
      goalId: selectedGoalId || undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
      status: "PLANNED",
      isRequiredForUnlock
    });

    setCreateModalVisible(false);
  }

  async function handleToggleTask(task: TaskResponse) {
    if (task.status === "COMPLETED") {
      await reopenTaskMutation.mutateAsync({
        taskId: task.id,
        reason: "User toggled completion off"
      });
    } else {
      await completeTaskMutation.mutateAsync(task.id);
    }
  }

  function handleOpenReschedule(task: TaskResponse) {
    setSelectedTask(task);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewDateInput(tomorrow.toISOString().slice(0, 10));
    setReasonInput("");
    setRescheduleModalVisible(true);
  }

  async function handleConfirmReschedule() {
    if (!selectedTask || !reasonInput.trim() || !newDateInput.trim()) return;

    await rescheduleTaskMutation.mutateAsync({
      taskId: selectedTask.id,
      newDate: newDateInput.trim(),
      reason: reasonInput.trim()
    });

    setRescheduleModalVisible(false);
    setSelectedTask(null);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Historical Integrity Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Historical Integrity Active</Text>
          <Text style={styles.bannerBody}>
            Tasks track immutable audit trails. Rescheduling preserves original dates without rewriting yesterday’s reports.
          </Text>
        </View>

        {/* Date Header & Creation Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.sectionTitle}>Task Register</Text>
            <Text style={styles.dateSubtitle}>
              {selectedDate === todayStr ? `Today (${selectedDate})` : selectedDate}
            </Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
            <Text style={styles.addBtnText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Loading / Error / Empty / List States */}
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading tasks for {selectedDate}...</Text>
          </View>
        ) : isError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Could not load daily tasks</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Tasks for this Date</Text>
            <Text style={styles.emptyBody}>
              Plan your priority commitments for today, linked to your core goals.
            </Text>
            <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
              <Text style={styles.addBtnText}>+ Create Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <TouchableOpacity
                  style={styles.checkboxTouch}
                  onPress={() => handleToggleTask(task)}
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

                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}

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
                    {task.estimatedMinutes && (
                      <Text style={styles.estimatedText}>
                        ⏱ {task.estimatedMinutes}m
                      </Text>
                    )}
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
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteTaskMutation.mutate(task.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Plan New Daily Task</Text>

            <Text style={styles.inputLabel}>Task Title:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Implement Focus Lock bridge verification"
              placeholderTextColor={theme.colors.textMuted}
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <Text style={styles.inputLabel}>Description (optional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Context or acceptance criteria"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              value={descInput}
              onChangeText={setDescInput}
            />

            {/* Link to Goal Selector */}
            {goals.length > 0 && (
              <>
                <Text style={styles.inputLabel}>Link to Core Goal:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalPillsRow}>
                  <TouchableOpacity
                    style={[
                      styles.goalPill,
                      selectedGoalId === null && styles.goalPillActive
                    ]}
                    onPress={() => setSelectedGoalId(null)}
                  >
                    <Text
                      style={[
                        styles.goalPillText,
                        selectedGoalId === null && styles.goalPillTextActive
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>
                  {goals.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.goalPill,
                        selectedGoalId === g.id && styles.goalPillActive
                      ]}
                      onPress={() => setSelectedGoalId(g.id)}
                    >
                      <Text
                        style={[
                          styles.goalPillText,
                          selectedGoalId === g.id && styles.goalPillTextActive
                        ]}
                        numberOfLines={1}
                      >
                        {g.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Focus Lock Requirement Toggle */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsRequiredForUnlock(!isRequiredForUnlock)}
            >
              <Text style={styles.checkboxIcon}>
                {isRequiredForUnlock ? "☑" : "☐"}
              </Text>
              <View style={styles.checkboxLabelGroup}>
                <Text style={styles.checkboxTitle}>Require for Focus Unlock</Text>
                <Text style={styles.checkboxSubtitle}>
                  Restricts distraction apps until this task is completed
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  (!titleInput.trim() || createTaskMutation.isPending) && styles.disabledBtn
                ]}
                disabled={!titleInput.trim() || createTaskMutation.isPending}
                onPress={handleCreateTask}
              >
                {createTaskMutation.isPending ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <Text style={styles.confirmBtnText}>Add Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                style={[
                  styles.confirmBtn,
                  (!reasonInput.trim() || rescheduleTaskMutation.isPending) && styles.disabledBtn
                ]}
                disabled={!reasonInput.trim() || rescheduleTaskMutation.isPending}
                onPress={handleConfirmReschedule}
              >
                {rescheduleTaskMutation.isPending ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <Text style={styles.confirmBtnText}>Save & Log Audit</Text>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  dateSubtitle: {
    fontSize: 12,
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
  taskDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2
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
  estimatedText: {
    fontSize: 11,
    color: theme.colors.textMuted
  },
  actionsFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder
  },
  rescheduleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  rescheduleBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600"
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  deleteBtnText: {
    color: theme.colors.textMuted,
    fontSize: 12
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
    marginBottom: 4
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
  textArea: {
    height: 50,
    textAlignVertical: "top"
  },
  reasonInput: {
    height: 70,
    textAlignVertical: "top"
  },
  goalPillsRow: {
    flexDirection: "row",
    marginBottom: theme.spacing.md
  },
  goalPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    marginRight: 6
  },
  goalPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  goalPillText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "600"
  },
  goalPillTextActive: {
    color: "#0F172A"
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  checkboxIcon: {
    fontSize: 20,
    color: theme.colors.primary,
    paddingTop: 1
  },
  checkboxLabelGroup: {
    flex: 1
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  checkboxSubtitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1
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
