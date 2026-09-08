import ExpoModulesCore
import Foundation

public class LedPopAdImmersiveModule: Module {
  public func definition() -> ModuleDefinition {
    Name("LedPopAdImmersive")
    Function("getAppId") { () throws -> String in
      guard let appId = Bundle.main.object(forInfoDictionaryKey: "GADApplicationIdentifier") as? String, !appId.isEmpty else {
        throw NSError(domain: "LEDPOPAds", code: 1, userInfo: [NSLocalizedDescriptionKey: "Native AdMob App ID missing"])
      }
      return appId
    }
  }
}
