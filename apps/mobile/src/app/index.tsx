import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../theme";
import { apiClient, ApiError } from "../services/apiClient";
import { FocusLockBridge } from "../native/FocusLockBridge";
import { PlatformCapabilities, AiGuidanceResponse } from "@truenorth/shared";

export default function HomeScreen() {
  const [apiHealth, setApiHealth] = useState<{ status: string; version: string } | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(true);

  const [platformCaps, setPlatformCaps] = useState<PlatformCapabilities | null>(null);

  // Quick thought analysis state
  const [thoughtInput, setThoughtInput] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [guidanceResult, setGuidanceResult] = useState<AiGuidanceResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialStatus() {
      // 1. Check Platform FocusLock capabilities
      try {
        const caps = await FocusLockBridge.getCapabilities();
        setPlatformCaps(caps);
      } catch (e) {
        console.warn("Failed to load platform caps", e);
      }

      // 2. Probe API Health
      try {
        setCheckingHealth(true);
        const health = await apiClient.getHealth();
        setApiHealth(health);
        setHealthError(null);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Backend offline or unreachable";
        setHealthError(message);
      } finally {
        setCheckingHealth(false);
      }
    }

    loadInitialStatus();
  }, []);

  async function handleAnalyzeThought() {
    if (!thoughtInput.trim() || analyzing) return;

    setAnalyzing(true);
    setAnalysisError(null);
    setGuidanceResult(null);

    try {
      // In development foundation test, inject mock token for demonstration
      apiClient.setAuthToken("foundation-dev-token");
      const res = await apiClient.analyzeThought({
        rawContent: thoughtInput,
        includeFaithPerspective: true
      });
      setGuidanceResult(res.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setAnalysisError(err.message);
      } else {
        setAnalysisError("Failed to reach TrueNorth analysis service.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>FOUNDATION v0.1.0</Text>
          <Text style={styles.title}>TrueNorth</Text>
          <Text style={styles.subtitle}>
            AI-Powered Self-Discipline & Goal Alignment
          </Text>
        </View>

        {/* Backend & Environment Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>System Connectivity</Text>

          {checkingHealth ? (
            <View style={styles.row}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={styles.statusText}>Checking Express API status...</Text>
            </View>
          ) : apiHealth ? (
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
              <Text style={styles.statusText}>
                API Connected ({apiHealth.status.toUpperCase()} - v{apiHealth.version})
              </Text>
            </View>
          ) : (
            <View style={styles.row}>
              <View style={[styles.dot, { backgroundColor: theme.colors.warning }]} />
              <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                API Offline ({healthError})
              </Text>
            </View>
          )}

          {platformCaps && (
            <View style={styles.platformBadge}>
              <Text style={styles.platformTitle}>
                Platform Runtime: {platformCaps.platform.toUpperCase()}
              </Text>
              <Text style={styles.platformNotice}>
                {platformCaps.entitlementOrPermissionNotice}
              </Text>
            </View>
          )}
        </View>

        {/* AI Thought Alignment Foundation Demo */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Thought Guidance Probe</Text>
          <Text style={styles.cardDescription}>
            Test thought submission against non-shaming and theological guardrails.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g., I want to skip working on my goals and scroll social media..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={3}
            value={thoughtInput}
            onChangeText={setThoughtInput}
          />

          <TouchableOpacity
            style={[styles.button, analyzing && styles.buttonDisabled]}
            disabled={analyzing}
            onPress={handleAnalyzeThought}
          >
            {analyzing ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.buttonText}>Evaluate Alignment</Text>
            )}
          </TouchableOpacity>

          {analysisError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{analysisError}</Text>
            </View>
          )}

          {guidanceResult && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultStatus}>
                  Status: {guidanceResult.alignmentStatus}
                </Text>
                <Text style={styles.resultScore}>
                  Alignment: {guidanceResult.alignmentScore}%
                </Text>
              </View>

              <Text style={styles.resultHeading}>Direct Reasoning:</Text>
              <Text style={styles.resultContent}>{guidanceResult.directReasoning}</Text>

              <Text style={styles.resultHeading}>Non-Shaming Insight:</Text>
              <Text style={styles.resultContent}>{guidanceResult.nonShamingInsight}</Text>

              {guidanceResult.faithReflection && (
                <>
                  <Text style={styles.resultHeading}>Faith Mode Reflection (Guarded):</Text>
                  <Text style={styles.resultContent}>{guidanceResult.faithReflection}</Text>
                </>
              )}

              <Text style={styles.resultHeading}>Recommended Next Actions:</Text>
              {guidanceResult.recommendedActions.map((action, idx) => (
                <Text key={idx} style={styles.actionItem}>
                  • {action}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    padding: theme.spacing.md,
    gap: theme.spacing.md
  },
  header: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg
  },
  badge: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.xs
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm
  },
  cardDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 18
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  statusText: {
    color: theme.colors.textPrimary,
    fontSize: 14
  },
  platformBadge: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  platformTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary
  },
  platformNotice: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    textAlignVertical: "top",
    fontSize: 14,
    marginBottom: theme.spacing.md
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 15
  },
  errorBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.error
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13
  },
  resultBox: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm
  },
  resultStatus: {
    fontWeight: "700",
    color: theme.colors.primary,
    fontSize: 14
  },
  resultScore: {
    color: theme.colors.textSecondary,
    fontSize: 14
  },
  resultHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginBottom: 2
  },
  resultContent: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18
  },
  actionItem: {
    fontSize: 13,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    marginTop: 2
  }
});
