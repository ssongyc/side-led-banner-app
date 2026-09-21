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

Cancellation/ads ineligibility invalidates callbacks and cancels the shared timer. A terminal initialization failure stays terminal until an explicit Settings focus entry or the existing rewarded manual retry starts one new bounded initialization/load cycle. Active/loading/loaded/showing slots are reused; neither path queues a show. Configuration mismatch is not retried.

## Settings banner

Uses react-native-google-mobile-ads 16.5.0 `LARGE_ANCHORED_ADAPTIVE_BANNER` and measured container width. The wrapper has no fixed 60dp height; the SDK's size drives content height. Settings reserves left/right/bottom Safe Area once; the persistent root host aligns the banner to that same inset rectangle. At usable viewport heights below 480 logical units, the footer is part of the Settings scroll body so it does not consume a fixed band beside the anchored ad. Other sizes retain the anchored footer. Actual phone/tablet/rotation measurements are pending.

Before the first success: an initial three-request cycle uses 6-second/12-second failure retries; stale/duplicate callbacks are ignored. After all three fail, remove the failed view and show the localized unavailable message for 10 seconds. After it disappears, wait another 60 seconds, then start exactly one additional three-request cycle with the same 6-second/12-second retries (at most six app-controlled requests across remounts before success or process restart). If that cycle also fails, show the message for 10 seconds and stop without another automatic cycle. Success stops app retries; leaving Settings or backgrounding cancels app retry/message timers while retaining their absolute deadlines and the native request. Increasing request identities reject callbacks from the previous cycle. Settings remounts retain the same process-level budget and absolute deadlines in ads/bannerState.ts. Re-entry reuses the retained loading/loaded native view and never resets its budget; terminal failure does not reset on remount. This exception applies only to banner load failures after SDK readiness, not initialization/configuration failures or rewarded ads.

This extra-cycle change is included in the September 10 06f8847 APK and was observed during offline device QA. September 9 artifacts do not include it despite sharing version 1.0.6 (24). Exact timer boundaries are covered by deterministic tests; device UI polling has limited time resolution.

After a successful load: SDK refresh failure leaves the existing ad view mounted. It does not start app retry timers, remount, or display a terminal failure over the existing ad. Further automatic refresh is controlled by the SDK and AdMob Console configuration. No Console settings were changed. The app's bounded two-cycle limit applies to initial app-controlled loads, not the SDK's own refresh mechanism.

## Rewarded ads and immersive navigation

Preserves the existing current/next slots, 6/12-second load retries, inline modal messages, manual retry only after final load/show failure, and no automatic playback. A ready user action confirms modal removal and crosses one animation frame before requesting presentation. Initialization completion only changes readiness.

Android presentation uses `immersiveModeEnabled=true` and the local `LedPopAdImmersive` Expo module. During the owned ad flow, it hides navigation bars on app/SDK-owned Activity creation/start/resume/post-resume and window focus, and on host dismissal/show failure. A flow token prevents stale cleanup from ending another presentation. Listeners are removed when the flow ends. It does not poll, add fixed presentation delays, hide with overlays, or modify external app windows.

A 15-second show-to-OPENED watchdog stops on OPENED; it does not time the user's viewing/reward duration or retry a show. Pending presentation is cancelled by backgrounding. The current ad's accepted EARNED_REWARD grants the reward immediately and exactly once. CLOSED only performs dismissal cleanup and next-slot promotion. Duplicate EARNED_REWARD events do not grant duplicate rewards.

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

Following decibella 2's web AdClient design, LED POP's ads/AdClient.web.ts emits LOADED when an explicit ready diagnostic is selected, then OPENED, EARNED and CLOSED in separate microtasks only after a fresh user show action. The web rewarded hook grants the existing two-hour simulation exactly once on EARNED; CLOSED performs cleanup only. A selected show failure or final load failure emits ERROR and grants nothing. Disposal, backgrounding and state replacement invalidate pending presentation events; loading never auto-shows. These are simulated events, not a real ad impression. Ordinary web remains unsupported, and the native resolution guard continues to exclude .web sources. The subsequent native boundary extraction is described below; analytics identity is unchanged.

recordAdEvent still retains its bounded 120-entry local trace, but the [LEDPOP Ads] console output and JSON serialization now run only under __DEV__. Amplitude assignment, payloads, identity persistence and event collection were not changed or live-verified. Compilation, tests, device verification, commit and push were deferred to the subsequent main delivery.

