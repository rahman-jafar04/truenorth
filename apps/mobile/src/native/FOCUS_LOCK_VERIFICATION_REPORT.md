# TrueNorth Focus Lock: OS Feasibility, Capabilities, & Verification Report

## Executive Summary

TrueNorth was designed with the ambitious goal of helping users practice self-discipline and focus through a **Focus Lock** mechanism. To ensure strict integrity and transparent reporting, this document provides an in-depth technical analysis of app restriction feasibility on modern **iOS** and **Android**, details current developer distribution policies, reports prototype capability findings, and specifies why the **In-App Focus Timer** operates as the reliable primary fallback.

---

## 1. iOS: FamilyControls & ManagedSettings (Screen Time API)

### Framework Overview
Starting in **iOS 16.0**, Apple introduced public Screen Time developer frameworks:
1. **`FamilyControls`**: Handles user authorization to monitor and restrict applications.
2. **`ManagedSettings`**: Allows modifying system configurations, specifically `store.shield.applications = Set(tokens)`, which renders an unbypassable, kernel-level OS shield overlay whenever a restricted app is launched.
3. **`DeviceActivity`**: Schedules monitoring intervals and executes lightweight extension points when activity thresholds are reached.

### Entitlement Requirement
- Key: `com.apple.developer.family-controls`
- **Distribution Barrier**: This is a **restricted entitlement**. You cannot enable it simply by checking a box in Xcode; it requires an explicit business justification submitted to Apple and approved on your Apple Developer Account team ID.
- **Simulator / Expo Go Limitations**: 
  - `FamilyControls` returns `AuthorizationStatus.unavailable` on iOS Simulators.
  - The entitlement cannot be provisioned inside Expo Go.
  - Bare native compilation without an approved provisioning profile triggers code-signing error: `Provisioning profile doesn't include the com.apple.developer.family-controls entitlement`.

### Verification Status & Verdict
- **Feasibility Rating**: **Conditional (Entitlement-Gated)**
- **Runtime Verdict**: Direct app blocking is verified as architecturally supported by iOS, but native builds cannot enforce shields until Apple approves the developer account entitlement and code is signed on a physical iOS 16+ device.
- **Enforcement Strategy**: When the entitlement check returns `canEnforce: false`, the app gracefully activates the **TrueNorth In-App Focus Timer**.

---

## 2. Android: UsageStats & Overlays vs. Accessibility Risk

### Framework Overview
Android does not provide a declarative shield API equivalent to iOS `ManagedSettings`. Historically, productivity apps employed two patterns:
1. **AccessibilityService**: Intercepting `AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED` to detect foreground apps and immediately force them to close or launch a home screen intent.
2. **UsageStatsManager + SYSTEM_ALERT_WINDOW**: Querying `UsageStatsManager.queryUsageStats()` periodically and drawing a full-screen window overlay (`TYPE_APPLICATION_OVERLAY`) over prohibited applications.

### Critical Google Play Policy & Distribution Risks
- **Accessibility Ban**: Google Play Developer Program Policies explicitly state:
  > *"The Accessibility API is not designed and cannot be requested for call recording, remote control, or app-blocking purposes unless specifically serving individuals with disabilities."*
  Apps utilizing `AccessibilityService` to block social media face **immediate removal, rejection, and account termination strikes**. TrueNorth **strictly rejects** the use of `AccessibilityService` for Focus Lock.
- **OEM Battery Killers**: On devices running aggressive battery management (e.g. Samsung OneUI, Xiaomi MIUI, Huawei EMUI), background services polling `UsageStatsManager` are killed within minutes unless the user manually grants background exemptions.

### Special Permission Friction
To function, the user must navigate through multiple deep Android Settings screens:
- `Settings.ACTION_USAGE_ACCESS_SETTINGS` (Usage Access)
- `Settings.ACTION_MANAGE_OVERLAY_PERMISSION` (Display over other apps)

### Verification Status & Verdict
- **Feasibility Rating**: **Conditional with High Policy Friction**
- **Runtime Verdict**: TrueNorth cannot guarantee OS-level app blocking across diverse Android OEM skins without requiring intrusive user permissions.
- **Enforcement Strategy**: When permissions are withheld or pending, TrueNorth activates the **In-App Focus Timer** without misleading the user into believing OS-level blocking is active.

---

## 3. The TrueNorth In-App Focus Timer Fallback

To ensure the app remains 100% reliable, cross-platform, policy-compliant, and honest with users, TrueNorth implements the **In-App Focus Timer**:

1. **Structured Pomodoro & Deep Work Sessions**: Configurable 25-, 45-, or 60-minute countdown intervals.
2. **Required Task Completion Locks**: Integrates with `isRequiredForUnlock` tasks in TrueNorth, requiring key tasks to be checked off before focus sessions conclude.
3. **Emergency Exception Bypass**: Users can request a 5–30 minute emergency exception by recording a deliberate reason (`RequestExceptionSchema`), maintaining intentionality rather than mindless evasion.
4. **Transparent Status Reporting**: The UI explicitly informs the user whether OS-level native blocking or In-App Focus Timer is currently enforcing the session.
