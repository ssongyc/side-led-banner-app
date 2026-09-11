# Android release build optimization

## Scope

The initial review inspected the local release wrapper and retained build logs without running a build. A later user-authorized production build measured the applied changes; its result is recorded below. No lint, test, upload, deployment, or Play Console change was run as part of the documentation update.

## Evidence and causes

The retained 1.0.8 (26) production run at artifacts/apk-runs/20260911-005046-12ab25c8 ran both :app:assembleRelease and :app:bundleRelease. Gradle reported BUILD SUCCESSFUL in 1h 7m 52s and 1203 actionable tasks: 749 executed, 422 from cache, 32 up-to-date. Four-ABI CMake work for React Native, Expo Modules, Skia, Reanimated, Gesture Handler, Screens and the app accounts for much of the executed work.

The wrapper did not run Gradle clean. It already ran npm ci only when package/lock/npm/patch inputs or installation state required it. Those controls remain.

The native-input fingerprint previously included the full app.json. Therefore Android version-only changes and iOS/web-only Expo configuration changes could require Android prebuild and cause broad native recompilation even though app.config.js and the local config plugins do not consume those version values.

For a store run, building an APK and AAB as separate top-level Gradle targets duplicated packaging work. The release AAB already contains the optimized base module and same-build R8 mapping needed to create a local universal APK.

## Applied changes

- The Android native fingerprint now ignores only expo.version, expo.android.versionCode, expo.ios, and expo.web. Common Expo settings, Android settings, config plugins, local modules, dependency inputs, referenced Android/common assets, environment hash, toolchain hash, and the ad profile still invalidate native output.
- The fingerprint schema and verified ad profile are recorded. An old successful stamp is migrated only when its matching prior plan proves the same ad profile and the preserved generated Android project exists. Otherwise preparation remains fail-closed.
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
