import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../theme";
import { apiClient } from "../../services/apiClient";

export default function ThoughtCaptureScreen() {
  const router = useRouter();
  const [thought, setThought] = useState("");
  const [contextTag, setContextTag] = useState("Work Resistance");
  const [faithMode, setFaithMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const contextOptions = [
    "Work Resistance",
    "Digital Distraction",
    "Fatigue / Comfort",
    "Goal Alignment",
    "Moral / Value Friction"
  ];

  async function handleEvaluate() {
    if (!thought.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // In development foundation test, inject mock token for demonstration
      apiClient.setAuthToken("foundation-dev-token");
      const res = await apiClient.analyzeThought({
        rawContent: thought.trim(),
        contextTag,
        includeFaithPerspective: faithMode
      });

      // Pass result into analysis result view via router params or global client
      router.push({
        pathname: "/(app)/analysis-result",
        params: {
          resultJson: JSON.stringify(res.data),
          rawThought: thought.trim()
        }
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to obtain AI analysis.";
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Privacy Guarantee Header */}
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyIcon}>🔒</Text>
        <View style={styles.privacyTextGroup}>
          <Text style={styles.privacyTitle}>Encrypted & Private</Text>
          <Text style={styles.privacyBody}>
            Thought text is scrubbed from application access logs. TrueNorth provides direct, non-shaming guidance.
          </Text>
        </View>
      </View>

      <Text style={styles.inputLabel}>What thought or proposed action are you wrestling with?</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. I have a critical deadline in 2 hours, but I want to scroll YouTube because I feel overwhelmed..."
        placeholderTextColor={theme.colors.textMuted}
        multiline
        numberOfLines={6}
        value={thought}
        onChangeText={setThought}
      />

      {/* Context Tag Selector */}
      <Text style={styles.inputLabel}>Context Category</Text>
      <View style={styles.tagRow}>
        {contextOptions.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagChip,
              contextTag === tag && styles.tagChipSelected
            ]}
            onPress={() => setContextTag(tag)}
          >
            <Text
              style={[
                styles.tagText,
                contextTag === tag && styles.tagTextSelected
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Optional Faith Mode Toggle */}
      <View style={styles.faithCard}>
        <View style={styles.faithHeader}>
          <View>
            <Text style={styles.faithTitle}>Optional Faith Perspective</Text>
            <Text style={styles.faithSubtitle}>
              Reflect against personal spiritual values without supernatural attribution.
            </Text>
          </View>
          <Switch
            value={faithMode}
            onValueChange={setFaithMode}
            trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.primary }}
            thumbColor={faithMode ? "#0F172A" : theme.colors.textMuted}
          />
        </View>

        {faithMode && (
          <View style={styles.guardrailNotice}>
            <Text style={styles.guardrailNoticeText}>
              Guarded Mode: TrueNorth AI strictly avoids attributing thoughts to God, Satan, or demons.
            </Text>
          </View>
        )}
      </View>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          (!thought.trim() || submitting) && styles.submitBtnDisabled
        ]}
        disabled={!thought.trim() || submitting}
        onPress={handleEvaluate}
      >
        {submitting ? (
          <ActivityIndicator color="#0F172A" />
        ) : (
          <Text style={styles.submitBtnText}>Evaluate Goal Alignment →</Text>
        )}
      </TouchableOpacity>
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
  privacyBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm
  },
  privacyIcon: {
    fontSize: 20
  },
  privacyTextGroup: {
    flex: 1
  },
  privacyTitle: {
    color: theme.colors.success,
    fontWeight: "700",
    fontSize: 13
  },
  privacyBody: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: "top"
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  tagChip: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  tagChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.textSecondary
  },
  tagTextSelected: {
    color: "#0F172A",
    fontWeight: "700"
  },
  faithCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder
  },
  faithHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  faithTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  faithSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    maxWidth: 240,
    marginTop: 2
  },
  guardrailNotice: {
    marginTop: theme.spacing.sm,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm
  },
  guardrailNoticeText: {
    fontSize: 11,
    color: theme.colors.primary
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginTop: theme.spacing.xs
  },
  submitBtnDisabled: {
    opacity: 0.5
  },
  submitBtnText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700"
  }
});
