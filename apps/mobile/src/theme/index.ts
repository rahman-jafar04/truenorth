export const theme = {
  colors: {
    background: "#0F172A", // Deep midnight slate
    surface: "#1E293B",    // Slate container
    surfaceBorder: "#334155",
    primary: "#38BDF8",    // TrueNorth cyan / sky blue
    primaryDark: "#0284C7",
    accent: "#6366F1",     // Indigo
    success: "#10B981",    // Emerald
    warning: "#F59E0B",    // Amber
    error: "#EF4444",      // Rose
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B"
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999
  }
} as const;
