package expo.modules.ledpoppurchase

import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.KeyFactory
import java.security.Signature
import java.security.spec.X509EncodedKeySpec
import org.json.JSONObject

class LedPopPurchaseVerificationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LedPopPurchaseVerification")

    AsyncFunction("verify") { data: String, signature: String, publicKey: String,
                              productId: String, purchaseToken: String ->
      val key = KeyFactory.getInstance("RSA").generatePublic(
        X509EncodedKeySpec(Base64.decode(publicKey, Base64.DEFAULT))
      )
      // Google Play signs the original purchase JSON using SHA1withRSA.
      val verifier = Signature.getInstance("SHA1withRSA")
      verifier.initVerify(key)
      verifier.update(data.toByteArray(Charsets.UTF_8))
      require(verifier.verify(Base64.decode(signature, Base64.DEFAULT))) {
        "Google Play purchase signature is invalid"
      }
      val receipt = JSONObject(data)
      val packageName = requireNotNull(appContext.reactContext).packageName
      require(receipt.getString("packageName") == packageName)
      require(receipt.getString("productId") == productId)
      require(receipt.getString("purchaseToken") == purchaseToken)
      // Signed JSON uses 0 for completed, unlike BillingClient's enum.
      require(receipt.getInt("purchaseState") == 0)
      true
    }
  }
}
