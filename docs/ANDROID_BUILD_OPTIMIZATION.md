# Android release build optimization

## Scope

The initial review inspected the local release wrapper and retained build logs without running a build. A later user-authorized production build measured the applied changes; its result is recorded below. No lint, test, upload, deployment, or Play Console change was run as part of the documentation update.

## Evidence and causes

The retained 1.0.8 (26) production run at artifacts/apk-runs/20260911-005046-12ab25c8 ran both :app:assembleRelease and :app:bundleRelease. Gradle reported BUILD SUCCESSFUL in 1h 7m 52s and 1203 actionable tasks: 749 executed, 422 from cache, 32 up-to-date. Four-ABI CMake work for React Native, Expo Modules, Skia, Reanimated, Gesture Handler, Screens and the app accounts for much of the executed work.

The wrapper did not run Gradle clean. It already ran npm ci only when package/lock/npm/patch inputs or installation state required it. Those controls remain.

The native-input fingerprint previously included the full app.json. Therefore Android version-only changes and iOS/web-only Expo configuration changes could require Android prebuild and cause broad native recompilation even though app.config.js and the local config plugins do not consume those version values.

For a store run, building an APK and AAB as separate top-level Gradle targets duplicated packaging work. The release AAB already contains the optimized base module and same-build R8 mapping needed to create a local universal APK.

## Applied changes

### CRLF/LF fingerprint correction — 2026-09-14

The raw-byte fingerprint could treat a Git LF checkout and a Windows CRLF checkout as different dependency/native inputs, causing unnecessary installation and regeneration. The helper now normalizes CRLF to LF for fingerprints of `.npmrc`, the tracked configuration template `.env.example`, and supported UTF-8 text inputs (`json`, `js/cjs/mjs/jsx`, `ts/tsx`, `kt`, `java`, `gradle`, `xml`, `properties`, `swift`, `podspec`). Actual local `.env*` files, patches, binary assets, unsupported formats and toolchain metadata remain byte-sensitive. Source synchronization and provenance hashes retain exact bytes. Actual text, dependency, patch, native configuration, environment and toolchain changes still invalidate the relevant preparation state.

Dependency schema 1 and native schema 3 preserve eligible existing success records through verified legacy-hash migration. The actual helper passed 23 tests in an in-memory filesystem with fake Git/toolchain inputs: both LF/CRLF migration directions, exact source provenance, genuine text/patch/binary/deletion changes, failed and unknown stamps, environment/toolchain drift, ad-profile changes and version-only reuse. No active build-root preparation, install, prebuild, build, lint or cache mutation was run. Actual build speed remains unmeasured.

### Resource preflight and phase timing — 2026-09-14

- The wrapper checks physical memory and active Gradle/Flutter/Expo/EAS CLI build clients before expensive preparation and again before Gradle. Below 4 GiB available memory, a detected client or an unreadable probe stops the run. No process termination, automatic waiting/retry or worker/heap increase is introduced. The 4 GiB floor is a conservative guard, not a measured peak-memory requirement.
- Idle Gradle/Kotlin daemons and read-only Gradle queries are excluded. This is a local process snapshot: IDE-only/remote builds and clients starting afterward may not be detected. The same-project build lock remains; this does not claim a cross-project global lock.
- `stage-timings.json` records total and individual phase durations, completion/failure/skipped states, safe resource summaries and available command exit codes. Phases include preflight, archive/source preparation, dependency installation, native generation/configuration, resource recheck, compilation, post-build checks, AAB export/mapping verification, APK conversion/export and artifact verification. Unreached/unrequested stages have no execution entry; total time also includes unassigned bookkeeping/cleanup.
- Timing is retained on failures once the record directory exists. Current npm/prebuild logs are retained only for commands actually started. Existing Gradle logs, provenance, build options, signing and artifact checks remain.
- Validation: 20 PowerShell fixture assertions passed for thresholds, client detection/exclusions, unreadable/failed probes, failed/skipped timing, JSON serialization and wrapper syntax. Neither a real host probe nor a release build was run as part of these tests.

Run the isolated regression checks with `node --test scripts/prepare-local-apk.test.cjs` and `pwsh -NoProfile -File scripts/android-build-observability.test.ps1` only when testing is authorized. No packages are installed by these checks.

### Existing release workflow

