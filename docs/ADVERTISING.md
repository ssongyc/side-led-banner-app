# Advertising behavior and verification status

## UMP recovery correction — 2026-10-16

- UMP is integrated; earlier UMP-exclusion records below are historical and were superseded on 2026-10-14 (see README).
- A failed consent update/form/status request can be retried through the existing explicit rewarded retry or Settings-entry recovery. Successful startup consent remains shared; no automatic consent retry loop or repeated QA reset was added. Every placement still requires the actual UMP `canRequestAds` result.
- Privacy-options opening invalidates banner request generations. Cancelling an issued load preserves its attempt count. Once consent allows ads again, visible placements may use the remaining slots; cancellation of the third request stops that cycle without inventing a failure or granting an extra cycle. Genuine failure deadlines and the existing 6/12-second sequence remain unchanged. Successfully loaded inventory is retired and may start a fresh cycle.
- Rewarded state and tracing distinguish consent blocking from SDK initialization failure. The existing retry action is available for transient consent errors; consent blocking does not display the SDK-initialization/load-failure message. No new UI copy or automatic ad presentation was added.
- Baseline: clean `6001e1dd5ac6b01a52f4babb9b4c86c5fbab7cdd`. Verification: source/call-site and diff review only. No build, lint, tests, device QA, console changes, commit or push. Native consent-error recovery and privacy-form banner disposal/recovery remain runtime-unverified.


## Current correction — orientation reuse and visibility

- At most two native banner hosts exist: portrait and landscape, on Android and iOS. They are created only after that direction is visible, with a 250 ms resize-settlement gate. Returning to a direction reuses the same host, loaded ad and retry ledger. Wider hosts retain fitting creatives unchanged; only settled width overflow retires a successfully loaded incompatible ad. Unknown pending work is retained hidden until a genuine result. No creative is stretched or cropped to fit.
- Status text uses a separate visible host, so a pending oversized native ad cannot hide its delayed-load notice. Hidden orientation hosts cannot receive touches or accessibility focus. There is no per-pixel placement collection.
- `adsAllowed` describes store entitlement (`free` versus `unknown`/`owned`), not the separate two-hour video-only reward. The earlier temporary-ad-removal wording should not be read as suppressing banners during that reward. Store verification, purchase ownership and video reward remain separate.
- Current shared policy permits SDK-owned Google optimized refresh. Earlier Disabled console records below are historical configuration evidence, not a current universal requirement. No console setting was changed here. Refresh failures preserve usable inventory; there is no app periodic timer. SDK-managed retry/refresh ownership and hidden-view request suppression still require exact-build runtime evidence before enabling refresh in the console.
- The three unsupported JS `delaysContentTouches` props were removed. Installed RN sets `_scrollView.delaysContentTouches = NO` in both Fabric and legacy native ScrollView implementations. `canCancelContentTouches`, scrolling, and slider/touch arbitration were preserved.
- SDK source review: Android banner view teardown calls `AdView.destroy()`; iOS teardown removes the banner from its superview and clears its stored reference. The JS wrapper exposes no explicit refresh pause/resume contract. Source inspection does not prove that SDK-internal refresh/recovery cannot overlap before teardown; this remains a blocker for claiming verified refresh ownership.
- Previous state-test and type-check evidence below applies to the earlier revision. Current execution results are recorded separately; native reuse/resize/refresh tests remain unverified without a connected test device.

### Verification — orientation correction

- Baseline: main `7368d44ffcf7544d667f44fc86c9ae4603d13cdb` plus the previous uncommitted advertising and Android-build-efficiency changes. Those changes were preserved.
- TypeScript `--noEmit`: passed after removing only the unsupported ScrollView props. No APK/AAB or iOS compilation was run.
- `node --test scripts/qa-ad-state.cjs`: 26/26 passed. The added orientation-state test checks reuse identity, request identity and exhausted retry-budget preservation. This does not mount React/native views and is not a substitute for integration/device QA.
- `git diff --check`: passed. `adb devices -l`: no connected devices. Remaining exact-build checks: repeated portrait/landscape returns, narrow/wide split-screen changes, delayed callbacks during resize, store entitlement changes, status visibility, real native disposal and SDK refresh ownership.
- No lint, native build, device installation, ad viewing, console change, commit or push.

