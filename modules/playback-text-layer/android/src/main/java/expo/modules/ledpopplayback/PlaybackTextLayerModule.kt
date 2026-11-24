package expo.modules.ledpopplayback

import android.content.Context
import android.content.res.Configuration
import android.view.OrientationEventListener
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlin.math.abs

class PlaybackTextLayerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PlaybackTextLayer")
    View(PlaybackTextLayerView::class) {
      Events("onDeviceRotation")
      Prop("rotationMode") { view: PlaybackTextLayerView, mode: String ->
        view.updateRotationMode(mode)
      }
      Prop("layoutRevision") { view: PlaybackTextLayerView, _: String ->
        view.sceneCommitted()
      }
    }
  }
}

class PlaybackTextLayerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var hiddenForRotation = false
  private var generation = 0
  private var orientationReady = false
  private val onDeviceRotation by EventDispatcher<Map<String, Any>>()
  private var rotationMode = "paused"
  private var reportedRotation: Int? = null
  private val reveal = Runnable {
    val ticket = generation
    // Wait for the native layout and the latest committed text scene to draw.
    postOnAnimation {
      postOnAnimation finalFrame@{
        if (!isAttachedToWindow || ticket != generation) return@finalFrame
        if (!isLayoutRequested && width > 0 && height > 0) {
          hiddenForRotation = false
          alpha = 1f
        } else {
          settle()
        }
      }
    }
  }
  private fun createOrientationListener() = object : OrientationEventListener(context) {
    override fun onOrientationChanged(degrees: Int) {
      if (degrees == ORIENTATION_UNKNOWN || !isShown) return
      val cardinal = ((degrees + 45) / 90 * 90) % 360
      val distance = abs(degrees - cardinal).let { minOf(it, 360 - it) }
      // Ignore diagonal positions and compensate for the display's current axes.
      val displayRotation = display?.rotation ?: return
      val rotation = (720 - cardinal - displayRotation * 90) % 360
      if (distance <= 25 && rotation != reportedRotation) {
        reportedRotation = rotation
        onDeviceRotation(mapOf("degrees" to rotation))
      }
    }
  }

  private var orientation = createOrientationListener()

  init {
    orientationReady = true
  }

  fun updateRotationMode(mode: String) {
    if (rotationMode == mode) return
    rotationMode = mode
    updateOrientationListener()
  }

  private fun updateOrientationListener() {
    orientation.disable()
    if (rotationMode != "device" || !isAttachedToWindow || windowVisibility != VISIBLE) return

    // A fresh listener reports the initial angle even when the phone hasn't moved.
    orientation = createOrientationListener()
    if (orientation.canDetectOrientation()) orientation.enable()
  }

  private fun hideForRotation() {
    hiddenForRotation = true
    alpha = 0f
    settle()
  }

  private fun settle() {
    generation += 1
    removeCallbacks(reveal)
    // Android does not expose the system rotation-animation completion to a
    // View. Restart this quiet interval for movement, native resize and JS layout.
    postDelayed(reveal, 450)
  }

  fun sceneCommitted() {
    if (hiddenForRotation) settle()
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    hideForRotation()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    updateOrientationListener()
  }

  override fun onWindowVisibilityChanged(visibility: Int) {
    super.onWindowVisibilityChanged(visibility)
    if (!orientationReady) return
    updateOrientationListener()
  }

  override fun onDetachedFromWindow() {
    orientation.disable()
    removeCallbacks(reveal)
    generation += 1
    hiddenForRotation = false
    reportedRotation = null
    alpha = 1f
    super.onDetachedFromWindow()
  }
}