## Advertising module boundaries — source refactor

Compared with C:/dev/decibella 2/ads/AdClient.tsx and its web implementation, native SDK creation, initialization, adaptive banner rendering, app-ID lookup, show and immersive calls now live in ads/AdClient.tsx. ads/rewardedState.ts owns current/next slots, callback guards, reward eligibility, retry timers, expiry and the presentation watchdog. hooks/useRewardedAd.ts only subscribes to that state and connects the existing reward callback. Native configuration, initialization, tracing and web diagnostics now reside under ads/; existing platform-specific hook and banner entry points remain intact. No second service layer was added.

The working tree's separately updated 6/12-second retry values were retained during extraction. This refactor does not change the timing policy or grant rewards from load completion. The earlier web event simulation and development-only console changes are retained. Amplitude identity and event payloads are unchanged.

The reference iOS return cover depends on its audio-visual animation freeze plus InteractionManager and two animation frames. LED POP has no verified equivalent rendering defect; that visual cover and extra scheduling were not copied. Native iOS return stability remains unverified.

Static import/call-site inspection only: no compile, lint, tests, device QA, commit, push or new artifacts were run. Existing artifact verification belongs to its original source and does not verify this refactor.
## Banner remount budget preservation — source update

The placement state owns request IDs, attempts, extra-cycle consumption and absolute retry/message deadlines outside React. Component cleanup removes timers; remount resumes the remaining delay, or requests once when an existing deadline has passed. No requests run while the placement is absent. The existing 6/12-second retry intervals and 10-second message plus 60-second wait remain unchanged. Final failure and the extra-cycle limit survive remounts until process restart. Successful loading clears deadlines; SDK refresh failure still keeps the existing ad.

Historical behavior, superseded by the September 19 root-host correction: an unmounted in-flight request consumed its attempt with an unknown outcome. A later entry immediately uses only the next remaining attempt in the same bounded cycle; an already scheduled failure delay still retains its absolute deadline. If the third/sixth request is destroyed before receiving a result, stop without fabricating a failed callback, unavailable message or another cycle. Owner tokens and increasing request IDs reject old callbacks and concurrent ownership. There is no disk persistence or new manual retry UI.

This correction was inspected statically only. No compile, lint, tests or new APK/AAB was performed. The source and documentation are included in the subsequent main delivery.

## Settings preload and analytics consolidation — 2026-09-12

App-root preload remains unchanged. Settings uses a memoized focus effect with `loadRewardedAd({ restartFailed: true })`: a retryable terminal failure may start one new bounded cycle, while an active cycle or ready/showing ad is reused. Retry delays remain 6/12 seconds and configuration failures remain blocked. Settings does not auto-show an ad; the separate Watch Ad action is still required. Web keeps its explicit diagnostic behavior and only accepts the matching optional interface argument.

Amplitude initialization, getDeviceId/setUserId, eight event call sites and flush now pass through the existing utils/ApiClient.ts. Event names/properties, invocation timing, API-key handling, disableCookies setting and SDK identity persistence/restoration configuration are preserved. No identifier masking, raw-ID log removal, new retry, SDK replacement or analytics upload was performed as part of this change. Live Amplitude receipt remains unverified.

These changes have static source/diff review only. No build, lint, tests, device QA or new APK/AAB was run for this delivery. Earlier build/test records above apply to their original versions only.


## App launch analytics — 2026-09-15

App Opened is queued once per JavaScript app lifetime from utils/ApiClient.ts after the existing app-root Amplitude initialization and getDeviceId/setUserId assignment. It represents a fresh app launch, not each foreground return, screen visit, Play action or SDK session start. A module-level guard prevents duplicate events from repeated initialization callbacks. Initialization remains scheduled after UI fonts load at the existing idle boundary; launches that end before initialization may not be recorded. Missing API configuration or initialization failure does not produce this event.

Existing identity assignment, transmission, SDK persistence/restoration settings and interaction events are preserved. Only static source/diff review was performed; build, lint, tests, live Amplitude receipt and dashboard changes were not performed. The event becomes available for chart selection after an updated app sends it and Amplitude ingests it.

## September 17 source correction

`ads/rewardedState.ts` now correlates earned rewards with the shown ad instance and retains that reward handler after CLOSED/open timeout. A timeout keeps presentation ownership until SDK CLOSED/ERROR; it does not discard the ad, end immersive handling or enable retry. Confirmed show failure promotes existing next-slot work instead of deleting its retry budget. Expiry is distinguished from load failure, and the existing manual retry remains available in eligible foreground recovery states. No ad IDs, reward duration or analytics identity were changed.