### Main delivery scope — 2026-09-21

This delivery includes all thirteen pending files from this conversation: banner orientation reuse/visibility and retirement, diagnostic metadata, distinct authored banner/rewarded labels, ScrollView prop cleanup, the synchronized regression harness, README and advertising documentation, and the previously pending Android build-cache/history improvements and run evidence. No unknown or other-worker changes were identified in the pending diff. The earlier verification records above are preserved; build, lint and tests are not rerun for this documentation/Git delivery. Current source still requires native device QA, and the build-cache speed improvement is not yet measured.

## Previous implementation — 2026-09-21 follow-up

- Settings now uses one root-owned native banner placement on both platforms. iOS width updates settle for 250 ms before retiring successfully loaded inventory; resizing cannot allocate one placement or retry budget per pixel. Only one issued request is retained. Request widths remain pinned until a genuine SDK callback.
- During ad removal, a loaded banner is removed immediately; an already-issued unresolved banner is hidden and retains its callback route until success/failure, then its native view is removed. No new requests run while ads are disallowed. This replaces the earlier September 21 unconditional unmount/`stopped` path for ordinary entitlement changes. Unexpected root teardown still stops unresolved work without refunding attempts. No arbitrary timeout declares failure or drops the callback.
- On return to free eligibility, settled successful inventory may start a new cycle; genuine failure deadlines and the extra-cycle budget survive. Ordinary navigation continues to retain the same native view. A never-settling SDK request remains pending, bounded to one native view; its device behavior is not proven by state tests.
- Traces remain local, bounded to 120 entries, and silent in production console output. They include native platform build number when exposed by Expo Constants, the Expo-config app version with its source label, and embedded `extra.gitSha` or `unmeasured`. Banner traces include placement and request identifiers. No diagnostics upload was added.
- The state harness has been synchronized with placement access, monotonic timers, initialization subscriptions, SDK disposal/source admission, and explicit pre-show failure classification. Current checks cover genuine settlement versus pending disposal, retry-deadline preservation, unsupported rewarded sources, and existing reward/retry flows.
- Execution evidence is recorded below. Historical passing builds/tests do not cover later source changes. Current native layout, iPad resize, temporary ad-removal return, rewarded playback and immersive transitions still require device QA. `adb devices -l` returned no connected devices during this task; no ad was viewed, app installed, store uploaded, or console setting changed.
- Existing UMP exclusion, Google-only rewarded admission, manual retry and production AdMob profile decisions are unchanged.

### Verification for this follow-up

- `node --test scripts/qa-ad-state.cjs`: 25/25 passed after harness synchronization, including pending settlement, deadline preservation and unsupported-source admission. These are isolated state tests, not native view tests.
- `node node_modules/typescript/bin/tsc --noEmit --pretty false`: failed on existing `delaysContentTouches` ScrollView prop types in Text/Background/Effects, and a duplicated advertising label key. The advertising duplicate was corrected by separating `bannerAdUnavailable` (short banner label) from `rewardAdUnavailable` (prepared rewarded inventory guidance); the three unrelated scroll props were left unchanged. A second type check reports only those three existing ScrollView errors.
- No native build or lint run; no connected Android device. No commit/push. Existing build-efficiency edits in README, ANDROID_BUILD_OPTIMIZATION.md and build-local-apk.ps1 were preserved.

## Historical status

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

## Android device QA follow-up — 2026-09-21

The installed production-configured V1.1.2 (30) APK matched source `7919f58`'s recorded artifact hash. After the console test-device registration propagated, both banner and rewarded placements displayed Test Ad. Rewarded playback, close/return, feature unlock and restart persistence were observed on Galaxy SM-M336K without changing production IDs or building another APK. See [the device QA record](QA_20260910.md#테스트-모드-반영-후-실제-보상-흐름-검증). Earlier source-only entries remain historical. Actual two-hour expiry, iOS, early close, SDK refresh while hidden, production delivery metrics and purchase/restore remain unverified; this evidence does not imply all ad lifecycle cases passed.

