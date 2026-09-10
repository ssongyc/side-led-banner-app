# Advertising behavior — 2026-09-09 source update

## Status

2026-09-10: the 06f8847 APK includes the source changes below. Galaxy SM-M336K QA observed bounded banner cycles and rewarded failure/manual recovery without autoplay. Twenty-one isolated regression tests pass. A new show-time readiness/expiry guard is source-only. Actual rewarded playback/reward/immersive transitions remain unverified. See [QA evidence](QA_20260910.md). The following September 9 build status is historical.

Initial source delivery was followed by the user-requested Android 1.0.6 (24) production APK/AAB build. TypeScript compilation, native build and local artifact/profile/JS isolation/signing/mapping checks passed; see [release evidence](ANDROID_RELEASE_1.0.6_24.md). The native module required defaultConfig version fields during compilation. The separate splash edit remains excluded. No real-device ad/layout/lifecycle test, iOS build, AdMob Console change or Play upload was performed.

## Native profiles

`advertising.config.json` records separate `test` and `production` values for Android/iOS. `app.config.js` selects one profile and supplies the matching native App IDs and runtime configuration. Runtime configuration must match its declared platform and selected profile, and the local native module must return the same App ID from Android Manifest/iOS Info.plist; missing/mixed configuration stops ad requests rather than selecting another platform or sample ID.

- EAS development/preview: explicit `LEDPOP_AD_PROFILE=test`, official Google demo App IDs and adaptive banner/rewarded units.
- EAS production: explicit `LEDPOP_AD_PROFILE=production`, existing LED POP AdMob IDs only. Production with a test profile fails config generation.
- Local wrapper: production by default; `-AdProfile test` explicitly selects a native test APK. `-IncludeBundle` requires production. No signing identity change. A local Metro serving a test development client also needs LEDPOP_AD_PROFILE=test; a production/test native-JS mismatch stops requests.
- Profile changes are included in native preparation fingerprints and recorded in the source plan/build result. Native output must be regenerated after this update; do not use an older prebuilt native tree with the new JS.
- This configuration check cannot prove the account-side platform ownership, account approval, fill, impressions or Console refresh settings. Verify generated manifests and final artifacts on the next requested build.

## SDK initialization

One shared in-flight initialization serves root rewarded preload and the Settings banner. It makes the initial attempt, retries 6 seconds after failure, then 12 seconds after a second failure, and stops after three failures. A resolved result with no ready adapter is treated as failure; adapter status is logged. Load timers begin only after initialization succeeds, so initialization and placement retry timers do not overlap.

Cancellation/ads ineligibility invalidates callbacks and cancels the shared timer. A terminal initialization failure stays terminal through screen re-entry. The existing rewarded manual retry can start one new bounded initialization/load cycle; it never queues a show. Configuration mismatch is not manually retried.

## Settings banner

Uses react-native-google-mobile-ads 16.5.0 `LARGE_ANCHORED_ADAPTIVE_BANNER` and measured container width. The wrapper has no fixed 60dp height; the SDK's size drives content height. Left/right/bottom Safe Area are owned once by Settings. At usable viewport heights below 480 logical units, the footer is part of the Settings scroll body so it does not consume a fixed band beside the anchored ad. Other sizes retain the anchored footer. Actual phone/tablet/rotation measurements are pending.

Before the first success: an initial three-request cycle uses 6-second/12-second failure retries; stale/duplicate callbacks are ignored. After all three fail, remove the failed view and show the localized unavailable message for 10 seconds. After it disappears, wait another 60 seconds, then start exactly one additional three-request cycle with the same 6-second/12-second retries (at most six app-controlled requests across remounts before success or process restart). If that cycle also fails, show the message for 10 seconds and stop without another automatic cycle. Success stops app retries; unmount cancels timers. Increasing request identities reject callbacks from the previous cycle. Settings remounts retain the same process-level budget and absolute deadlines in ads/bannerState.ts. Only a previously confirmed successful placement allows a fresh budget on later entry; terminal failure does not reset on remount. This exception applies only to banner load failures after SDK readiness, not initialization/configuration failures or rewarded ads.

