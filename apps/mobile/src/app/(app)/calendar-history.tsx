import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from "react-native";
import { theme } from "../../theme";
import { useTasks } from "../../hooks/useTasks";
import { useThoughts, useDeleteThought } from "../../hooks/useThoughts";
import { useCalendarAnalytics } from "../../hooks/useReports";
import { ThoughtRecord } from "@truenorth/shared";

function getRecentDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export default function CalendarHistoryScreen() {
  const recentDates = useMemo(() => getRecentDates(), []);
  const todayIso = recentDates[0];
  const startDateIso = recentDates[recentDates.length - 1];
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const { data: analytics, isLoading: analyticsLoading } = useCalendarAnalytics(
    startDateIso,
    todayIso
  );
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(selectedDate);
  const { data: thoughts = [], isLoading: thoughtsLoading } = useThoughts();
  const deleteThoughtMutation = useDeleteThought();

  const dayThoughts = useMemo(() => {
    return thoughts.filter((t) => t.createdAt.slice(0, 10) === selectedDate);
  }, [thoughts, selectedDate]);

  function handleDeleteThought(thoughtId: string) {
    Alert.alert(
      "Permanently Delete Thought",
      "This thought and its AI guidance will be permanently purged from database records.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => {
            deleteThoughtMutation.mutate(thoughtId, {
              onError: (err) => {
                Alert.alert("Delete Failed", err.message || "Failed to delete thought.");
              }
            });
          }
        }
      ]
    );
  }

  // Lookup day summary from analytics
  const daySummaryMap = useMemo(() => {
    const map = new Map<string, { completionRatePercent: number; hasActivity: boolean; completedCount: number }>();
    if (analytics?.days) {
      for (const d of analytics.days) {
        map.set(d.date, {
          completionRatePercent: d.completionRatePercent,
          hasActivity: d.hasActivity,
          completedCount: d.completedCount
        });
      }
    }
    return map;
  }, [analytics]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Analytics & Streak Banner */}
      <View style={styles.streakBanner}>
        <View style={styles.streakLeft}>
          <Text style={styles.streakIcon}>🔥</Text>
          <View>
            <Text style={styles.streakTitle}>
              {analytics?.currentStreakDays ?? 0} Day Streak
            </Text>
            <Text style={styles.streakSub}>
              Best: {analytics?.bestStreakDays ?? 0} days | Completion: {analytics?.overallCompletionRate ?? 0}%
            </Text>
          </View>
        </View>
        {analyticsLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
      </View>

      {/* Day Selector */}
      <View style={styles.dateSelectorRow}>
        {recentDates.map((d) => {
          const summary = daySummaryMap.get(d);
          const hasCompleted = (summary?.completedCount ?? 0) > 0;
          return (
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
                {d === todayIso ? "Today" : d.slice(5)}
              </Text>
              {hasCompleted && <View style={styles.completedDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.timezoneNotice}>
        <Text style={styles.timezoneText}>
          Selected: {selectedDate} | Timezone: {analytics?.timezone || "UTC"}
        </Text>
      </View>

      {/* Historical Tasks for Date */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tasks on {selectedDate}</Text>
        {tasksLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 12 }} />
        ) : tasks.length === 0 ? (
          <Text style={styles.emptyText}>No recorded tasks for this date.</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.historyTaskItem}>
              <View style={styles.taskStatusRow}>
                <Text
                  style={[
                    styles.statusBadge,
                    task.status === "COMPLETED"
                      ? styles.statusCompleted
                      : task.status === "RESCHEDULED"
                      ? styles.statusRescheduled
                      : styles.statusPlanned
                  ]}
                >
                  {task.status}
                </Text>
                <Text style={styles.taskName}>{task.title}</Text>
              </View>

              {task.rescheduledToDate && (
                <View style={styles.auditReasonBox}>
                  <Text style={styles.auditReasonText}>
                    Rescheduled to: {task.rescheduledToDate}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Past Thoughts on Selected Date */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Reflected Thoughts</Text>
          {thoughtsLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>

        {thoughtsLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 12 }} />
        ) : dayThoughts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No reflected thoughts recorded on {selectedDate}.</Text>
            <Text style={styles.emptySubtext}>
              Capture thoughts on the Thought Capture tab to receive guarded guidance.
            </Text>
          </View>
        ) : (
          <View style={styles.thoughtsList}>
            {dayThoughts.map((thought: ThoughtRecord) => (
              <View key={thought.id} style={styles.thoughtItem}>
                <View style={styles.thoughtHeaderRow}>
                  {thought.contextTag && (
                    <Text style={styles.contextBadge}>{thought.contextTag}</Text>
                  )}
                  {thought.guidance?.alignmentScore !== undefined && (
                    <Text style={styles.alignmentPill}>
                      Alignment: {thought.guidance.alignmentScore}% (
                      {thought.guidance.alignmentStatus})
                    </Text>
                  )}
                </View>

                <Text style={styles.thoughtSnippet}>"{thought.content}"</Text>

                {thought.guidance?.directReasoning && (
                  <View style={styles.reasoningBox}>
                    <Text style={styles.reasoningLabel}>AI Insight:</Text>
                    <Text style={styles.reasoningContent} numberOfLines={3}>
                      {thought.guidance.directReasoning}
                    </Text>
                  </View>
                )}

                <View style={styles.thoughtFooter}>
                  <Text style={styles.timeLabel}>
                    {new Date(thought.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteThought(thought.id)}
                    disabled={deleteThoughtMutation.isPending}
                  >
                    <Text style={styles.deleteLink}>
                      {deleteThoughtMutation.isPending ? "Purging..." : "Delete Permanently"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
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
  streakBanner: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  streakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  streakIcon: {
    fontSize: 28
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  streakSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  dateSelectorRow: {
    flexDirection: "row",
    gap: 4
  },
  dateTab: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    minHeight: 44
  },
  dateTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  dateTabText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700"
  },
  dateTabTextActive: {
    color: "#0F172A"
  },
  completedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.success,
    marginTop: 3
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  emptyBox: {
    paddingVertical: theme.spacing.md
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13
  },
  emptySubtext: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 4
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
  statusPlanned: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    color: theme.colors.textSecondary
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
  thoughtsList: {
    gap: theme.spacing.sm
  },
  thoughtItem: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: theme.spacing.xs
  },
  thoughtHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  contextBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    textTransform: "uppercase"
  },
  alignmentPill: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: "700"
  },
  thoughtSnippet: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
    fontStyle: "italic"
  },
  reasoningBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginTop: 4
  },
  reasoningLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.textMuted,
    textTransform: "uppercase"
  },
  reasoningContent: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16
  },
  thoughtFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceBorder
  },
  timeLabel: {
    fontSize: 11,
    color: theme.colors.textMuted
  },
  deleteLink: {
    fontSize: 11,
    color: theme.colors.error,
    fontWeight: "600"
  }
});
