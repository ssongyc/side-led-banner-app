# Android release build optimization

## Scope

This review inspected the local release wrapper and retained build logs only. No compile, dependency installation, prebuild, lint, test, APK/AAB generation, signing operation, upload, or deployment was run for this change.

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

## Required verification on the next authorized build

1. Run the production store wrapper with -IncludeBundle -VersionCode <unused-code> -MeasureBuild.
2. Confirm preparation reports no npm ci and no Android prebuild for a version-only/iOS-only change, while a real Android/plugin/toolchain/ad-profile change still requires regeneration.
3. Confirm the generated Android fields and both artifacts report the requested version name/code.
4. Confirm the Gradle task list records only :app:bundleRelease for the store run, then compare total time and executed/from-cache/up-to-date counts with the 1.0.8 (26) baseline.
5. Confirm bundletool creates exactly one nonempty universal APK from the same AAB and that no password file remains.
6. Perform the existing independent checks: upload certificate, package/version, target/compile SDK 36 or higher, Billing version, four ABIs, 16 KiB native/ZIP alignment, production AdMob metadata, native modules, web-diagnostic and hidden-Pro exclusion, AAB validation, APK installability, and byte-identical same-build R8 mapping in the AAB.
7. Run real-device smoke/QA after installation. Local static review cannot establish runtime behavior, Play registration, or the actual time saved.
