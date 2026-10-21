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
import {
  useFocusLockPolicy,
  useUpdateFocusLockPolicy,
  useActiveFocusLockException,
  useRequestFocusLockException
} from "../../hooks/useFocusLock";
import {
  PlatformCapabilities,
  FOCUS_LOCK_FEASIBILITY,
  RestrictedApp
} from "@truenorth/shared";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, updateProfile, signOut, deleteAccount, isLoading } = useAuth();

  const [newValueInput, setNewValueInput] = useState("");
  const [addingValue, setAddingValue] = useState(false);
  const [platformCaps, setPlatformCaps] = useState<PlatformCapabilities | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Focus Lock server state
  const { data: policy, isLoading: policyLoading } = useFocusLockPolicy();
  const updatePolicyMutation = useUpdateFocusLockPolicy();
  const { data: activeException } = useActiveFocusLockException();
  const requestExceptionMutation = useRequestFocusLockException();

  // Emergency exception request modal
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionMinutes, setExceptionMinutes] = useState(15);

  // In-App Focus Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);

  useEffect(() => {
    FocusLockBridge.getCapabilities().then(setPlatformCaps);
  }, []);

  // Ticking effect for active timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (timerActive && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (remainingSeconds === 0 && timerActive) {
      setTimerActive(false);
      Alert.alert("Focus Session Complete", "Well done! Your scheduled focus session has concluded.");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, remainingSeconds]);

  const currentValues = profile?.personalValues || ["Diligence", "Integrity", "Deep Focus"];
  const faithModeActive = profile?.faithModeEnabled ?? false;

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

  function handleToggleRestrictedApp(bundleOrPackageId: string) {
    if (!policy) return;

    const existingApps = policy.restrictedApps || [];
    const isPresent = existingApps.some((a) => a.bundleOrPackageId === bundleOrPackageId);

    let updatedApps: RestrictedApp[];
    if (isPresent) {
      updatedApps = existingApps.filter((a) => a.bundleOrPackageId !== bundleOrPackageId);
    } else {
      const knownNames: Record<string, string> = {
        "com.burbn.instagram": "Instagram",
        "com.zhiliaoapp.musically": "TikTok",
        "com.atebits.Tweetie2": "Twitter / X",
        "com.google.ios.youtube": "YouTube"
      };
      updatedApps = [
        ...existingApps,
        {
          id: bundleOrPackageId,
          name: knownNames[bundleOrPackageId] || "App",
          bundleOrPackageId
        }
      ];
    }

    updatePolicyMutation.mutate({ restrictedApps: updatedApps });
  }

  function handleToggleRequireTasks(val: boolean) {
    updatePolicyMutation.mutate({ requireTasksCompleted: val });
  }

  function handleToggleStrictMode(val: boolean) {
    updatePolicyMutation.mutate({ strictModeEnabled: val });
  }

  function handleStartTimer(minutes: number) {
    setTimerMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setTimerActive(true);
    FocusLockBridge.startFocusTimer(minutes);
    flashStatus(`Started ${minutes}-minute in-app focus session.`);
  }

  function handleStopTimer() {
    setTimerActive(false);
    FocusLockBridge.stopFocusTimer();
    flashStatus("Focus session ended.");
  }

  function handleRequestExceptionSubmit() {
    if (!policy?.id) {
      Alert.alert("Error", "Policy not initialized.");
      return;
    }
    if (exceptionReason.trim().length < 5) {
      Alert.alert("Reason Required", "Please enter at least 5 characters explaining this exception.");
      return;
    }

    requestExceptionMutation.mutate(
      {
        policyId: policy.id,
        durationMinutes: exceptionMinutes,
        reason: exceptionReason.trim()
      },
      {
        onSuccess: (res) => {
          setShowExceptionModal(false);
          setExceptionReason("");
          Alert.alert("Exception Granted", `Granted ${res.durationMinutes} minutes of unshielded access.`);
        },
        onError: (err) => {
          Alert.alert("Request Failed", err.message || "Could not request exception.");
        }
      }
    );
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
          text: "Delete Irreversibly",
          style: "destructive",
          onPress: async () => {
            const success = await deleteAccount();
            if (success) {
              router.replace("/(auth)/login");
            } else {
              Alert.alert("Error", "Could not delete account. Please try again.");
            }
          }
        }
      ]
    );
  }

  const defaultCatalog = [
    { name: "Instagram", bundle: "com.burbn.instagram" },
    { name: "TikTok", bundle: "com.zhiliaoapp.musically" },
    { name: "Twitter / X", bundle: "com.atebits.Tweetie2" },
    { name: "YouTube", bundle: "com.google.ios.youtube" }
  ];

  const formatTimerTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {statusMessage && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>{statusMessage}</Text>
        </View>
      )}

      {/* Account Info */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Account</Text>
            <Text style={styles.cardSubtitle}>{user?.email || "Guest Mode"}</Text>
            {profile?.displayName && (
              <Text style={styles.displayNameText}>{profile.displayName}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* In-App Focus Timer Controller */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>In-App Focus Timer</Text>
        <Text style={styles.cardSubtitle}>
          Reliable pomodoro sessions with locked tasks and local accountability.
        </Text>

        <View style={styles.timerDisplayBox}>
          <Text style={styles.timerCountdown}>{formatTimerTime(remainingSeconds)}</Text>
          <Text style={styles.timerStatusLabel}>
            {timerActive ? `Active (${timerMinutes}m session)` : "Timer Idle"}
          </Text>
        </View>

        {timerActive ? (
          <TouchableOpacity style={styles.stopTimerBtn} onPress={handleStopTimer}>
            <Text style={styles.stopTimerBtnText}>Stop Focus Session</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.timerPresetRow}>
            {[25, 45, 60].map((m) => (
              <TouchableOpacity
                key={m}
                style={styles.timerPresetBtn}
                onPress={() => handleStartTimer(m)}
              >
                <Text style={styles.timerPresetText}>{m}m Sprint</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Personal Values Management */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Personal Values Compass</Text>
            <Text style={styles.cardSubtitle}>
              Anchor guidance against declared principles ({currentValues.length}/10).
            </Text>
          </View>
          {!addingValue && currentValues.length < 10 && (
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
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Focus Lock Policy</Text>
            <Text style={styles.cardSubtitle}>
              Apps shielded and requirements for unlock.
            </Text>
          </View>
          {policyLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>

        {/* Active Emergency Exception Banner */}
        {activeException && (
          <View style={styles.activeExceptionBox}>
            <Text style={styles.activeExceptionTitle}>🚨 Emergency Exception Active</Text>
            <Text style={styles.activeExceptionSub}>
              Expires at {new Date(activeException.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={styles.activeExceptionReason}>"{activeException.reason}"</Text>
          </View>
        )}

        {/* Require Tasks Completed Switch */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Require Tasks Before Unlock</Text>
            <Text style={styles.toggleSub}>
              Must complete designated daily tasks to clear lock.
            </Text>
          </View>
          <Switch
            value={policy?.requireTasksCompleted ?? true}
            onValueChange={handleToggleRequireTasks}
            trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.primary }}
          />
        </View>

        {/* Strict Mode Switch */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleTitle}>Strict Mode</Text>
            <Text style={styles.toggleSub}>
              Disallows early cancellation without emergency exception.
            </Text>
          </View>
          <Switch
            value={policy?.strictModeEnabled ?? false}
            onValueChange={handleToggleStrictMode}
            trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.warning }}
          />
        </View>

        {/* Restricted Apps List */}
        <Text style={styles.sectionHeading}>Restricted Apps Catalog</Text>
        <View style={styles.appList}>
          {defaultCatalog.map((app) => {
            const isSelected = (policy?.restrictedApps || []).some(
              (a) => a.bundleOrPackageId === app.bundle
            );
            return (
              <View key={app.bundle} style={styles.appRow}>
                <View>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appBundle}>{app.bundle}</Text>
                </View>
                <Switch
                  value={isSelected}
                  onValueChange={() => handleToggleRestrictedApp(app.bundle)}
                  trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.primary }}
                />
              </View>
            );
          })}
        </View>

        {/* Emergency Exception Button */}
        <TouchableOpacity
          style={styles.exceptionBtn}
          onPress={() => setShowExceptionModal(true)}
        >
          <Text style={styles.exceptionBtnText}>Request Emergency Exception</Text>
        </TouchableOpacity>

        {/* Emergency Exception Form Modal */}
        {showExceptionModal && (
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Request Time-Limited Exception</Text>
            <Text style={styles.modalSub}>
              State an honest reason to bypass restrictions for 5 to 30 minutes.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Urgent client call, two-factor auth prompt"
              placeholderTextColor={theme.colors.textMuted}
              value={exceptionReason}
              onChangeText={setExceptionReason}
              multiline
            />

            <View style={styles.durationSelector}>
              {[5, 15, 30].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.durationPill,
                    exceptionMinutes === mins && styles.durationPillActive
                  ]}
                  onPress={() => setExceptionMinutes(mins)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      exceptionMinutes === mins && styles.durationTextActive
                    ]}
                  >
                    {mins} mins
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowExceptionModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                disabled={requestExceptionMutation.isPending}
                onPress={handleRequestExceptionSubmit}
              >
                <Text style={styles.modalSubmitText}>
                  {requestExceptionMutation.isPending ? "Granting..." : "Confirm Exception"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  signOutBtn: {
    backgroundColor: theme.colors.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  signOutBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600"
  },
  timerDisplayBox: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm
  },
  timerCountdown: {
    fontSize: 48,
    fontWeight: "800",
    color: theme.colors.primary
  },
  timerStatusLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4
  },
  timerPresetRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  timerPresetBtn: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  timerPresetText: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 12
  },
  stopTimerBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.error
  },
  stopTimerBtnText: {
    color: theme.colors.error,
    fontWeight: "700",
    fontSize: 13
  },
  addValBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm
  },
  addValBtnText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 12
  },
  addValueBox: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginVertical: theme.spacing.sm
  },
  addValueInput: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    fontSize: 13,
    marginBottom: theme.spacing.xs
  },
  addValueActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.xs
  },
  cancelValBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  cancelValText: {
    color: theme.colors.textSecondary,
    fontSize: 12
  },
  saveValBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.sm
  },
  saveValText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 12
  },
  disabledBtn: {
    opacity: 0.5
  },
  valuesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm
  },
  valueBadge: {
    backgroundColor: theme.colors.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    flexDirection: "row",
    alignItems: "center"
  },
  valueText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "600"
  },
  removeX: {
    color: theme.colors.textMuted,
    fontSize: 14
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: theme.spacing.xs
  },
  boundaryNotice: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginTop: theme.spacing.sm
  },
  boundaryText: {
    fontSize: 11,
    color: theme.colors.accent,
    lineHeight: 16
  },
  activeExceptionBox: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.warning,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginVertical: theme.spacing.sm
  },
  activeExceptionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.warning
  },
  activeExceptionSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  activeExceptionReason: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontStyle: "italic",
    marginTop: 4
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceBorder
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  toggleSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs
  },
  appList: {
    gap: theme.spacing.xs
  },
  appRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm
  },
  appName: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary
  },
  appBundle: {
    fontSize: 10,
    color: theme.colors.textMuted
  },
  exceptionBtn: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    marginTop: theme.spacing.md
  },
  exceptionBtnText: {
    color: theme.colors.warning,
    fontSize: 12,
    fontWeight: "700"
  },
  modalBox: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.warning
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  modalSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: theme.spacing.sm
  },
  modalInput: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    fontSize: 12,
    minHeight: 50
  },
  durationSelector: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginVertical: theme.spacing.sm
  },
  durationPill: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center"
  },
  durationPillActive: {
    backgroundColor: theme.colors.warning
  },
  durationText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "700"
  },
  durationTextActive: {
    color: "#0F172A"
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  modalCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontSize: 12
  },
  modalSubmitBtn: {
    backgroundColor: theme.colors.warning,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.sm
  },
  modalSubmitText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 12
  },
  feasibilityBox: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  feasibilityTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4
  },
  feasibilityText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16
  },
  fallbackTag: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.xs,
    alignSelf: "flex-start"
  },
  fallbackTagText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: "700"
  },
  dangerCard: {
    borderColor: "rgba(239, 68, 68, 0.3)"
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.error
  },
  dangerText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing.md,
    lineHeight: 16
  },
  deleteBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.error,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center"
  },
  deleteBtnText: {
    color: theme.colors.error,
    fontWeight: "700",
    fontSize: 13
  }
});