## Android V1.1.2 (30) final QA follow-up — 2026-09-22

The exact installed production-configured APK from main `a49fed6` showed `Test Ad` on the registered Galaxy SM-M336K. An entitlement granted during the preceding QA had expired after more than two hours: presets 2–5 and Size were locked again after a cold start. A new rewarded test ad reached `Reward granted`; closing it unlocked the controls, and the two-hour entitlement persisted across force-stop and cold restart. This verifies expiry after the duration and the normal rewarded return path, but not the exact boundary instant, early close, duplicate/late native callbacks, iOS, production inventory, or revenue.

The rewarded popup exposed background main-screen controls in the Android accessibility hierarchy. The source now hides main content descendants while the popup is visible and marks the popup as the accessibility modal. Ad loading, presentation, retry budgets and reward eligibility are unchanged. TypeScript and all 26 ad-state regression tests passed. The accessibility correction is source-only and requires a new native build before TalkBack/device verification; it is not part of the APK used for the advertising flow above.

## Rewarded popup immediate dismissal — 2026-09-22

The popup previously retained its white card and dim layer for a 180 ms close fade after every close request. It now returns no overlay in the first React commit where `visible` is false, so the close button, outside tap and Android back action remove the card and dim layer together without a trailing visual remnant. The existing 180 ms opening fade remains. Watch Ad still waits until the overlay-removal commit and then one animation frame before requesting native presentation; loading, retry, reward and entitlement state are unchanged.

Source/diff review only. No build, lint, automated test or device QA was run. The visual result still requires confirmation on the affected device.

## QA attempt — 2026-10-16 (build deferred)

- Requested profile: official Google test ads, APK-only, UMP EEA debug device from the connected Galaxy SM-M336K's UMP log. Production defaults remain unchanged; no AAB or store upload requested.
- Updated the existing state harness for the consent boundary. SDK initialization deduplication is asserted through request counts rather than async Promise object identity. Added consent-error/manual-recovery and banner cancellation/budget/deadline regressions.
- `node --test scripts/qa-ad-state.cjs`: 29/29 passed. `node node_modules/typescript/bin/tsc --noEmit --pretty false`: passed, no diagnostics. These isolated checks do not prove native ad playback or UMP form behavior.
- Existing release wrapper with `-AdProfile test -UmpEeaTestDevice <SDK-issued hash> -MeasureBuild` stopped at resource preflight: 0.92 GiB available versus the existing 4 GiB minimum. Compilation did not begin; no new QA APK was generated or installed. Log: `artifacts/qa-build-20261016.log`.
- User explicitly deferred the build after the memory warning. No other process was terminated, no memory gate bypassed, and no app data cleared. Connected device reports Android 16. iOS device behavior was not checked.
- Pending after resumption: build/install the exact QA APK, then verify offline UMP recovery, privacy-options banner recovery, consent-versus-SDK failure UI, early close/no reward, earned/once-only unlock and normal retry timing on device. No runtime pass is claimed.

## Android device QA resume — 2026-10-16

