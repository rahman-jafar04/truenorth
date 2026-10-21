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
import { useAuth } from "../../hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading, error: authError } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSignUp() {
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    const success = await signUp(
      trimmedEmail,
      password,
      displayName.trim() || undefined
    );

    if (success) {
      router.replace("/(app)");
    }
  }

  const displayedError = localError || authError;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>TRUENORTH AUTH</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Begin your journey of intentional discipline and goal alignment.
          </Text>
        </View>

        {/* Error Alert Box */}
        {displayedError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {displayedError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Your Name / Pseudonym</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Thomas"
            placeholderTextColor={theme.colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />

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
              if (localError) setLocalError(null);
            }}
          />

          <Text style={styles.label}>Password (min 6 characters)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (localError) setLocalError(null);
            }}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (localError) setLocalError(null);
            }}
          />

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={handleSignUp}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account →</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
  form: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    gap: theme.spacing.xs
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surfaceBorder,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    fontSize: 15,
    marginBottom: theme.spacing.xs
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 14
  },
  footerLink: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 14
  }
});
