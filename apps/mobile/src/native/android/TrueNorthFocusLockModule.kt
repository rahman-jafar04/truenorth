package app.truenorth.focuslock

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings

/**
 * TrueNorth Android Focus Lock Native Prototype
 *
 * FEASIBILITY & CAPABILITY ASSESSMENT:
 * 1. Underlying Mechanism:
 *    - Android lacks a native declarative shield API equivalent to iOS ManagedSettings.
 *    - Requires two separate special permissions:
 *      a) PACKAGE_USAGE_STATS (Usage Access) via Settings.ACTION_USAGE_ACCESS_SETTINGS
 *      b) SYSTEM_ALERT_WINDOW (Display over other apps) via Settings.ACTION_MANAGE_OVERLAY_PERMISSION
 *
 * 2. Critical Google Play Developer Policy Restrictions:
 *    - AccessibilityService MUST NOT be used for blocking distractions or social media.
 *      Google Play Developer Policy explicitly bans Accessibility misuse for non-disability purposes.
 *      TrueNorth strictly avoids AccessibilityService.
 *
 * 3. OEM Battery Optimization & Background Execution:
 *    - Devices from Samsung (OneUI), Xiaomi (MIUI), and Huawei enforce aggressive background app killing.
 *    - Polling UsageStatsManager requires a Foreground Service with an ongoing notification.
 *    - Battery optimization exemptions (REQUEST_IGNORE_BATTERY_OPTIMIZATIONS) are scrutinized by Google Play.
 *
 * 4. Runtime Verification Status:
 *    - If permissions are not explicitly granted by the user in system settings, OS blocking cannot function.
 *    - FALLBACK: TrueNorth In-App Focus Timer is active whenever permissions are pending or denied.
 */
class TrueNorthFocusLockModule(private val context: Context) {

    fun hasUsageAccess(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun hasOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    fun checkCapabilities(): Map<String, Any> {
        val hasUsage = hasUsageAccess()
        val hasOverlay = hasOverlayPermission()
        val canEnforce = hasUsage && hasOverlay

        return mapOf(
            "platform" to "android",
            "canEnforce" to canEnforce,
            "hasUsageAccess" to hasUsage,
            "hasOverlayPermission" to hasOverlay,
            "missingPermissions" to buildList {
                if (!hasUsage) add("PACKAGE_USAGE_STATS")
                if (!hasOverlay) add("SYSTEM_ALERT_WINDOW")
            },
            "policyNotice" to "AccessibilityService is strictly avoided to comply with Google Play Policy.",
            "fallbackActive" to if (!canEnforce) "IN_APP_FOCUS_TIMER" else "NONE"
        )
    }

    fun openUsageSettingsIntent(): Intent {
        return Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
    }

    fun openOverlaySettingsIntent(): Intent {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
        } else {
            Intent(Settings.ACTION_SETTINGS)
        }
    }
}
