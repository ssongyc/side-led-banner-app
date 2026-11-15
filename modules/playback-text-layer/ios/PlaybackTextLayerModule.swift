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
  private let observer = RotationObserverController()
  private var rotating = false
  private var revealLink: CADisplayLink?
  private var settledFrames = 0
  let onDeviceRotation = EventDispatcher()
  private var observesDeviceRotation = false
  private var isObservingDevice = false
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
      NotificationCenter.default.addObserver(
        self, selector: #selector(deviceOrientationChanged),
        name: UIDevice.orientationDidChangeNotification, object: UIDevice.current
      )
      UIDevice.current.beginGeneratingDeviceOrientationNotifications()
      // Let the view's event handler finish mounting before reporting the initial pose.
      DispatchQueue.main.async { [weak self] in self?.deviceOrientationChanged() }
    } else {
      stopDeviceObservation()
    }
  }

  private func stopDeviceObservation() {
    NotificationCenter.default.removeObserver(
      self, name: UIDevice.orientationDidChangeNotification, object: UIDevice.current
    )
    UIDevice.current.endGeneratingDeviceOrientationNotifications()
    reportedRotation = nil
  }

  deinit {
    if isObservingDevice { stopDeviceObservation() }
  }

  @objc private func deviceOrientationChanged() {
    guard isObservingDevice else { return }
    let rotation: Int
    switch UIDevice.current.orientation {
    case .portrait: rotation = 0
    case .landscapeLeft: rotation = 90
    case .portraitUpsideDown: rotation = 180
    case .landscapeRight: rotation = 270
    default: return
    }
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
