import React from "react";
import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { theme } from "../../theme";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <View style={styles.iconContainer}>
      <Text
        style={[
          styles.iconText,
          focused ? styles.iconTextFocused : styles.iconTextUnfocused
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background
        },
        headerTintColor: theme.colors.textPrimary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          headerTitle: "TrueNorth",
          tabBarLabel: "Today",
          tabBarIcon: ({ focused }) => <TabIcon label="☀️" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          headerTitle: "Daily Tasks",
          tabBarLabel: "Tasks",
          tabBarIcon: ({ focused }) => <TabIcon label="✓" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          headerTitle: "Core Goals",
          tabBarLabel: "Goals",
          tabBarIcon: ({ focused }) => <TabIcon label="🎯" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="thought-capture"
        options={{
          title: "Reflect",
          headerTitle: "Thought Alignment",
          tabBarLabel: "Reflect",
          tabBarIcon: ({ focused }) => <TabIcon label="💭" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="calendar-history"
        options={{
          title: "History",
          headerTitle: "Timeline & History",
          tabBarLabel: "History",
          tabBarIcon: ({ focused }) => <TabIcon label="📅" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="daily-report"
        options={{
          title: "Report",
          headerTitle: "Daily Review",
          tabBarLabel: "Report",
          tabBarIcon: ({ focused }) => <TabIcon label="📊" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerTitle: "Preferences & Focus",
          tabBarLabel: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon label="⚙️" focused={focused} />
        }}
      />
      <Tabs.Screen
        name="analysis-result"
        options={{
          href: null, // Hidden from bottom tabs; navigated to directly from thought capture
          headerTitle: "AI Alignment Guidance"
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center"
  },
  iconText: {
    fontSize: 18
  },
  iconTextFocused: {
    opacity: 1
  },
  iconTextUnfocused: {
    opacity: 0.5
  }
});
