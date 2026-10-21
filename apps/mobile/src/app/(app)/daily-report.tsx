import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { theme } from "../../theme";
import { useDailyReport } from "../../hooks/useTasks";

export default function DailyReportScreen() {
  const today = new Date();
  const d0 = today.toISOString().slice(0, 10);
  const d1 = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
  const d2 = new Date(today.getTime() - 86400000 * 2).toISOString().slice(0, 10);

  const availableDates = [d0, d1, d2];
  const [reportDate, setReportDate] = useState(d0);

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
        {availableDates.map((date) => (
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
              {date === d0 ? "Today" : date === d1 ? "Yesterday" : date}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Calculating historical day audit report...</Text>
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
            <Text style={styles.scoreTitle}>Completion Rate</Text>
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
          </View>

          {/* Audit Model Integrity Notice */}
          <View style={styles.integrityCard}>
            <Text style={styles.integrityTitle}>Immutable Historical Record</Text>
            <Text style={styles.integrityText}>
              This review is calculated directly from the immutable task audit log. Rescheduling tasks today does not rewrite yesterday’s historical completion rate.
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
    fontSize: 12,
    fontWeight: "700"
  },
  datePillTextActive: {
    color: "#0F172A"
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
    fontSize: 13,
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
    minWidth: "45%",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  metricVal: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
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
