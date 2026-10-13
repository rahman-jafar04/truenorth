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

export default function DashboardScreen() {
  const router = useRouter();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [timerSession, setTimerSession] = useState<FocusTimerSession>({
    isActive: false,
    durationMinutes: 25,
    remainingSeconds: 1500,
    startedAt: null
  });

  const personalValues = ["Diligence", "Integrity", "Deep Focus"];
  const todayTasks = [
    { id: "1", title: "Complete System Architecture RFC", completed: true, required: true },
    { id: "2", title: "Review Goal Alignment with Faith Mode", completed: false, required: true },
    { id: "3", title: "Exercise & Physical Endurance (30m)", completed: false, required: false }
  ];

  useEffect(() => {
    apiClient
      .getHealth()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    setTimerSession(FocusLockBridge.getFocusTimerSession());
  }, []);

  function toggleFocusTimer() {
    if (timerSession.isActive) {
      setTimerSession(FocusLockBridge.stopFocusTimer());
    } else {
      setTimerSession(FocusLockBridge.startFocusTimer(25));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Live / Prototype Integration Banner */}
      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: apiOnline ? theme.colors.success : theme.colors.warning }
            ]}
          />
          <Text style={styles.statusText}>
            Backend: {apiOnline === null ? "Probing..." : apiOnline ? "Connected (Live Express API)" : "Offline (Local Preview)"}
          </Text>
        </View>
        <Text style={styles.prototypeNotice}>Phase 1 Foundation</Text>
      </View>

      {/* User Values & Daily Compass */}
      <View style={styles.card}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.subgreeting}>Here is your TrueNorth compass for today.</Text>

        <View style={styles.valuesContainer}>
          {personalValues.map((val) => (
            <View key={val} style={styles.valueChip}>
              <Text style={styles.valueChipText}>★ {val}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Focus Lock / In-App Focus Timer Fallback Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Focus Lock Session</Text>
          <View style={styles.badgeFallback}>
            <Text style={styles.badgeFallbackText}>In-App Timer Active</Text>
          </View>
        </View>

        <Text style={styles.cardDescription}>
          Restricts social media distraction. In Expo/un-entitled runtimes, TrueNorth uses the in-app focus timer.
        </Text>

        <View style={styles.timerRow}>
          <Text style={styles.timerDisplay}>
            {timerSession.isActive ? "25:00 Remaining" : "25 min Pomodoro"}
          </Text>
          <TouchableOpacity
            style={[styles.timerButton, timerSession.isActive && styles.timerButtonActive]}
            onPress={toggleFocusTimer}
          >
            <Text style={styles.timerButtonText}>
              {timerSession.isActive ? "Stop Session" : "Start Focus"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Priority Tasks */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Today's Critical Tasks</Text>
          <TouchableOpacity onPress={() => router.push("/(app)/tasks")}>
            <Text style={styles.linkText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {todayTasks.map((task) => (
          <View key={task.id} style={styles.taskItem}>
            <Text style={styles.taskCheckbox}>{task.completed ? "☑" : "☐"}</Text>
            <View style={styles.taskInfo}>
              <Text
                style={[
                  styles.taskTitle,
                  task.completed && styles.taskTitleCompleted
                ]}
              >
                {task.title}
              </Text>
              {task.required && (
                <Text style={styles.requiredBadge}>Required for Focus Unlock</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(app)/thought-capture")}
        >
          <Text style={styles.actionIcon}>💭</Text>
          <Text style={styles.actionTitle}>Reflect Thought</Text>
          <Text style={styles.actionSub}>AI Alignment Check</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push("/(app)/daily-report")}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionTitle}>Daily Review</Text>
          <Text style={styles.actionSub}>Task Completion Log</Text>
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
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  subgreeting: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.sm
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
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  badgeFallback: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm
  },
  badgeFallbackText: {
    color: theme.colors.warning,
    fontSize: 11,
    fontWeight: "700"
  },
  cardDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 18
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  timerDisplay: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  timerButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md
  },
  timerButtonActive: {
    backgroundColor: theme.colors.error
  },
  timerButtonText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 13
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
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  actionSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2
  }
});
