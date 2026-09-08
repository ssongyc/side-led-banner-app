package expo.modules.ledpopads

import android.app.Activity
import android.app.Application
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.ViewTreeObserver
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.WeakHashMap

class LedPopAdImmersiveModule : Module(), Application.ActivityLifecycleCallbacks {
  @Volatile private var active = false
  private var flow = 0
  private var application: Application? = null
  private val focusListeners = WeakHashMap<Activity, ViewTreeObserver.OnWindowFocusChangeListener>()
  private fun hide(activity: Activity) {
    if (activity.isFinishing || activity.isDestroyed) return
    WindowCompat.getInsetsController(activity.window, activity.window.decorView).apply {
      systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      hide(WindowInsetsCompat.Type.navigationBars())
    }
  }
  private fun attach(activity: Activity) {
    if (!active || activity.application !== application) return
    hide(activity)
    if (focusListeners.containsKey(activity)) return
    val listener = ViewTreeObserver.OnWindowFocusChangeListener { focused -> if (focused && active) hide(activity) }
    activity.window.decorView.viewTreeObserver.addOnWindowFocusChangeListener(listener)
    focusListeners[activity] = listener
  }
  private fun detach(activity: Activity) {
    val listener = focusListeners.remove(activity) ?: return
    val observer = activity.window.decorView.viewTreeObserver
    if (observer.isAlive) observer.removeOnWindowFocusChangeListener(listener)
  }
  override fun definition() = ModuleDefinition {
    Name("LedPopAdImmersive")
    Function("getAppId") {
      val context = requireNotNull(appContext.reactContext)
      val info = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
      requireNotNull(info.metaData?.getString("com.google.android.gms.ads.APPLICATION_ID")) { "Native AdMob App ID missing" }
    }
    OnCreate {
      application = requireNotNull(appContext.reactContext).applicationContext as Application
      application?.registerActivityLifecycleCallbacks(this@LedPopAdImmersiveModule)
    }
    AsyncFunction("begin") { token: Int ->
      val activity = requireNotNull(appContext.currentActivity) { "No host Activity for rewarded ad" }
      flow = token
      active = true
      attach(activity)
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("end") { token: Int ->
      if (token != flow) return@AsyncFunction
      appContext.currentActivity?.let { hide(it) }
      active = false
      focusListeners.keys.toList().forEach { detach(it) }
    }.runOnQueue(Queues.MAIN)
    OnDestroy {
      active = false
      application?.unregisterActivityLifecycleCallbacks(this@LedPopAdImmersiveModule)
      Handler(Looper.getMainLooper()).post { focusListeners.keys.toList().forEach { detach(it) } }
      application = null
    }
  }
  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = attach(activity)
  override fun onActivityStarted(activity: Activity) = attach(activity)
  override fun onActivityResumed(activity: Activity) = attach(activity)
  override fun onActivityPostResumed(activity: Activity) = attach(activity)
  override fun onActivityPaused(activity: Activity) {}
  override fun onActivityStopped(activity: Activity) {}
  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
  override fun onActivityDestroyed(activity: Activity) = detach(activity)
}