- QA build `20261016-175154-016f12e6`: V1.1.3 (31), source HEAD `6001e1d` plus this task's working changes. APK SHA-256 `C33CB73872C4F6FBE0CDAE9785A79786CED24E60D1D1AFA4F365C8ADFEE726BF`. Official Google test App/unit IDs verified in the packaged Expo config and Android manifest; all four ABIs retained. Signature, identity, SDK and ZIP alignment checks passed. Full Gradle log retained: build successful in 14m06s, 1160 tasks (92 executed / 46 cached / 1022 up-to-date). Dependency/native preparation reused on resumed compile. Upstream SDK/R8 warnings remain; success does not imply zero warnings.
- Device: Galaxy SM-M336K, Android 16. Existing V1.1.2 (30) used a different signing identity, so update install was rejected. User explicitly authorized uninstall/data loss; old app removed and QA APK installed successfully. No signing identity was substituted.
- Device evidence in `artifacts/qa-20261016/`: offline startup produced genuine UMP `consent-update-failed`; main screen remained usable. Reward modal showed existing Try again without the SDK initialization failure message. Restoring original Wi-Fi and tapping retry enabled Watch Ad without auto-show. Official Test Ad presentation, Back return, and unlocked favorites/size controls observed. This does not independently prove once-only native earned delivery or an early-close/no-reward path; those remain covered only by state tests until more device evidence is collected.
- Settings displayed a Test Ad banner and the banner remained visible after leaving/reentering Settings. No privacy-options item was present in this run because UMP returned `IABTCF_gdprApplies=0`.
- QA configuration limitation discovered: uninstall/reinstall with the local signing identity changed the SDK-issued UMP test-device hash. The first APK embedded the old installed app's hash, so forced EEA form and consent-change banner recovery were not verified. Rebuilding with the newly observed hash was attempted but resource preflight blocked at 3.73 GiB (later 3.89 GiB) versus the existing 4 GiB minimum. The generated first APK remains test-ad QA, not a store release. No fabricated form or eligibility was added.
- Remaining: corrected-hash QA APK, official UMP form/privacy-options recovery (especially in-flight banner cancellation), early close/no reward and detailed once-only reward tracing; iOS unverified. Wi-Fi restored enabled; mobile data stayed disabled, matching initial state. No commit/push/store upload performed.

## Corrected UMP QA artifact and device result — 2026-10-16

This supersedes the pending corrected-hash build above. Run `20261016-185016-4d617d41` produced and installed V1.1.3 (31), official test ads, APK SHA-256 `04CB064AC4E36B54DA094455F94039CB42A9EA319DB31ACA4E683BA074DAF0E7`. Gradle succeeded in 4m17s: 1160 tasks, 71 executed and 1089 up-to-date (no FROM-CACHE tasks reported); wrapper elapsed 263.48 seconds. Signature, identity, SDK, ZIP alignment and packaged UMP identifier checks passed. Complete logs and artifact metadata remain in that run directory. Existing Expo-plugin App ID warning and SDK XML tool-version warning remain; this is not a warning-free build.

A preceding rebuild revealed that Expo CI retained Metro transforms containing the previous UMP device identifier even though Gradle rebundled. Metro cache identity now includes the UMP QA identifier and ad profile; the wrapper rejects a QA APK whose JavaScript bundle lacks its requested identifier before export. Production defaults, signing and native caches remain unchanged. The final installed APK passed that guard and displayed the official UMP form.

Device evidence under `artifacts/qa-20261016/`: `ump-current.png` shows the official Publisher Test Ads consent form. After Do not consent, Settings exposed Ad privacy choices; `privacy-form.png` shows its official form, and `privacy-return.png` shows the Test Ad banner restored after Consent. Rewarded test-ad playback and return unlocked favorites and Size. Earlier offline/manual-recovery results above remain valid for the same runtime source. QA-created temporary reward data was reset for the subsequent interruption check; no original user data remained after the previously authorized uninstall.

Early-close/no-reward is **unverified**: Android Back did not immediately dismiss the supplied creative, and the later return already had an earned unlock. Do not classify that sequence as an early-close pass or a reward bug. In-flight banner cancellation and duplicate/late native reward callbacks remain state-test coverage only (29/29 passed), not independently reproduced device cases. iOS, production fill/revenue, purchases and the exact two-hour expiry boundary were not checked in this run. No commit, push, console changes or store upload. This APK is for QA, not store publication.

## Rewarded modal presentation extraction — 2026-10-18

Moved the unchanged fireworks implementation to `components/rewardAdModal/FireworksBurst.tsx` and the five benefit rows to `components/rewardAdModal/RewardBenefits.tsx`. The modal passes its existing localization function to the benefit list. Existing styles, images, labels, particle values and animation timing remain unchanged. Visibility, dismissal, scroll/drag handling, deferred native presentation, retry and analytics remain owned by `rewardAdModal.tsx`; no ad-state or reward lifecycle was moved. Source/diff review only, no build/lint/tests or device QA for this extraction. Earlier device evidence predates it; no performance improvement is claimed.

## Production Android device QA — 2026-10-20

