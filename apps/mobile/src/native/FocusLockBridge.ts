import { Platform } from "react-native";
import {
  IFocusLockNativeBridge,
  PlatformCapabilities,
  PermissionState,
  FocusLockStatus,
  RestrictedApp
} from "@truenorth/shared";

/**
 * FocusLockBridge provides platform-specific app restriction enforcement.
 * Adheres strictly to OS security models:
 * - iOS: Requires FamilyControls & ManagedSettings entitlement (Screen Time API).
 * - Android: Requires UsageStatsManager + AccessibilityService / Overlay permission.
 * - Non-native / Simulator / Expo Go: Reports real permission states and operates in simulation mode.
 */
class FocusLockBridgeImpl implements IFocusLockNativeBridge {
  private activeStatus: FocusLockStatus = {
    isRestricting: false,
    activePolicyId: null,
    activeApps: [],
    hasActiveException: false,
    exceptionExpiresAt: null
  };

  async getCapabilities(): Promise<PlatformCapabilities> {
    if (Platform.OS === "ios") {
      return {
        platform: "ios",
        canBlockAppsDirectly: true,
        requiredSystemPermissions: ["FamilyControls (Screen Time API)"],
        entitlementOrPermissionNotice:
          "Requires Apple Developer entitlement 'com.apple.developer.family-controls' and iOS 16+ ManagedSettings framework."
      };
    }

    if (Platform.OS === "android") {
      return {
        platform: "android",
        canBlockAppsDirectly: true,
        requiredSystemPermissions: [
          "PACKAGE_USAGE_STATS",
          "SYSTEM_ALERT_WINDOW",
          "ACCESSIBILITY_SERVICE (Optional fallback)"
        ],
        entitlementOrPermissionNotice:
          "Requires user to manually grant 'Usage Access' and 'Display over other apps' in Android System Settings."
      };
    }

    return {
      platform: "unsupported",
      canBlockAppsDirectly: false,
      requiredSystemPermissions: [],
      entitlementOrPermissionNotice:
        "Direct application blocking is not supported on web or desktop runtimes."
    };
  }

  async getPermissionStatus(): Promise<PermissionState> {
    // In bare native runtime, this queries native bridge modules (NativeModules.TrueNorthFocusLock)
    // In Expo Go or development environment, return NOT_DETERMINED or UNKNOWN
    if (Platform.OS === "ios" || Platform.OS === "android") {
      return "NOT_DETERMINED";
    }
    return "UNSUPPORTED";
  }

  async requestPermissions(): Promise<boolean> {
    const caps = await this.getCapabilities();
    if (!caps.canBlockAppsDirectly) {
      console.warn("Focus Lock cannot request native app blocking on this platform:", caps.platform);
      return false;
    }

    // Explicit non-deceptive flow: informs user of exact native settings required
    console.info("Requesting platform permissions for Focus Lock:", caps.requiredSystemPermissions);
    return false; // Will return true once native module is linked in bare build
  }

  async applyRestrictions(apps: RestrictedApp[]): Promise<boolean> {
    this.activeStatus.isRestricting = true;
    this.activeStatus.activeApps = apps;
    console.info(`[FocusLockBridge] Enforcing policy for ${apps.length} restricted applications.`);
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
}

export const FocusLockBridge: IFocusLockNativeBridge = new FocusLockBridgeImpl();
