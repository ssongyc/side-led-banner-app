package expo.modules.ledpopplayback

import android.content.Context
import android.content.res.Configuration
import android.view.OrientationEventListener
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView
import kotlin.math.abs

class PlaybackTextLayerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PlaybackTextLayer")
    View(PlaybackTextLayerView::class) {
      Prop("layoutRevision") { view: PlaybackTextLayerView, _: String ->
        view.sceneCommitted()
      }
    }
  }
}

class PlaybackTextLayerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private var hiddenForRotation = false
  private var lastDegrees = -1
  private var generation = 0
  private var rotationArmed = true
  private var orientationReady = false
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
  private val orientation = object : OrientationEventListener(context) {
    override fun onOrientationChanged(degrees: Int) {
      if (degrees == ORIENTATION_UNKNOWN || !isShown) return
      val rotation = display?.rotation ?: return
      val currentDegrees = (360 - rotation * 90) % 360
      val distance = abs(degrees - currentDegrees).let { minOf(it, 360 - it) }
      // Hide ahead of Android's cardinal-orientation switch, rather than waiting
      // for the JS Dimensions event after the rotation snapshot has been taken.
      if (distance < 20) rotationArmed = true
      if (rotationArmed && distance > 30) {
        rotationArmed = false
        hideForRotation()
      }
      if (hiddenForRotation && (lastDegrees < 0 || abs(degrees - lastDegrees) >= 4)) {
        lastDegrees = degrees
        settle()
      }
    }
  }

  init {
    orientationReady = true
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

  override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
    super.onSizeChanged(w, h, oldw, oldh)
    if (oldw > 0 && oldh > 0 && (w != oldw || h != oldh)) hideForRotation()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (orientation.canDetectOrientation()) orientation.enable()
  }

  override fun onWindowVisibilityChanged(visibility: Int) {
    super.onWindowVisibilityChanged(visibility)
    if (!orientationReady) return
    // Do not keep orientation sensors running behind another app.
    if (visibility == VISIBLE && isAttachedToWindow) {
      if (orientation.canDetectOrientation()) orientation.enable()
    } else {
      orientation.disable()
    }
  }

  override fun onDetachedFromWindow() {
    orientation.disable()
    removeCallbacks(reveal)
    generation += 1
    hiddenForRotation = false
    lastDegrees = -1
    rotationArmed = true
    alpha = 1f
    super.onDetachedFromWindow()
  }
}
