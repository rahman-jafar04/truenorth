import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { theme } from "../../theme";

export default function DailyReportScreen() {
  const [reportDate, setReportDate] = useState("2026-10-12");

  const availableDates = ["2026-10-13", "2026-10-12", "2026-10-11"];

  // Mock report adhering strictly to DailyReportSchema
  const reportData = {
    date: reportDate,
    timezone: "UTC",
    totalTasks: 4,
    plannedCount: 4,
    completedCount: 3,
    pendingCount: 0,
    rescheduledCount: 1,
    reopenedCount: 0,
    completionRatePercent: 75,
    thoughtsLoggedCount: 2,
    focusLockSessionsCount: 3
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
              {date === "2026-10-13" ? "Today" : date}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Completion Rate Scorecard */}
      <View style={styles.heroScorecard}>
        <Text style={styles.scoreTitle}>Completion Rate</Text>
        <Text style={styles.scoreNumber}>{reportData.completionRatePercent}%</Text>
        <Text style={styles.scoreSub}>
          {reportData.completedCount} of {reportData.totalTasks} planned tasks completed
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
          <Text style={styles.metricVal}>{reportData.focusLockSessionsCount}</Text>
          <Text style={[styles.metricLabel, { color: theme.colors.primary }]}>
            Focus Sessions
          </Text>
        </View>
      </View>

      {/* Audit Model Integrity Notice */}
      <View style={styles.integrityCard}>
        <Text style={styles.integrityTitle}>Immutable Historical Record</Text>
        <Text style={styles.integrityText}>
          This review is calculated directly from the immutable task audit log. Rescheduling tasks today does not rewrite yesterday's 75% rate.
        </Text>
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
