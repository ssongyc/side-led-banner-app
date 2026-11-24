import CoreMotion
import ExpoModulesCore
import UIKit

public class PlaybackTextLayerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PlaybackTextLayer")
    View(PlaybackTextLayerView.self) {
      Events("onDeviceRotation")
      Prop("rotationMode") { (view: PlaybackTextLayerView, mode: String) in
        view.setObservesDeviceRotation(mode == "device")
      }
      Prop("layoutRevision") { (view: PlaybackTextLayerView, _: String) in
        view.sceneCommitted()
      }
    }
  }
}

private final class RotationObserverController: UIViewController {
  weak var textLayer: PlaybackTextLayerView?

  override func viewWillTransition(to size: CGSize, with coordinator: UIViewControllerTransitionCoordinator) {
    textLayer?.beginRotation()
    super.viewWillTransition(to: size, with: coordinator)
    coordinator.animate(alongsideTransition: nil) { [weak self] _ in
      self?.textLayer?.endRotation()
    }
  }
}

final class PlaybackTextLayerView: ExpoView {
  private static let motionManager = CMMotionManager()

  private let observer = RotationObserverController()
  private var rotating = false
  private var revealLink: CADisplayLink?
  private var settledFrames = 0
  let onDeviceRotation = EventDispatcher()
  private var observesDeviceRotation = false
  private var isObservingDevice = false
  private var observationID = 0
  private var reportedRotation: Int?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    observer.textLayer = self
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    updateDeviceObservation()
    if window == nil {
      observer.willMove(toParent: nil)
      observer.view.removeFromSuperview()
      observer.removeFromParent()
      revealLink?.invalidate()
      revealLink = nil
      rotating = false
      alpha = 1
      return
    }
    guard observer.parent == nil else { return }
    var responder: UIResponder? = next
    while let current = responder {
      if let controller = current as? UIViewController {
        controller.addChild(observer)
        observer.view.isUserInteractionEnabled = false
        observer.view.frame = .zero
        insertSubview(observer.view, at: 0)
        observer.didMove(toParent: controller)
        break
      }
      responder = current.next
    }
  }

  func setObservesDeviceRotation(_ active: Bool) {
    observesDeviceRotation = active
    updateDeviceObservation()
  }

  private func updateDeviceObservation() {
    let shouldObserve = observesDeviceRotation && window != nil
    guard shouldObserve != isObservingDevice else { return }
    isObservingDevice = shouldObserve
    if shouldObserve {
      startDeviceObservation()
    } else {
      stopDeviceObservation()
    }
  }

  private func startDeviceObservation() {
    let motion = Self.motionManager
    guard motion.isDeviceMotionAvailable else {
      NSLog("[LED POP] Play device motion is unavailable")
      return
    }
    observationID += 1
    let id = observationID
    // The Play window stays portrait on iPhone. Read physical gravity instead
    // of relying on UIKit orientation events while Portrait Lock is on.
    motion.deviceMotionUpdateInterval = 0.1
    motion.startDeviceMotionUpdates(to: .main) { [weak self] sample, error in
      guard let self, self.isObservingDevice, self.observationID == id else { return }
      if let error {
        NSLog("[LED POP] Play device motion stopped: %@", error.localizedDescription)
        self.stopDeviceObservation()
        return
      }
      if let gravity = sample?.gravity {
        self.reportDeviceRotation(gravity)
      }
    }
  }

  private func stopDeviceObservation() {
    observationID += 1
    Self.motionManager.stopDeviceMotionUpdates()
    reportedRotation = nil
  }

  deinit {
    if isObservingDevice { stopDeviceObservation() }
  }

  private func reportDeviceRotation(_ gravity: CMAcceleration) {
    // A nearly flat pose has no reliable screen-plane direction.
    guard hypot(gravity.x, gravity.y) >= 0.45 else { return }
    let degrees = atan2(-gravity.x, -gravity.y) * 180 / Double.pi
    let quarterTurns = Int((degrees / 90).rounded())
    // Hold the current orientation through diagonal movement.
    guard abs(degrees - Double(quarterTurns) * 90) <= 25 else { return }
    let rotation = ((quarterTurns + 4) % 4) * 90
    guard rotation != reportedRotation else { return }
    reportedRotation = rotation
    onDeviceRotation(["degrees": rotation])
  }

  func beginRotation() {
    revealLink?.invalidate()
    revealLink = nil
    rotating = true
    alpha = 0
  }

  func endRotation() {
    rotating = false
    sceneCommitted()
  }

  func sceneCommitted() {
    revealLink?.invalidate()
    revealLink = nil
    guard !rotating else { return }
    // Keep the latest React/Skia layout mounted; reveal after the transition
    // completion and two display frames, without an opacity fade.
    settledFrames = 0
    let link = CADisplayLink(target: self, selector: #selector(revealFrame))
    revealLink = link
    link.add(to: .main, forMode: .common)
  }

  @objc private func revealFrame() {
    guard window != nil, !rotating else {
      revealLink?.invalidate()
      revealLink = nil
      return
    }
    layoutIfNeeded()
    settledFrames += 1
    if settledFrames >= 2 {
      alpha = 1
      revealLink?.invalidate()
      revealLink = nil
    }
  }
}