- The Android native fingerprint now ignores only expo.version, expo.android.versionCode, expo.ios, and expo.web. Common Expo settings, Android settings, config plugins, local modules, dependency inputs, referenced Android/common assets, environment hash, toolchain hash, and the ad profile still invalidate native output.
- The fingerprint schema and verified ad profile are recorded. Legacy dependency hashes and native schema-2 hashes migrate only after reproducing the successful old hash from the preserved inputs. Native migration also proves the environment/toolchain/ad-profile hash and requires the generated Android project. Failed, mismatched or unknown stamps require preparation.
- The wrapper writes the requested versionName and versionCode into the generated Android build.gradle after source synchronization. It requires exactly one generated field of each type and stops on an unexpected template.
- APK-only runs still use :app:assembleRelease.
- -IncludeBundle runs now use only :app:bundleRelease, retain the AAB and exact R8 mapping, and derive one universal APK from that exact AAB with pinned bundletool 1.18.3.
- The inspected local bundletool JAR reports version 1.18.3 and SHA-256 A099CFA1543F55593BC2ED16A70A7C67FE54B1747BB7301F37FDFD6D91028E29. Its build-apks help exposes universal mode, bundle/output, keystore/alias, password-file and thread options used by the wrapper.
- bundletool uses the existing upload keystore and alias. Passwords are supplied through access-restricted temporary files outside the repository, never command-line password values, and the files are deleted in finally.
- Existing signing fingerprint checks, production-ad requirement, web-diagnostic exclusion, R8 compiler/mapping checks, AAB embedded mapping equality, four ABIs, Gradle/CMake worker limits, build cache, source provenance and per-run artifact retention remain.
- -MeasureBuild adds Gradle profiling for an authorized comparison build and copies the report into the run record.

A bundletool universal APK is suitable for local installation and QA. Google Play review still uses the AAB and generates device-specific APK splits. If Play App Signing is enabled, Play-delivered APKs are signed by the Play app-signing key rather than the local upload key.

## Measured production result — 1.0.9(27)

- The wrapper completed in 760.69 seconds. Gradle reported `BUILD SUCCESSFUL in 11m 49s` with 1,195 actionable tasks: 90 executed and 1,105 up-to-date.
- The store run invoked only `:app:bundleRelease`; it did not run `npm ci`, Expo prebuild, Gradle clean, or `:app:assembleRelease`.
- The 1.0.8(26) Gradle baseline was 1h 7m 52s. The measured reduction is 56m 3s, or about 82.6 percent.
- bundletool 1.18.3 generated one universal APK from the exact release AAB. The AAB and APK both report 1.0.9(27), and their DEX, native libraries and Hermes bundle match.
- Independent checks passed for the existing upload certificate, application ID, SDK 36, Billing 9.1.0, production AdMob configuration, four ABIs, 108 native libraries, APK ZIP/ELF and AAB 16 KiB alignment, R8 8.13.23 mapping, bundle validation, and release exclusions.
- Gradle profiling attributed 5m 0.84s to R8 and 1m 26.66s to JavaScript bundling. These remain the largest measured tasks.
- Real-device smoke/QA, live ad impression/reward verification, Google Play upload, Play App Signing output, and Play mapping registration remain separate and were not performed.

The exact artifacts, hashes and verification boundary are recorded in [ANDROID_RELEASE_1.0.9_27.md](ANDROID_RELEASE_1.0.9_27.md).

## Measured production result — 1.1.1(29), 2026-09-14

