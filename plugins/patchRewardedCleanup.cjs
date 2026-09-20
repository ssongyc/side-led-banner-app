// LED POP scoped repair for react-native-google-mobile-ads 16.5.0.
// User approved direct JS/Android/iOS patching after the approval-review rejection.
// This is source editing only; it never compiles or runs tests.
const fs = require('node:fs');
const path = require('node:path');
function applyRewardedCleanupPatch() {
const root = path.resolve(__dirname, '../node_modules/react-native-google-mobile-ads');
if (JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version !== '16.5.0') {
  throw new Error('Review rewarded cleanup patch before changing ads dependency version');
}
const edits = new Map();
function edit(file, before, after) {
  const text = edits.get(file) ?? fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  if (text.includes(after)) return;
  if (text.split(before).length !== 2) throw new Error(`Rewarded cleanup anchor changed: ${file}`);
  edits.set(file, text.replace(before, after));
}
const lifecycle = `
  // Single-use handles. Unknown mediation retains genuine late-reward delivery.
  _cleanupRequested = false;
  _resourceReleased = false;
  _rewardReceived = false;
  _dismissed = false;
  _googleRewardOrder = false;

  get googleRewardOrderGuaranteed() {
    return this._googleRewardOrder && !this._resourceReleased;
  }

  dispose() {
    if (this._resourceReleased) return;
    this._cleanupRequested = true;
    // Do not orphan an unresolved native load: its real result will release it.
    if (this._isLoadCalled && !this._loaded && !this._dismissed) return;
    this._releaseResources();
  }

  _releaseResources() {
    if (this._resourceReleased) return;
    NativeRewardedModule.rewardedDispose(this._requestId);
    this._resourceReleased = true;
    this._nativeListener.remove();
    this.removeAllListeners();
  }

  _handleAdEvent(event) {
    if (this._resourceReleased) return;
    const type = event.body.type;
    if (type === 'rewarded_loaded') {
      this._googleRewardOrder = event.body.data?.googleRewardOrderGuaranteed === true;
    }
    if (type === 'rewarded_earned_reward') this._rewardReceived = true;
    if (type === 'closed') this._dismissed = true;
    // Finish delivery before removing listeners, including late EARNED after CLOSED.
    try {
      if (!this._cleanupRequested) super._handleAdEvent(event);
    } finally {
      if (type === 'error' ||
          (this._cleanupRequested && type === 'rewarded_loaded') ||
          (this._dismissed && (this._rewardReceived || this._googleRewardOrder))) {
        this._releaseResources();
      }
    }
  }
`;
const tsLifecycle = lifecycle.replace('_handleAdEvent(event)', "protected _handleAdEvent(event: Parameters<MobileAd['_handleAdEvent']>[0])")
  .replace('event.body.data?.googleRewardOrderGuaranteed', '(event.body.data as { googleRewardOrderGuaranteed?: boolean } | undefined)?.googleRewardOrderGuaranteed');
// Upgrade only the exact earlier task-owned patch in reused native snapshots.
// Fresh dependencies still use the original anchors below.
function upgrade(file, previous, current) {
  const text = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
  if (!text.includes(current) && text.includes(previous)) edit(file, previous, current);
}
const getter = `  get googleRewardOrderGuaranteed() {
    return this._googleRewardOrder && !this._resourceReleased;
  }

`;
upgrade('src/ads/RewardedAd.ts', tsLifecycle.replace(getter, ''), tsLifecycle);
upgrade('lib/module/ads/RewardedAd.js', lifecycle.replace(getter, ''), lifecycle);
const commonJsLifecycle = lifecycle.replace('NativeRewardedModule.rewardedDispose', '_NativeRewardedModule.default.rewardedDispose');
upgrade('lib/commonjs/ads/RewardedAd.js', commonJsLifecycle.replace(getter, ''), commonJsLifecycle);
upgrade('lib/typescript/ads/RewardedAd.d.ts',
  '    protected static _rewardedRequest: number;\n    dispose(): void;',
  '    protected static _rewardedRequest: number;\n    dispose(): void;\n    readonly googleRewardOrderGuaranteed: boolean;');
edit('src/ads/RewardedAd.ts', '  protected static _rewardedRequest = 0;', '  protected static _rewardedRequest = 0;' + tsLifecycle);
edit('lib/module/ads/RewardedAd.js', 'export class RewardedAd extends MobileAd {', 'export class RewardedAd extends MobileAd {' + lifecycle);
edit('lib/commonjs/ads/RewardedAd.js', 'class RewardedAd extends _MobileAd.MobileAd {', 'class RewardedAd extends _MobileAd.MobileAd {' + lifecycle.replace('NativeRewardedModule.rewardedDispose', '_NativeRewardedModule.default.rewardedDispose'));
edit('lib/typescript/ads/RewardedAd.d.ts', '    protected static _rewardedRequest: number;', '    protected static _rewardedRequest: number;\n    dispose(): void;\n    readonly googleRewardOrderGuaranteed: boolean;');
edit('src/specs/modules/NativeRewardedModule.ts', '  rewardedLoad(', '  rewardedDispose(requestId: number): void;\n  rewardedLoad(');
edit('lib/typescript/specs/modules/NativeRewardedModule.d.ts', '    rewardedLoad(', '    rewardedDispose(requestId: number): void;\n    rewardedLoad(');
const androidBase = 'android/src/main/java/io/invertase/googlemobileads/';
edit(androidBase + 'ReactNativeGoogleMobileAdsFullScreenAdModule.kt', '  private val adArray = SparseArray<T>()', '  protected val adArray = SparseArray<T>()');
edit(androidBase + 'ReactNativeGoogleMobileAdsRewardedModule.kt', '  override fun getAdEventName(): String {', `  @ReactMethod
  fun rewardedDispose(requestId: Int) {
    com.facebook.react.bridge.UiThreadUtil.runOnUiThread {
      adArray.remove(requestId)
    }
  }

  override fun getAdEventName(): String {`);
edit(androidBase + 'ReactNativeGoogleMobileAdsFullScreenAdModule.kt', '          data.putInt("amount", rewardItem.amount)', `          data.putInt("amount", rewardItem.amount)
          if (ad is RewardedAd) {
            data.putBoolean("googleRewardOrderGuaranteed",
              ad.responseInfo?.mediationAdapterClassName == "com.google.ads.mediation.admob.AdMobAdapter")
          }`);
edit(androidBase + 'ReactNativeGoogleMobileAdsFullScreenAdModule.kt', '            override fun onAdClicked() {', `            override fun onAdFailedToShowFullScreenContent(adError: com.google.android.gms.ads.AdError) {
              if (ad !is RewardedAd) return
              val details = ReactNativeGoogleMobileAdsCommon.getCodeAndMessageFromAdError(adError)
              val error = Arguments.createMap()
              error.putString("code", details[0])
              error.putString("message", details[1])
              this@ReactNativeGoogleMobileAdsFullScreenAdModule.sendAdEvent(
                ReactNativeGoogleMobileAdsEvent.GOOGLE_MOBILE_ADS_EVENT_ERROR,
                requestId, adUnitId, error, null)
            }

            override fun onAdClicked() {`);
const iosBase = 'ios/RNGoogleMobileAds/';
edit(iosBase + 'RNGoogleMobileAdsRewardedModule.mm', 'RCT_EXPORT_METHOD(invalidate) { [_ad invalidate]; }', `RCT_EXPORT_METHOD(rewardedDispose : (double)requestId) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [_ad.adMap removeObjectForKey:@((int)requestId)];
    [_ad.delegateMap removeObjectForKey:@((int)requestId)];
  });
}

RCT_EXPORT_METHOD(invalidate) { [_ad invalidate]; }`);
edit(iosBase + 'RNGoogleMobileAdsFullScreenAd.mm', '          data = @{@"type" : adReward.type, @"amount" : adReward.amount};', `          BOOL googleRewardOrder = [ad isKindOfClass:[GADRewardedAd class]] &&
              [[(GADRewardedAd *)ad responseInfo].adNetworkClassName isEqualToString:@"GADMAdapterGoogleAdMobAds"];
          data = @{@"type" : adReward.type, @"amount" : adReward.amount,
                   @"googleRewardOrderGuaranteed" : @(googleRewardOrder)};`);
// All original or already-applied anchors must match before the first write.
for (const [file, text] of edits) fs.writeFileSync(path.join(root, file), text);
return edits.size;
}
module.exports = applyRewardedCleanupPatch;
if (require.main === module) console.log(`Rewarded cleanup: patched ${applyRewardedCleanupPatch()} files`);