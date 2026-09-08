# LED POP Android local signing

- Application ID: com.minkyokim.sideledbannerapp.
- Existing EAS credential: Build Credentials FIxh6TZalE, downloaded with user authorization on 2026-09-08.
- External directory: C:/AndroidSigning/com.minkyokim.sideledbannerapp/.
- Files: upload-key.jks, credentials.json (secret passwords and alias), upload_certificate.pem, expected-certificate-sha256.txt.
- Expected SHA-256: 730173560958735BF237CA84BA4F35BBE76A6734986929EB65F6CED63D3FD893.
- Certificate expiry: 2053-11-01. Existing alias: 88995a0e2459ad11a9ee33f8f161d791.
- These private files must never be committed or printed. The external directory has restricted Windows access permissions. No replacement key or debug signing is permitted.

## Internal APK build

The authorized 2026-09-08 local build uses an isolated source snapshot now archived at C:/dev/Led Banner/artifacts/local-builds/20260908-expo57. It includes main 227d57b and the current StyleSheet/Kotlin compiler fixes. Version 1.0.6/22 is an internal installation build, not a store submission or version increment.

Run scripts/build-local-apk.ps1 with the explicit BuildRoot. It verifies the exact external keystore and public certificate, generates Android only in a fresh snapshot, replaces release debug signing with the verified external key, and passes passwords through process environment variables. ResumeNative is only for this inspected existing native output; it never deletes or regenerates it. A successful Gradle command still requires independent APK signature, manifest, ABI, embedded bundle, advertising, Billing and alignment verification before delivery.

Native android/ios folders in the source checkout are generated SDK 55 output and are not used by this isolated build. Existing preview R8 configuration is unchanged (not enabled); an unoptimized internal APK is not evidence of production optimization or Play deobfuscation readiness. No AAB or Play upload is authorized by this procedure.

## Project folder consolidation (2026-09-08)

C:/dev/Led Banner is the authoritative source checkout. The completed build snapshot was moved intact from C:/LedPopBuild into artifacts/local-builds/20260908-expo57; the empty former parent was removed. APK and app.json hashes matched before and after the move. The existing delivered APK remains in artifacts/. Signing credentials remain external at C:/AndroidSigning/com.minkyokim.sideledbannerapp/.

The moved snapshot preserves source, dependencies, logs and native output as build evidence. Its .relocated-build marker prevents the wrapper from resuming native caches containing old absolute paths. For the next explicitly authorized build, prepare a fresh snapshot from the current main checkout under artifacts/local-builds/<new-build-id>, excluding artifacts, dependencies and generated native output from the source copy; install the locked dependencies and provision the authorized build environment before invoking the wrapper from the main scripts directory. Do not treat the archived snapshot as the editable project. No rebuild or runtime verification was performed during consolidation.
