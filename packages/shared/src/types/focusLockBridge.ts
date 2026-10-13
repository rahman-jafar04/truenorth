import { RestrictedApp } from "../schemas/focusLock";

export type PermissionState =
  | "GRANTED"
  | "DENIED"
  | "NOT_DETERMINED"
  | "RESTRICTED"
  | "UNSUPPORTED";

export interface PlatformCapabilities {
  platform: "ios" | "android" | "web" | "unsupported";
  canBlockAppsDirectly: boolean;
  requiredSystemPermissions: string[];
  entitlementOrPermissionNotice: string;
}

export interface FocusLockStatus {
  isRestricting: boolean;
  activePolicyId: string | null;
  activeApps: RestrictedApp[];
  hasActiveException: boolean;
  exceptionExpiresAt?: string | null;
}

/**
 * Cross-platform contract for Focus Lock native bridges.
 * Decouples domain logic from OS-specific implementations.
 */
export interface IFocusLockNativeBridge {
  getCapabilities(): Promise<PlatformCapabilities>;
  getPermissionStatus(): Promise<PermissionState>;
  requestPermissions(): Promise<boolean>;
  applyRestrictions(apps: RestrictedApp[]): Promise<boolean>;
  releaseRestrictions(): Promise<boolean>;
  getStatus(): Promise<FocusLockStatus>;
}
