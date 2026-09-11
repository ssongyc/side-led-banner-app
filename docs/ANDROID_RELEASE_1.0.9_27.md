# Android release 1.0.9 (27)

## Result

**compile-ok**: production store AAB and its bundletool universal APK were generated from main commit 85dbc1c8a8d321d5f663efe9fa81bdbc5ce02605 with no source overrides.

- Gradle: BUILD SUCCESSFUL in 11m 49s
- End-to-end wrapper record: 760.69 seconds
- Tasks: 1,195 actionable; 90 executed and 1,105 up-to-date
- Gradle task: :app:bundleRelease only
- npm ci, Expo prebuild, Gradle clean and :app:assembleRelease: not run
- R8: 8.13.23; optimization and obfuscation enabled
- APK generation: bundletool 1.18.3 universal APK from the exact release AAB

## Artifacts

- APK: artifacts/apk-runs/20260911-151146-911dd2e5/apk-deliveries/20260911-152426-ef066623927f46a3b1a6f6539c89416c/LedPopV109.apk
  - SHA-256: 586DAC8F15376F1F14775ED8C6386322581A6B1846BC6616F0783A4758260194
  - Size: 271,954,638 bytes
- AAB: artifacts/apk-runs/20260911-151146-911dd2e5/aab-deliveries/20260911-152358-af819132a6c04980ae9d9e9baebbec05/LedPopV109.aab
  - SHA-256: D5F5F7E9434651760E8EE96D67CE8B9D744B9449DE4194E90698307A228BBB1C
  - Size: 241,438,695 bytes
- mapping.txt SHA-256: A04ED3050DB2B6EE8682568E2857285F6687AE5A3BDA265FBD31E5347C92D759
- native-debug-symbols.zip SHA-256: 7BABE3EA3779726130DF8A5C2BFCE63A7CA0DEE50EF598279A68178228B446A8

## Verification

The existing upload certificate, applicationId, 1.0.9/27 versions, minSdk 24, compileSdk/targetSdk 36, Billing 9.1.0, production AdMob app and banner/rewarded unit configuration, four ABIs, 108 native libraries, APK ZIP/64-bit ELF 16 KiB alignment and AAB PAGE_ALIGNMENT_16K passed.

AAB signature and bundletool validation passed. APK/AAB DEX, native libraries, Hermes bundle and same-build embedded R8 mapping matched. The APK is non-debuggable; CAMERA and RECORD_AUDIO are absent. Web ad diagnostics and the hidden Premium route are excluded.

The full 1,598-line Gradle log was inspected. Remaining messages are non-blocking Expo config-plugin, manifest marker, NO_COLOR and future Gradle 10 deprecation warnings. No build error was found.

## Performance result

The previous 1.0.8(26) Gradle run took 1h 7m 52s. This run took 11m 49s, reducing the Gradle interval by 56m 3s, or about 82.6 percent. The profile attributes 5m 0.84s to R8 and 1m 26.66s to the JavaScript bundle.

Device runtime QA, live ad impression/reward validation, Google Play upload, Play App Signing output and Play mapping registration were not performed.
