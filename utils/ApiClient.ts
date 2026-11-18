import AsyncStorage from "@react-native-async-storage/async-storage";
import { PREMIUM_ANDROID_PURCHASE_OPTION_ID, PREMIUM_PRODUCT_IDS } from "@/constants/premium";
import type { Product, Purchase } from "expo-iap";
import { requireNativeModule } from "expo";
import { AppState, Platform } from "react-native";
import * as amplitude from "@amplitude/analytics-react-native";
import { File } from "expo-file-system";

interface BinaryRequestOptions {
  signal?: AbortSignal;
  onProgress?: (fraction: number) => void;
}

export function downloadBinaryFile(
  url: string,
  destination: File,
  options?: BinaryRequestOptions,
): Promise<File> {
  return File.downloadFileAsync(url, destination, {
    idempotent: true,
    signal: options?.signal,
    onProgress: options?.onProgress
      ? ({ bytesWritten, totalBytes }) => {
          options.onProgress!(totalBytes > 0 ? bytesWritten / totalBytes : -1);
        }
      : undefined,
  });
}

export async function fetchBinaryBlob(
  url: string,
  options?: BinaryRequestOptions,
): Promise<Blob> {
  const response = await fetch(url, { signal: options?.signal });
  if (!response.ok) {
    throw new Error(`ApiClient request failed: HTTP ${response.status}`);
  }

  const total = Number(response.headers.get("content-length") ?? -1);
  if (!options?.onProgress || !response.body || total <= 0) {
    return response.blob();
  }

  const reader = response.body.getReader();
  const chunks: BlobPart[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value.slice().buffer);
    received += value.byteLength;
    options.onProgress(received / total);
  }
  return new Blob(chunks);
}

// One launch event per JS app lifetime, including repeated root effects.
let appOpenedQueued = false;

export async function initializeAnalytics(): Promise<void> {
  const key = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY ?? "";
  if (!key) return;
  try {
    await amplitude.init(key, undefined, {
      disableCookies: true,
    }).promise;
    const deviceId = amplitude.getDeviceId();
    if (deviceId) amplitude.setUserId(deviceId);
    if (!appOpenedQueued) {
      appOpenedQueued = true;
      trackAnalyticsEvent("App Opened");
    }
  } catch (e) {
    if (__DEV__) console.warn("[App] Amplitude init failed:", e);
  }
}

export function trackAnalyticsEvent(...args: Parameters<typeof amplitude.track>) {
  return amplitude.track(...args);
}

export function flushAnalytics() {
  return amplitude.flush();
}

