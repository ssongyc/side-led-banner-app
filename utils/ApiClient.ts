import { PREMIUM_ANDROID_PURCHASE_OPTION_ID, PREMIUM_PRODUCT_IDS } from "@/constants/premium";
import type { Product, Purchase } from "expo-iap";
import { requireNativeModule } from "expo";
import { Platform } from "react-native";

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ApiClient request failed: HTTP ${response.status}`);
  }
  return response.text();
}

export type PremiumNotice = "unavailable" | "error" | "cancelled" | "pending" |
  "purchased" | "restored" | "nothingToRestore" | "verificationFailed";
export type PremiumSnapshot = {
  entitlement: "unknown" | "free" | "owned";
  operation: "idle" | "loading" | "purchasing" | "restoring";
  product: Product | null;
  offerTokenAndroid: string | null;
  notice: PremiumNotice | null;
  connected: boolean;
};

let premiumSnapshot: PremiumSnapshot = {
  entitlement: "unknown", operation: "loading", product: null, offerTokenAndroid: null, notice: null, connected: false,
};
const premiumListeners = new Set<() => void>();
let iap: typeof import("expo-iap") | null = null;
let connection: Promise<void> | null = null;
let refreshFlight: Promise<void> | null = null;
// One native connection/listener pair for the app lifetime, independent of screens.
let purchaseListener: { remove(): void } | null = null;
let errorListener: { remove(): void } | null = null;
let purchaseQueue: Promise<void> = Promise.resolve();
const finishedTransactions = new Set<string>();
let paymentPending = false;

export const getPremiumSnapshot = () => premiumSnapshot;
export const subscribePremium = (listener: () => void) => {
  premiumListeners.add(listener);
  return () => { premiumListeners.delete(listener); };
};
function publishPremium(patch: Partial<PremiumSnapshot>) {
  premiumSnapshot = { ...premiumSnapshot, ...patch };
  premiumListeners.forEach((listener) => listener());
}
function premiumProductId() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    throw new Error("Native in-app purchases require iOS or Android.");
  }
  return PREMIUM_PRODUCT_IDS[Platform.OS];
}
function reportPremiumError(error: unknown, notice: PremiumNotice = "error") {
  // Never log signed purchase data, tokens, or full SDK error objects.
  console.warn("[IAP]", notice, error instanceof Error ? error.name : "StoreError");
  if (notice === "pending") paymentPending = true;
  if (notice === "cancelled") paymentPending = false;
  publishPremium({ notice, operation: "idle" });
}
function enqueuePurchaseWork(work: () => Promise<void>) {
  const next = purchaseQueue.then(work);
  purchaseQueue = next.catch(() => {}); // Caller reports failure; later explicit work can proceed.
  return next;
}

async function verifyAndFinish(purchase: Purchase) {
  if (!iap || purchase.productId !== premiumProductId() || purchase.purchaseState !== "purchased") {
    throw new Error("Purchase is not a completed Premium purchase.");
  }
  if (Platform.OS === "ios") {
    const current = await iap.currentEntitlementIOS(purchase.productId);
    if (!current || current.id !== purchase.id || current.revocationDateIOS != null || purchase.store !== "apple" ||
        ("revocationDateIOS" in purchase && purchase.revocationDateIOS != null) ||
        !(await iap.isTransactionVerifiedIOS(purchase.productId))) {
      throw new Error("StoreKit did not verify the Premium entitlement.");
    }
  } else {
    if (purchase.store !== "google" || !("dataAndroid" in purchase) ||
        !purchase.dataAndroid || !purchase.signatureAndroid || !purchase.purchaseToken) {
      throw new Error("Google Play signed purchase data is missing.");
    }
    const verifier = requireNativeModule<{
      verify(data: string, signature: string, key: string, sku: string, token: string): Promise<boolean>;
    }>("LedPopPurchaseVerification");
    const verified = await verifier.verify(
      purchase.dataAndroid, purchase.signatureAndroid,
      process.env.EXPO_PUBLIC_GOOGLE_PLAY_LICENSE_KEY ?? "",
      purchase.productId, purchase.purchaseToken,
    );
    if (!verified) throw new Error("Google Play purchase verification failed.");
  }
  const identity = `${purchase.store}:${purchase.purchaseToken ?? purchase.id}`;
  if (finishedTransactions.has(identity)) return;
  // Non-consumable: acknowledge on Google Play, finish on StoreKit. Never consume.
  if (!("isAcknowledgedAndroid" in purchase && purchase.isAcknowledgedAndroid === true)) {
    await iap.finishTransaction({ purchase, isConsumable: false });
  }
  finishedTransactions.add(identity);
}

async function reconcilePremium() {
  if (!iap) throw new Error("Store is not connected.");
  const purchases = await iap.getAvailablePurchases({
    onlyIncludeActiveItemsIOS: true, alsoPublishToEventListenerIOS: false,
  });
  const matching = purchases.filter((p) => p.productId === premiumProductId());
  const completed = matching.filter((p) => p.purchaseState === "purchased");
  for (const purchase of completed) await verifyAndFinish(purchase);
  if (completed.length > 0) paymentPending = false;
  if (matching.some((p) => p.purchaseState === "pending")) paymentPending = true;
  publishPremium({
    entitlement: completed.length > 0 ? "owned" : "free",
    notice: paymentPending ? "pending" : null,
  });
}

async function onPremiumPurchase(purchase: Purchase) {
  if (purchase.productId !== premiumProductId()) return;
  if (purchase.purchaseState === "pending") {
    paymentPending = true;
    publishPremium({ operation: "idle", notice: "pending" });
    return;
  }
  await enqueuePurchaseWork(async () => {
    if ("revocationDateIOS" in purchase && purchase.revocationDateIOS != null) {
      await reconcilePremium();
    } else {
      // A signed Android receipt alone does not prove it is still owned.
      if (Platform.OS === "android") {
        const owned = await iap!.getAvailablePurchases();
        if (!owned.some((item) => item.productId === purchase.productId &&
            item.purchaseToken === purchase.purchaseToken && item.purchaseState === "purchased")) {
          throw new Error("Google Play no longer reports this purchase as owned.");
        }
      }
      await verifyAndFinish(purchase);
      paymentPending = false;
      publishPremium({ entitlement: "owned", notice: "purchased" });
    }
    publishPremium({ operation: "idle" });
  }).catch((error) => {
    publishPremium({ entitlement: "unknown" });
    reportPremiumError(error, "verificationFailed");
  });
}

async function connectPremium() {
  if (premiumSnapshot.connected) return;
  if (connection) return connection;
  connection = (async () => {
    premiumProductId();
    iap = await import("expo-iap");
    purchaseListener = iap.purchaseUpdatedListener((purchase) => { void onPremiumPurchase(purchase); });
    errorListener = iap.purchaseErrorListener((error) => {
      // Query/restore rejections are reported by their awaiting caller.
      if (premiumSnapshot.operation !== "purchasing") return;
      if (error.productId && error.productId !== premiumProductId()) return;
      if (error.code === iap!.ErrorCode.AlreadyOwned) {
        void enqueuePurchaseWork(reconcilePremium)
          .then(() => publishPremium({ operation: "idle" }))
          .catch((cause) => reportPremiumError(cause));
        return;
      }
      const notice = error.code === iap!.ErrorCode.UserCancelled ? "cancelled" :
        error.code === iap!.ErrorCode.DeferredPayment || error.code === iap!.ErrorCode.Pending ? "pending" : "error";
      reportPremiumError(error, notice);
    });
    if (!(await iap.initConnection())) throw new Error("Store connection failed.");
    publishPremium({ connected: true });
  })();
  try { await connection; }
  catch (error) {
    purchaseListener?.remove();
    errorListener?.remove();
    purchaseListener = null;
    errorListener = null;
    throw error;
  } finally { connection = null; }
}

export function refreshPremium(): Promise<void> {
  if (refreshFlight) return refreshFlight;
  if (premiumSnapshot.operation === "purchasing" || premiumSnapshot.operation === "restoring") {
    return Promise.resolve();
  }
  publishPremium({ operation: "loading", notice: null });
  refreshFlight = (async () => {
    try {
      await connectPremium();
      await enqueuePurchaseWork(reconcilePremium);
    } catch (error) {
      publishPremium({ entitlement: "unknown", product: null });
      reportPremiumError(error, "unavailable");
      return;
    }
    try {
      const products = await iap!.fetchProducts({ skus: [premiumProductId()], type: "in-app" });
      let product = products?.find((item): item is Product =>
        item.id === premiumProductId() && item.type === "in-app");
      let offerTokenAndroid: string | null = null;
      if (product?.platform === "ios" && product.typeIOS !== "non-consumable") {
        product = undefined;
      }
      if (product?.platform === "android") {
        const offer = product.discountOffers?.find((item) =>
          item.purchaseOptionIdAndroid === PREMIUM_ANDROID_PURCHASE_OPTION_ID &&
          !item.id && !item.rentalDetailsAndroid && !item.preorderDetailsAndroid);
        if (!offer?.offerTokenAndroid || !offer.displayPrice) {
          product = undefined;
        } else {
          offerTokenAndroid = offer.offerTokenAndroid;
          product = { ...product, displayPrice: offer.displayPrice, price: offer.price };
        }
      }
      if (!product?.displayPrice ||
          (Platform.OS === "android" && !process.env.EXPO_PUBLIC_GOOGLE_PLAY_LICENSE_KEY?.trim())) {
        publishPremium({ product: null, notice: "unavailable", operation: "idle" });
        return;
      }
      publishPremium({ product, offerTokenAndroid, operation: "idle" });
    } catch (error) {
      publishPremium({ product: null });
      reportPremiumError(error, "unavailable");
    }
  })().finally(() => { refreshFlight = null; });
  return refreshFlight;
}

export async function buyPremium() {
  if (premiumSnapshot.operation !== "idle" || premiumSnapshot.entitlement !== "free" ||
      paymentPending || refreshFlight || !premiumSnapshot.product || !iap) return;
  publishPremium({ operation: "purchasing", notice: null });
  try {
    await iap.requestPurchase({ type: "in-app", request: {
      apple: { sku: premiumProductId(), andDangerouslyFinishTransactionAutomatically: false },
      google: { skus: [premiumProductId()], offerToken: premiumSnapshot.offerTokenAndroid },
    } });
    // The listener owns completion. A resolved request is not purchase success.
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === iap.ErrorCode.AlreadyOwned) {
      await enqueuePurchaseWork(reconcilePremium)
        .then(() => publishPremium({ operation: "idle" }))
        .catch((cause) => reportPremiumError(cause));
    } else {
      reportPremiumError(error, code === iap.ErrorCode.UserCancelled ? "cancelled" :
        code === iap.ErrorCode.DeferredPayment || code === iap.ErrorCode.Pending ? "pending" : "error");
    }
  }
}

export async function restorePremium() {
  if (premiumSnapshot.operation !== "idle" || refreshFlight) return;
  publishPremium({ operation: "restoring", notice: null });
  try {
    await connectPremium();
    await enqueuePurchaseWork(async () => {
      await iap!.restorePurchases();
      await reconcilePremium();
      publishPremium({ operation: "idle", notice:
        premiumSnapshot.entitlement === "owned" ? "restored" :
        premiumSnapshot.notice === "pending" ? "pending" : "nothingToRestore" });
    });
  } catch (error) {
    publishPremium({ entitlement: "unknown" });
    reportPremiumError(error);
  }
}