Tested the installed V1.1.3 (31) on Galaxy SM-M336K. Pulled APK SHA-256 `1C388077073685816AA9AF7EC301CCA37249A878AE20A3897E92AC705DD805E4` matches production run `20261020-141442-c2518642`, source `81bd3a690db2620a15895ce897a0ff7020e91ec4`. Existing app data was preserved. The ad-state regression harness passed 29/29 tests; these are simulated state tests, not native callback verification.

Observed cold start to main, Text vertical scrolling, reward modal benefit/button layout, modal dismissal followed by Play entry, and Play return to Effects. Settled Settings shows V1.1.3 and a banner. No fatal exception was found in this app process's captured log; device-wide historical UiAutomation exceptions are unrelated to this run. Frame-perfect transitions, all premium effects, performance equivalence and reward fireworks remain unverified. Screenshots/logs are local under `artifacts/qa-20261020/`.

**Blocked UMP check:** the production UMP request returned `Publisher misconfiguration` / `no form(s) configured for the input app ID` for Android App ID ending `~7354080715`. This is a server-reported message configuration problem, not proof of a missing SDK. Asked the user to check/publish the AdMob message for this Android app. No console settings or consent values were changed. Existing-choice SDK eligibility may still permit ads after an update error; banner appearance does not prove the consent form succeeded.

The observed banner had no Test Ad label, so current provider test-device serving was not established. Did not press Watch Ad or advertiser links. Reward playback, early close, once-only reward/unlock, privacy-option changes and consent-related banner recovery remain pending verified test traffic and a valid production message configuration. No rebuild, app-data reset, purchase, commit or push was performed during this QA pass. No app-code defect was established by the checks completed so far.

### UMP publication and device recheck — 2026-10-20

With explicit user approval, published `LED POP Android - European consent` for Android package `com.minkyokim.sideledbannerapp`, using the existing Settings privacy-policy URL. Enabled Consent, Manage options and Do not consent (all regions where the message is shown); AdMob confirmed Published. Default language is English. Evidence: `artifacts/qa-20261020/ump-published.png`.

After publication, a production cold start on the same Galaxy returned `IABTCF_gdprApplies=0` and no previous publisher-misconfiguration error in the captured current-process UMP log. No consent form appeared; this non-GDPR response does not verify accept/reject flows. Evidence: `ump-after-publish-log.txt` and `ump-after-publish.png` in the same evidence directory.

The user authorized building/installing an APK-only test-ad profile with the SDK-issued EEA test-device hash. The existing wrapper stopped before compilation because available memory was 1.37 GiB, below its unchanged 4 GiB gate (`artifacts/qa-build-20261020-ump.log`). No QA APK was produced or installed in this attempt; consent/rejection and subsequent test-ad playback remain pending. Production defaults and app data were preserved.

### Test-profile UMP accept/reject verification — 2026-10-20

After memory was freed, APK-only run `20261020-164119-be4a2a66` completed (`compile-ok`): V1.1.3 (31), HEAD `81bd3a6` plus this QA documentation, official test ad profile and the approved device-specific EEA identifier. Dependencies were reused; changed ad configuration required native generation. Gradle took 10m 28s: 1160 tasks, 78 executed, 6 from cache, 1076 up-to-date. Existing wrapper signature/identity/target SDK/alignment and embedded QA identifier checks passed; full store verification was not requested for this QA artifact. APK SHA-256: `F1B11B793C7848CEF89353DE9888FCE22A3CAF59AF832FCE2BEC88FC79D200D4`. Installed with `adb install -r` successfully, preserving existing data/signing.

On Galaxy SM-M336K, official `Publisher Test Ads` UMP form appeared on both cold starts. Do not consent saved `IABTCF_PurposeConsents=00000000000`; Consent saved `11111111111`. Both completed with `CONSENT_SIGNAL_SUFFICIENT`, returned to the app and displayed a labeled Test Ad banner. Reject does not by itself mean UMP forbids all ad requests; test delivery does not establish production personalization or inventory. No UMP failure or app fatal exception appeared in the captured accept/reject process logs.

