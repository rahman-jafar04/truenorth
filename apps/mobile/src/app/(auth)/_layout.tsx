import React from "react";
import { Stack } from "expo-router";
import { theme } from "../../theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background
        },
        headerTintColor: theme.colors.textPrimary,
        contentStyle: {
          backgroundColor: theme.colors.background
        }
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Sign In",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Create Account",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          title: "Reset Password",
          headerShown: false
        }}
      />
    </Stack>
  );
}