- Fixed source revision `14b698f709b38c4f0cc41eb3e105a14c02a7a8f7` built with no source overrides, production ads, `-IncludeBundle` and `-ResumeNative`; `-MeasureBuild`, Configuration Cache and daemon reuse were off, with one Gradle/CMake worker.
- The first fast-path attempt stopped after 19.21 seconds because `.env.example` had identical text but LF bytes after fixed-revision synchronization, while the last successful native stamp had hashed CRLF bytes. Recomputing the legacy hash with CRLF reproduced the stored value exactly; actual local `.env`, native source inputs, SDK, JDK and Node metadata were unchanged. The generated cache stamp was corrected to the proven LF-equivalent hash. The helper now normalizes only `.env.example` line endings in the environment fingerprint so this false native invalidation does not recur.
- The successful wrapper run completed in 1,131.90 seconds (18m 51.90s). Dependency installation and Expo native generation were skipped. Gradle `:app:bundleRelease` completed in 16m 56s with 1,159 actionable tasks: 79 executed, 3 from cache and 1,077 up-to-date.
- The exact AAB was retained with its R8 mapping and bundletool 1.18.3 derived the universal APK. Static checks passed for the existing signer, version 1.1.1(29), production AdMob configuration, SDK 36, Billing 9.1.0, four ABIs, 16 KiB ZIP/ELF alignment, embedded same-build mapping, Hermes equality and release exclusions.
- Retained warnings are the Expo config-plugin AdMob location notice, `NO_COLOR`/`FORCE_COLOR`, and Gradle 10 deprecation notice. The packaged production IDs were independently verified. Device runtime, live ad impression/reward, Google Play upload and Play mapping registration remain unverified.
The 23-test record above belongs to the earlier fingerprint implementation. The subsequent .env.example correction received source/preparation inspection only; those tests were not rerun for this correction. No build, lint or tests were run during the 2026-09-15 documentation and main delivery.

## R8 investigation and unified verification — 2026-09-12

The retained 1.0.9(27) run changed the version from 1.0.8(26). Its log records app generateReleaseBuildConfig, processReleaseMainManifest and minifyReleaseWithR8 as executed. The generated BuildConfig contains VERSION_CODE=27 and VERSION_NAME="1.0.9"; version changes therefore affect native compiler inputs even when Android prebuild is unnecessary. This is evidence consistent with necessary R8 invalidation, not proof that every JavaScript-only edit runs R8. The old log lacks the exact up-to-date invalidation reason. No unnecessary R8 input has yet been proven, so no optimization task or input tracking was disabled.

- MeasureBuild now adds --info alongside --profile. On the next authorized build, inspect the minifyReleaseWithR8 "not up-to-date because" input-property/file reasons. The new verification report retains a bounded excerpt; absent reasons are reported as not recorded.
- Existing write-if-changed build.gradle/local.properties handling, source synchronization, native cache policy, worker limits and R8 settings remain.
- scripts/verify-store-release.py is the single post-export entrypoint for IncludeBundle. It replaces the sequence of historical verify-apk.py, verify-store-artifacts.ps1, verify-store-metadata.py, verify-store-native.py and verify-record.py commands; historical evidence files remain untouched.
- Each SDK signature/manifest/alignment/bundletool command runs once. Python opens each APK/AAB ZIP once and reuses native, DEX, Hermes, config and mapping bytes for related checks. Export-integrity hashes and the wrapper's same-build mapping gate remain separate deliberate checks.
- Version, revision, dirty state, source inventory and artifact hashes come from the current build record, with packaged values independently checked. No fixed 1.0.9/27 or fixed source revision remains in the verifier. SDK build-tools 36.1.0, Billing 9.1.0, bundletool 1.18.3 and the existing certificate are explicit current policy checks, not automatically relaxed.
- Preserved checks cover signer, package/version, SDK, permissions, production AdMob config, native ad classes, Billing, four ABIs, 16 KiB alignment, APK/AAB contents, R8 mapping, source inventory/source maps, hidden Premium/web diagnostics exclusion and exact Sunny icons. Same-build JS maps and native symbols are retained; required symbol absence fails.
- Each verification run writes a new release-verification/<unique-id>/verification.json with tool durations, failures and warning findings. A failing check exits nonzero; successful static checks do not claim human log review, installability/runtime QA, live ads or Play registration.
- Python 3.11+ and the inspected Android build-tools are required before a store build. PythonExecutable can name an explicit installed interpreter. The verifier does not install dependencies, compile, package, sign, install an app or upload anything.
- The previous build-result.json records 738.86 seconds from Gradle start through export; total-build-timing records about 760.69 seconds from the run record to completion. Both exclude subsequent independent verification. Future comparisons must use matching intervals and include the new verifier's elapsedSeconds separately.

### Remaining validation (not executed in this change)

1. Run one authorized production IncludeBundle/MeasureBuild with the new verifier; confirm no duplicate SDK calls or packaging tasks.
2. Confirm R8 reasons for the actual edit. A version-changing run cannot establish JS-only invalidation; use an authorized same-version JS comparison if needed.
3. Confirm all static checks and same-build symbol retention on the real artifacts; inspect complete logs and warnings.
4. Compare Gradle, export and verification durations separately. Additional speedup is unmeasured.
5. Verify failure paths (wrong hashes/certificate/version, missing tools/mapping/symbols) only when tests are authorized.