After rejection, Watch Ad became ready and a labeled Test Ad rewarded creative played. The app was force-stopped during the ad sequence; the next launch showed unlocked presets/Size and retained entitlement. The exact reward callback/close moment was not captured, so this is not an early-close/no-reward pass or proof of once-only callback handling. Because the temporary reward was then active, a separate rewarded playback after acceptance was not tested; no app data or entitlement was erased to force another viewing. Settings privacy-options entry was absent in this demo-app response, so reopening/revocation remains unverified. The test form is Google's demo message, not proof of the production LED POP message's EEA presentation.

Evidence under `artifacts/qa-20261020/`: `qa-ump-form.png`, `qa-reject-settings.png`, `qa-reject-reward-ready.png`, `qa-reject-ad.png`, `qa-accept-form.png`, `qa-accept-ready.png` (unlocked state), `qa-accept-settings.png`, and the accept/reject logs. Device remains on the QA APK; production defaults were not edited. No product-code defect was established, and no commit/push was performed.

### Production App ID EEA check — 2026-10-20

Run `20261020-170945-018ed27e` built V1.1.3/code31 with production AdMob IDs and device-specific EEA QA settings (not a store artifact). Gradle succeeded in 3m 51s; 1160 tasks: 76 executed, 7 from cache, 1077 up-to-date. APK SHA-256 `158AD6E501C326F578FC4A21E369495CE46A400675E0FE2166D595560500163B`; wrapper signature/identity/SDK/alignment checks passed. Installed with `adb install -r` after USB authorization.

The actual LED POP logo/name consent form appeared (`production-eea-form.png`), and UMP logged `IABTCF_gdprApplies=1`. Consent completed and stored purpose consent bits `11111111111`. However, Settings did not display the Ad privacy choices entry, including after settling and scrolling (`production-privacy-settled.png`, `production-privacy-scroll.png`). Reopening/changing choices therefore remains blocked, not passed. The currently captured log does not expose the SDK privacy-options requirement status, so the exact cause is not established. No live rewarded ad or advertiser link was clicked.

Added a QA-flag-only diagnostic in `ads/adConsent.tsx` reporting only SDK status, canRequestAds and privacyOptionsRequirementStatus, without consent strings or identifiers. Its build attempt stopped before compilation at 3.65 GiB available memory (4 GiB required); the installed APK does not yet contain this diagnostic. Log: `artifacts/qa-build-20261020-ump-status.log`. Production defaults remain unchanged; no fix or complete privacy-options validation is claimed.

### Privacy options diagnosis and correction — 2026-10-20

Diagnostic run `20261020-172229-57c3ace6` completed and was installed with data preserved. The SDK returned `OBTAINED`, `canRequestAds=true`, and `privacyOptionsRequirementStatus=REQUIRED`. UIAutomator found the Settings button: it was present but white on the white Settings background when the device used dark mode. This supersedes the earlier apparent missing-entry diagnosis. The host Settings screen now explicitly supplies `color="#111111"` to `AdPrivacyOptions`; consent eligibility and SDK behavior are unchanged.

Before rebuilding the color correction, tapping the accessibility-confirmed button reopened the actual LED POP form. Do not consent changed stored purpose bits to `00000000000`; reopening and Consent changed them back to `11111111111`. Both returned `OBTAINED`, `canRequestAds=true`, and privacy options `REQUIRED`. Evidence: `privacy-reopen.png`, `privacy-reopen-after-reject.png`, `privacy-reject.txt`, and `privacy-reaccept.txt` under `artifacts/qa-20261020/`. This verifies choice changes using the production App ID with the authorized EEA debug device, not an actual EEA network location or store approval. No live ad was clicked. Visual verification of the color correction is pending its QA build.

Color-fix QA run `20261020-173321-5ffb4520` completed (`compile-ok`, Gradle 2m 59s; 1160 tasks, 71 executed and 1089 up-to-date). Dependency installation and native regeneration were both skipped because their inputs were unchanged. APK signature/identity/SDK/alignment checks passed, and `adb install -r` succeeded. APK SHA-256: `87CC4851700F71BBE989286BB75F2C75C8667CE4480F8FDACB0E9C349A531F3B`.

