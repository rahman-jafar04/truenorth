/**
 * Focus Lock OS Feasibility and Capability Analysis
 * Documents real platform restrictions, Apple/Google developer policies,
 * and the graceful in-app focus timer fallback.
 */

export const FOCUS_LOCK_FEASIBILITY = {
  ios: {
    platform: "iOS 16+",
    primaryFrameworks: ["FamilyControls", "ManagedSettings", "DeviceActivity"],
    blockingMechanism: "ManagedSettings.shield.applications (System-level shield)",
    entitlementRequired: "com.apple.developer.family-controls",
    entitlementApprovalProcess:
      "Apple Developer Program manual application and justification. Strictly granted only for parental controls or documented screen-time well-being tools.",
    expoGoCompatibility: false,
    simulatorCompatibility: false,
    feasibilityRating: "CONDITIONAL",
    summary:
      "Direct app blocking is genuinely supported by iOS system APIs, but requires the official Apple FamilyControls entitlement. Without this entitlement, native builds will fail code signing. TrueNorth provides an in-app Focus Timer as the non-entitled fallback."
  },
  android: {
    platform: "Android 10+",
    primaryFrameworks: ["UsageStatsManager", "SYSTEM_ALERT_WINDOW", "AccessibilityService"],
    blockingMechanism:
      "Background detection of foreground package name + drawing full-screen blocking overlay window.",
    entitlementRequired: "Special App Access: Usage Access & Display over other apps",
    playStorePolicyRisk:
      "CRITICAL: Google Play Developer Policy prohibits using AccessibilityService for non-disability features. Apps using Accessibility to block social media face high rejection and ban risks. TrueNorth restricts Android enforcement to UsageStatsManager + System Alert Window.",
    batteryOptimizationRisk:
      "High vendor-specific background kill rate (OEM battery savers). Requires foreground service with persistent notification.",
    feasibilityRating: "CONDITIONAL_WITH_RESTRICTIONS",
    summary:
      "Android does not provide a single declarative Shield API like iOS. Blocking relies on user-granted Usage Access and overlay permissions. If permissions are withheld or denied, TrueNorth falls back to the in-app Focus Timer."
  },
  fallback: {
    name: "TrueNorth In-App Focus Timer",
    description:
      "Provides structured pomodoro/custom focus sessions, required task completion locks within TrueNorth, session milestone tracking, and local device accountability notifications."
  }
} as const;
