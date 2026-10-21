import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { theme } from "../../theme";
import { useDailyReport } from "../../hooks/useReports";

function getPastDates(daysCount: number = 7): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function DailyReportScreen() {
  const pastDates = useMemo(() => getPastDates(7), []);
  const todayIso = pastDates[0];
  const [reportDate, setReportDate] = useState<string>(todayIso);

  const { data: report, isLoading, isError, refetch } = useDailyReport(reportDate);

  const reportData = report || {
    date: reportDate,
    timezone: "UTC",
    totalTasks: 0,
    plannedCount: 0,
    completedCount: 0,
    pendingCount: 0,
    rescheduledCount: 0,
    reopenedCount: 0,
    completionRatePercent: 0,
    tasks: [],
    thoughtsLoggedCount: 0,
    focusLockSessionsCount: 0
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Date Switcher */}
      <View style={styles.dateSelector}>
        {pastDates.map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              styles.datePill,
              reportDate === date && styles.datePillActive
            ]}
            onPress={() => setReportDate(date)}
          >
            <Text
              style={[
                styles.datePillText,
                reportDate === date && styles.datePillTextActive
              ]}
            >
              {date === todayIso ? "Today" : date === pastDates[1] ? "Yest" : date.slice(5)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateSubRow}>
        <Text style={styles.dateSubText}>
          Date: {reportDate} | Timezone: {reportData.timezone || "UTC"}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Calculating immutable audit report...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Could not generate report for {reportDate}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Completion Rate Scorecard */}
          <View style={styles.heroScorecard}>
            <Text style={styles.scoreTitle}>DAILY COMPLETION RATE</Text>
            <Text style={styles.scoreNumber}>{reportData.completionRatePercent}%</Text>
            <Text style={styles.scoreSub}>
              {reportData.completedCount} of {reportData.plannedCount} planned tasks completed
            </Text>
          </View>

          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{reportData.completedCount}</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.success }]}>
                Completed
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{reportData.rescheduledCount}</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.accent }]}>
                Rescheduled
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{reportData.pendingCount}</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.warning }]}>
                Pending
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{reportData.reopenedCount}</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>
                Reopened
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{reportData.thoughtsLoggedCount}</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.primary }]}>
                Thoughts
              </Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{reportData.focusLockSessionsCount}</Text>
              <Text style={[styles.metricLabel, { color: theme.colors.accent }]}>
                Focus Sessions
              </Text>
            </View>
          </View>

          {/* Tasks Breakdown */}
          <View style={styles.tasksCard}>
            <Text style={styles.cardTitle}>Day Tasks ({reportData.tasks.length})</Text>
            {reportData.tasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks planned or active on this date.</Text>
            ) : (
              reportData.tasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                  <View style={styles.taskMeta}>
                    <Text
                      style={[
                        styles.taskStatusBadge,
                        task.status === "COMPLETED"
                          ? styles.statusCompleted
                          : task.status === "RESCHEDULED"
                          ? styles.statusRescheduled
                          : styles.statusPlanned
                      ]}
                    >
                      {task.status}
                    </Text>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                  </View>
                  {task.completedAt && (
                    <Text style={styles.taskTime}>
                      Done at {new Date(task.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  )}
                  {task.rescheduledToDate && (
                    <Text style={styles.taskRescheduledInfo}>
                      &rarr; Moved to {task.rescheduledToDate}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Audit Model Integrity Notice */}
          <View style={styles.integrityCard}>
            <Text style={styles.integrityTitle}>Immutable Historical Record</Text>
            <Text style={styles.integrityText}>
              This review is calculated directly from immutable task audit logs and thought timestamps. Rescheduling or modifying tasks today never silently rewrites historical completion records.
            </Text>
          </View>
        </>
      )}
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
  dateSelector: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  datePill: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  datePillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  datePillText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700"
  },
  datePillTextActive: {
    color: "#0F172A"
  },
  dateSubRow: {
    alignItems: "flex-end"
  },
  dateSubText: {
    fontSize: 11,
    color: theme.colors.textMuted
  },
  centerBox: {
    padding: theme.spacing.xl,
    alignItems: "center",
    gap: theme.spacing.sm
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 13
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    gap: theme.spacing.xs
  },
  errorText: {
    color: theme.colors.error,
    fontWeight: "700",
    fontSize: 13
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
  heroScorecard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  scoreTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 1
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "800",
    color: theme.colors.primary,
    marginVertical: 4
  },
  scoreSub: {
    fontSize: 13,
    color: theme.colors.textSecondary
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  metricCard: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  metricVal: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  },
  tasksCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  taskRow: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder
  },
  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  taskStatusBadge: {
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm
  },
  statusCompleted: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    color: theme.colors.success
  },
  statusRescheduled: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    color: theme.colors.accent
  },
  statusPlanned: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    color: theme.colors.textSecondary
  },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary
  },
  taskTime: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
    marginLeft: 2
  },
  taskRescheduledInfo: {
    fontSize: 11,
    color: theme.colors.accent,
    marginTop: 4,
    marginLeft: 2,
    fontStyle: "italic"
  },
  integrityCard: {
    backgroundColor: "rgba(56, 189, 248, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md
  },
  integrityTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 2
  },
  integrityText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16
  }
});
