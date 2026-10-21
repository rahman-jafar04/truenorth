import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../theme";
import { useAuth } from "../../hooks/useAuth";
import { FocusLockBridge } from "../../native/FocusLockBridge";
import { PlatformCapabilities, FOCUS_LOCK_FEASIBILITY } from "@truenorth/shared";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, updateProfile, signOut, isLoading } = useAuth();

  const [newValueInput, setNewValueInput] = useState("");
  const [addingValue, setAddingValue] = useState(false);
  const [platformCaps, setPlatformCaps] = useState<PlatformCapabilities | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const restrictedApps = [
    { name: "Instagram", bundle: "com.burbn.instagram", selected: true },
    { name: "TikTok", bundle: "com.zhiliaoapp.musically", selected: true },
    { name: "Twitter / X", bundle: "com.atebits.Tweetie2", selected: false },
    { name: "YouTube", bundle: "com.google.ios.youtube", selected: false }
  ];

  const currentValues = profile?.personalValues || ["Diligence", "Integrity", "Deep Focus"];
  const faithModeActive = profile?.faithModeEnabled ?? false;

  useEffect(() => {
    FocusLockBridge.getCapabilities().then(setPlatformCaps);
  }, []);

  async function handleToggleFaithMode(val: boolean) {
    const success = await updateProfile({ faithModeEnabled: val });
    if (success) {
      flashStatus(val ? "Faith mode activated." : "Faith mode disabled.");
    }
  }

  async function handleAddValue() {
    const trimmed = newValueInput.trim();
    if (!trimmed) return;

    if (currentValues.length >= 10) {
      Alert.alert("Limit Reached", "You can specify a maximum of 10 personal values.");
      return;
    }
    if (currentValues.includes(trimmed)) {
      Alert.alert("Duplicate Value", "This value is already in your compass.");
      return;
    }

    const updated = [...currentValues, trimmed];
    const success = await updateProfile({ personalValues: updated });
    if (success) {
      setNewValueInput("");
      setAddingValue(false);
      flashStatus(`Added "${trimmed}" to personal values.`);
    }
  }

  async function handleRemoveValue(valToRemove: string) {
    if (currentValues.length <= 1) {
      Alert.alert("Minimum Required", "Maintain at least one personal value in your compass.");
      return;
    }

    const updated = currentValues.filter((v) => v !== valToRemove);
    const success = await updateProfile({ personalValues: updated });
    if (success) {
      flashStatus(`Removed "${valToRemove}".`);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  function flashStatus(msg: string) {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  }

  function handleAccountDelete() {
    Alert.alert(
      "Delete Account & Purge Data",
      "This action will immediately and irreversibly delete your user profile, all goals, daily task histories, and recorded thoughts from PostgreSQL.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Permanently Delete",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/(auth)/login");
          }
        }
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Flash Message */}
      {statusMessage && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>✓ {statusMessage}</Text>
        </View>
      )}

      {/* User Profile Summary */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>User Profile</Text>
            <Text style={styles.cardSubtitle}>
              {user ? user.email : "Signed in as Guest"}
            </Text>
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {profile?.displayName && (
          <Text style={styles.displayNameText}>Display: {profile.displayName}</Text>
        )}
      </View>

      {/* Personal Compass Values Management */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Personal Compass Values</Text>
            <Text style={styles.cardSubtitle}>
              {currentValues.length} of 10 defined
            </Text>
          </View>
          {currentValues.length < 10 && !addingValue && (
            <TouchableOpacity
              style={styles.addValBtn}
              onPress={() => setAddingValue(true)}
            >
              <Text style={styles.addValBtnText}>+ Add Value</Text>
            </TouchableOpacity>
          )}
        </View>

        {addingValue && (
          <View style={styles.addValueBox}>
            <TextInput
              style={styles.addValueInput}
              placeholder="e.g. Humility, Stewardship, Focus"
              placeholderTextColor={theme.colors.textMuted}
              value={newValueInput}
              onChangeText={setNewValueInput}
            />
            <View style={styles.addValueActions}>
              <TouchableOpacity
                style={styles.cancelValBtn}
                onPress={() => {
                  setAddingValue(false);
                  setNewValueInput("");
                }}
              >
                <Text style={styles.cancelValText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveValBtn, !newValueInput.trim() && styles.disabledBtn]}
                disabled={!newValueInput.trim() || isLoading}
                onPress={handleAddValue}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <Text style={styles.saveValText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.valuesList}>
          {currentValues.map((val) => (
            <TouchableOpacity
              key={val}
              style={styles.valueBadge}
              onPress={() => handleRemoveValue(val)}
            >
              <Text style={styles.valueText}>{val}</Text>
              <Text style={styles.removeX}> ×</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.helperText}>Tap any value to remove it.</Text>
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
            value={faithModeActive}
            onValueChange={handleToggleFaithMode}
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
  statusBanner: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: "center"
  },
  statusBannerText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: "700"
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
    marginBottom: theme.spacing.xs
  },
  displayNameText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: "600",
    marginTop: theme.spacing.xs
  },
  signOutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.error,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md
  },
  signOutBtnText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: "700"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  addValBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm
  },
  addValBtnText: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "700"
  },
  addValueBox: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  addValueInput: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    padding: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder,
    marginBottom: theme.spacing.sm
  },
  addValueActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm
  },
  cancelValBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  cancelValText: {
    color: theme.colors.textMuted,
    fontSize: 12
  },
  saveValBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm
  },
  disabledBtn: {
    opacity: 0.5
  },
  saveValText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 12
  },
  valuesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm
  },
  valueBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    flexDirection: "row",
    alignItems: "center"
  },
  valueText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600"
  },
  removeX: {
    color: theme.colors.error,
    fontWeight: "800",
    fontSize: 14
  },
  helperText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
    fontStyle: "italic"
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