This extra-cycle change is included in the September 10 06f8847 APK and was observed during offline device QA. September 9 artifacts do not include it despite sharing version 1.0.6 (24). Exact timer boundaries are covered by deterministic tests; device UI polling has limited time resolution.

After a successful load: SDK refresh failure leaves the existing ad view mounted. It does not start app retry timers, remount, or display a terminal failure over the existing ad. Further automatic refresh is controlled by the SDK and AdMob Console configuration. No Console settings were changed. The app's bounded two-cycle limit applies to initial app-controlled loads, not the SDK's own refresh mechanism.

## Rewarded ads and immersive navigation

Preserves the existing current/next slots, 6/12-second load retries, inline modal messages, manual retry only after final load/show failure, and no automatic playback. A ready user action confirms modal removal and crosses one animation frame before requesting presentation. Initialization completion only changes readiness.

Android presentation uses `immersiveModeEnabled=true` and the local `LedPopAdImmersive` Expo module. During the owned ad flow, it hides navigation bars on app/SDK-owned Activity creation/start/resume/post-resume and window focus, and on host dismissal/show failure. A flow token prevents stale cleanup from ending another presentation. Listeners are removed when the flow ends. It does not poll, add fixed presentation delays, hide with overlays, or modify external app windows.

A 15-second show-to-OPENED watchdog stops on OPENED; it does not time the user's viewing/reward duration or retry a show. Pending presentation is cancelled by backgrounding. OPENED + EARNED_REWARD + CLOSED from the same ad remains required for a reward.

The previously observed external `com.android.vending` Google Play Activity navigation bar remains an acknowledged limitation, as approved by the user. Single-frame entry/exit behavior, three-button and gesture navigation still require a real-device recording. No claim of complete navigation-bar suppression is made.

## Web diagnostic isolation

Ordinary web shows an explicit localized unsupported message and cannot grant an ad reward. The native initialization function's web version reports unsupported; it does not fake SDK success.

To explicitly start development-only diagnostics after authorization to run the web app:

```powershell
node scripts/start-web-ad-diagnostics.cjs
```

This sets `EXPO_PUBLIC_WEB_AD_DIAGNOSTICS=1`; both that flag and `__DEV__` are required. The main screen shows a clearly labeled web-only panel. Choose Preparing, Ready/success, Ready/show failure, or Final load failure; then open the reward modal and use a fresh enabled Watch Ad action. Only selected success grants the existing two-hour Pro simulation. No real video or ad impression is implied.

Settings displays a labeled 150px banner reservation in diagnostic mode. The reward expiry uses web page memory only, never the native reward storage key, and is cleared by reload. Web reward clicks do not emit the native WatchAd analytics event. The 1.0.6 (24) snapshot excluded ProDebugFab. Subsequent remote main commits restored its import and render under __DEV__; those commits are preserved. The current source requires a new release-bundle check and must not inherit the older artifact exclusion result.

Implementation lives in `.web.ts/.web.tsx` files. The native diagnostic component contains no imports or reward implementation. Metro rejects project-owned `.web` source resolving into Android/iOS and rejects native bundling when the diagnostic flag is enabled. EAS/local native build entrypoints also reject diagnostic configuration. Android 1.0.6 (24) source-map and APK/AAB verification confirmed exclusion; future artifacts need their own verification.

## Local logs and measurement limits

`ads/adTrace.ts` keeps the most recent 120 records and writes local console diagnostics only under __DEV__: timestamp, platform, placement, stage, attempt, dimensions/profile where available, and SDK error code/domain/original message. No diagnostic upload is added.

App-controlled banner requests record their view-request boundary time and completion/error time. SDK automatic refresh exposes completion/failure callbacks but not a request-start callback in this wrapper: its requestedAt/elapsed time are explicitly null, never fabricated. This is not network latency measurement. Next device checks should inspect Settings content scroll area, footer, ad dimensions and Safe Area at portrait/landscape phone/tablet sizes, plus controlled initial/refresh/initialization failure paths.

