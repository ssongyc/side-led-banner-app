import ExpoModulesCore
import Foundation
import UIKit

public class LedPopAdImmersiveModule: Module {
  private weak var observedPopup: RewardPopupSurface?
  private var observedToken: Int?
  public func definition() -> ModuleDefinition {
    Name("LedPopAdImmersive")
    View(RewardPopupSurface.self) {}
    Events("rewardPopupDismissed")
    AsyncFunction("observeRewardPopupDismissal") { (viewTag: Int, token: Int) in
      guard let view = self.appContext?.findView(withTag: viewTag, ofType: RewardPopupSurface.self),
            view.window != nil else {
        throw NSError(domain: "LEDPOPAds", code: 2, userInfo: [NSLocalizedDescriptionKey: "Reward popup is not attached"])
      }
      self.observedPopup?.onDetach = nil
      self.observedPopup = view
      self.observedToken = token
      view.onDetach = { [weak self] in
        self?.observedPopup = nil
        self?.observedToken = nil
        self?.sendEvent("rewardPopupDismissed", ["token": token])
      }
    }.runOnQueue(.main)
    AsyncFunction("cancelRewardPopupObservation") { (token: Int) in
      guard self.observedToken == token else { return }
      self.observedPopup?.onDetach = nil
      self.observedPopup = nil
      self.observedToken = nil
    }.runOnQueue(.main)
    Function("getAppId") { () throws -> String in
      guard let appId = Bundle.main.object(forInfoDictionaryKey: "GADApplicationIdentifier") as? String, !appId.isEmpty else {
        throw NSError(domain: "LEDPOPAds", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native AdMob App ID missing"])
      }
      return appId
    }
  }
}

final class RewardPopupSurface: ExpoView {
  var onDetach: (() -> Void)?

  override func didMoveToWindow() {
    super.didMoveToWindow()
    guard window == nil, let onDetach else { return }
    self.onDetach = nil
    onDetach()
  }
}
