# LED POP Android local signing

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

Run scripts/build-local-apk.ps1 from the main checkout for an authorized APK build. The signing-verified wrapper invokes prepare-local-apk.cjs to inventory and synchronize source additions, modifications and deletions. It preserves local environment files and external credentials. Package/lock/npm/patch inputs decide installation; Expo config, plugins, modules, referenced config assets, local environment, Node version and JDK/Android SDK installation metadata fingerprints decide native regeneration. ResumeNative is an optional assertion that stops when preparation is required.

Successful phase stamps are invalidated before installation/regeneration and restored only on success. Previous native output is moved to artifacts/native-archives outside the active Metro root; it is never silently restored. APKs/logs and source hashes are retained per run under artifacts/apk-runs. An exclusive lock prevents concurrent wrapper builds. Existing local versionCode is preserved unless explicitly supplied; a first build without one stops.

The initial inventory is bootstrapped from the previous source revision and successful build log. Toolchain changes predating the first recorded baseline and manually altered native/dependency files still require independent inspection; an installation marker is not a full dependency integrity audit. The successful execution and timing are recorded below. Generated APKs still require all independent release checks; the wrapper does not claim compile-ok, runtime validation or Play registration.

## Incremental build execution — 2026-09-08

The edaf82b application source built successfully in 7m 5s (83 executed, 1105 up-to-date). The preparation helper was corrected locally to fingerprint installed SDK package source.properties files instead of a nonexistent SDK-root packages.xml. No dependency install or native regeneration was required. The existing signer, APK v2 signature, manifest SDK/ABI/Billing metadata and 16KB ZIP alignment passed independent verification. See README for artifact hashes and runtime/R8 limitations. Earlier statements that the automation was unexecuted describe the pre-build state. This helper correction and build report are included with the subsequent main-branch delivery.

## Store APK and AAB workflow

Use the same signing boundary: scripts/build-local-apk.ps1 -IncludeBundle -VersionCode <unused-code>. The switch invokes only bundleRelease, retains the AAB and exact mapping, then uses pinned bundletool 1.18.3 to derive one local universal APK from that exact AAB with the existing upload key and alias. Passwords use access-restricted temporary files outside the repository and are deleted after conversion. Previous AAB/mapping/universal APK are archived before build preparation. APK-only runs continue to use assembleRelease.

The withAndroidRelease config plugin enables R8 and resource shrinking and selects proguard-android-optimize.txt. Existing framework/SDK consumer rules are retained; no blanket keep rule or warning suppression was added. The wrapper requires a nonempty application mapping and verifies byte-identical mapping content in AAB BUNDLE-METADATA. Independent signing, manifest, SDK, ABI, Billing, native alignment and bundle validation are still required. An optimized build is not runtime QA or Play upload/registration verification.

This changes native inputs, so the first optimized build requires verified native regeneration; later unchanged builds reuse the fixed artifacts/b directory. Existing internal APK evidence remains valid only for its own build. No store upload is performed by this wrapper.

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