The September 17 Settings banner implementation destroyed the in-flight native view on exit and could leave the session stopped. The September 19 correction below supersedes that lifecycle behavior. SDK automatic refresh remains separately unverified; no AdMob console settings changed. Chinese explicit script now precedes region in `language/deviceLocale.ts`.

These source changes were read back but not compiled, linted, tested or exercised on a device. Earlier APK/QA records apply only to their named builds. Late-event behavior, immersive transitions and SDK refresh limits remain runtime verification items.

## September 19 Settings banner lifecycle correction (source only)

- `BannerPlacementProvider` under the app root owns one native banner independently of Settings navigation. Settings reserves the existing banner height, bottom margin and safe-area space. Web keeps its inline diagnostic implementation.
- Leaving Settings, backgrounding, or disabling ads hides the retained view outside the viewport and disables its touch/accessibility surface. It does not detach the native request or fabricate a load outcome. Existing callbacks can finish while absent; re-entry displays that same request/result, including the third or sixth attempt.
- App-controlled requests/retry timers run only while Settings is eligible and foreground. Request identity, attempt count, absolute retry/message deadlines and the single extra-cycle budget survive re-entry. Native request width stays fixed for each request so a layout change cannot implicitly reload it. No ad IDs, SDK dependencies, reward logic or console settings changed.
- Static source/call-site and diff inspection only; no build, lint, tests or device QA performed. Device checks remain necessary for exit/re-entry during each load attempt, hidden completion/failure, background return, ad removal, phone/tablet safe areas and SDK-controlled refresh/viewability. This is not proof of live impressions or release readiness.

## September 20 Android/iOS rate review (source only)

User-supplied aggregate screenshot, with reporting dates/country/format/build breakdown not supplied:

| Platform | Requests | Matched | Match rate | Impressions | Show rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Android | 798 | 366 | 45.86% | 212 | 57.92% |
| iOS | 256 | 232 | 90.63% | 183 | 78.88% |

Match rate is matched requests / requests; show rate is impressions / matched requests. The unmatched 432 Android requests are not evidence of 432 SDK No-fill errors. The 154 matched-but-unshown Android requests are not all proven display failures: unused rewarded preloads and session exits also contribute. This aggregate cannot establish an Android SDK defect or the shipped version of the banner fix.

Source inspection found the same non-personalized request setting on both platforms, separate production App IDs/unit IDs with runtime profile checks, and shared load/show logic. The Android-only immersive presentation boundary remains unchanged. The existing app-start current preload and next preload on OPENED remain; removing them merely to increase Show Rate would change approved readiness behavior.

Corrections in this source change:

- Rewarded requests and 6/12-second retry handles pause in inactive/background states. In-flight SDK work remains owned; failures retain monotonic deadlines and attempt counts. Foreground return resumes only pending first loads or due retries; slot promotion preserves them. No new retry cycle or automatic show is introduced.
- Recheck ad eligibility immediately before SDK show, after Android immersive preparation, to reject a presentation whose entitlement changed while awaiting preparation.
- Rewarded traces now correlate request IDs, attempt counts, elapsed time, SDK errors and discarded slot state. The banner records the SDK's actual onAdImpression separately from load completion, including placement eligibility and app state. These are bounded local diagnostics, not uploaded analytics or proof of AdMob report receipt. The installed rewarded adapter does not expose an impression event; OPENED is not labeled as an impression.

Remaining evidence: same-period format/country/app-version reports, serving restrictions, eCPM floors, blocking controls, and country-specific consent configuration in AdMob. No app-owned UMP consent flow was found in the inspected source; this requires consent/configuration review for affected markets, but is not established as the cause of this Android/iOS difference. Non-personalized requests are not a replacement for consent handling. This change does not enable personalized ads or alter console settings.

Static source/diff review only. Build, lint, automated tests, device/ad playback, store-version matching and live console validation were not performed. Rate or revenue improvement is not yet measured. Verify the corrected source in a separately authorized build/device run before judging rollout results.