On the installed correction, the Settings entry is visibly dark on white (`privacy-color-fixed.png`), tapping it reopens the actual LED POP form (`privacy-color-fixed-reopen.png`), and changing Consent to Do not consent saves purpose bits from `11111111111` to `00000000000` (`privacy-color-fixed-log.txt`). No fatal exception appeared in that captured process log. The device is left on this EEA QA APK with rejection selected. This APK includes the forced EEA debug configuration and must not be submitted to Play; a new production APK/AAB without QA settings is needed to deliver the Settings correction. No commit, push or upload was performed.

### SDK 58 upgrade device QA — 2026-10-20

Corrected run `20261020-204946-3c27c770` (Expo 58.0.16 / RN 0.88.0 / AGP 9.2.1, V1.1.3/code31) was installed on Galaxy SM-M336K, Android 16. This is the official test-ad profile with the approved EEA debug device, not the production LED POP form or a store artifact. The earlier upgraded APK crashed during WorkManager startup; the scoped Room constructor keep rule and corrected rebuild resolved that crash in the exercised launches.

- Do not consent stored purpose bits `00000000000`; changing choices through Settings to Consent stored `11111111111`. Both returned `OBTAINED`, `canRequestAds=true`, and privacy options `REQUIRED`. The Settings entry was readable and reopened the form. Google's Publisher Test Ads form was used; the production-App-ID evidence above belongs to the preceding SDK 57 build.
- A labeled Test Ad banner appeared after rejection. After changing consent, a stale prepared reward correctly required explicit preparation: Try again prepared the ad without auto-showing; a separate Watch Ad tap opened a labeled Test Ad. After completion, tapping its close button returned to main with favorites 2–5 and Size unlocked. The unlock survived a force-stop/cold launch and another rejection. No advertiser CTA was tapped. This is not proof of production personalization, inventory, exact two-hour expiry, or duplicate native callbacks.
- Text and Effects vertically scrolled; Background displayed its complete Color/Blur controls within the viewport. Pixel rendering, bundled Tektur and remote-font Rubik selection, full-screen Play and Back return rendered without a captured fatal error. Rubik selection is not evidence of a fresh network download, since existing font cache was preserved. Landscape, photo import, all languages and all effects were not exhaustively retested.
- Fresh process logs (`25440`, then `29430`) contained no AndroidRuntime fatal or ReactNativeJS error in the captured ranges. This is bounded smoke QA, not a performance benchmark or crash-free guarantee.
- Purchase UI remains intentionally excluded; payment, restore and existing-paid-account reconciliation were not exercised. iOS, the new production APK/AAB, actual EEA network behavior and Play acceptance remain unverified.

Evidence: `artifacts/agp9-compat-20261020/device-qa/04`–`24` screenshots/logs. The connected device remains on this test-ad/EEA QA APK. No app data was erased and no commit, push or upload was performed.

## Android-only QA follow-up — 2026-10-16

Used the same installed test-profile V1.1.3 (31) on Galaxy SM-M336K; no rebuild or production profile change. Reset only the QA-created app state to remove prior temporary rewards. The official rewarded creative was captured early in playback (`interrupted.png`) and the app was force-stopped immediately afterward. On restart, favorites 2–5 and Size remained locked (`interruption-return.png`). This verifies interruption without an unearned persistent unlock, not dismissal by an available SDK close button. The supplied creative did not expose immediate Back dismissal before earning; that exact early-close path remains unverified.

During the Settings/consent transition, Wi-Fi was briefly disabled and restored. Captures `banner-loading.png`, `banner-interrupt-form.png`, and `banner-followup-return.png` show no rendered banner, official UMP form, then a Test Ad banner after form completion/network recovery. The first capture does not prove the native banner request had already dispatched; precise in-flight cancellation is still state-test evidence only. Wi-Fi was restored enabled. The Android crash buffer returned no entries during the follow-up inspection.

Re-ran `node --test scripts/qa-ad-state.cjs`: all 29 passed, including one-time earned handling, early-close no reward, stale callbacks, consent cancellation attempt preservation and real failure deadlines. Its intentional offline-error diagnostic is expected test input, not a failed case. Duplicate/late native callbacks were not artificially injected into the release APK, so the automated state result is not represented as SDK device coverage. No new defect was established in the exercised paths, and no app code change was needed. iOS excluded as requested; no commit/push/upload.
