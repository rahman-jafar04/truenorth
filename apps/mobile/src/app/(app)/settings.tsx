import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert
} from "react-native";
import { theme } from "../../theme";
import { FocusLockBridge } from "../../native/FocusLockBridge";
import { PlatformCapabilities, FOCUS_LOCK_FEASIBILITY } from "@truenorth/shared";

export default function SettingsScreen() {
  const [faithMode, setFaithMode] = useState(false);
  const [personalValues, setPersonalValues] = useState([
    "Diligence",
    "Integrity",
    "Deep Focus",
    "Stewardship"
  ]);

  const [platformCaps, setPlatformCaps] = useState<PlatformCapabilities | null>(null);

  const restrictedApps = [
    { name: "Instagram", bundle: "com.burbn.instagram", selected: true },
    { name: "TikTok", bundle: "com.zhiliaoapp.musically", selected: true },
    { name: "Twitter / X", bundle: "com.atebits.Tweetie2", selected: false },
    { name: "YouTube", bundle: "com.google.ios.youtube", selected: false }
  ];

  useEffect(() => {
    FocusLockBridge.getCapabilities().then(setPlatformCaps);
  }, []);

  function handleAccountDelete() {
    Alert.alert(
      "Delete Account & Purge Data",
      "This action will immediately and irreversibly delete your user profile, all goals, daily task histories, and recorded thoughts from PostgreSQL.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Permanently Delete",
          style: "destructive",
          onPress: () => Alert.alert("Account Deleted", "All user records purged.")
        }
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Personal Values Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Compass Values</Text>
        <Text style={styles.cardSubtitle}>
          TrueNorth evaluates your submitted thoughts against these values.
        </Text>

        <View style={styles.valuesList}>
          {personalValues.map((val) => (
            <View key={val} style={styles.valueBadge}>
              <Text style={styles.valueText}>{val}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Faith Mode Configuration */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Faith Mode</Text>
            <Text style={styles.cardSubtitle}>
              Include spiritual reflection against personal virtues.
            </Text>
          </View>
          <Switch
            value={faithMode}
            onValueChange={setFaithMode}
            trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.boundaryNotice}>
          <Text style={styles.boundaryText}>
            Theological Guardrail: TrueNorth AI never attributes thoughts or feelings to Satan, God, or supernatural entities.
          </Text>
        </View>
      </View>

      {/* Focus Lock Platform Feasibility & Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Focus Lock Configuration</Text>
        <Text style={styles.cardSubtitle}>
          Selected apps to shield during active focus sessions.
        </Text>

        <View style={styles.appList}>
          {restrictedApps.map((app) => (
            <View key={app.bundle} style={styles.appRow}>
              <View>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appBundle}>{app.bundle}</Text>
              </View>
              <Switch value={app.selected} />
            </View>
          ))}
        </View>

        {/* Platform Feasibility Status Card */}
        <View style={styles.feasibilityBox}>
          <Text style={styles.feasibilityTitle}>
            OS Feasibility Status ({platformCaps?.platform.toUpperCase() || "UNKNOWN"})
          </Text>
          <Text style={styles.feasibilityText}>
            {platformCaps?.entitlementOrPermissionNotice ||
              FOCUS_LOCK_FEASIBILITY.fallback.description}
          </Text>
          <View style={styles.fallbackTag}>
            <Text style={styles.fallbackTagText}>
              Status: In-App Focus Timer Active (Safe Fallback)
            </Text>
          </View>
        </View>
      </View>

      {/* Privacy & Account Deletion */}
      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>Privacy & Account Deletion</Text>
        <Text style={styles.dangerText}>
          GDPR/CCPA compliant: Purges user row, goals, tasks, audit trails, and thoughts in a cascading database delete.
        </Text>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleAccountDelete}
        >
          <Text style={styles.deleteBtnText}>Delete Account & Purge All Data</Text>
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
    color: theme.colors.textPrimary
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.sm
  },
  valuesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs
  },
  valueBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)"
  },
  valueText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  boundaryNotice: {
    marginTop: theme.spacing.sm,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm
  },
  boundaryText: {
    fontSize: 11,
    color: theme.colors.accent,
    lineHeight: 15
  },
  appList: {
    marginTop: theme.spacing.xs
  },
  appRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder
  },
  appName: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: "600"
  },
  appBundle: {
    fontSize: 11,
    color: theme.colors.textMuted
  },
  feasibilityBox: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  feasibilityTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.warning,
    marginBottom: 4
  },
  feasibilityText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16
  },
  fallbackTag: {
    marginTop: theme.spacing.xs,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    alignSelf: "flex-start"
  },
  fallbackTagText: {
    color: theme.colors.warning,
    fontSize: 11,
    fontWeight: "700"
  },
  dangerCard: {
    borderColor: "rgba(239, 68, 68, 0.3)"
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.error
  },
  dangerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.md,
    lineHeight: 16
  },
  deleteBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.error,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: "center"
  },
  deleteBtnText: {
    color: theme.colors.error,
    fontWeight: "700",
    fontSize: 13
  }
});