export async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ApiClient request failed: HTTP ${response.status}`);
  }
  return response.text();
}

export type PremiumNotice = "unavailable" | "error" | "cancelled" | "pending" |
  "purchased" | "restored" | "nothingToRestore" | "verificationFailed";
type PremiumPrice = Readonly<{ displayPrice: string; currency: string }>;

type PremiumSnapshot = {
  entitlement: "unknown" | "free" | "owned";
  operation: "idle" | "loading" | "purchasing" | "restoring";
  price: PremiumPrice | null;
  paymentPending: boolean;
  notice: PremiumNotice | null;
};

let premiumSnapshot: PremiumSnapshot = {
  entitlement: "unknown", operation: "loading", price: null, paymentPending: false, notice: null,
};
const premiumListeners = new Set<() => void>();
let iap: typeof import("expo-iap") | null = null;
let premiumConnected = false;
let premiumConnectionNeedsReset = false;
let connection: Promise<void> | null = null;
let refreshFlight: Promise<void> | null = null;
let foregroundRefreshRequested = false;

function drainForegroundPremiumRefresh() {
  if (!foregroundRefreshRequested || AppState.currentState !== "active" ||
      refreshFlight || premiumSnapshot.operation !== "idle") return;
  foregroundRefreshRequested = false;
  void refreshPremium({ preserveNotice: true });
}

export function requestForegroundPremiumRefresh() {
  foregroundRefreshRequested = true;
  drainForegroundPremiumRefresh();
}
// One native connection/listener pair for the app lifetime, independent of screens.
let purchaseListener: { remove(): void } | null = null;
let errorListener: { remove(): void } | null = null;
let purchaseQueue: Promise<void> = Promise.resolve();
const finishedTransactions = new Set<string>();
// A persisted store-pending marker blocks a duplicate purchase; it grants no access.
const pendingPurchaseKey = "@led_banner_pending_premium_sku_v1";
let pendingHydrated = false;
let pendingWriteNeeded = false;

type PremiumQuote = {
  product: Product;
  storefront: string;
  currency: string;
  option: string | null;
  offerTokenAndroid: string | null;
};
let displayedQuote: PremiumQuote | null = null;
let shopVisible = false;
let shopRevision = 0;
let purchaseDispatched = false;

export function setPremiumShopVisible(visible: boolean) {
  if (shopVisible === visible) return;
  shopVisible = visible;
  shopRevision += 1;
}

export const getPremiumSnapshot = () => premiumSnapshot;
export const subscribePremium = (listener: () => void) => {
  premiumListeners.add(listener);
  return () => { premiumListeners.delete(listener); };
};
function publishPremium(patch: Partial<PremiumSnapshot>) {
  premiumSnapshot = { ...premiumSnapshot, ...patch };
  premiumListeners.forEach((listener) => listener());
  if (foregroundRefreshRequested && patch.operation === "idle") {
    queueMicrotask(drainForegroundPremiumRefresh);
  }
}
function premiumProductId() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    throw new Error("Native in-app purchases require iOS or Android.");
  }
  return PREMIUM_PRODUCT_IDS[Platform.OS];
}
function invalidateDisconnectedPremiumConnection(error: unknown) {
  if (Platform.OS !== "android" || !iap || !error || typeof error !== "object") return;
  const { code, message } = error as { code?: string; message?: string };
  if (code === iap.ErrorCode.ServiceDisconnected || code === iap.ErrorCode.ConnectionClosed ||
      code === iap.ErrorCode.NotPrepared || message === "Billing client not ready") {
    premiumConnected = false;
    premiumConnectionNeedsReset = true;
  }
}
function reportPremiumError(error: unknown, notice: PremiumNotice = "error") {
  invalidateDisconnectedPremiumConnection(error);
  // Never log signed purchase data, tokens, or full SDK error objects.
  console.warn("[IAP]", notice, error instanceof Error ? error.name : "StoreError");
  publishPremium({ notice });
}
function enqueuePurchaseWork(work: () => Promise<void>) {
  const next = purchaseQueue.then(work);
  purchaseQueue = next.catch(() => {}); // Caller reports failure; later explicit work can proceed.
  return next;
}

// Read and write pending state through the existing serialized purchase queue.
async function hydratePendingPurchase() {
  if (pendingHydrated) return;
  const savedSku = await AsyncStorage.getItem(pendingPurchaseKey);
  if (savedSku !== null && savedSku !== premiumProductId()) {
    throw new Error("Unexpected pending Premium product.");
  }
  publishPremium({ paymentPending: savedSku !== null });
  pendingHydrated = true;
}

async function setPaymentPending(pending: boolean) {
  await hydratePendingPurchase();
  if (premiumSnapshot.paymentPending !== pending) {
    pendingWriteNeeded = true;
    publishPremium({ paymentPending: pending });
  }
  if (!pendingWriteNeeded) return;
  if (pending) await AsyncStorage.setItem(pendingPurchaseKey, premiumProductId());
  else await AsyncStorage.removeItem(pendingPurchaseKey);
  pendingWriteNeeded = false;
}

async function readPremiumQuote(): Promise<PremiumQuote | null> {
  if (!iap) throw new Error("Store is not connected.");
  const storefront = await iap.getStorefront();
  const products = await iap.fetchProducts({ skus: [premiumProductId()], type: "in-app" });
  if (!storefront || storefront !== await iap.getStorefront()) return null;
  const product = products?.find((item) => item.id === premiumProductId() && item.type === "in-app");
  if (product?.type !== "in-app") return null;
  if (Platform.OS === "ios" && product.platform === "ios" && product.typeIOS === "non-consumable" &&
      product.displayPrice && product.currency && Number.isFinite(product.price) && Number(product.price) > 0) {
    return { product, storefront, currency: product.currency, option: null, offerTokenAndroid: null };
  }
  if (Platform.OS !== "android" || product.platform !== "android" ||
      !process.env.EXPO_PUBLIC_GOOGLE_PLAY_LICENSE_KEY?.trim()) return null;
  const offer = product.discountOffers?.find((item) =>
    item.purchaseOptionIdAndroid === PREMIUM_ANDROID_PURCHASE_OPTION_ID &&
    !item.id && !item.limitedQuantityInfoAndroid && !item.rentalDetailsAndroid && !item.preorderDetailsAndroid);
  if (!offer?.offerTokenAndroid || !offer.displayPrice || !offer.currency ||
      !Number.isFinite(offer.price) || offer.price <= 0) return null;
  return {
    product: { ...product, displayPrice: offer.displayPrice, price: offer.price },
    storefront, currency: offer.currency, option: PREMIUM_ANDROID_PURCHASE_OPTION_ID,
    offerTokenAndroid: offer.offerTokenAndroid,
  };
}

function publishQuote(quote: PremiumQuote | null) {
  displayedQuote = quote;
  publishPremium({ price: quote ? { displayPrice: quote.product.displayPrice, currency: quote.currency } : null });
}

function sameQuote(shown: PremiumQuote, fresh: PremiumQuote) {
  return shown.product.id === fresh.product.id && shown.product.price === fresh.product.price &&
    shown.product.displayPrice === fresh.product.displayPrice && shown.currency === fresh.currency &&
    shown.storefront === fresh.storefront && shown.option === fresh.option;
}

function purchaseIdentity(purchase: Purchase) {
  return purchase.store + ":" + (purchase.purchaseToken ?? purchase.id);
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
  const identity = purchaseIdentity(purchase);
  if (finishedTransactions.has(identity)) return;
  // Non-consumable: acknowledge on Google Play, finish on StoreKit. Never consume.
  if (!("isAcknowledgedAndroid" in purchase && purchase.isAcknowledgedAndroid === true)) {
    await iap.finishTransaction({ purchase, isConsumable: false });
  }
  finishedTransactions.add(identity);
}

async function reconcilePremium(preserveNotice = false) {
  if (!iap) throw new Error("Store is not connected.");
  await hydratePendingPurchase();
  // OpenIAP Google 3.5.0 rejects a non-OK BillingClient ownership query.
  const purchases = await iap.getAvailablePurchases({
    onlyIncludeActiveItemsIOS: true, alsoPublishToEventListenerIOS: false,
  });
  const matching = purchases.filter((p) => p.productId === premiumProductId());
  if (matching.some((p) => p.store !== (Platform.OS === "ios" ? "apple" : "google") ||
      (p.purchaseState !== "purchased" && p.purchaseState !== "pending"))) {
    throw new Error("Incomplete Premium ownership result.");
  }
  const completed = matching.filter((p) => p.purchaseState === "purchased" &&
    !("revocationDateIOS" in p && p.revocationDateIOS != null));
  for (const purchase of completed) await verifyAndFinish(purchase);
  const storePending = matching.some((p) => p.purchaseState === "pending");
  // StoreKit current entitlements do not include an outstanding approval request.
  await setPaymentPending(completed.length === 0 && (storePending ||
    (Platform.OS === "ios" && premiumSnapshot.paymentPending)));
  const entitlement = completed.length > 0 ? "owned" : "free";
  const notice = preserveNotice && entitlement === premiumSnapshot.entitlement && premiumSnapshot.notice !== "pending"
    ? premiumSnapshot.notice : null;
  publishPremium({ entitlement, notice: premiumSnapshot.paymentPending ? "pending" : notice });
}

async function onPremiumPurchase(purchase: Purchase) {
  if (purchase.productId !== premiumProductId()) return;
  await enqueuePurchaseWork(async () => {
    if (purchase.purchaseState === "pending") {
      if (premiumSnapshot.entitlement === "owned") return;
      await setPaymentPending(true);
      publishPremium({ notice: "pending" });
      return;
    }
    if ("revocationDateIOS" in purchase && purchase.revocationDateIOS != null) {
      await reconcilePremium();
    } else {
      if (premiumSnapshot.entitlement === "owned" && finishedTransactions.has(purchaseIdentity(purchase))) return;
      // A signed Android receipt alone does not prove it is still owned.
      if (Platform.OS === "android") {
        const owned = await iap!.getAvailablePurchases();
        if (!owned.some((item) => item.productId === purchase.productId &&
            item.purchaseToken === purchase.purchaseToken && item.purchaseState === "purchased")) {
          throw new Error("Google Play no longer reports this purchase as owned.");
        }
      }
      await verifyAndFinish(purchase);
      await setPaymentPending(false);
      publishPremium({ entitlement: "owned", notice: "purchased" });
    }
  }).catch((error) => {
    reportPremiumError(error, "verificationFailed");
  });
}

async function connectPremium() {
  if (premiumConnected) return;
  if (connection) return connection;
  connection = (async () => {
    premiumProductId();
    iap = await import("expo-iap");
    // Retry only through the existing refresh/restore entry points. The native
    // SDK also caches connectionReady, so initConnection alone cannot recover.
    if (premiumConnectionNeedsReset) {
      await iap.endConnection();
      premiumConnectionNeedsReset = false;
    }
    if (!purchaseListener) purchaseListener = iap.purchaseUpdatedListener((purchase) => { void onPremiumPurchase(purchase); });
    if (!errorListener) errorListener = iap.purchaseErrorListener((error) => {
      // Some purchase errors omit productId. Correlate those only while this
      // app's single purchase request is actually dispatched, not during queries.
      if (error.productId ? error.productId !== premiumProductId() : !purchaseDispatched) return;
      void enqueuePurchaseWork(async () => {
        if (premiumSnapshot.entitlement === "owned") return;
        if (error.code === iap!.ErrorCode.DeferredPayment || error.code === iap!.ErrorCode.Pending) {
          await setPaymentPending(true);
          publishPremium({ notice: "pending" });
        } else if (error.code === iap!.ErrorCode.AlreadyOwned) {
          await reconcilePremium();
        } else {
          reportPremiumError(error, premiumSnapshot.paymentPending ? "pending" :
            error.code === iap!.ErrorCode.UserCancelled ? "cancelled" : "error");
        }
      }).catch((cause) => reportPremiumError(cause));
    });
    if (!(await iap.initConnection())) throw new Error("Store connection failed.");
    premiumConnected = true;
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

export function refreshPremium({ preserveNotice = false } = {}): Promise<void> {
  if (refreshFlight) return refreshFlight;
  if (premiumSnapshot.operation === "purchasing" || premiumSnapshot.operation === "restoring") {
    return Promise.resolve();
  }
  const notice = preserveNotice && premiumSnapshot.notice !== "unavailable" ? premiumSnapshot.notice : null;
  publishPremium({ operation: "loading", notice });
  refreshFlight = (async () => {
    try {
      await connectPremium();
      await enqueuePurchaseWork(() => reconcilePremium(preserveNotice));
    } catch (error) {
      publishQuote(null);
      reportPremiumError(error, "unavailable");
      return;
    }
    try {
      const quote = await readPremiumQuote();
      publishQuote(quote);
      publishPremium({
        operation: "idle",
        notice: premiumSnapshot.paymentPending ? "pending" :
          premiumSnapshot.notice ?? (quote || premiumSnapshot.entitlement === "owned" ? null : "unavailable"),
      });
    } catch (error) {
      publishQuote(null);
      reportPremiumError(error, "unavailable");
    }
  })().finally(() => {
    refreshFlight = null;
    publishPremium({ operation: "idle" });
    drainForegroundPremiumRefresh();
  });
  return refreshFlight;
}

export async function buyPremium(shownPrice: PremiumPrice) {
  if (!shopVisible || shownPrice !== premiumSnapshot.price) return;
  const revision = shopRevision;
  const shown = displayedQuote;
  if (premiumSnapshot.operation !== "idle" || premiumSnapshot.entitlement !== "free" ||
      premiumSnapshot.paymentPending || refreshFlight || !shown || !iap) return;
  publishPremium({ operation: "purchasing", notice: null });
  try {
    let fresh: PremiumQuote | null;
    try {
      await enqueuePurchaseWork(reconcilePremium);
      if (getPremiumSnapshot().entitlement !== "free" || premiumSnapshot.paymentPending) return;
      fresh = await readPremiumQuote();
    } catch (error) {
      publishQuote(null);
      reportPremiumError(error, "unavailable");
      return;
    }
    publishQuote(fresh);
    if (!fresh) {
      publishPremium({ notice: "unavailable" });
      return;
    }
    // Publish a changed quote and require a fresh tap before contacting the payment sheet.
    await purchaseQueue;
    if (!sameQuote(shown, fresh) || getPremiumSnapshot().entitlement !== "free" || premiumSnapshot.paymentPending ||
        !shopVisible || revision !== shopRevision || AppState.currentState !== "active") return;
    purchaseDispatched = true;
    const result = await iap.requestPurchase({ type: "in-app", request: {
      apple: { sku: premiumProductId(), andDangerouslyFinishTransactionAutomatically: false },
      google: { skus: [premiumProductId()], offerToken: fresh.offerTokenAndroid },
    } });
    // Only process actual purchase records. Expo IAP may also send the matching listener event.
    for (const purchase of Array.isArray(result) ? result : result ? [result] : []) {
      await onPremiumPurchase(purchase);
    }
    await purchaseQueue;
  } catch (error) {
    await purchaseQueue;
    const code = (error as { code?: string })?.code;
    try {
      if (code === iap.ErrorCode.AlreadyOwned) {
        await enqueuePurchaseWork(reconcilePremium);
      } else if (code === iap.ErrorCode.DeferredPayment || code === iap.ErrorCode.Pending) {
        await enqueuePurchaseWork(async () => {
          if (getPremiumSnapshot().entitlement !== "owned") {
            await setPaymentPending(true);
            publishPremium({ notice: "pending" });
          }
        });
      } else if (getPremiumSnapshot().entitlement !== "owned") {
        reportPremiumError(error, premiumSnapshot.paymentPending ? "pending" :
          code === iap.ErrorCode.UserCancelled ? "cancelled" : "error");
      }
    } catch (reconciliationError) {
      reportPremiumError(reconciliationError);
    }
  } finally {
    purchaseDispatched = false;
    publishPremium({ operation: "idle" });
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
      publishPremium({ notice:
        premiumSnapshot.entitlement === "owned" ? "restored" :
        premiumSnapshot.notice === "pending" ? "pending" : "nothingToRestore" });
    });
  } catch (error) {
    reportPremiumError(error);
  } finally {
    publishPremium({ operation: "idle" });
  }
}
