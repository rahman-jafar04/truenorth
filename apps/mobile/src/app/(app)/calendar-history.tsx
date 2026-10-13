import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert
} from "react-native";
import { theme } from "../../theme";

export default function CalendarHistoryScreen() {
  const [selectedDate, setSelectedDate] = useState("2026-10-12");

  const pastDates = ["2026-10-13", "2026-10-12", "2026-10-11", "2026-10-10"];

  const historicalTasks: Record<
    string,
    Array<{
      id: string;
      title: string;
      status: string;
      rescheduledTo?: string;
      rescheduleReason?: string;
    }>
  > = {
    "2026-10-12": [
      {
        id: "h1",
        title: "Database Architecture Specification",
        status: "COMPLETED"
      },
      {
        id: "h2",
        title: "Focus Lock Native Feasibility Whitepaper",
        status: "RESCHEDULED",
        rescheduledTo: "2026-10-13",
        rescheduleReason: "Needed in-depth review of Apple FamilyControls entitlement"
      }
    ],
    "2026-10-11": [
      {
        id: "h3",
        title: "Initial Monorepo Research",
        status: "COMPLETED"
      }
    ]
  };

  const dayTasks = historicalTasks[selectedDate] || [];

  function handleDeleteThought(thoughtId: string) {
    Alert.alert(
      "Permanently Delete Thought",
      "This thought and its AI guidance will be permanently purged from database records.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Permanently", style: "destructive", onPress: () => console.log("Deleted", thoughtId) }
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Day Selector */}
      <View style={styles.dateSelectorRow}>
        {pastDates.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.dateTab,
              selectedDate === d && styles.dateTabActive
            ]}
            onPress={() => setSelectedDate(d)}
          >
            <Text
              style={[
                styles.dateTabText,
                selectedDate === d && styles.dateTabTextActive
              ]}
            >
              {d === "2026-10-13" ? "Today" : d.slice(5)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.timezoneNotice}>
        <Text style={styles.timezoneText}>Timezone: Local System / UTC-Aligned</Text>
      </View>

      {/* Historical Tasks for Date */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tasks on {selectedDate}</Text>
        {dayTasks.length === 0 ? (
          <Text style={styles.emptyText}>No recorded tasks for this date.</Text>
        ) : (
          dayTasks.map((task) => (
            <View key={task.id} style={styles.historyTaskItem}>
              <View style={styles.taskStatusRow}>
                <Text
                  style={[
                    styles.statusBadge,
                    task.status === "COMPLETED"
                      ? styles.statusCompleted
                      : styles.statusRescheduled
                  ]}
                >
                  {task.status}
                </Text>
                <Text style={styles.taskName}>{task.title}</Text>
              </View>

              {task.rescheduleReason && (
                <View style={styles.auditReasonBox}>
                  <Text style={styles.auditReasonText}>
                    Rescheduled to {task.rescheduledTo}: "{task.rescheduleReason}"
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Past Thoughts on Selected Date */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reflected Thoughts</Text>
        <View style={styles.thoughtItem}>
          <Text style={styles.thoughtSnippet}>
            "Wrestled with procrastination regarding Focus Lock native implementation complexity."
          </Text>
          <View style={styles.thoughtFooter}>
            <Text style={styles.alignmentPill}>Alignment: 75%</Text>
            <TouchableOpacity onPress={() => handleDeleteThought("th-12")}>
              <Text style={styles.deleteLink}>Delete Permanently</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  dateSelectorRow: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  dateTab: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  dateTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  dateTabText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700"
  },
  dateTabTextActive: {
    color: "#0F172A"
  },
  timezoneNotice: {
    alignItems: "flex-end"
  },
  timezoneText: {
    fontSize: 11,
    color: theme.colors.textMuted
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  historyTaskItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder
  },
  taskStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  statusBadge: {
    fontSize: 11,
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
  taskName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600"
  },
  auditReasonBox: {
    backgroundColor: theme.colors.background,
    padding: 6,
    borderRadius: theme.borderRadius.sm,
    marginTop: 6
  },
  auditReasonText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: "italic"
  },
  thoughtItem: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  thoughtSnippet: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18
  },
  thoughtFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.sm
  },
  alignmentPill: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: "700"
  },
  deleteLink: {
    fontSize: 11,
    color: theme.colors.error,
    fontWeight: "600"
  }
});