No build, lint or test was performed for this change.

References: https://docs.gradle.org/current/userguide/incremental_build.html and https://docs.gradle.org/current/userguide/continuous_builds.html

## Optional comparison sequence: 5 → 3 → 4

The wrapper now accepts `-ConfigurationCache`, `-ReuseDaemon`, and `-GradleWorkers 1|2`. Defaults remain configuration cache off, a single-use daemon, and one Gradle worker. Configuration-cache problems fail the run (`--configuration-cache-problems=fail`); the wrapper never retries with different settings or suppresses incompatibility. Existing signing, production ads, R8, ABI coverage and artifact verification gates remain. App CMake compile/link pools remain one; this does not assert a global limit for every dependency's native build.

For the next explicitly authorized comparison, keep source revision, version, environment and release settings identical and change one option at a time:

1. **5 — Configuration Cache:** use `-IncludeBundle -AdProfile production -ResumeNative -MeasureBuild -ConfigurationCache` twice. Inspect the compatibility report and confirm reuse on the second run. Failure means incompatibility, not permission to continue with warnings. Keep configuration-cache files local: Gradle can serialize sensitive signing configuration; do not publish/cache-upload them.
2. **3 — Daemon:** after step 5 passes, add `-ReuseDaemon` and compare consecutive warm runs. Reuse requires matching JDK/JVM settings. To explicitly stop daemons after the batch, use the fixed build's `android/gradlew.bat --stop` with the same JAVA_HOME and Gradle user home. This stops all matching Gradle-version daemons in that user home, including other projects; do not do it automatically.
3. **4 — workers:** with the other settings held constant, compare `-GradleWorkers 1` and `-GradleWorkers 2`. Measure peak RAM, committed memory and page-file pressure during each run; an idle snapshot or a system-wide historical page-file peak is not build-specific evidence. Adopt two only if time and memory stability improve. Do not raise CMake concurrency in this comparison.

`build-options.json` records selected flags before Gradle, including failed trials; successful `build-result.json` also records them. Use each run's Gradle log/profile and verification time to compare equivalent intervals. These options have been added but not compiled or tested; no additional APK/AAB was generated for these options.

Baseline from run `20260912-002428-05bfeae8`: Gradle 5m0.25s, startup 19.318s, configuration 1m14.83s, 73 executed / 1122 up-to-date, and R8 UP-TO-DATE. Export interval 332.85s and separate unified verification 31.44s. These measurements precede the optional flags and do not prove their benefit.

