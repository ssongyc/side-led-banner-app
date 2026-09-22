# LED POP Android local signing

## 2026-09-21 — Splash composition and main-first review

- Baseline `7513cad`. `RootLayout.tsx` no longer makes main-screen readiness depend on native splash dismissal or the loader image. Once the existing font/storage/preview/layout readiness reaches its frame boundary, the overlay is removed and native dismissal can proceed directly to main. Image preparation finishing later cannot restore the loader. `SplashLoadingScreen.tsx` reveals its image composition only after image loading, with no Android image fade. Existing startup errors and manual retry remain available, including native-dismissal failure after main preparation. The image contains the splash branding; no additional text/font load is introduced.

Source review only: no prebuild, build, lint, tests or device run in this task. No minimum branding duration was added. Frame callbacks coordinate rendering; they do not prove GPU completion. Native OS launch surfaces may not be skippable. Runtime visual continuity remains unverified. See the [shared splash policy](C:/Users/ssong/.codex/skills/mobile-app-production/references/layout-platform.md#splash-to-main-transition).


## 2026-09-21 — DEX / Play quality source review

- Existing `withAndroidRelease.js` already selects the optimizing default and enables minify/resource shrinking. Added the missing independent effective-configuration/AAB-metrics gate to `build-local-apk.ps1` before artifact export; results and configuration are retained as `r8-optimization.json` and `r8-configuration.txt` in the build record directory.
- Main/Settings explicitly select orientation, while playback supports orientation selection. Preserve that product behavior; adaptive large-screen/rotation validation is still required. Tracked native/plugin source search found no direct `getStatusBarColor`, `setStatusBarColor`, `setNavigationBarColor` or `BitmapFactory.decodeStream` call; this does not cover SDK bytecode or prove Play warnings absent.
- `scripts/verify-r8-optimization.ps1` rejects empty effective R8 configuration and active `-dontoptimize`, `-dontshrink` or `-dontobfuscate`. For an AAB it independently checks enabled options and numeric `100 - no*Percentage` values in embedded `r8.json`; missing/unknown metadata blocks export. The local preventive floor is 25% in each category, including small apps; this is not a claim that Play enforces a deadline on every app. Evidence includes configuration/metadata SHA-256 and total uncompressed DEX bytes. APK-only checks do not build an extra AAB or claim AAB metrics.
- Static source/diff review only: no prebuild, build, lint, tests, device checks or Play upload. New artifacts and runtime compatibility remain unverified. Retain required JNI/reflection/SDK keep rules. Store warning resolution requires a later authorized build, relevant device checks and the user's manual Play upload/reanalysis. No version, signing identity or SDK upgrade in this change.
- Shared reference: [DEX optimization policy](C:/Users/ssong/.codex/skills/mobile-app-production/references/android-release-mapping.md#dex-optimization-is-separate-from-mapping). App-specific Play eligibility/deadline remains unverified.


- Application ID: com.minkyokim.sideledbannerapp.
- Existing EAS credential: Build Credentials FIxh6TZalE, downloaded with user authorization on 2026-09-08.
- External directory: C:/AndroidSigning/com.minkyokim.sideledbannerapp/.
- Files: upload-key.jks, credentials.json (secret passwords and alias), upload_certificate.pem, expected-certificate-sha256.txt.
- Expected SHA-256: 730173560958735BF237CA84BA4F35BBE76A6734986929EB65F6CED63D3FD893.
- Certificate expiry: 2053-11-01. Existing alias: 88995a0e2459ad11a9ee33f8f161d791.
- These private files must never be committed or printed. The external directory has restricted Windows access permissions. No replacement key or debug signing is permitted.

## Historical internal APK build (2026-09-08)

The authorized 2026-09-08 local build uses an isolated source snapshot now archived at C:/dev/Led Banner/artifacts/local-builds/20260908-expo57. It includes main 227d57b and the current StyleSheet/Kotlin compiler fixes. Version 1.0.6/22 is an internal installation build, not a store submission or version increment.

That historical invocation used scripts/build-local-apk.ps1 with its then-configured BuildRoot. The current fixed-path workflow is documented below. The wrapper verifies the exact external keystore and public certificate, generates Android only in a fresh snapshot, replaces release debug signing with the verified external key, and passes passwords through process environment variables. ResumeNative is only for this inspected existing native output; it never deletes or regenerates it. A successful Gradle command still requires independent APK signature, manifest, ABI, embedded bundle, advertising, Billing and alignment verification before delivery.

Native android/ios folders in the source checkout are generated SDK 55 output and are not used by this isolated build. That historical internal APK had R8 disabled; it is not evidence of production optimization or Play deobfuscation readiness. The later explicit APK/AAB request authorizes the Store APK and AAB workflow below. No procedure in this document authorizes a Play upload.

## Project folder consolidation (2026-09-08)

C:/dev/Led Banner is the authoritative source checkout. The completed build snapshot was moved intact from C:/LedPopBuild into artifacts/local-builds/20260908-expo57; the empty former parent was removed. APK and app.json hashes matched before and after the move. The existing delivered APK remains in artifacts/. Signing credentials remain external at C:/AndroidSigning/com.minkyokim.sideledbannerapp/.

The moved snapshot preserves source, dependencies, logs and native output as build evidence. Its .relocated-build marker prevents the wrapper from resuming native caches containing old absolute paths. That was the relocation-time procedure. For subsequent authorized builds, reuse artifacts/b and follow the Incremental local APK workflow below; do not create another snapshot for each APK. Do not treat the archived snapshot as the editable project. No rebuild or runtime verification was performed during consolidation.

## Windows native build path

Use C:/dev/Led Banner/artifacts/b as the short active build snapshot path. The wrapper accepts only this exact active path; archived snapshots cannot be resumed. Deep nesting triggered a Ninja CMake regeneration loop on existing prefab files; a substituted drive was insufficient because Expo resolved dependency paths back to their original C: paths. Files stay inside the main project. Preserve completed APKs and logs under unique artifact names before reusing the active folder. Only generated native path caches are invalidated after relocation.

The short-path build completed successfully (40m 57s) for main 85a61d6. The delivered APK is artifacts/LedPop-V1.0.6-Expo57-85a61d6.apk; its existing signing certificate, manifest and ZIP alignment passed. Full build provenance and verification limits are recorded in README.md and the matching artifact verification report. No drive substitution remains.

## Incremental local APK workflow

- User-approved default: keep C:/dev/Led Banner/artifacts/b as the fixed active build directory and reuse its dependencies, native output and caches. Do not create a new snapshot or clear caches for each APK.
- Before every authorized build, synchronize the current main working source, including additions and deletions, into that directory. Use a source-file inventory and compare content; copy only changed files. Never mirror the whole repository into its own artifacts subfolder or overwrite generated output/credentials. Record the source revision and any uncommitted changes used.
- Compare package.json and package-lock.json with the last build inputs. Run dependency installation only if inputs changed or the installation is missing/inconsistent. Do not routinely run npm ci for UI-only changes.
- Compare Expo config, config plugins, native modules, toolchain and native-affecting assets/settings with the previous inputs. Reuse native output with -ResumeNative when these inputs are unchanged. Regenerate only when native inputs actually require it, using the signing-verified procedure; never resume stale native configuration merely to save time.
- Treat versionName/versionCode and iOS/web-only Expo configuration as non-structural for Android. Synchronize those source values, patch exactly one generated Android version field of each kind at the build boundary, and stop if the expected generated template is absent or ambiguous.
- Preserve previous APKs, verification evidence and complete logs under unique build identifiers before another run. Keep the active build directory at the same path.
- The release wrapper explicitly enables the local Gradle build cache. Do not routinely clean, delete .cxx, reinstall dependencies or rewrite unchanged generated configuration. Invalidate only the identified stale output when an actual error requires it.
- Keep all four existing Android ABIs. ARM64-only builds require a separate explicit request and device compatibility confirmation. Retain signing, API level and artifact verification requirements.
- Keep the current worker limit until host memory and measured timings justify adjustment. No speedup estimate is a measured result; report total time and UP-TO-DATE/FROM-CACHE/executed counts after the next authorized build.
- This standing workflow does not authorize compiling, testing, committing, pushing or uploading without a user request.

## Automated preparation

Run `pwsh -NoProfile -File scripts/build-local-apk.ps1` from the main checkout for an authorized APK build. PowerShell 7 or newer is required and Windows PowerShell 5.1 stops before preparation. Native stderr remains diagnostic output; the wrapper captures and evaluates each native process exit code immediately. The signing-verified wrapper invokes prepare-local-apk.cjs to inventory and synchronize source additions, modifications and deletions. It preserves local environment files and external credentials. Package/lock/npm/patch inputs decide installation; Expo config, plugins, modules, referenced config assets, local environment, Node version and JDK/Android SDK installation metadata fingerprints decide native regeneration. ResumeNative is an optional assertion that stops when preparation is required.

Input fingerprints ignore CRLF/LF differences only in explicitly supported UTF-8 configuration/source text; patches and binary inputs remain byte-sensitive. Source copies and provenance hashes remain byte-exact. Legacy successful dependency and native stamps migrate only after reproducing their old hashes from the preserved inputs (including environment/toolchain/ad profile for native output). Missing, failed, mismatched or unknown stamps require preparation. The fingerprint helper passed 23 fixture-based regression tests; resource checks/timing and wrapper parsing passed 20 PowerShell assertions. No actual preparation, credential inspection, build, lint, artifact verification or speed measurement was performed for this update.

Successful phase stamps are invalidated before installation/regeneration and restored only on success. Previous native output is moved to artifacts/native-archives outside the active Metro root; it is never silently restored. APKs/logs and source hashes are retained per run under artifacts/apk-runs. An exclusive lock prevents concurrent wrapper builds. Existing local versionCode is preserved unless explicitly supplied; a first build without one stops.

The initial inventory is bootstrapped from the previous source revision and successful build log. Toolchain changes predating the first recorded baseline and manually altered native/dependency files still require independent inspection; an installation marker is not a full dependency integrity audit. The successful execution and timing are recorded below. Generated APKs still require all independent release checks; the wrapper does not claim compile-ok, runtime validation or Play registration.

## Resource preflight and phase records — 2026-09-14

The existing release entrypoint checks available Windows physical memory and active Gradle/Flutter/Expo/EAS CLI build clients before credentials/source preparation and again immediately before Gradle. Less than 4 GiB, a detected build or an inconclusive probe stops execution. The 4 GiB floor is a conservative preflight guard, not a peak-memory guarantee. It neither kills processes nor waits/retries automatically. Idle Gradle/Kotlin daemons are excluded; IDE-only/remote builds and clients launched after the snapshot are not guaranteed to be detected. The existing same-project exclusive lock remains.

Each run records `stage-timings.json` with total/stage durations, statuses, measured resource checks and available external-command exit codes. Early failures before a valid record directory exists still report through the command error; later failures retain timing records. Skipped stages are explicit; stages not reached/requested have no execution entry. The current run's installation/prebuild logs are retained only if their commands were started. Existing signing, mapping, artifact/hash/export-time and verification gates remain unchanged.

## Incremental build execution — 2026-09-08

The edaf82b application source built successfully in 7m 5s (83 executed, 1105 up-to-date). The preparation helper was corrected locally to fingerprint installed SDK package source.properties files instead of a nonexistent SDK-root packages.xml. No dependency install or native regeneration was required. The existing signer, APK v2 signature, manifest SDK/ABI/Billing metadata and 16KB ZIP alignment passed independent verification. See README for artifact hashes and runtime/R8 limitations. Earlier statements that the automation was unexecuted describe the pre-build state. This helper correction and build report are included with the subsequent main-branch delivery.

## Store APK and AAB workflow

Use the same signing boundary: scripts/build-local-apk.ps1 -IncludeBundle -VersionCode <unused-code>. The switch invokes only bundleRelease, retains the AAB and exact mapping, then uses pinned bundletool 1.18.3 to derive one local universal APK from that exact AAB with the existing upload key and alias. Passwords use access-restricted temporary files outside the repository and are deleted after conversion. Previous AAB/mapping/universal APK are archived before build preparation. APK-only runs continue to use assembleRelease.

Final delivered APK/AAB names use the built `versionName` with periods removed: `LedPopV109.apk` and `LedPopV109.aab` for 1.0.9. Each delivery is placed in a unique build directory. Immediately after each final copy, the wrapper sets and reads back `LastWriteTimeUtc`, records it in `build-result.json`, and verifies the signed bytes with SHA-256; it does not unpack, repack, or re-sign the artifact.

The withAndroidRelease config plugin enables R8 and resource shrinking and selects proguard-android-optimize.txt. Existing framework/SDK consumer rules are retained; no blanket keep rule or warning suppression was added. The wrapper requires a nonempty application mapping and verifies byte-identical mapping content in AAB BUNDLE-METADATA. Independent signing, manifest, SDK, ABI, Billing, native alignment and bundle validation are still required. An optimized build is not runtime QA or Play upload/registration verification.

This changes native inputs, so the first optimized build requires verified native regeneration; later unchanged builds reuse the fixed artifacts/b directory. Existing internal APK evidence remains valid only for its own build. No store upload is performed by this wrapper.

The authorized 1.0.9(27) production run completed `bundleRelease` in 11m 49s with 90 executed and 1,105 up-to-date tasks, without dependency installation, Expo prebuild, Gradle clean, or a separate `assembleRelease`. The exact AAB-derived APK, hashes, signer, production advertising, SDK/Billing, ABI, alignment and mapping checks are recorded in [ANDROID_RELEASE_1.0.9_27.md](ANDROID_RELEASE_1.0.9_27.md). Runtime QA and Play registration remain unverified.

### Kotlin/R8 compatibility correction

The first R8-enabled run reported Kotlin metadata parsing errors with the AGP 8.12 bundled optimizer and Kotlin 2.3.20. Such output is not accepted for submission. The release plugin now pins Google Maven R8 8.13.23 in settings.gradle pluginManagement.buildscript, following the R8 project's documented override mechanism. The wrapper rejects metadata parsing warnings and requires the mapping compiler header to match the pinned version.

After verified native regeneration at the unchanged artifacts/b path, only generated app/build and app/.cxx caches may be copied from that run's archive. Native source, Gradle configuration, signing settings and manifests are never restored. Gradle/Ninja must still invalidate changed inputs, and final artifact/mapping checks remain mandatory.

References: https://developer.android.com/build/kotlin-support and https://r8.googlesource.com/r8/+/refs/heads/main/README.md#replacing-r8-in-android-gradle-plugin

### Local Gradle class metadata memory

The optimized build reached the 512 MiB Gradle metaspace limit and stalled during failure shutdown; the original task exception was not emitted before shutdown. The local wrapper retains the 2 GiB heap and two-worker limit, increases only MaxMetaspaceSize to 1024 MiB, and retains stack traces in the complete build log. This build-process setting does not alter app runtime memory or clear native caches.

The final retry resumes the user-approved e58e9aa snapshot after verifying all 292 recorded file hashes, using artifacts/resume-submission-e58e9aa.ps1 with the corrected JVM limits. It deliberately skips source synchronization and native regeneration because the user requested preservation and exclusion of a concurrent RootLayout splash change. The snapshot source-inputs.json and exact retry wrapper are retained with the artifacts; later documentation/build-wrapper commits are not represented as the app source revision.

Final retry: compile-ok in 12m 40s, 120 executed / 1047 up-to-date. APK/AAB signer, SDK/Billing, 16KB alignment and exact R8 8.13.23 mapping checks passed. See [release report](ANDROID_RELEASE_1.0.6_23.md) for exact hashes, retained warnings and unperformed runtime/Play verification.

## Advertising profile selection

The local wrapper accepts -AdProfile production (default) or test. IncludeBundle requires production. Native builds reject the web diagnostic flag, and Metro rejects project-owned .web sources in Android/iOS resolution. Profile selection is part of the native fingerprint and build provenance. EAS development/preview explicitly select Google test ads; production selects existing LED POP IDs. See [ADVERTISING.md](ADVERTISING.md). The 1.0.6 (24) build regenerated native output and verified the production profile and web-code exclusion in the resulting APK/AAB; see ANDROID_RELEASE_1.0.6_24.md. Runtime verification remains separate.
## Fixed-revision local release builds

The source preparer accepts `LEDPOP_BUILD_REVISION` to read a verified Git commit directly without modifying the working tree. `LEDPOP_BUILD_OVERRIDES` is an explicit JSON array of repository-relative source files to take from the working tree for necessary build fixes. The build inventory records each file hash, the base revision, overrides, version code and advertising profile; an override makes the build dirty. `-VersionCode` changes the build snapshot's version code, and Settings continues to read the marketing version from Expo config.

The 1.0.6 (24) build uses bd567b0 plus the ad immersive module's required Android defaultConfig version fields. The separate RootLayout splash change remains outside the snapshot. Local generated native caches are moved back to the fixed build path rather than duplicated. Following an observed Windows commit-limit error (0x5AF) in clang, the local wrapper bounds Gradle workers and the app's Ninja compile/link pools to one. This changes build concurrency only; ABI coverage, compiler optimization, release R8 and signing remain unchanged.

## Unified store verification — 2026-09-12

After IncludeBundle exports APK/AAB and build-result.json, the wrapper invokes scripts/verify-store-release.py once. This consolidates the prior per-build manual verification scripts without changing signing credentials or skipping release checks. Python 3.11+ is required; use -PythonExecutable for an explicit interpreter. APK-only builds retain their separate verification requirement.

Results and same-build symbols are retained under the run's release-verification/<unique-id>/ directory. Nonzero verification blocks successful completion. Static checks are distinct from complete human log review, device runtime QA, live ad verification and Play mapping registration. The integration passed static artifact checks in run 20260912-002428-05bfeae8 for 1.0.9(27), app source 2b6dc16, with a local keytool stderr-handling correction. Runtime QA and Play registration remain unperformed. See [the investigation and validation plan](ANDROID_BUILD_OPTIMIZATION.md).

Optional Configuration Cache, Daemon reuse and Gradle worker 1/2 comparisons are opt-in; defaults retain one worker and no reusable daemon. Configuration-cache errors fail the run. Signing credentials and cached signing configuration must remain local. See the 5 → 3 → 4 sequence in the optimization document; these options and 1.1.0(28) are not yet build-verified.


## iOS TestFlight source audit — 2026-09-16

- Source baseline: `ae61fc8`, marketing version 1.1.2, bundle identifier `com.minkyokim.sideledbannerapp`. TestFlight builds use the existing EAS production profile and App Store Connect app ID `6749168042`; preview is internal distribution, not TestFlight.
- The production iOS image is pinned to `macos-tahoe-26.5-xcode-26.6` (Xcode 26.6, Node 22.23.1), listed by Expo for SDK 57. SDK 57 requires Xcode 26.4+, iOS 16.4+ and Node 22.13+. The configured Expo 57 / React Native 0.86 / React 19.2.3 versions match Expo's compatibility table; native compilation is not verified.
- EAS remote app-version management and autoIncrement remain enabled. The next iOS build number must be checked against App Store Connect; no remote number was read or changed during this audit. Android versionCode remains 29.
- Production iOS config now rejects a missing/blank/example EXPO_PUBLIC_AMPLITUDE_API_KEY. Configure the real public SDK key in the existing EAS production environment, accessible during config evaluation and Metro bundling; do not use the server-side secret key. Its presence check does not validate the project destination or prove event receipt. No remote environment value was read or changed.
- Production AdMob App ID is injected by the existing plugin. The Apple implementation and podspec of LedPopAdImmersive are present; its Android-only immersive calls remain platform-guarded. StoreKit IAP capability is configured. Pod resolution, linked GMA/OpenIAP versions, privacy manifests, purchases and real ads still need archive/device verification.
- The iOS icon source is 1024x1024 with alpha; Expo's installed iOS icon generator removes transparency for the default icon. Do not alter the artwork merely because the source has alpha. Inspect the generated asset catalog/archive before submission.
- Generated ios/ is absent and ignored; EAS must generate it from the current config. The configured ATT and photo permission plugins are present, but this audit does not establish consent-flow or App Store privacy declaration compliance. Do not add tracking requests or change identifiers as a build workaround.
- Signing remains unresolved in this audit: eas.json does not explicitly select a credential source, so the existing EAS default is unchanged. Windows cannot verify the Apple Distribution private key/profile, Team ID, expiry, entitlements, or IPA signature. Do not switch credential sources, create replacement credentials, or claim signing readiness without verifying the existing identity on the authorized build host. Local credential migration, if needed, must preserve that identity and use the external archive described by the shared signing policy.
- Static source/diff and file metadata inspection only. No install, prebuild, CocoaPods, compilation, lint, tests, EAS build, upload, console changes, or credential mutation was performed. Recent iOS scrolling, Play-return safe area/status bar, Watch Ad layout, startup, IAP and App Opened receipt remain device-QA items.

References: [Expo SDK compatibility](https://docs.expo.dev/versions/latest/), [EAS images](https://docs.expo.dev/build-reference/infrastructure/), [EAS environment variables](https://docs.expo.dev/eas/environment-variables/), [Apple upload requirements](https://developer.apple.com/news/?id=ueeok6yw).


## iOS TestFlight source audit — 2026-09-22

- Baseline: `main` at `89a54ffdb3c7291fe5833895b78295ab6f8290b7` with the task-owned V1.1.3(31), Android photo-picker transition and this iOS preparation still uncommitted. The marketing version is 1.1.3 and the bundle identifier remains `com.minkyokim.sideledbannerapp`.
- The EAS production image remains `macos-tahoe-26.5-xcode-26.6`. Apple requires Xcode 26 or later for current iOS uploads, Expo lists this image for SDK 57, and SDK 57 requires Xcode 26.4+, iOS 16.4+ and Node 22.13+.
- Updated the four packages reported by `expo install --check` to the SDK 57-compatible patch lines: Expo 57.0.24, expo-constants 57.0.19, expo-image-picker 57.0.19 and expo-router 57.0.22. The follow-up compatibility check and top-level installed-tree check passed.
- Production iOS config now sets `NSAllowsArbitraryLoads` to false. Development profiles retain Expo's normal Metro behavior. Release-only removal of Expo Dev Launcher's Bonjour/local-network keys remains owned by its generated Xcode build phase and must be confirmed in the archive.
- The app only selects an existing photo, so generated camera and microphone usage descriptions are removed. The unused ATT plugin/package and `NSUserTrackingUsageDescription` are removed because no ATT API is called and banner/rewarded requests remain explicitly non-personalized. The photo-library usage description remains.
- The user-provided Xcode screenshot exposed an incompatible project-owned rewarded patch: the compiled SDK does not provide `adNetworkClassName` directly on `GADResponseInfo`. The persistent postinstall patch now reads `loadedAdNetworkResponseInfo.adNetworkClassName` and compares it with `GADGoogleAdNetworkClassName`, preserving the existing direct-Google reward-order gate. It also upgrades already-patched node_modules snapshots. The patch script passed Node syntax validation and updated the installed module; an iOS rebuild remains unverified.
- Production config introspection retained the actual iOS AdMob App ID, production advertising profile, StoreKit capability plugin, version 1.1.3 and photo permission. A missing/blank/example production Amplitude public key still fails config evaluation. The diagnostic introspection value was process-local and was not written to source or EAS.
- `npm audit --omit=dev` still reports 16 moderate findings in Expo/config tooling, Router query parsing and their transitive xcode/uuid path. Its proposed automatic fixes downgrade Expo/Router/AdMob outside the SDK 57 compatibility set, so no forced audit fix was applied. No high or critical finding was reported.
- Remaining external or artifact checks: real EAS production Amplitude key availability, remote iOS build-number eligibility, existing Apple signing identity/profile, generated privacy manifests and SDK signatures, resolved CocoaPods/GMA/OpenIAP versions, final icon/assets, IAP registration and sandbox purchase, App Store privacy answers, updated age-rating questions, applicable EU trader status, IPA upload processing, TestFlight install and iPhone/iPad runtime flows.
- Static configuration/dependency inspection only. No prebuild, CocoaPods install, compilation, lint, automated tests, EAS build, upload, console mutation or credential change was performed.

References: [Apple upload requirements](https://developer.apple.com/news/upcoming-requirements/), [Apple supported upload tools](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds), [Apple third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/), [Expo SDK compatibility](https://docs.expo.dev/versions/latest/), [EAS images](https://docs.expo.dev/build-reference/infrastructure/), [Expo ImagePicker permissions](https://docs.expo.dev/versions/latest/sdk/imagepicker/).

## Android audit follow-up — 2026-09-16

The existing local release entrypoint now rejects an out-of-validity signing certificate and a bundletool hash mismatch before compilation. APK-only exports must pass signature/identity/version/target-SDK/debuggable/ZIP-alignment checks; combined APK/AAB exports retain the full store verifier. Signing credentials, same-build mapping retention, file naming, export timestamps and cache reuse are preserved. No credentials, builds or verification commands were executed for this source change. See [the audit scope and remaining checks](ANDROID_BUILD_OPTIMIZATION.md#android-preflight-audit--2026-09-16).

## iOS launch crash — 2026-09-22

The user-provided iPhone crash report for 1.1.3 (1) confirms `DYLD / Library missing`: `ExpoModulesWorklets.framework` references `@rpath/React.framework/React`, which the installed app cannot resolve. Termination precedes JavaScript initialization. Apple ITMS-90863 also names `ReactNativeDependencies.framework`; that email alone does not establish its absence on iPhone. Mac availability settings do not repair the confirmed iPhone crash.

The crashing binary identifies as `com.sunnyinnolab.ledpop`; app.json currently identifies as `com.minkyokim.sideledbannerapp`. No native ios project is tracked in this checkout; the subsequently supplied Mac configuration files are external review evidence, not a locally buildable native project. Preserve the actual App Store identity and existing signing credentials; do not regenerate or rename the Mac project from this mismatched source configuration until its owner reconciles the identifiers. Earlier EAS audit notes describe the configured route, not proof of how this Xcode archive was produced.

Before the next upload, on the build Mac, run this read-only check against the exact archive intended for export (or the .app extracted from the exported IPA):

```sh
python3 scripts/verify-ios-react-frameworks.py "/path/to/LedPop.xcarchive" --expected-bundle-id com.sunnyinnolab.ledpop
```

The check scans the app executable and Mach-O files under Frameworks for the two named dynamic dependencies, requires referenced framework binaries to exist under the app's Frameworks directory, and exits nonzero on missing files, identity mismatch or inspection errors. It does not require these frameworks when no dynamic reference exists (for example, static linkage). It does not copy frameworks or modify the archive. This is a narrow presence check, not validation of architecture slices, signatures, all dyld search paths/dependencies, extensions, runtime startup or store acceptance. It is a manual gate because this repository has no local iOS archive/upload wrapper. The script was source-reviewed only; no Mac execution, build, lint, tests or upload occurred in this change.

### Initial handoff before Mac files were supplied (historical)

- Supply the exact build checkout revision and its Podfile, Podfile.properties.json (if present), Podfile.lock and project.pbxproj. Reconcile the bundle ID discrepancy without replacing the existing app identity.
- Inspect the actual CocoaPods resolution, precompiled Expo/RN settings (`EXPO_USE_PRECOMPILED_MODULES`, `RCT_USE_PREBUILT_RNCORE`, `ios.buildReactNativeFromSource`, `ios.useFrameworks`) and Archive configuration. Precompiled Expo modules depend on prebuilt React; do not mix incompatible module/RN linkage settings. The local installed autolinking code already guards this combination, but the Mac's installed inputs are unknown.
- Use the CocoaPods workspace and confirm the app target's generated embed-framework build phase and file lists include its actual dynamic React dependencies for Archive. Determine whether the failure is stale Pods, missing embedding or mismatched linkage before changing settings. Do not manually copy arbitrary framework versions or force blanket dependency upgrades/cache deletion.
- Inspect the exported app's React and ReactNativeDependencies binaries, load commands, device architecture and signatures. Then install the corrected release build on iPhone/iPad and verify cold launch; upload with an unused iOS build number only after successful verification. The existing 1.1.3 (1) is known to crash; successful delivery is not runtime success.

Reference: [Expo precompiled modules](https://docs.expo.dev/guides/prebuilt-expo-modules/). At this initial stage the Mac project/archive was pending and only detection was added. The supplied-project findings and implemented source configuration below supersede that status; archive/device verification remains pending.

### Supplied Mac project follow-up — 2026-09-22

The subsequently supplied ZIP contains the Mac Podfile, properties, lockfile and project.pbxproj. The Podfile defaults Expo precompiled modules on. The lockfile resolves source-style React-Core 0.86.3 (boost/DoubleConversion/RCT-Folly dependencies), with neither React-Core-prebuilt nor ReactNativeDependencies present. The app target's `[CP] Embed Pods Frameworks` phase includes precompiled ExpoModulesCore, ExpoModulesJSI and ExpoModulesWorklets but neither React nor ReactNativeDependencies. This is consistent with the crash's unresolved React dependency: precompiled Expo binaries and the resolved RN linkage are mismatched. The files do not establish why the original pod installation selected this combination (environment overrides, stale generated inputs or tool behavior remain unproven).

The durable correction is `package.json` → `expo.autolinking.ios.buildFromSource: [".*"]`, an officially supported opt-out for all autolinking-managed precompiled iOS modules. After the next successful pod install, Expo modules are configured to build from source against the React Native installation selected by CocoaPods instead of using these precompiled artifacts. The resulting linkage has not yet been verified on Mac. All modules are selected rather than only ExpoModulesWorklets, because other embedded Expo binaries can reference the same missing React dependencies; this also keeps coupled worklets/reanimated modules on the same source path. React Native's own source/prebuilt policy, Android behavior, bundle identifiers, signing, ad configuration and app logic are unchanged. The first iOS compile can take longer; no runtime performance difference has been measured.

For the Mac developer, after transferring the updated package.json into the exact build checkout:

1. Preserve the existing native project and its store bundle ID. Do not run a clean prebuild from the currently different app.json identifier.
2. Run the project's normal `pod install` from ios (use `bundle exec pod install` if that project manages CocoaPods through Bundler). This is required to regenerate the Pods graph and framework embedding; Archive alone cannot apply the package setting. Do not edit Podfile.lock or generated embed lists manually, or copy frameworks from another build.
3. Open LedPop.xcworkspace and create a new Release Archive with an unused build number. Run the targeted framework checker on the new archive and exported app, then confirm cold launch on iPhone/iPad before upload. If CocoaPods or Archive fails, retain that actual output rather than adding an automatic fallback or deleting all caches.

The attached native files were inspected directly in the ZIP and were not imported into source or modified. This follow-up supersedes the earlier pending-input diagnosis: the source configuration correction is now implemented, but pod resolution, archive contents and crash resolution remain unverified on Mac/device. No dependency installation, native regeneration, build, lint, tests, upload, commit or push was run.
