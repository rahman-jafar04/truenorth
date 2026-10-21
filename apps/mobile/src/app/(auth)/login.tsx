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

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error: authError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSignIn() {
    setLocalError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError("Please enter your email address.");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    const success = await signIn(trimmedEmail, password);
    if (success) {
      router.replace("/(app)");
    }
  }

  // Quick sign-in helper for development/testing
  async function handleDemoSignIn() {
    setLocalError(null);
    const success = await signIn("demo@truenorth.app", "TrueNorth2026!");
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
        {/* Brand Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>TRUENORTH AUTH</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your compass, goals, and guarded reflection.
          </Text>
        </View>

        {/* Error Alert Box */}
        {displayedError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {displayedError}</Text>
          </View>
        )}

        {/* Input Form */}
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
              if (localError) setLocalError(null);
            }}
          />

          <View style={styles.passwordHeader}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={styles.forgotLink}>Forgot?</Text>
            </TouchableOpacity>
          </View>
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

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
            onPress={handleSignIn}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In →</Text>
            )}
          </TouchableOpacity>

          {/* Development Quick Demo Login */}
          <TouchableOpacity
            style={styles.demoButton}
            disabled={isLoading}
            onPress={handleDemoSignIn}
          >
            <Text style={styles.demoButtonText}>⚡ Quick Demo Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>Create One</Text>
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
    gap: theme.spacing.sm
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing.xs
  },
  forgotLink: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600"
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
  demoButton: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginTop: theme.spacing.xs
  },
  demoButtonText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 13
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
