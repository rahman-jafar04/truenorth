import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

/**
 * TrueNorth iOS Focus Lock Native Prototype (Screen Time API)
 *
 * FEASIBILITY & CAPABILITY ASSESSMENT:
 * 1. Required Frameworks:
 *    - FamilyControls: Provides user authorization for app monitoring.
 *    - ManagedSettings: Applies shields (`store.shield.applications`) directly via iOS kernel.
 *    - DeviceActivity: Manages scheduled monitoring intervals without persistent background execution.
 *
 * 2. Entitlement Requirement:
 *    - Must have `com.apple.developer.family-controls` in Entitlements.plist.
 *    - Apple strictly requires a dedicated distribution request submitted via the Apple Developer portal.
 *    - Unapproved provisioning profiles will FAIL code signing during `xcodebuild`.
 *
 * 3. Runtime Verification Status:
 *    - Cannot run in iOS Simulator (FamilyControls returns unsupported).
 *    - Cannot run in Expo Go.
 *    - REQUIRES bare workflow / custom dev client with approved Apple entitlement.
 *    - FALLBACK: TrueNorth In-App Focus Timer is active whenever entitlement is unavailable.
 */
@objc(TrueNorthFocusLockModule)
public class TrueNorthFocusLockModule: NSObject {
    private let store = ManagedSettingsStore(named: .init("TrueNorthFocusLock"))
    
    @objc
    public func checkEntitlementStatus(_ resolve: @escaping (Any) -> Void, reject: @escaping (String, String, Error?) -> Void) {
        if #available(iOS 16.0, *) {
            let status = AuthorizationCenter.shared.status
            switch status {
            case .approved:
                resolve(["status": "APPROVED", "canEnforce": true])
            case .denied:
                resolve(["status": "DENIED", "canEnforce": false, "reason": "User denied Screen Time permission."])
            case .notDetermined:
                resolve(["status": "NOT_DETERMINED", "canEnforce": false, "reason": "Authorization not yet requested."])
            @unknown default:
                resolve(["status": "UNKNOWN", "canEnforce": false])
            }
        } else {
            resolve([
                "status": "UNSUPPORTED_OS",
                "canEnforce": false,
                "reason": "FamilyControls ManagedSettings requires iOS 16.0 or higher."
            ])
        }
    }

    @objc
    public func requestAuthorization(_ resolve: @escaping (Any) -> Void, reject: @escaping (String, String, Error?) -> Void) {
        if #available(iOS 16.0, *) {
            Task {
                do {
                    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                    resolve(["success": true, "status": "APPROVED"])
                } catch {
                    // Typical failure: entitlement missing or user declined
                    resolve([
                        "success": false,
                        "error": error.localizedDescription,
                        "entitlementMissing": true,
                        "fallbackActive": "IN_APP_FOCUS_TIMER"
                    ])
                }
            }
        } else {
            resolve(["success": false, "reason": "Requires iOS 16+"])
        }
    }

    @objc
    public func applyShields(_ applicationTokens: [ApplicationToken], resolve: @escaping (Any) -> Void, reject: @escaping (String, String, Error?) -> Void) {
        if #available(iOS 16.0, *) {
            store.shield.applications = Set(applicationTokens)
            resolve(["success": true, "shieldedCount": applicationTokens.count])
        } else {
            resolve(["success": false, "reason": "Requires iOS 16+"])
        }
    }

    @objc
    public func releaseShields(_ resolve: @escaping (Any) -> Void, reject: @escaping (String, String, Error?) -> Void) {
        if #available(iOS 16.0, *) {
            store.shield.applications = nil
            resolve(["success": true, "message": "All restrictions cleared"])
        } else {
            resolve(["success": false, "reason": "Requires iOS 16+"])
        }
    }
}