References: [Configuration Cache](https://docs.gradle.org/current/userguide/configuration_cache.html), [Gradle Daemon](https://docs.gradle.org/current/userguide/gradle_daemon.html).

The release wrapper also preserves successful keytool JKS notices on stderr without treating them as a failure; a nonzero exit code or mismatched certificate still stops the build. This correction was exercised by run 20260912-002428-05bfeae8. Version 1.1.0(28) and the optional comparison flags have not been built.


## Android preflight audit — 2026-09-16

- The source preparer now fingerprints incoming .env.example bytes, including additions/deletions, rather than the previous active snapshot's copy. Previously a template change could record a pre-sync hash, causing another native regeneration on the following build. Real local environment files remain untouched and byte-sensitive. This correction does not run preparation or migrate cache state during the audit.
- Bundletool 1.18.3's SHA-256 is checked before executing the JAR or starting compilation, using the same expected hash as the existing final store verifier. Missing artifact-inspection tools now block APK-only builds as well as combined builds.
- The recorded public signing certificate must be within its validity dates after the existing identity checks. Credentials and signing identity are unchanged; no credential operations were executed.
- APK-only builds now inspect signature/single expected signer, application ID, expected versionName/versionCode, targetSdk >= 36, non-debuggable status and 16 KiB ZIP alignment before final export, retaining logs and a separate verification duration. These basic checks do not establish native ELF alignment, Billing/ad module correctness, four-ABI coverage or full store readiness. Combined APK/AAB builds retain their full existing verifier; there is no repeated compilation.
- Read-only audit found build caching enabled in the effective default Gradle User Home and the wrapper's --build-cache argument. Preserved generated output has target/compile SDK 36, four ABIs, R8/resource shrinking and merged Billing 9.1.0 metadata. This is evidence for the previous build, not a verified V1.1.2 artifact. Google's Billing deprecation table and release notes were rechecked; Billing 8+ is required without an extension, and the recorded 9.1.0 remains supported.
- Marketing version is 1.1.2 but local versionCode remains 29. Before Play submission, verify that the selected code has not been used on any track; use the existing explicit -VersionCode option if needed. No Play Console lookup, automatic increment or source version change was performed.
- Static source/diff review only: no build, lint, tests, source preparation, dependency installation, artifact-verifier execution or upload. New checks are implemented but not execution-verified. Existing iOS audit and unrelated localization changes remain separate.

References: [Billing deprecation](https://developer.android.com/google/play/billing/deprecation-faq), [Billing release notes](https://developer.android.com/google/play/billing/release-notes).

## Release attempt — 2026-09-20

Run 20260920-164209-293bcd5d requested production ads and V1.1.2(30), using app source revision 2bec314df65d47086e0c633e5371b7018d4cac9d and the local release-preparation tooling changes documented above. Source preparation reported 21 changed files, no removals, installRequired=false and nativeRequired=false. The subsequent resource gate stopped the run with 3.96 GiB available memory against its 4 GiB minimum. Compilation and final artifact verification were not reached; no new release APK/AAB was produced. Cached dependencies/native output were retained. The previously pending preparation and localized Sunny-label changes are now included in the source delivery; this failed attempt does not validate those changes or a release binary.

## Release build failure and source correction — 2026-09-20

Run 20260920-185656-fbd511d2 used revision 64db761 with production ads and V1.1.2(30). Both resource checks passed. Dependency installation was skipped; changed native inputs required prebuild, which completed while preserving generated app caches. Total elapsed time was 1096.69 seconds; compilation stage 756.34 seconds. Gradle reported 72 actionable tasks: 40 executed, 32 up-to-date, no FROM-CACHE tasks reported. Compilation failed in createBundleReleaseJsAndAssets because bannerAd.tsx imported useIsFocused from @react-navigation/native, which Expo Router SDK 56+ rejects in app code.

The import was changed to expo-router/react-navigation, the officially supported entry point for the same API; banner lifecycle logic was unchanged. Reference: https://docs.expo.dev/router/migrate/sdk-55-to-56/. A subsequent ResumeNative attempt with only this source override stopped at preflight: 3.44 GiB available against 4 GiB required. At that point the correction was not compile/runtime verified, and that attempt exported no new APK/AAB. The user explicitly approved including this previously uncommitted correction and its failure records in the September 20 final main delivery. Source/diff review only; no build, lint or tests were run for that delivery. The earlier failed attempts remain historical and do not verify the correction.

## Successful local V1.1.2(30) export — 2026-09-20

Run `20260920-214301-06a96479` completed with production ads using commit `64db761d11c37cf59e68993baddb7c458230ab5a` plus the explicit, uncommitted-at-build `components/admob/bannerAd.tsx` import correction. The app source inventory records that override; documentation-only changes were not build inputs. Source synchronization changed 0 files, and dependency installation/native generation were skipped. Fixed `artifacts/b`, all four ABIs, existing upload signing, one Gradle worker and build cache were retained. No cache clean or replacement credentials were used.

- Complete final Gradle output (17,167 lines) was scanned and diagnostic categories reviewed: compile-ok. Gradle reported 23m33s, 1,159 actionable tasks: 419 executed, 109 FROM-CACHE, 631 UP-TO-DATE. Wrapper compilation stage was 1,418.44 seconds; the whole successful resume including preparation/export/verification took 1,870.68 seconds (31m10.68s). This excludes previous failed/interrupted runs and is not the total elapsed time of the entire task.
- Earlier run `20260920-192504-76a37e15` was interrupted before completion. Its full available log is retained as `previous-gradle-release.log` in the successful run. Completed native objects were reused; the final x86_64 invocation resumed with 67 remaining tasks. The interrupted run has no complete timing/result record, so its full build duration is unverified.
- Resource `values_values.arsc.flat` changes triggered resource processing and R8 again in the resumed run. Source comparison alone took 343.74 seconds. These are measured bottlenecks; no unmeasured speedup claim is made.
- Static verifier `release-verification/27ec94f8c396473d968e60df45ccb2cd/verification.json` passed all recorded checks. Verified V1.1.2(30), compile/target SDK 36, Billing 9.1.0, existing signer, production AdMob manifest/embedded configuration, APK/AAB source consistency, all four ABIs, required 16 KiB ZIP/ELF alignment, and matching embedded R8 mapping. Same-build JS maps and native symbols are retained.
- AAB exported at 2026-09-20 22:12:51 KST: `aab-deliveries/20260920-221250-7ad974c510f646b596d28ec6c90fdc1e/LedPopV112.aab`; 241006934 bytes; SHA-256 `E79D1B55A025A9F3D5DFB7EB61579D42EB68B5F80481FCC9F86317DC033FA3F2`.
- Universal APK derived from that AAB with bundletool 1.18.3, exported at 22:13:25 KST: `apk-deliveries/20260920-221325-a469783981654127bce1bb849220f2a9/LedPopV112.apk`; 271151144 bytes; SHA-256 `1F253DF1EF5500BAF1E2B5511271F42CB06434F1805745B3F6EED4C0B55D9E49`.
- Reviewed diagnostics: Expo Core deprecated RawPropsParser use, Gradle deprecations, R8 informational unmatched rules/missing EnclosingMethod attributes and commons-codec platform/library overlap. The SDK's app.json App ID warning explicitly permits Expo config-plugin integration; the final production manifest ID was verified. These observations do not establish device behavior.
- No standalone lint/test command, device QA, live-ad serving check, Git delivery or Play upload was performed. Gradle's normal bundleRelease dependency tasks ran. The supplied Play screenshot showed versionCode 29, but unused code 30 across all tracks is not independently verified. The import correction is included in this final source delivery; confirm Play code eligibility before claiming store-submission readiness. Local artifact checks passed; store acceptance and runtime behavior remain unverified.

Final delivery review: the user approved including the concurrently added successful-build records. Existing build-result.json, source-inputs.json and verification.json were read back for revision, source override, artifact hashes and recorded static-check status. Those are retained results from a separate build task, not new verification executed during this delivery. No build, lint or tests ran for the final commit/push.

## Incremental preparation improvements — 2026-09-20 (source only)

Baseline: clean main at `40e2445584a844cede24b55e83a7ad5ffbdd5989`. Implementation updated the existing build path without running a build, source preparation, dependency installation, lint or tests. The subsequent requested main delivery includes all six pending files (the two existing documents, dynamic config, iOS validator and two build scripts); earlier banner import and release records are already committed in the baseline.

- Pinned-revision preparation now enumerates Git object IDs/sizes once and reads exact blob bytes through bounded `git cat-file --batch` calls, replacing one `git show` process per file. Batches target 32 MiB; a single file retains the existing 64 MiB limit. Headers, byte lengths, trailing delimiters and regular-file modes are checked. Binary contents, explicit source overrides, additions/deletions, per-file hashes, changed-files-only copying and signing exclusions remain intact. Working-tree preparation still reads local files directly.
- The successful resumed run's log identified `generated/res/resValues/release/values/gradleResValues.xml` as the changed input triggering resource merge. That generated file contains the developer server IP/port; installed React Native's `configureDevServerLocation` defaults the IP to host detection. The release-only wrapper now supplies `-PreactNativeDevServerIp=127.0.0.1 -PreactNativeDevServerPort=8081`, preventing host network changes from changing these release resource values. No debug workflow or application API/ad endpoint is changed. The exact previous IP was not retained, so this removes an observed variable input without claiming it was the only reason for every prior rebuild.
- iOS production analytics validation moved unchanged to `config/validateIosProduction.js`, called only inside the iOS production branch. Future changes to this iOS-only validation no longer change Android's dynamic-config fingerprint. Other dynamic config, plugin, native module, dependency, asset, environment and toolchain inputs remain conservatively tracked; this is not a blanket exclusion of config changes. Do not introduce an Android dependency on the iOS-only helper.
- First adoption changes app.config.js and the release resource value, so one native regeneration/resource optimization pass may be necessary. Existing state/schema/cache gates are not bypassed or rewritten to pretend inputs match.
- Existing AAB-once/universal-APK conversion, all four ABIs, worker/heap limits, signing, AdMob configuration, source provenance, mapping and artifact verification gates are preserved. Existing artifacts are unchanged. Static diff review only: byte-level batch execution, incremental behavior, debug/release runtime separation and timing remain to be verified during the next authorized build; no speedup percentage is claimed.