Official references: [large adaptive banners and refresh](https://developers.google.com/admob/android/banner), [Android test ads](https://developers.google.com/admob/android/test-ads), [iOS test ads](https://developers.google.com/admob/ios/test-ads).

## Popup content visibility — source update

The rewarded popup places the close control, badge, benefits, reserved status text, retry action and Watch Ad in one vertical ScrollView. Card padding belongs to its scroll content; the card can grow to the safe viewport rather than retaining a 380/560 width cap. Required text and touch targets are not reduced. Status/button variants still reserve their longest text in the initial layout. A drag starting on a control suppresses its action; normal taps retain the existing dismissal and next-frame ad sequence. The development CSV sheet uses the same full-content scroll arrangement and safe insets. Platform photo permission/picker windows remain OS-owned; fullscreen LED playback remains a playback surface, not a scrolling text popup.

These layout/gesture changes are not included in the existing APK/AAB. No compilation, lint, tests or device gesture/localization verification was run. Other project checkouts were not modified; the shared mobile skill already documents this policy for future work across apps/games.

Settings footer alignment: the Sunny logo/Innovation Lab artwork is left-aligned and Terms/Privacy are right-aligned using space-between, preserving 20px horizontal padding and existing artwork/text sizes. Source change only; no new build or device verification.

## Web diagnostic event parity — source update

Following decibella 2's web AdClient design, LED POP's ads/AdClient.web.ts emits LOADED when an explicit ready diagnostic is selected, then OPENED, EARNED and CLOSED in separate microtasks only after a fresh user show action. The web rewarded hook grants the existing two-hour simulation once only after all three presentation events in order. A selected show failure or final load failure emits ERROR and grants nothing. Disposal, backgrounding and state replacement invalidate pending presentation events; loading never auto-shows. These are simulated events, not a real ad impression. Ordinary web remains unsupported, and the native resolution guard continues to exclude .web sources. The subsequent native boundary extraction is described below; analytics identity is unchanged.

recordAdEvent still retains its bounded 120-entry local trace, but the [LEDPOP Ads] console output and JSON serialization now run only under __DEV__. Amplitude assignment, payloads, identity persistence and event collection were not changed or live-verified. Compilation, tests, device verification, commit and push were deferred to the subsequent main delivery.

## Advertising module boundaries — source refactor

Compared with C:/dev/decibella 2/ads/AdClient.tsx and its web implementation, native SDK creation, initialization, adaptive banner rendering, app-ID lookup, show and immersive calls now live in ads/AdClient.tsx. ads/rewardedState.ts owns current/next slots, callback guards, reward eligibility, retry timers, expiry and the presentation watchdog. hooks/useRewardedAd.ts only subscribes to that state and connects the existing reward callback. Native configuration, initialization, tracing and web diagnostics now reside under ads/; existing platform-specific hook and banner entry points remain intact. No second service layer was added.

The working tree's separately updated 6/12-second retry values were retained during extraction. This refactor does not change the timing policy or grant rewards from load completion. The earlier web event simulation and development-only console changes are retained. Amplitude identity and event payloads are unchanged.

The reference iOS return cover depends on its audio-visual animation freeze plus InteractionManager and two animation frames. LED POP has no verified equivalent rendering defect; that visual cover and extra scheduling were not copied. Native iOS return stability remains unverified.

Static import/call-site inspection only: no compile, lint, tests, device QA, commit, push or new artifacts were run. Existing artifact verification belongs to its original source and does not verify this refactor.
## Banner remount budget preservation — source update

The placement state owns request IDs, attempts, extra-cycle consumption and absolute retry/message deadlines outside React. Component cleanup removes timers; remount resumes the remaining delay, or requests once when an existing deadline has passed. No requests run while the placement is absent. The existing 6/12-second retry intervals and 10-second message plus 60-second wait remain unchanged. Final failure and the extra-cycle limit survive remounts until process restart. Successful loading clears deadlines; SDK refresh failure still keeps the existing ad.

An unmounted in-flight request consumes its attempt. A later entry may use only the next remaining attempt after its delay. If the third/sixth request is destroyed before receiving a result, stop without fabricating a failed callback, unavailable message or another cycle. Owner tokens and increasing request IDs reject old callbacks and concurrent ownership. There is no disk persistence or new manual retry UI.

This correction was inspected statically only. No compile, lint, tests or new APK/AAB was performed. The source and documentation are included in the subsequent main delivery.