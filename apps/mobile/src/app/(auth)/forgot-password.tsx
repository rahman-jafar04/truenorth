import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "../../theme";
import { supabaseAuthService } from "../../services/supabaseClient";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    const { error: resetErr } = await supabaseAuthService.resetPassword(trimmed);
    setSubmitting(false);

    if (resetErr) {
      setError(resetErr.message);
    } else {
      setSuccess(true);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.badge}>RECOVERY</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter the email associated with your TrueNorth account to receive password reset instructions.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Check Your Inbox</Text>
            <Text style={styles.successBody}>
              If an account matches {email}, you will receive a secure password reset link.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text style={styles.backButtonText}>Return to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@domain.com"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
            />

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              disabled={submitting}
              onPress={handleReset}
            >
              {submitting ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Reset Link →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.cancelButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollContent: {
    padding: theme.spacing.lg,
    justifyContent: "center",
    minHeight: "100%"
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl
  },
  badge: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: theme.spacing.xs
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.textPrimary
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.xs,
    lineHeight: 20
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: "600"
  },
  successBox: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: theme.colors.success,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center"
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.success,
    marginBottom: theme.spacing.xs
  },
  successBody: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    lineHeight: 20
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md
  },
  backButtonText: {
    color: "#0F172A",
    fontWeight: "700"
  },
  form: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: theme.spacing.sm
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: 15
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginTop: theme.spacing.md
  },
  buttonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 15
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600"
  }
});