References: [AdMob metric definitions](https://support.google.com/admob/table/16327896?hl=en), [low match rate causes](https://support.google.com/admob/answer/9655701?hl=en), [Google UMP integration](https://developers.google.com/admob/android/privacy).

AdMob read-only access was authorized during this review. Browser and computer-use runtimes failed with `trusted Node process exited unexpectedly` before a console page could be read. No authenticated report, floor, restriction or consent setting was verified or modified. The screenshot remains the only current account-metric evidence.

## September 20 follow-up: delayed loads, expiry and session clocks (source only)

- Initialization and banner/rewarded load responses pending for 45 seconds now use a neutral delayed-preparation message. This is an observation deadline, not a failed SDK callback: it never refunds an attempt, disposes the request, enables a duplicate retry or auto-shows an ad. A genuine late response remains accepted. Both new status messages are authored in all seven supported languages and included in the rewarded modal's existing intrinsic status-area measurement.
- A one-shot foreground status timer updates rewarded readiness at the existing one-hour expiry boundary. Expiry disables Watch Ad and exposes the existing manual preparation control; it is separate from show failure and no longer triggers the show's automatic error-popup path just because time elapsed. Foreground return recomputes expiry. Started playback is not interrupted by this timer.
- SDK initialization retains its shared pending promise, in-flight attempt and 6/12-second retry deadlines across inactive/background transitions. Backgrounding cancels timer handles, not in-flight SDK work; foreground return issues only the remaining due attempt. Explicit entitlement/root suspension retains its existing cancellation behavior.
- Banner waits/messages, SDK initialization timing, rewarded validity and load deadlines use performance.now(). Human-readable trace timestamps remain UTC wall-clock values; monotonic deadline values are not formatted as calendar dates. Slot disposal/suspension and request outcomes clean up status timer handles. No periodic polling or new automatic retry cycle was added.

Read back the affected source, call sites, web interface and translation variants. No compilation, lint, automated tests, device checks, commit or push was performed. Pending device checks include a genuinely delayed callback and its late result, foreground/background transitions during each initialization retry, one-hour expiry while the popup is open/closed, system-clock changes, and long translated statuses on small/large screens. Source inspection alone does not establish timer behavior during OS suspension or improved AdMob metrics.

### Additional user-supplied seven-day screenshots

A later Android overview showed 57 requests, 100% match rate and 32 impressions: calculated show rate 56.14%. The preceding seven-day counts inferred from the displayed differences are 186 requests and 129 impressions (69.35% show rate). For this interval, lower request volume and matched-but-unshown ads require investigation; low match rate was not observed. Another cropped overview showed 19 requests, 100% match rate and 10 impressions (52.63% calculated show rate), but its app/platform label was not visible. These screenshots have no exact calendar dates or format/country split and are not evidence that the unbuilt source changes improved results.

### Scoped source delivery

The September 19–20 banner lifecycle, delayed/expired state, initialization timing and documentation cleanup changes are grouped for main delivery. The unused external export of the web-internal DiagnosticAdEvent type was removed; no unused runtime ad files were established. The existing qa-ad-state.cjs harness needs synchronization with the new monotonic clock and initialization subscription interface before its next run. Historical passing QA results do not validate this source. Build, lint, tests and device QA were excluded from this delivery request.

### Expo Router import correction — 2026-09-20

The production Android build exposed an unsupported direct @react-navigation/native import in the Settings banner slot. useIsFocused now comes from expo-router/react-navigation, as required by the installed Expo Router. No attach/detach, visibility, request budget or reward logic changed. The first rebuild was blocked at the memory preflight after the correction; that attempt did not verify compilation or device behavior. See the failure record in ANDROID_BUILD_OPTIMIZATION.md.


The import correction subsequently passed Android compilation and bundled-source checks in run 20260920-214301-06a96479 for V1.1.2(30). Production AdMob configuration and native modules were verified in both APK and AAB. Actual impressions/rewards and device lifecycle QA remain unperformed. The source correction and the historical export records are included in this final source delivery; no build, lint, tests or device QA ran for this delivery. See the successful export record in ANDROID_BUILD_OPTIMIZATION.md.

## Rewarded failure messages — 2026-09-21 source update

The rewarded snapshot now carries its existing failure cause through the hook and main screen to the popup. SDK initialization failure, configuration failure and unconfirmed ad opening each have separate authored messages in all seven supported languages. These messages participate in the popup's initial reserved-text sizing and are not overwritten by Sheet matching. The web hook exposes a null native failure cause and retains its existing explicit diagnostic behavior.

Third-load exhaustion still uses the load-failure message; confirmed show failure keeps the existing presentation-failure message. A show-to-open timeout no longer claims definite playback failure or asks the user to retry. Its existing recovery block, genuine late callbacks, current/next slots and fresh-tap-only presentation remain unchanged.

Source and call-site diff review only; no build, lint, tests, device QA, commit or push. Effective AdMob automatic refresh, native transition frames and retained late-reward listener/resource cleanup remain unverified and are not claimed fixed.
## Banner refresh delivery and pending SDK cleanup — 2026-09-21

The user requested both improvements. Automatic refresh was changed from Google optimized to Disabled for Android banner 9971880471 and iOS banner 4875843768 (publisher 3506417530430977). Each AdMob setting was reopened after Save and showed Disabled selected. No app periodic refresh was added. This confirms saved console configuration, not measured device request totals.

Installed react-native-google-mobile-ads 16.5.0 retains its JS SharedEventEmitter subscription after removeAllListeners; Android adArray and iOS adMap/delegateMap also retain per-request objects without an individual rewarded disposal API. Removing only app listeners therefore cannot complete native cleanup.

The proposed dependency repair was NOT applied: automatic approval review rejected direct JS/Android/iOS library patching and a new native API because an unbuilt cross-platform change could break builds, ad callbacks or reward delivery. The rejected command did not create the patch script or change node_modules. Earlier app-level message corrections remain intact.

### Concrete pending repair scope (requires approval after review rejection)

1. Add rewardedDispose(requestId) to the rewarded module's codegen interface and Android/iOS implementations, releasing only that request's native references on the UI queue.
2. Have the loaded event identify a Google-served response from the actual adapter. Release a closed Google-served instance, or a rewarded-and-closed instance, only after delivering its genuine callbacks. Preserve unknown mediation's late earned callback and report any unproved terminal boundary; no time/count eviction.
3. Release the corresponding JS native-event subscription as well as app listeners. For a discarded in-flight load, retain a cleanup listener until a real load/error result, then release that result instead of recreating an orphan native object. Preserve current/next slot budgets and show cancellation.
4. Keep the repair as a version-checked reproducible dependency patch, include it in installation/native preparation fingerprints and apply it to reused build snapshots. Require a native rebuild before claiming delivery to an installed app. No dependency upgrade, build/test, commit or push is authorized by this pending proposal alone.

This is a reviewable implementation scope, not implemented or verified code. Android/iOS compilation and callback/resource/device checks remain unperformed.
## Approved rewarded resource repair — 2026-09-21 source implementation

The user explicitly approved the concrete dependency repair above after the automatic review rejection. The prior blocked status is historical. The source implementation is now present in plugins/patchRewardedCleanup.cjs and applied to the installed 16.5.0 dependency. This is not a compiled/runtime validation.

- The version-checked patch adds rewardedDispose(requestId) to the codegen spec, Android rewarded module and iOS rewarded module. Native per-request ad/delegate references are removed on the UI queue. The JS handle removes its native event subscription and all remaining application listeners after a proved terminal boundary. Android now forwards rewarded failed-to-show callbacks into the existing error path; other fullscreen formats are unchanged.
- The loaded event carries the actual Google adapter ordering guarantee. Google-served CLOSED, an earned-and-closed ad (in either order), and a confirmed SDK error release resources only after the event reaches app listeners. The app explicitly disposes never-shown discarded slots and rejected/cancelled show attempts. A discarded pending load retains only the callback path necessary to release its genuine later result; it is not turned into a failure/retry.
- Unknown mediation that closes without an earned callback still lacks a proved terminal reward boundary. Its genuine late callback remains, as does any SDK request that never settles. These unresolved cases are not solved by an arbitrary time limit; no universal bounded-memory claim is made. Current/next retry budgets, exactly-once reward grants, manual retry and the open watchdog are preserved.
- The dependency is pinned to 16.5.0 in package.json and package-lock.json. postinstall, Expo config and the local Android wrapper reapply the same patch. The existing source preparer hashes plugins/ and dependency inputs, so this change invalidates stale native preparation and cannot use ResumeNative against old inputs. No package installation or build was run now.
- The native ad boundary checks for the new disposal method. An older binary reports configuration failure and stops ad requests; shipping this JS requires an Android/iOS native rebuild. It is not an OTA-only update.

Reviewed the patch anchors, native main-thread release paths, type declarations, event ordering, app callers and build-preparation inclusion by source inspection. No compilation, lint, automated tests, device/memory profiling, commit or push. Before release, the exact rebuilt artifact still needs load failure, early close, earned-before/after-close, expired/discarded ad, show failure, timeout, backgrounding and repeated-use memory checks.
## Google-only rewarded admission — 2026-09-21 current status

The user explicitly selected "Google ads only" for Watermelon Checker and LED POP to eliminate the closed-without-reward retention path for unknown mediation. Before marking a rewarded ad ready, the app now requires the actual loaded response to identify the Google adapter: Android com.google.ads.mediation.admob.AdMobAdapter or iOS GADMAdapterGoogleAdMobAds. Null, unknown and third-party responses are released before show, reported as configuration failure and do not trigger load retries. This restriction applies to rewarded ads; it does not change banner source selection or AdMob mediation configuration.

For admitted ads, Google's documented earned-before-dismissal contract makes CLOSED a terminal reward boundary, including early closure without a reward. Genuine earned callbacks are delivered once before resources are released. No arbitrary late-reward timer or reward fabrication is used. Earlier notes about unknown mediation retention describe the pre-restriction implementation, not a supported presentation path after this change. A show/open timeout still does not prove termination; an SDK operation that never returns remains pending. This change does not claim to solve an unresponsive SDK.

All four Android/iOS banner Automatic refresh settings were reopened on 2026-09-21 and still showed Disabled. The saved settings are verified; device request counts are not. No additional periodic refresh was added.

Source inspection only. Build, lint, tests, runtime/memory QA, commit and push were not performed. Installed apps need a new build before the source changes take effect.

LED POP exposes the native response-order flag through its pinned dependency patch and checks it at load and again before show. The patch also upgrades its exact earlier task-owned form in reused build snapshots. A native Android/iOS rebuild is required; an OTA-only update cannot supply the disposal API.


### September 21 follow-up policy corrections

Settings/manual recovery first promotes a usable or loading next slot, retaining its identity, attempt budget and pending deadline. No fresh current cycle is created in that case.

Source/diff review only. No build, lint, tests, device verification, commit, push or console changes. Consent integration remains excluded by user instruction.


### September 21 presentation classification and reward integrity

Pre-handoff cancellation and confirmed SDK pre-show rejection retain the existing recovery path. Errors after dispatch without terminal evidence keep the current presentation and genuine reward callback; no replacement load/show is started.

Reviewed installed RN Google Mobile Ads 16.5.0 / Flutter Google Mobile Ads source as applicable. No build, lint, automated tests, device checks, commit, push or console changes were performed. Source changes do not verify installed binaries. Consent integration remains excluded.


### Banner initialization recovery follow-up (source review)

Final shared SDK initialization failure now records the banner placement's ten-second notice and seventy-second recovery deadline. A visible foreground placement may consume its single extra cycle at that deadline, reset a retryable initialization failure and reuse the shared initialization promise. Configuration failure is excluded. The extra-cycle guard and deadline survive hiding and re-entry; initialization recovery and later banner load failures share the same extra-cycle allowance. No periodic refresh or rewarded presentation is added.

Source/diff review only; no build, lint, automated tests, device QA, commit, push or console changes. Actual SDK request timing and retained hidden-view behavior remain unverified.


## Loaded inventory, pre-show cancellation and ad removal — 2026-09-21

- An SDK error for an already loaded current/next rewarded slot now disposes that invalid inventory and publishes `unavailable`, independently of exhausted load attempts. The existing manual/Settings recovery may prepare or reuse inventory; it never shows automatically. The modal has authored unavailable text in all seven supported languages, included in its reserved status sizing.
- Background cancellation during the native pre-show handoff retains a still-valid Google ad with its original loaded timestamp and remaining expiry. The cancelled tap is not replayed. Expired/unusable inventory is classified separately; stale handoff completion cannot replace a newer slot. Issued/unknown presentations retain their existing terminal/reward handling.
- When `adsAllowed` becomes false, root-owned banner views are unmounted rather than parked offscreen. Ordinary Settings navigation still retains them. Disposal after a completed successful cycle permits a later eligible fresh cycle; an unresolved issued request remains stopped without refunding attempts. Existing failure deadlines/extra-cycle limits survive teardown.
- Source/diff and call-site review only. No build, lint, tests, device QA, console changes, commit or push. Native disposal, purchase/reward transitions, cancellation and SDK refresh visibility remain device-unverified. UMP remains excluded by the existing user decision.
