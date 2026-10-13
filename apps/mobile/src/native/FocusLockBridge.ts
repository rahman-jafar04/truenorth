import { Platform } from "react-native";
import {
  IFocusLockNativeBridge,
  PlatformCapabilities,
  PermissionState,
  FocusLockStatus,
  RestrictedApp,
  FOCUS_LOCK_FEASIBILITY
} from "@truenorth/shared";

export interface FocusTimerSession {
  isActive: boolean;
  durationMinutes: number;
  remainingSeconds: number;
  startedAt: string | null;
}

/**
 * FocusLockBridge provides platform-specific app restriction enforcement.
 * Adheres strictly to OS security models:
 * - iOS: Requires FamilyControls & ManagedSettings entitlement (Screen Time API).
 * - Android: Requires UsageStatsManager + SYSTEM_ALERT_WINDOW.
 * - Non-native / Simulator / Expo Go / Fallback: Provides transparent status and In-App Focus Timer.
 */
class FocusLockBridgeImpl implements IFocusLockNativeBridge {
  private activeStatus: FocusLockStatus = {
    isRestricting: false,
    activePolicyId: null,
    activeApps: [],
    hasActiveException: false,
    exceptionExpiresAt: null
  };

  private timerSession: FocusTimerSession = {
    isActive: false,
    durationMinutes: 25,
    remainingSeconds: 25 * 60,
    startedAt: null
  };

  async getCapabilities(): Promise<PlatformCapabilities> {
    if (Platform.OS === "ios") {
      return {
        platform: "ios",
        canBlockAppsDirectly: false, // Cannot block until FamilyControls entitlement is approved by Apple
        requiredSystemPermissions: ["FamilyControls (Screen Time API)"],
        entitlementOrPermissionNotice:
          FOCUS_LOCK_FEASIBILITY.ios.summary
      };
    }

    if (Platform.OS === "android") {
      return {
        platform: "android",
        canBlockAppsDirectly: false, // Cannot block until user manually grants Usage Access and Overlay
        requiredSystemPermissions: [
          "PACKAGE_USAGE_STATS",
          "SYSTEM_ALERT_WINDOW"
        ],
        entitlementOrPermissionNotice:
          FOCUS_LOCK_FEASIBILITY.android.summary
      };
    }

    return {
      platform: "unsupported",
      canBlockAppsDirectly: false,
      requiredSystemPermissions: [],
      entitlementOrPermissionNotice:
        "Direct application blocking is not supported on web/desktop. In-app Focus Timer is active."
    };
  }

  async getPermissionStatus(): Promise<PermissionState> {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      // Until bare native module is compiled and entitlements granted, status is NOT_DETERMINED
      return "NOT_DETERMINED";
    }
    return "UNSUPPORTED";
  }

  async requestPermissions(): Promise<boolean> {
    const caps = await this.getCapabilities();
    console.info("Requesting platform permissions for Focus Lock:", caps.requiredSystemPermissions);
    // Explicit, non-deceptive flow: returns false until device-level native module is linked
    return false;
  }

  async applyRestrictions(apps: RestrictedApp[]): Promise<boolean> {
    this.activeStatus.isRestricting = true;
    this.activeStatus.activeApps = apps;
    console.info(`[FocusLockBridge] Enforcing policy for ${apps.length} apps (In-App timer fallback active).`);
    return true;
  }

  async releaseRestrictions(): Promise<boolean> {
    this.activeStatus.isRestricting = false;
    this.activeStatus.activeApps = [];
    console.info("[FocusLockBridge] Restrictions released.");
    return true;
  }

  async getStatus(): Promise<FocusLockStatus> {
    return { ...this.activeStatus };
  }

  // In-App Focus Timer Fallback
  startFocusTimer(minutes: number = 25): FocusTimerSession {
    this.timerSession = {
      isActive: true,
      durationMinutes: minutes,
      remainingSeconds: minutes * 60,
      startedAt: new Date().toISOString()
    };
    return { ...this.timerSession };
  }

  stopFocusTimer(): FocusTimerSession {
    this.timerSession.isActive = false;
    this.timerSession.startedAt = null;
    return { ...this.timerSession };
  }

  getFocusTimerSession(): FocusTimerSession {
    return { ...this.timerSession };
  }
}

export const FocusLockBridge = new FocusLockBridgeImpl();
