import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../theme";
import { FocusLockBridge, FocusTimerSession } from "../../native/FocusLockBridge";
import { apiClient } from "../../services/apiClient";
import { PlatformCapabilities, TaskResponse } from "@truenorth/shared";

import { useAuth } from "../../hooks/useAuth";
import { useTasks, useCompleteTask, useReopenTask } from "../../hooks/useTasks";

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [platformCaps, setPlatformCaps] = useState<PlatformCapabilities | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const { data: todayTasks = [], isLoading: tasksLoading } = useTasks(todayStr);
  const completeTaskMutation = useCompleteTask();
  const reopenTaskMutation = useReopenTask();

  // In-App Focus Timer state
  const [timerSession, setTimerSession] = useState<FocusTimerSession>({
    isActive: false,
    durationMinutes: 25,
    remainingSeconds: 25 * 60,
    startedAt: null
  });
  const [selectedPresetMinutes, setSelectedPresetMinutes] = useState(25);

  const personalValues = profile?.personalValues || ["Diligence", "Integrity", "Deep Focus"];
  const displayName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "Seeker";


  useEffect(() => {
    apiClient
      .getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    FocusLockBridge.getCapabilities().then(setPlatformCaps);
    setTimerSession(FocusLockBridge.getFocusTimerSession());
  }, []);

  // Timer countdown ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerSession.isActive && timerSession.remainingSeconds > 0) {
      interval = setInterval(() => {
        setTimerSession((prev) => {
          if (prev.remainingSeconds <= 1) {
            FocusLockBridge.stopFocusTimer();
            return { ...prev, isActive: false, remainingSeconds: 0 };
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerSession.isActive, timerSession.remainingSeconds]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleStartTimer(minutes: number) {
    setSelectedPresetMinutes(minutes);
    const session = FocusLockBridge.startFocusTimer(minutes);
    setTimerSession(session);
  }

  function handleStopTimer() {
    const session = FocusLockBridge.stopFocusTimer();
    setTimerSession({
      ...session,
      durationMinutes: selectedPresetMinutes,
      remainingSeconds: selectedPresetMinutes * 60
    });
  }

  async function toggleTask(task: TaskResponse) {
    if (task.status === "COMPLETED") {
      await reopenTaskMutation.mutateAsync({
        taskId: task.id,
        reason: "User toggled off in dashboard"
      });
    } else {
      await completeTaskMutation.mutateAsync(task.id);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Backend Integration Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: apiOnline ? theme.colors.success : theme.colors.warning }
            ]}
          />
          <Text style={styles.statusText}>
            Backend: {apiOnline === null ? "Connecting..." : apiOnline ? "Connected (Express API :4000)" : "Offline (Local Prototype)"}
          </Text>
        </View>
        <Text style={styles.prototypeNotice}>PHASE 3 GOALS & TASKS</Text>
      </View>

      {/* User Values & Daily Compass */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.greeting}>Welcome, {displayName}</Text>
          <View style={styles.prototypeChip}>
            <Text style={styles.prototypeChipText}>
              {profile ? "LIVE VALUES" : "DEFAULT VALUES"}
            </Text>
          </View>
        </View>
        <Text style={styles.subgreeting}>Your personal north star virtues for today:</Text>

        <View style={styles.valuesContainer}>
          {personalValues.map((val) => (
            <View key={val} style={styles.valueChip}>
              <Text style={styles.valueChipText}>★ {val}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reliable In-App Focus Timer */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>In-App Focus Timer</Text>
          <View style={styles.reliableBadge}>
            <Text style={styles.reliableBadgeText}>Reliable Focus Active</Text>
          </View>
        </View>

        {/* Honest Platform Capabilities Check Notice */}
        <View style={styles.capsNotice}>
          <Text style={styles.capsTitle}>
            Platform: {platformCaps?.platform.toUpperCase() || "MOBILE"} (Unverified Device Blocking)
          </Text>
          <Text style={styles.capsBody}>
            {platformCaps?.entitlementOrPermissionNotice ||
              "Native OS app blocking requires unverified entitlements. TrueNorth enforces focus using this reliable in-app timer."}
          </Text>
        </View>

        {/* Timer Display */}
        <View style={styles.timerCenter}>
          <Text style={styles.countdownDigits}>
            {formatTime(timerSession.remainingSeconds)}
          </Text>
          <Text style={styles.countdownLabel}>
            {timerSession.isActive ? "Deep Focus Session in Progress" : "Ready to Focus"}
          </Text>
        </View>

        {/* Preset Selector */}
        {!timerSession.isActive && (
          <View style={styles.presetRow}>
            {[15, 25, 45, 60].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.presetBtn,
                  selectedPresetMinutes === mins && styles.presetBtnActive
                ]}
                onPress={() => {
                  setSelectedPresetMinutes(mins);
                  setTimerSession((prev) => ({
                    ...prev,
                    durationMinutes: mins,
                    remainingSeconds: mins * 60
                  }));
                }}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedPresetMinutes === mins && styles.presetTextActive
                  ]}
                >
                  {mins}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timer Action Buttons */}
        <View style={styles.timerActionsRow}>
          {timerSession.isActive ? (
            <TouchableOpacity
              style={styles.stopTimerBtn}
              onPress={handleStopTimer}
            >
              <Text style={styles.stopTimerText}>End Focus Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startTimerBtn}
              onPress={() => handleStartTimer(selectedPresetMinutes)}
            >
              <Text style={styles.startTimerText}>
                Start {selectedPresetMinutes}-Minute Focus
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Today's Tasks */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Today's Critical Tasks</Text>
          <TouchableOpacity onPress={() => router.push("/(app)/tasks")}>
            <Text style={styles.linkText}>View All Tasks →</Text>
          </TouchableOpacity>
        </View>

        {todayTasks.length === 0 ? (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 13, marginBottom: 8 }}>
              No tasks planned for today.
            </Text>
            <TouchableOpacity
              style={[styles.presetBtn, styles.presetBtnActive]}
              onPress={() => router.push("/(app)/tasks")}
            >
              <Text style={styles.presetTextActive}>+ Plan Today's Tasks</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todayTasks.slice(0, 5).map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskItem}
              onPress={() => toggleTask(task)}
            >
              <Text style={styles.taskCheckbox}>
                {task.status === "COMPLETED" ? "☑" : "☐"}
              </Text>
              <View style={styles.taskInfo}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.status === "COMPLETED" && styles.taskTitleCompleted
                  ]}
                >
                  {task.title}
                </Text>
                {task.isRequiredForUnlock && (
                  <Text style={styles.requiredBadge}>Required for Focus Unlock</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>


      {/* Quick Navigation Cards */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(app)/thought-capture")}
        >
          <Text style={styles.actionIcon}>💭</Text>
          <Text style={styles.actionTitle}>Reflect Thought</Text>
          <Text style={styles.actionSub}>Live AI Guidance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(app)/daily-report")}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionTitle}>Daily Review</Text>
          <Text style={styles.actionSub}>Audit Log Analytics</Text>
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
  statusBar: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.textSecondary
  },
  prototypeNotice: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: "700"
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  greeting: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  subgreeting: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.xs
  },
  prototypeChip: {
    backgroundColor: "rgba(148, 163, 184, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm
  },
  prototypeChipText: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.textMuted
  },
  valuesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs
  },
  valueChip: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  valueChipText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600"
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  reliableBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm
  },
  reliableBadgeText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: "700"
  },
  capsNotice: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md
  },
  capsTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.warning,
    marginBottom: 2
  },
  capsBody: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 15
  },
  timerCenter: {
    alignItems: "center",
    paddingVertical: theme.spacing.sm
  },
  countdownDigits: {
    fontSize: 48,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: 2
  },
  countdownLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm
  },
  presetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  presetBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  presetText: {
    color: theme.colors.textSecondary,
    fontWeight: "700",
    fontSize: 13
  },
  presetTextActive: {
    color: "#0F172A"
  },
  timerActionsRow: {
    marginTop: theme.spacing.sm
  },
  startTimerBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: "center"
  },
  startTimerText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 14
  },
  stopTimerBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.error,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: "center"
  },
  stopTimerText: {
    color: theme.colors.error,
    fontWeight: "700",
    fontSize: 14
  },
  linkText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "600"
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    gap: theme.spacing.sm
  },
  taskCheckbox: {
    fontSize: 18,
    color: theme.colors.primary
  },
  taskInfo: {
    flex: 1
  },
  taskTitle: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: "600"
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: theme.colors.textMuted
  },
  requiredBadge: {
    fontSize: 11,
    color: theme.colors.warning,
    marginTop: 2
  },
  actionsRow: {
    flexDirection: "row",
    gap: theme.spacing.md
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  actionSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2
  }
});
