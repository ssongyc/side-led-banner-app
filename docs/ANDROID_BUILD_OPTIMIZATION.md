# Android release build optimization

## Scope

The initial review inspected the local release wrapper and retained build logs without running a build. A later user-authorized production build measured the applied changes; its result is recorded below. No lint, test, upload, deployment, or Play Console change was run as part of the documentation update.

## Production build V1.1.5 (34) — 2026-11-23

- 실행: `20261123-021801-09d42ee5`, 소스 `73f8f07`. G: Gradle과 의존성 캐시를 재사용했습니다. 의존성 재설치는 생략했고 적응형 아이콘 변경을 반영하기 위해 네이티브 설정을 다시 생성했습니다.
- 전체 21분 48초, Gradle 16분 15초. Gradle 작업 1,279개 중 94개 실행, 1,185개 up-to-date였습니다.
- 출시 파일 검사 482개 통과. 기존 서명, 16 KiB 정렬, 선택적 Wi-Fi 선언, 운영 AdMob·Google UMP, Shop 상품·Google Play 공개키·구매 및 복원 코드, 내장 R8 매핑과 적응형 아이콘을 확인했습니다.
- 실행 폴더 `artifacts/apk-runs/20261123-021801-09d42ee5/`의 `release-file-audit.json`에 산출물 경로와 추가 검증을 기록했습니다. Play 업로드, 실기기 광고 노출·구매·복원, S3 런처 아이콘은 확인하지 않았습니다. 이후 Android 태블릿 방향 전환과 배경 전환 수정은 현재 소스에 반영됐습니다.

## Production build V1.1.5 (34) — 2026-11-22

Run `20261122-205130-7cf299a7` built Android 1.1.5 (34) from clean main `382873d`. The wrapper produced a signed AAB and derived the signed universal APK from it. All 482 local release checks passed. The files contain production AdMob, Google UMP, Play Billing 9.1.0 and the Pro product configuration. Device purchase and restore, live ad delivery and Play Console status were outside this verification.

The version update changed the lockfile metadata and triggered dependency installation and native generation. The wrapper restored the existing G: Gradle and app build caches. Gradle took 1h 57m 59s with 620 tasks executed, 366 from cache and 293 up to date. The full recorded run took about 2h 8m 23s. The Play pixelated-photo rotation fix was made after this run.

## Production rebuild with Settings footer alignment — 2026-11-22

Run `20261122-200638-0a620869` built Android 1.1.4 (34) from `4c7b032`. The signed APK and AAB passed all 482 local release checks. The wrapper reused the G: caches and completed in 16m 28s. This run did not include device QA or a Play upload.

The subsequent source configuration is Android 1.1.5 (34). The files from this run retain 1.1.4 (34).

## Wi-Fi hardware filtering in Google Play

Play Console blocked review of the Android 1.1.4 (33) production draft because it treated Wi-Fi hardware as required. The local code 33 AAB contains ACCESS_WIFI_STATE and no explicit Wi-Fi feature entry. The release manifest merger report attributes the permission to expo-network, which the app uses to track connectivity for ad loading.

The Expo Android release plugin now declares Wi-Fi hardware optional while keeping the network permission. Release verification checks the final AAB manifest and APK badging for this hardware setting. The existing code 33 AAB predates the fix. The signed code 34 APK and AAB both passed the optional Wi-Fi check. Play Console processing for code 34 was outside the local build verification.

## Production build with optional Wi-Fi — 2026-11-19

- Run `20261119-072859-0bdb580b` delivered signed Android 1.1.4 (34) APK and AAB from `2b31933`. The wrapper used a build-time version override and derived the universal APK from the same AAB.
- All 482 release file checks passed, including the Wi-Fi declaration on both files, production AdMob, Play Billing 9.1.0, signing, 16 KiB alignment and embedded R8 mapping. The artifacts contain the Google UMP SDK and Pro purchase product ID. Code 34 device QA was outside this run. The earlier code 33 purchase and restore results apply to that build.
- A Codex Desktop restart interrupted the first attempt. The successful run reused prepared native inputs and the G: Gradle cache. Gradle took 21m 23s with 82 tasks executed and 1,197 up to date. The resumed wrapper took about 22 minutes, excluding the first attempt.

## Production build with startup recovery — 2026-11-19

- Run `20261119-023304-5e464521` built Android 1.1.4 (33) from `879f8e9`. The signed AAB and its universal APK include startup recovery and the updated rewarded popup spacing and status placement.
- The 480 release checks passed. The bundle source matched the Shop, startup, rewarded popup, consent and Pro storage sources, and the APK and AAB contained the same Hermes bundle. The build report records the exact artifact hashes. This run did not include device QA or a Play upload.

## Production build with rewarded popup layout — 2026-11-19

- Run `20261119-014712-dc1aa4b4` built Android 1.1.4 (33) from clean main `206103f`. It reused the existing G: dependency and native outputs and generated the signed universal APK from the signed AAB.
- All 480 release checks passed, including production AdMob, normal Google UMP, the two-hour reward, signing, 16 KiB alignment and matching R8 mapping. Gradle took 12m06s with 72 tasks executed and 1,207 up to date. The full run took 13m32s.
- The Galaxy SM-M336K installed APK matched the delivery hash. Shop showed ₩7,500. The no-charge test checkout could be cancelled and reopened. A completed purchase unlocked Pro, which survived a cold restart and was confirmed by manual restoration.
- An active temporary Pro reward unlocked the features that normally open the popup, so its layout was not verified. Live ad serving and standard EEA consent also remain unverified for this APK. The 15dp spacing, ad status placement and startup recovery changes first appeared in the later run above. The AAB was retained for manual upload.

## Production build with Android ad window fixes — 2026-11-19

- Run 20261119-001934-7ed6fc53 built 1.1.4 (33) from clean main `6c60018`. It reused G: dependencies and Gradle outputs, regenerated the native project for the manifest plugin, and created the signed universal APK from one signed AAB.
- All 480 release checks passed, including the fullscreen AdActivity theme, production AdMob, normal Google UMP, two-hour rewards, signing, 16 KiB alignment and matching embedded R8 mapping.
- The Galaxy SM-M336K installed APK matched the delivery hash. Shop showed ₩7,500. Google Play confirmed a no-charge test purchase, the app enabled Pro, and Pro persisted across a cold restart. A restore with an owned purchase succeeded. Before purchase, restore correctly found no owned product.
- End-to-end local build and checks took 21m37s. Gradle took 16m17s with 98 tasks executed and 1,181 up to date. The new APK’s ad presentation, Settings return, and EEA dialog were not exercised on-device. The AAB was delivered locally for manual upload.

## Production build with Watch Ad alignment — 2026-11-18

- Run 20261118-232746-d9c9d2f0 built clean main 74a509d as V1.1.4 (33), reused G: dependency and native outputs, and derived the signed universal APK from one signed AAB with bundletool 1.18.3. Gradle succeeded in 10m34s with 72 tasks executed and 1,207 up to date. The wrapper took about 11m10s and reused the R8 output.
- Both files passed 479 release checks. Artifact checks confirmed production AdMob IDs, normal Google UMP, a two-hour reward, the Play product and public licensing key, and exact current Shop, consent and Watch Ad source. AAB SHA-256: 1602B9D016ED34F50AB7A03432DFE3A3543CF7128C79D03987E2B0B5A6907F1A. APK SHA-256: 9F1321F31518419DB7A27F48C0D80902A9E4F5A965179CA4C56095AFD567EC42.
- The Galaxy installation matched the APK hash. Shop showed ₩7,500 and Restore below Buy. Restore reported no owned purchase. The official Google Play license-test sheet showed the matching price and no-charge notice. Cancelling returned to Shop with Buy enabled. The earlier build covered a completed test purchase and successful restore of an owned product.
- Galaxy accessibility bounds placed the Watch Ad icon at the button's vertical center and its visible text box within 0.5 px of center. This checked the English ready state without playing an ad. Evidence is in device-watch-ad-layout.json and device-commerce-verification.json under the run directory.
- Play Console showed production 1.1.3 (31) and code 32 as the newest uploaded bundle and a production draft. The check was read-only.

## Production rebuild V1.1.4 (33) — 2026-11-18

- Run 20261118-223109-945aeb55 built clean main 2b73df9 after the G: drive was reconnected. It reused the prepared dependency and native caches, ran bundleRelease once, and generated a matching universal APK with bundletool 1.18.3.
- Gradle succeeded in 17m37s. Of 1,279 tasks, 109 executed, 2 came from cache, and 1,168 were up to date. R8 output was reused. The resumed wrapper took about 18m52s.
- The signed files passed 479 release checks, including API 36, Billing 9.1.0, four ABIs, 16 KiB alignment and embedded same-build R8 mapping. Additional artifact checks confirmed latest bundled Shop and consent sources, the public Play licensing key and product, production AdMob, normal Google UMP and the two-hour reward.
- AAB SHA-256: 0253624682A71EA86209D323AEB859697242EE2BDE991B644182336D54426AFD. APK SHA-256: AD7AF6FAFFAE76369E1B112952CB810BA9FB1BB8373C73BC45935DEE7A00C1FF. Delivery paths and evidence are in build-result.json, release-verification, commerce-verification.json and device-commerce-verification.json under the run directory.
- The Galaxy installation matched the new APK hash. Shop displayed ₩7,500 and the restore control below Buy. Restore returned no purchase for the current account, and the Google Play license-test sheet showed the matching price, official test card and no-charge notice. Cancelling returned to Shop with Buy available. A completed transaction and a restore of an owned purchase were verified on the preceding artifact documented below. Play version-code availability, upload and review were not checked for this rebuild.

## Production build V1.1.4 (33) — 2026-11-18

- Run `20261118-114825-c8bd2378` built the signed AAB and derived the universal APK from clean `7f9672c`. The build resumed after the first attempt completed native generation and then reached the Gradle memory gate. The resumed run reused the G: caches and prepared native output without reinstalling dependencies or regenerating native files.
- Gradle succeeded in 12m55s with 115 tasks executed, 7 from cache and 1,157 up to date. R8 reused cached output. The wrapper passed all 479 static checks, including signing, 16 KiB alignment, matching bundled content and embedded R8 mapping.
- Both artifacts include the current Shop, Play product and public licensing key, production AdMob IDs, Google UMP and the standard two-hour reward. The DEX and Hermes checks are recorded in the run directory as `commerce-verification.json`.
- After USB debugging was authorized again, the Galaxy installed this APK over the existing app and its installed SHA-256 matched. Shop displayed the Play price of ₩7,500 and one restore control below Buy. Restore reported no Pro purchase for the current store account. Google Play opened the license-test checkout at the same price with a no-charge notice. Cancel returned to Shop and re-enabled Buy. A subsequent Google Play license-test order succeeded with no charge. Shop displayed Purchased, manual restore confirmed that the Pro purchase was restored, and Purchased remained after force-stop and cold launch. The device-commerce-verification.json file in the run directory records the matching installed APK hash and UI evidence. The same release APK was rechecked on the Galaxy with Pro still owned. Settings displayed neither an ad banner nor an Ad privacy choices entry, and the app skipped ad initialization in the owned state. After the user refunded the test order, a cold launch showed Buy and restore reported no Pro purchase. The UMP SDK logged gdprApplies=0 and presented no consent form. The locked-preset dialog showed an enabled Watch Ad button, confirming rewarded readiness through the production configuration. The SDK suggested adding the Galaxy as a test device, so the ad was left unplayed. Live ad impressions and EEA form presentation remain unverified for this build.
- Follow-up Galaxy QA used a separate ARM64 APK (run 20261118-123306-40678696) with the same revision and production ad IDs, plus device-scoped UMP debug geography and test ads. The published LED POP form appeared with GDPR applied. Reject and reopening to accept both returned to Settings with a Test Ad banner. The original release APK was restored with its SHA-256 confirmed and returned GDPR not applicable on the local network. After the user reported adding the Galaxy in AdMob, two fresh launches of the SHA-256-verified release APK still logged the SDK test-device setup prompt. Those two launches yielded no test-device confirmation. The user subsequently observed a Test Ad banner in Settings on the original release APK. Live billable impressions and EEA form presentation on the unmodified release APK remain unverified.
- The highest previously uploaded Play bundle was 32 when checked. Current production was 1.1.3 (31). No upload or review submission was performed.

## Production build V1.1.4 (33) — 2026-11-17

후속 태블릿 검증에서는 별도 기기 전용 QA APK로 실제 LED POP EEA 메시지와 테스트 광고 경로를 확인한 뒤 원래 출시 APK로 복원했습니다. 출시 AAB/APK 바이트는 변경하지 않았습니다. [상세 범위](ADVERTISING.md#android-태블릿의-실제-led-pop-eea-메시지와-광고--2026-11-17)

- Run `20261117-161101-575b889f` built from clean `dbb1f2b59b56865435c0e64a2af34eda8c8cb75e` with the approved build-only version-code override 33. The canonical Android default was updated to 33 afterward; marketing version 1.1.4 and iOS build number were unchanged. The source includes the Shop entry below Watch Ad, LED POP PRO title, crop-notice removal and consent/purchase lifecycle improvements.
- Command: `./scripts/build-local-apk.ps1 -AdProfile production -IncludeBundle -VersionCode 33`. The existing G: build snapshot, Gradle/npm caches and original signing identity were reused. Dependencies were not reinstalled; native generation restored `.gradle`, `build` and `app/build`. No clean, QA reward override, forced EEA device or ARM64-only option was used.
- compile-ok: the complete 1,945-line Gradle log was reviewed; `BUILD SUCCESSFUL in 15m 14s`, 1,279 tasks: 90 executed and 1,189 up-to-date. Total wrapper time was 1,297.94 seconds (21m38s), including native preparation, AAB compilation, universal APK conversion and artifact verification. Source/profile/version inputs differ from earlier runs, so no isolated speedup percentage is claimed. Reviewed notices concern the installed Expo/RN plugins' legacy AGP/Kotlin DSL, deprecated activity delegate, output colors and the Expo-plugin-compatible AdMob app.json warning; the effective release manifest passed.
- All 479 release static checks passed: original signer, V1.1.4 (33), API 36, Billing 9.1.0, four ABIs, 16 KiB alignment, production AdMob, same AAB/APK payload and embedded same-build R8 mapping. Twelve additional checks matched the bundled Shop, purchase, consent and reward source, embedded public licensing key/SKU and production profile. These are artifact checks, not proof of live advertising inventory or EEA form delivery.
- AAB: `artifacts/apk-runs/20261117-161101-575b889f/aab-deliveries/20261117-163058-13a79a4d89534ceb9739927dfced58d7/LedPopV114.aab`; SHA-256 `A350463DD170ACB8B31325B125F3E94E4B93082E65B266A13C9394332E1F414A`.
- APK: `artifacts/apk-runs/20261117-161101-575b889f/apk-deliveries/20261117-163204-cbc3bd4077854202ad134e7b03e838c2/LedPopV114.apk`; SHA-256 `463C529F39F1E70A0B24AAC953C1707BB4F13FD96172FB92DA3ADD601465F2F0`. The installed Galaxy APK hash matched. Mapping SHA-256: `0288FC2FF25777D5A5BBC26EF6C0F9EC34C411BCFE6AE7FF9E043AEF4E9B49BF`.
- On Galaxy SM-M336K / Android 16, Shop displayed LED POP PRO and KRW 7,500. Cancelling the store sheet restored Buy; reentry succeeded. Google Play explicitly marked the order as a non-charged test order using Test card, always approves. Payment successful led to app Purchase complete / Pro active, manual restore succeeded, and Pro remained active after force-stop/cold launch. Settings displayed without a visible ad WebView. No fatal exception or IAP warning was observed in the current process. See local `commerce-verification.json` and `device-qa.json` in the run folder.
- Read-only Play Console inspection showed latest upload 32, still a production draft, and released version 31. Code 33 was absent from the latest bundles listing at that time. No upload, draft replacement or review submission was performed. The initial attempt stopped before compilation because a JAVA_TOOL_OPTIONS diagnostic polluted the strict bundletool version output; removing that added environment option allowed the single compilation above. No signing or verification gate was weakened.

## Production build and Play draft — 2026-11-17

- Run `20261117-102122-40e5e984` built V1.1.4 (32) from `b5b03fe` plus the local Shop changes present at build time. It predates the cleanup of the two unused PNGs. The existing wrapper built the signed AAB once, then generated the four-ABI universal APK with bundletool 1.18.3. It reused the G: dependency cache and regenerated the native configuration for the production profile.
- The verification report (`artifacts/apk-runs/20261117-102122-40e5e984/release-verification/6b32b43088d644a6b8e937fdecf3a2c4/verification.json`) records 479 passing static checks for the signed files, including API 36, Billing 9.1.0, 16 KiB alignment and matching embedded R8 mapping. Additional inspection verified the bundled Shop and public licensing key, production AdMob IDs, native Google UMP and the two-hour reward. Production ad delivery and consent-form display remain device-unverified for these files.
- AAB SHA-256 `205D5BCC85D0A90A3FB274132E2DB6B8A12A8FB2B903FBD1D1E59737F5689520`. APK SHA-256 `8500A0BD3FCE34AA8AA98A73323E9C2913FC661649B5D8A61753A2C2846882E3`. The file paths and hashes are in the local build result (`artifacts/apk-runs/20261117-102122-40e5e984/build-result.json`).
- Play Console accepted and processed version 32 and showed the ReTrace mapping and native debug symbols. The [production release](https://play.google.com/console/u/0/developers/4821943543257074458/app/4975144280076706829/tracks/4698187213056404510/releases/13/prepare) was saved as a draft before review submission.

## Production build — 2026-11-04

Run `20261104-165700-57ddd8e7` built V1.1.4 (32) from clean main `4a66b44` with production AdMob, normal Google UMP, and the standard two-hour reward. Gradle completed in 6m44s with 85 tasks executed and 1,159 up to date. The universal APK was derived from the signed AAB. Static verification passed for the two artifacts, including signing, 16 KiB alignment and embedded R8 mapping. Device QA and Play upload were unverified for this build. The local run directory contains the APK, AAB and verification report.

## October QA and store handoff — 2026-10-20

### Latest main build request — 2026-10-21

**Production completion — 90% Pixel text fill:** run `20261021-170512-4ed611b7`, clean main `c071835201bcabf38cf2deb1a89f7bedb4bc9aa6`, V1.1.3/code31, production AdMob and normal Google UMP. Includes denser text fill, preserved 80% outline/background grids, native rotation text hiding and dim photo gaps. Five changed inputs synchronized; dependency installation and native generation skipped. Existing signing/four ABIs retained; R8 **UP-TO-DATE**. **compile-ok**, Gradle **2m19s**, **1244 tasks: 72 executed / 1172 up-to-date / 0 FROM-CACHE**. Total wrapper **175.49s** (2m55s), compilation 140.21s, conversion 14.04s, artifact verification 13.79s. One AAB build; APK derived from the identical signed AAB.

- APK: `artifacts/apk-runs/20261021-170512-4ed611b7/apk-deliveries/20261021-170753-38649dfc310b4758ae698f72ca0bc31c/LedPopV113.apk`; 191,798,439 bytes; SHA-256 `C50CE6F5F7D2A87535E95582C55267B65C15FFE6490EA402F99461B16549A0A1`.
- AAB: `artifacts/apk-runs/20261021-170512-4ed611b7/aab-deliveries/20261021-170737-6e6d42b00c7d4d3f8c4a4e6ad147747e/LedPopV113.aab`; 147,307,466 bytes; SHA-256 `93A0D696D606EF94CC29678E703CD92E43E5920721D80510C4236B5943216D58`.
- **479 static checks passed**, evidence `release-verification/7b7be9ca85514a14b845e924ab38e9ab/verification.json`: signatures, API 36 target/compileSDK 37, production ads/profile, Billing, four ABIs, 16 KiB alignment, embedded mapping, retained symbols and source checks. Supplemental source-map comparisons confirm exact current `constants/pixelLed.ts` and `components/animation/MarqueeCanvas.tsx`; R8-mapped DEX confirms UMP and PlaybackTextLayer module/View. Photo-gap shader is present; QA EEA device hash/log markers are absent from production Hermes.
- Full **1,864-line** compile output reviewed. Upstream Kotlin/DSL/variant deprecations, Expo-plugin-covered AdMob app.json and color flag warnings remain; no warning-free/Gradle 10 claim. `final-review.json` retains log hash and supplemental checks.
- Exact-binary white-text brightness, rotation, photo contrast and ad/UMP/reward/purchase runtime remain device-unverified. No standalone lint/tests, device installation/QA, Git delivery or store upload. Play code31 reuse eligibility remains a manual Console check. Earlier records below retain their historical scopes.

Historical pre-build source status: Pixel text fill width increased from 80% to 90%, with background and outline grids preserved at 80%. This change is **not included** in `20261021-163700-75ec4373`; its requested linter passed, but compilation/visual device checks remain unperformed. The following Git delivery includes the source, this prior build record and existing README/UI updates without running builds, lint or tests.

**Previous production completion — native text layer/photo gaps:** run `20261021-163700-75ec4373`, clean main `1c34d5945f982e98c94a5774da66db1bc08e7a17`, V1.1.3/code31, production AdMob and normal Google UMP. Includes native Play text hiding and dim photo pixel gaps. Fourteen changed inputs synchronized; dependency installation skipped; native generation required for module registration (**9.76s**), with existing .gradle/build/app build/.cxx caches restored. Existing signing and four ABIs retained. **compile-ok**, Gradle **7m**, **1244 tasks: 124 executed / 7 FROM-CACHE / 1113 up-to-date**. Total wrapper **463.11s** (7m43s), compilation 420.36s, APK conversion 12.39s, artifact verification 13.94s. This native-input build re-executed R8; it is not the same workload as the preceding UI-only warm build.

- APK: `artifacts/apk-runs/20261021-163700-75ec4373/apk-deliveries/20261021-164429-414f2bdaf3384f259f100bfcef97865d/LedPopV113.apk`; 191,798,439 bytes; SHA-256 `11D344753EACC7F4E84EC111D6C2A8E54FF75140AD56BE7A4FFBDA28BFE890B0`.
- AAB: `artifacts/apk-runs/20261021-163700-75ec4373/aab-deliveries/20261021-164415-f1f9fb984c7a430c8430b1cdf174b721/LedPopV113.aab`; 147,307,510 bytes; SHA-256 `FC9002338D3F7ADD04BE473F64052E7A303503CAD1BDC33B5B7EA47FB8243C97`. Built once and used to derive the universal APK; no second assemble build.
- **479 static checks passed**: `release-verification/45e5b59d7b1f412bad61cb7682173183/verification.json`. Signature, API 36 target/compileSDK 37, four ABIs, 16 KiB alignment, Billing, production IDs/profile, bundled source, same-build embedded mapping and retained symbols checked. Supplementary R8-mapped DEX checks confirm UMP and PlaybackTextLayer module/View; production Hermes contains the dim photo-gap shader and excludes known QA EEA device/hash log markers.
- Full **1,888-line** compilation output reviewed. Remaining warnings: upstream Kotlin/legacy DSL/variant/Expo APIs, Expo-plugin-covered AdMob app.json warning, manifest merge remove/replace notices and console color flags. No warning-free/Gradle 10 claim. `final-review.json` retains log hash and supplementary checks.
- Exact-artifact rotation, text hiding, photo contrast, ads/UMP/rewards and purchases remain **device-unverified**. iOS was not built. No standalone lint/tests, device installation, Git commit/push, Play upload or console changes performed. Code31 eligibility across Play tracks remains a manual submission check. Prior records below retain their own artifact scopes.

Historical source-delivery status before the new build above: native Play text hiding and dim photo gaps were not in run `20261021-160722-8118dd36`. They are now built in `20261021-163700-75ec4373`; device verification remains pending. The subsequent requested linter passed; the Git delivery itself runs no build, lint or tests. Source/configuration and existing documentation are delivered together, while binary/cache/signing files remain outside ordinary Git.

**Previous completion:** run `20261021-160722-8118dd36`, source `5bd7ef5bf48d8ae5e415bf1bdad0b2b8f2305dd0` plus the prior build-status document only, V1.1.3/code31, production AdMob and normal Google UMP. Includes the latest Pixel/photo rotation recurrence correction and same-window Play overlay. Six changed source inputs synchronized; dependency installation and native generation skipped; fixed build directory, signer and all four ABIs retained. AAB built once; universal APK derived from it. **compile-ok**, Gradle **2m35s**, 1209 tasks (**72 executed / 1137 up-to-date / 0 FROM-CACHE**). Total wrapper **192.42 seconds**; compilation 155.31s, conversion 13.36s, artifact verification 15.78s.

- APK: `artifacts/apk-runs/20261021-160722-8118dd36/apk-deliveries/20261021-161018-6ebc1e42777545d9bc80c8025a734aef/LedPopV113.apk`; 191,798,439 bytes; SHA-256 `213EAB4F340FF17ED38BD13350399FACB835EAA7957050F40B400D58D68B81D8`.
- AAB: `artifacts/apk-runs/20261021-160722-8118dd36/aab-deliveries/20261021-161004-33d94672b9a34ebeb05fffa66a2af440/LedPopV113.aab`; 147,302,332 bytes; SHA-256 `63B9CCE9799D0D724B2FA6FC4C767592F94EFCCA4862FDD8B16CFE60DE8CCEDB`.
- All **479 static checks passed**, evidence `release-verification/88255d9120d2403b98dc720942bccd10/verification.json`. Signature, target/compile SDK, four ABIs, 16 KiB ZIP/ELF alignment, production ads, embedded mapping and exact bundled source checked. Supplementary R8-mapped DEX checks confirm UMP ConsentForm/ConsentInformation; QA device geography hash and QA log marker are absent from production Hermes.
- Full 1,812-line compilation log reviewed; remaining warnings are upstream Kotlin/DSL/variant deprecations, the Expo-plugin-covered AdMob app.json warning and color flags. No warning-free or Gradle 10 claim. `final-review.json` retains log hash and supplementary checks.
- This exact binary's rotation, ad/UMP/reward runtime and purchases remain **unverified**. No device installation/QA, standalone lint/tests, commit/push or Play upload performed. Code31 upload eligibility remains a manual Play Console check. Earlier records below remain historical and refer to their own artifacts.

Post-recurrence-fix release request: clean main `5bd7ef5bf48d8ae5e415bf1bdad0b2b8f2305dd0`, production AdMob/normal UMP, V1.1.3/code31. The existing combined wrapper stopped before preparation at 3.66 GiB available memory (4 GiB minimum). No dependency installation, native preparation, compilation or new artifacts. Log: `artifacts/release-20261021-main5bd7ef5.log`. The retained production pair below still excludes this latest rotation recurrence correction.

Subsequent user-device report: this completed production APK still shows Pixel photo-background gaps and the editor during rotation. Static artifact success does not establish this flow works. Follow-up source changes replace Android's Play Dialog with a same-window overlay, gate orientation unlock on Play layout and synchronize Pixel scene coverage to native surface size. They are not included in this retained artifact; see [the UI recurrence record](UI_INTERACTION_1.0.9_27.md#pixel-사진-배경-회전-및-메인-화면-노출-재발-보완--2026-10-21). The later lint passed; no corrected build/device pass is claimed.

**Completed after memory recovery:** run `20261021-153149-88a5b8c6`, source `6cf7a1cb3cb69e1b9bd7a930960de83661270676` plus preceding build-status documentation only. Includes `239db15` rotation/Pixel/Speed changes and the committed homepage-link correction. V1.1.3/code31, production AdMob and normal UMP; 14 changed inputs synchronized, dependencies/native generation skipped, existing signer/four ABIs/cache retained. **compile-ok**, Gradle **2m43s**, 1209 tasks (72 executed, 1137 up-to-date). Wrapper completed in **199.97 seconds**; compilation stage 164.47s, APK conversion 12.29s, artifact verification 15.65s. AAB built once, universal APK derived from that AAB. No extra benchmark build.

- APK: `artifacts/apk-runs/20261021-153149-88a5b8c6/apk-deliveries/20261021-153453-88647161013443ab8333b4af60ee0dd8/LedPopV113.apk`; 191,798,439 bytes; SHA-256 `123E0205D9F28E76E97B4E581D75888AC319B47E662DFB69495A4A527B1A6397`.
- AAB: `artifacts/apk-runs/20261021-153149-88a5b8c6/aab-deliveries/20261021-153439-1c68851dbe454e71b6131c06b7376fa7/LedPopV113.aab`; 147,301,574 bytes; SHA-256 `B0D2B932F04025364517363614CE1FB64A341AFDFF125F580BD2E988BD86873C`.
- `release-verification/a6cb12aa4e494112aab09d8c1bf7c5aa/verification.json`: all **479 static checks passed**, including signature, API 36 target, compileSDK 37, production configuration, four ABIs, 16 KiB alignment, same-build mapping and bundled source. Matching native/Hermes symbols retained. Supplementary R8-mapped DEX checks confirm UMP ConsentForm/ConsentInformation; known QA EEA device and QA log marker are absent from production Hermes.
- Full 1,820-line compile log reviewed. Remaining notices concern upstream Kotlin/DSL/variant deprecations, the Expo-config-plugin-covered AdMob app.json warning and console color flags. This is not warning-free or Gradle 10 verification. `final-review.json` records the reviewed log hash and supplementary checks.
- Rotation, Pixel preview and Speed × 3.3 are now included in these artifacts; their exact-device visual behavior has not been checked. No standalone lint/tests, device installation/QA, Git delivery or store upload was performed in this build. Play code31 eligibility is still a manual submission check.

Retry: working HEAD was now `6cf7a1cb3cb69e1b9bd7a930960de83661270676` (committed homepage-link correction on top of `239db15`); only this build-status document was dirty. Initial preflight stopped at 2.23 GiB available memory versus the unchanged 4 GiB minimum. No preparation/compilation or new artifacts. Log: `artifacts/release-20261021-main239db15-retry.log`.

Requested production APK/AAB from clean main `239db1535386f118d7f182b530a40c066eb7ea93`, including the later Play rotation, Pixel preview and Speed × 3.3 changes. The existing `-IncludeBundle -AdProfile production` command stopped at initial preflight with 1.61 GiB available memory (minimum 4 GiB). No dependency installation, native preparation, compilation or artifact verification started; no new APK/AAB was produced. Prior signed artifacts and caches were retained. Log: `artifacts/release-20261021-main239db15.log`. The earlier production pair below does not contain those later UI/speed changes.

### Production completion — 2026-10-21

After memory recovery, preparation run `20261021-124257-a9e0c7fc` reused dependencies and generated production native settings in 32.99 seconds, then stopped when a process-command-line query was transiently unreadable. A fresh read passed with about 5.24 GiB available. Run `20261021-124440-61801b3a` resumed with `-IncludeBundle -AdProfile production -ResumeNative`: zero changed inputs, no installation/native regeneration, existing signer/four ABIs retained, V1.1.3/code31, source `6cdcda83eff43be4406ebbe0fb91d8dfb83b7aec` plus build-status documentation only. **compile-ok**, Gradle **8m4s**, 1209 tasks: 87 executed, 1122 up-to-date. AAB built once; universal APK derived from those signed AAB bytes.

The original post-build verifier failed with `KeyError: sources`: SDK 58 emits an indexed packager source map containing inline `sections`. `verify-store-release.py` now reads ordinary and inline indexed v3 source inventories, rejects unsupported/malformed or external sections and preserves exact bundled-source content checks. Re-ran only artifact verification on the unchanged signed files; **479 checks passed** in 12.05 seconds. Original failed wrapper status/timing (522.07 seconds through the first verification) is preserved, with successful recheck linked in `artifact-recheck-result.json`; no second compilation was needed. Full 1,834-line compile output reviewed. Remaining warnings: upstream Kotlin/DSL/variant deprecations, config-plugin-covered AdMob app.json warning, console color flags and manifest merge replace/remove notices. No warning-free or Gradle 10 claim.

- APK: `artifacts/apk-runs/20261021-124440-61801b3a/apk-deliveries/20261021-125309-c04a6ea831f9468da3328f7fbe4b8f32/LedPopV113.apk`, 191,798,439 bytes; SHA-256 `CB41F02C31A11AD0ACDA3233A00AACEFBC77541D1E4B42652FC108C64B869855`.
- AAB: `artifacts/apk-runs/20261021-124440-61801b3a/aab-deliveries/20261021-125252-fef1e5da082e4c91abc7a56dd9082bb9/LedPopV113.aab`, 147,301,935 bytes; SHA-256 `746E33925C7A056A48FB474F819BE59DE4E38D72D344F1047873307EC194CE87`.
- Mapping SHA-256: `D224D9B173BB12D71B85CD4FCA3AC995DD6DBAA226C5CB9CD1B708A251F50BAF`; matches embedded AAB mapping. Same-build Hermes maps and native symbols retained. R8 optimization/shrinking/obfuscation metadata: 81.41% / 81.84% / 81.84%.
- Verified existing signature, API 36 target, compileSDK 37, four ABIs, 16 KiB ZIP/ELF alignment, Billing 9.1.0, production manifest/config/ad module and bundled-source checks. Supplementary DEX checks use R8-mapped UMP ConsentForm/ConsentInformation names; literal un-obfuscated package-name absence is not absence of the SDK. QA EEA device identifier and QA diagnostic marker are absent from the production Hermes bundle. UMP takes normal regional eligibility, without the QA reset/geography override.
- This production artifact has not been installed/device-tested here; preceding test-profile SDK 58 QA retains its original scope. Actual ad supply, this artifact's UMP form/reward runtime, purchases, iOS and Play processing remain unverified. Code31 eligibility is checked by the user at manual upload. No standalone lint/tests, Git delivery or upload performed.

### Earlier attempts and workflow confirmation

2026-10-21 second retry: initial preflight again stopped, this time at 2.46 GiB available memory (4 GiB minimum). No preparation or compilation started and no new APK/AAB was produced. Existing inputs/caches were preserved. Log: `artifacts/release-20261021-production-retry2.log`.

2026-10-21 retry: the same authorized production command stopped at initial preflight with 2.84 GiB available memory against the unchanged 4 GiB minimum. Only the preceding build-status documentation was dirty; source HEAD remained `6cdcda83eff43be4406ebbe0fb91d8dfb83b7aec`. No preparation, compilation or new artifact creation occurred. Log: `artifacts/release-20261021-production.log`. No processes or caches were removed.

Production retry from clean main `6cdcda83eff43be4406ebbe0fb91d8dfb83b7aec`: the user requested production AdMob plus Google UMP APK/AAB, retaining V1.1.3/code31. `pwsh -NoProfile -File scripts/build-local-apk.ps1 -IncludeBundle -AdProfile production` stopped at the initial resource gate with 1.70 GiB available memory (minimum 4 GiB). Dependency installation, source/native preparation, compilation and artifact verification were not reached; no new APK/AAB was generated. Existing caches, signing and previous artifacts were retained. Log: `artifacts/release-20261020-production.log`. Awaiting the user's memory recovery; no safety threshold was lowered or unrelated process terminated.

The existing wrapper already separates APK-only QA from one-AAB production export. Source inspection reconfirmed that `-IncludeBundle` invokes only `:app:bundleRelease`, then derives the universal APK from that exact AAB. It rejects test ads and forced EEA configuration in bundle mode. Do not add another assemble task or a second wrapper for these workflows.

Use PowerShell 7 from the repository root for the next explicitly authorized build:

```powershell
# Optimized QA APK with official test ads; add the approved device hash only for EEA consent QA.
pwsh -NoProfile -File scripts/build-local-apk.ps1 -AdProfile test

# Store AAB plus universal APK, production ads and normal UMP regional behavior.
pwsh -NoProfile -File scripts/build-local-apk.ps1 -IncludeBundle -AdProfile production
```

Let input comparison select dependency installation and native regeneration. `-ResumeNative` is optional and asserts unchanged preparation inputs; it is not appropriate when switching QA/production profiles. Keep the fixed build directory, all four ABIs and validation gates. Routine builds omit `-MeasureBuild`; use existing timing records first when diagnosing delays. Framework upgrades should be completed and verified before the final production export rather than introduced during an otherwise routine release.

Latest upgraded QA run `20261020-204946-3c27c770` is V1.1.3/code31 with `adProfile=test`, forced EEA device settings and `aab=null`. It must not be submitted to Google Play. Its device results and limitations are recorded in [advertising QA](ADVERTISING.md#sdk-58-upgrade-device-qa--2026-10-20). A new production APK/AAB containing the upgrade and startup correction must complete full artifact checks and production-config smoke QA before a manual Play handoff. Code31 was approved by the user, but reuse eligibility across Play tracks still needs confirmation at submission.

This workflow confirmation changed documentation only; it did not start compilation, tests, upload or console changes. iOS build/upload timing remains unmeasured; keep the source-build crash correction until an explicitly scoped replacement has archive and device evidence.

## Evidence and causes

The retained 1.0.8 (26) production run at artifacts/apk-runs/20260911-005046-12ab25c8 ran both :app:assembleRelease and :app:bundleRelease. Gradle reported BUILD SUCCESSFUL in 1h 7m 52s and 1203 actionable tasks: 749 executed, 422 from cache, 32 up-to-date. Four-ABI CMake work for React Native, Expo Modules, Skia, Reanimated, Gesture Handler, Screens and the app accounts for much of the executed work.

The wrapper did not run Gradle clean. It already ran npm ci only when package/lock/npm/patch inputs or installation state required it. Those controls remain.

The native-input fingerprint previously included the full app.json. Therefore Android version-only changes and iOS/web-only Expo configuration changes could require Android prebuild and cause broad native recompilation even though app.config.js and the local config plugins do not consume those version values.

For a store run, building an APK and AAB as separate top-level Gradle targets duplicated packaging work. The release AAB already contains the optimized base module and same-build R8 mapping needed to create a local universal APK.

## Applied changes

### CRLF/LF fingerprint correction — 2026-09-14

The raw-byte fingerprint could treat a Git LF checkout and a Windows CRLF checkout as different dependency/native inputs, causing unnecessary installation and regeneration. The helper now normalizes CRLF to LF for fingerprints of `.npmrc`, the tracked configuration template `.env.example`, and supported UTF-8 text inputs (`json`, `js/cjs/mjs/jsx`, `ts/tsx`, `kt`, `java`, `gradle`, `xml`, `properties`, `swift`, `podspec`). Actual local `.env*` files, patches, binary assets, unsupported formats and toolchain metadata remain byte-sensitive. Source synchronization and provenance hashes retain exact bytes. Actual text, dependency, patch, native configuration, environment and toolchain changes still invalidate the relevant preparation state.

At that point, dependency schema 1 and native schema 3 preserved eligible existing success records through verified legacy-hash migration. The actual helper passed 23 tests in an in-memory filesystem with fake Git/toolchain inputs: both LF/CRLF migration directions, exact source provenance, genuine text/patch/binary/deletion changes, failed and unknown stamps, environment/toolchain drift, ad-profile changes and version-only reuse. No active build-root preparation, install, prebuild, build, lint or cache mutation was run. Actual build speed remains unmeasured.

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

## Current routine release path — 2026-09-22

- Invoke the wrapper with PowerShell 7 or newer: `pwsh -NoProfile -File scripts/build-local-apk.ps1`. It rejects Windows PowerShell 5.1 before preparation, preserves native stderr as diagnostic output and captures each native command's exit code immediately so benign warnings cannot replace the actual success/failure signal.
- Keep the fixed `artifacts/b` build root, Gradle build cache, generated task history and existing native outputs. Do not clean, reinstall dependencies or regenerate native output unless the wrapper's recorded inputs require it.
- For a JS/UI-only change whose dependency, Expo/native, toolchain and ad-profile inputs are unchanged, use `-IncludeBundle -AdProfile production -ResumeNative`. Omit `-MeasureBuild` from routine delivery; it is reserved for an explicitly authorized comparison that needs Gradle `--profile --info` output.
- Keep Configuration Cache disabled. Its strict trial failed because the generated Expo/React Native Android configuration starts Node processes during Gradle configuration. Keep one Gradle worker and non-reused daemon as the release defaults until a separate, same-input measurement demonstrates a stable improvement within the resource gate.
- Build the AAB once and derive the universal QA APK from that exact AAB. Production AdMob, signing identity, four ABIs, R8 mapping, SDK/Billing, 16 KiB, source provenance and artifact checks remain mandatory.
- The unified verifier now runs its nine independent external signature, metadata, alignment and bundletool commands with at most two workers. It still records every command output/duration and performs the same checks; APK/AAB archive comparisons remain single-open, deterministic checks. This source-only change has not been timed on a release artifact, so the next authorized build must compare `artifact verification` duration without assuming a speedup.

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

## Completed build-option evaluation

The wrapper retains `-ConfigurationCache`, `-ReuseDaemon`, and `-GradleWorkers 1|2` for controlled diagnostics, but the production defaults remain Configuration Cache off, a single-use daemon and one Gradle worker.

- Strict Configuration Cache was tested and rejected: generated `android/app/build.gradle` starts six Node processes during configuration, Gradle reported `Configuration cache problems found in this build`, and the cache entry was discarded. Do not enable it for release delivery or silently retry after this failure.
- Daemon reuse is limited to an explicitly authorized consecutive comparison with matching JDK/JVM inputs. It is not a default because an isolated release receives little benefit and a retained daemon consumes host memory needed by the resource gate.
- Two Gradle workers were not adopted. Keep one worker and the existing CMake pools until a same-source measurement records both lower time and stable peak memory/page-file pressure.
- `build-options.json`, the Gradle log/profile and stage timings preserve the selected options and evidence. Performance experiments remain separate from release delivery and change one variable at a time.

Historical baseline run `20260912-002428-05bfeae8` recorded Gradle 5m0.25s, startup 19.318s, configuration 1m14.83s, 73 executed / 1,122 up-to-date, R8 UP-TO-DATE, export interval 332.85s and separate unified verification 31.44s. These measurements preceded the option trials and do not prove a benefit. The wrapper also preserves successful keytool JKS notices written to stderr without treating them as failure; a nonzero exit code or mismatched certificate still stops the build. That correction was exercised by the same baseline run.

References: [Configuration Cache](https://docs.gradle.org/current/userguide/configuration_cache.html), [Gradle Daemon](https://docs.gradle.org/current/userguide/gradle_daemon.html).

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

## Release preflight stopped — 2026-09-21

Requested production APK/AAB build from clean, synchronized main `bc23fad724df28f07f558c805e00ba4c8d7bc2c3`, with the explicit snapshot override V1.1.2(30), using the existing fixed-directory wrapper and AAB-to-universal-APK workflow. The resource preflight stopped with 2.65 GiB available memory against the established 4 GiB minimum. Source synchronization, dependency installation, native generation, compilation and artifact verification were not reached; no new APK/AAB was produced. Existing caches and artifacts were retained. No processes were terminated and the safety threshold was not lowered. The supplied Play screenshot shows released code 29; code 30 eligibility across all tracks remains unverified. No lint, standalone tests, device QA or upload was performed.

User-requested retry (20260921-082355-73254353): the same production V1.1.2(30) source was selected, but preflight again stopped before source preparation/compilation with 2.91 GiB available against 4 GiB required. No new APK/AAB was generated; existing caches and artifacts remain unchanged.

## Successful retry V1.1.2(30) — 2026-09-21

Run `20260921-083708-471023bf` completed from pinned commit `bc23fad724df28f07f558c805e00ba4c8d7bc2c3`, production ads, no source overrides, and explicit build-only versionCode 30. Command: `scripts/build-local-apk.ps1 -IncludeBundle -AdProfile production -VersionCode 30 -MeasureBuild` under PowerShell 7, with LEDPOP_BUILD_REVISION set to that commit. Existing signing, four ABIs, fixed artifacts/b, one Gradle worker and build cache were retained. No cache clean or additional benchmark build ran.

- Resource checks passed (approximately 6.09/5.64 GiB available). Source preparation changed 25 files with no removals in 5.62 seconds. Dependency/native inputs had changed, so installation (77.67 seconds) and native generation (16.73 seconds) were required. Generated app caches were retained, but changed inputs caused substantial native recompilation. This run is not a warm UI-only build and does not demonstrate a total-build speedup.
- Full 19,372-line compilation log scanned and diagnostic categories reviewed: compile-ok, 1h12m53s; 1,159 actionable tasks, 748 executed, 411 FROM-CACHE, 0 UP-TO-DATE reported. Total wrapper time 4,557.49 seconds (75m57s); compilation 4,373.57 seconds, APK conversion 31.44 seconds, final artifact verification 42.03 seconds. Source preparation is measured at 5.62 seconds versus the previous 343.74 seconds, but source/input and cache conditions differ.
- All recorded static checks passed in `release-verification/a39490e05410415c9a00f136623b75c8/verification.json`: existing signer, production AdMob configuration/native modules, version, SDK 36, Billing metadata, four ABIs, required 16 KiB ZIP/ELF alignment, matching APK/AAB Hermes and native payloads, same-build embedded R8 mapping and retained symbols/maps. R8 metadata percentages: optimization 84.05%, shrinking 84.50%, obfuscation 84.44%; uncompressed DEX 15,274,040 bytes. These are local artifact results, not Play processing or optimized-runtime verification.
- AAB: `aab-deliveries/20260921-095148-7aaf3b9a0c0a48448f51756072b540ee/LedPopV112.aab`, 241,015,304 bytes, exported 09:51:48 KST. SHA-256 `C65BB47927A56B546B239062A542A1D183F6D30CC5A8ACF49091761AABDB8A44`.
- APK: `apk-deliveries/20260921-095222-e4acd1ab564d4a0c96586b87876d7d8e/LedPopV112.apk`, 271,151,144 bytes, exported 09:52:23 KST. SHA-256 `A9A751940DFB66E33332CE0B757608132957F4E57C653C41370E1F61F7BAE221`. This universal APK derives from the same AAB using bundletool 1.18.3. Mapping SHA-256 `1405B7F92B5D9BE6B8CDF59000CD6D8AD34841147CB7B33FADA5A9101A603104`.
- Reviewed diagnostics: Expo Core RawPropsParser and ad-adapter API deprecations, unnecessary Kotlin safe call, Gradle future deprecations, R8 informational unmatched rules and commons-codec overlap. The SDK app.json warning explicitly allows the Expo config plugin; the final manifest production ID passed verification. npm installation reported 16 moderate vulnerabilities; no automatic audit fix or dependency upgrade was performed.
- No separate lint/test command or device QA ran; normal bundleRelease dependency tasks including lintVital ran. Real ad serving, purchases/analytics receipt, splash/scroll runtime behavior, Play acceptance and code 30 availability on every track remain unverified. Official Billing deadline, page-size and DEX guidance was consulted on September 21; store upload is manual.
- Concurrent source boundary: main advanced through documentation commit `6e8ef8a` to ad-fix commit `7368d44` during this build. Neither changes the pinned source inventory. In particular, the later ad inventory/cancellation/banner-disposal changes in `7368d44` are NOT included in these APK/AAB files. A new build is needed to include them; this run must not be described as matching the later main HEAD.
## Preserve Gradle execution history — 2026-09-21 (source only)

Baseline for this improvement: main `7368d44ffcf7544d667f44fc86c9ae4603d13cdb`, with this task's successful-build record already pending in this document. The prior run archived the native project and restored app/build and app/.cxx only. Its archived android/.gradle still contains Gradle 9.3.1 task history and buildOutputCleanup; android/build contains generated output/reports. The build repeatedly reported `No history is available` despite retained app outputs. Losing local task history is an additional avoidable invalidation source, separate from the dependency reinstall and genuinely changed native inputs.

- The existing signing-verified wrapper now restores only the generated `.gradle`, `build`, `app/build` and `app/.cxx` directories after successful native generation, at the identical fixed absolute path. Existing source/archive boundary, reparse-point and destination-collision checks apply. Gradle still validates task inputs, toolchain and outputs. Native source, manifests, gradle.properties, settings.gradle and build.gradle are not restored. This does not enable Configuration Cache or daemon reuse.
- Necessary installation remains `npm ci`, with `--prefer-offline` to prefer npm's local download cache. Lockfile validation, integrity checks and install scripts remain enabled; missing cache content can still be downloaded normally. Package pin/postinstall changes in the last run are not reclassified as a safe skip. No package fingerprint exemption or cached dependency binary substitution was added.
- Each run retains source-plan.json before installation and cache-reuse.json after native preparation, recording whether installation/regeneration was required and exactly which generated directories were restored. Source revision, profile, version and artifact verification continue through the existing records.
- Preserve all four ABIs, production ads, existing signing, the one-worker/memory limits, R8, exact mapping, 16 KiB checks and AAB-once/APK conversion. A dependency reinstall or native-source change can still require substantial C++ compilation; task-history preservation does not guarantee that all native objects become UP-TO-DATE.
- Source/diff review only. No preparation script, install, prebuild, compilation, lint, tests or new artifact generation was executed for this improvement. The next authorized build must confirm restored-history behavior and actual task counts/timing. Existing 75m57s artifacts are unchanged; no measured speedup is claimed for this source change.

## Incremental V1.1.2(30) production export — 2026-09-21 15:11 KST

- Source main `7919f58d10f512de68e32ac80a3cf2765276502a`, committed/pushed, pinned, dirty=false, no source overrides. User confirmed code 30 with latest-release screenshot showing 29; all-track Play eligibility remains externally unverified. app.json remains 29; build override 30.
- Run `artifacts/apk-runs/20260921-150419-3b6c4768`: `build-local-apk.ps1 -IncludeBundle -AdProfile production -VersionCode 30 -MeasureBuild`, existing signing, fixed artifacts/b, four ABIs, one worker and cache retained. 16 changed files, zero removals, dependency installation and native generation skipped.
- compile-ok: full 12,636-line log scanned; BUILD SUCCESSFUL in 6m 3s. 1,159 actionable tasks: 73 executed, 1,086 UP-TO-DATE, zero reported FROM-CACHE. Total 455.64s (7m36s); source preparation 5.51s, compilation 363.97s, APK conversion 38.16s, artifact verification 36.69s. Prior 75m57s run had changed native/dependency inputs; this warm incremental result is not an isolated benchmark of the wrapper edit.
- All 421 local checks passed: production ads, source/embedded JS, signature, SDK 36, Billing metadata, four ABIs, 16 KiB ZIP/ELF alignment, APK/AAB payload parity and same-build embedded R8 mapping. Verification record: `release-verification/8e35568c422c49ffb5e990ffa365e25e/verification.json` under this run.
- Notices: Expo-plugin-compatible AdMob app.json warning (effective production manifest verified), NO_COLOR/FORCE_COLOR, Gradle 10 future deprecations. No standalone lint/tests, device QA, ad viewing or Play upload; normal release dependencies retained. Live serving, optimized runtime and Play acceptance remain unverified.
- APK: `C:\dev\Led Banner\artifacts\apk-runs\20260921-150419-3b6c4768\apk-deliveries\20260921-151117-f9550d597a464cc8874eeb5cd28a1842\LedPopV112.apk`; SHA-256 `0C56845470CB761E7825712E88441B308EA2591DFDFE803608BE6721D9074C11`; export UTC `2026-09-21T06:11:17.4103859Z`.
- AAB: `C:\dev\Led Banner\artifacts\apk-runs\20260921-150419-3b6c4768\aab-deliveries\20260921-151036-e1c10e9a40c74624bfa505573da782cd\LedPopV112.aab`; SHA-256 `2CF1AA2FD2EA887DFAFF1E2CAD153E9E0EAC3E2405D141216DBD0FE46D3F4B18`; export UTC `2026-09-21T06:10:36.4870890Z`.
- Mapping SHA-256 `1405B7F92B5D9BE6B8CDF59000CD6D8AD34841147CB7B33FADA5A9101A603104`. Previous artifacts retained; final signed bytes and export timestamps verified.

## Latest V1.1.2(30) production export — 2026-09-22

Retained run `20260922-003235-4e1bd97d/build-result.json` records clean pinned source `a49fed6e711156b841a486528dc63241baae414c`, production ads, build-only versionCode 30, existing signing, one Gradle worker and `:app:bundleRelease`. The universal APK was derived from the same AAB with bundletool 1.18.3. Total recorded wrapper duration was 492.82 seconds (8m13s); this is not an isolated performance benchmark.

- APK SHA-256: `4F800A29E3BCB169F784996EBFD80F8884CE743049DF58FB2F4810ACBBEF3261`; export UTC `2026-09-21T15:40:54.9429901Z` (September 22 KST).
- AAB SHA-256: `ACAD949EA6C58FA782D9CE0C7EA0F92825BF15019E05327B528770B4ED899D74`; export UTC `2026-09-21T15:40:17.5822635Z` (September 22 KST).
- Same-build mapping SHA-256: `1405B7F92B5D9BE6B8CDF59000CD6D8AD34841147CB7B33FADA5A9101A603104`.
- The installed Android APK matched this hash. Observed test-ad rewards, expiry after more than two hours, UI and performance results are recorded in [the September 22 QA section](QA_20260910.md#2026-09-22--최신-v112-30-설치-apk-최종-qa). Later accessibility isolation and unused-export cleanup are source changes and are not included in these artifacts.

This entry consolidates existing build evidence during the requested main delivery. No build, lint or tests were rerun; Play upload and all-track version-code availability remain unverified. Original artifacts, logs and traces remain in the ignored local artifacts directory, rather than Git.

## Release preflight stopped — 2026-09-22 01:29 KST

Run `20260922-012952-fbb987a8` selected clean, previously pushed main `afd29b86c1762297f9555a7cdb5a70ac663c38a9`, V1.1.2 with the user-approved build-only versionCode 30, production AdMob and the existing APK/AAB wrapper. Resource preflight measured 3.78 GiB available against the established 4 GiB minimum and stopped before source preparation or compilation. No new APK/AAB was produced. Existing signing, source, caches and prior artifacts were preserved; no process termination, threshold reduction, automatic retry, lint/test command, device install or store upload was performed. This attempt did not verify the newly committed accessibility correction. At that time, the latest successful artifact remained the preceding `20260922-003235-4e1bd97d` run.

## V1.1.2(30) production release export — 2026-09-22 02:55 KST

- Clean pinned main `afd29b86c1762297f9555a7cdb5a70ac663c38a9`, production AdMob, existing upload signing and explicit build-only versionCode 30. Run `20260922-024340-ebd9287d` used the fixed `artifacts/b` directory, one Gradle worker, all four ABIs and AAB-once/universal-APK conversion. It includes the rewarded-popup accessibility isolation and unused-export cleanup committed in that revision.
- Dependency installation was skipped. Native inputs required regeneration; prebuild took 41.40 seconds and restored `.gradle`, `build`, `app/build` and `app/.cxx` caches at the fixed path. Compilation completed in 492.48 seconds: `BUILD SUCCESSFUL in 8m 11s`, 1,159 tasks with 75 executed, 2 from cache and 1,082 up-to-date. Total wrapper time was 686.11 seconds (11m26s), including 62.51 seconds for APK conversion and 64.46 seconds for artifact verification.
- All 421 recorded static checks passed. Verified V1.1.2(30), source inventory, production AdMob manifest and bundled configuration, existing signer, SDK 36, Billing 9.1.0 metadata, non-debuggable manifest, excluded web diagnostics/disabled Premium route, matching Hermes/native payloads, four ABIs, 16 KiB ZIP/ELF alignment, same-build embedded R8 mapping and final export hashes/timestamps. R8 metrics passed: optimization 84.05%, shrinking 84.50%, obfuscation 84.44%; uncompressed DEX 15,274,040 bytes.
- AAB: `aab-deliveries/20260922-025252-701619011c6d466a8f1434d19cd1f79d/LedPopV112.aab`, 241,016,267 bytes, SHA-256 `453C4B0775CA0D09AF73B2BB45EC8F4A48E57FE7363D5E518985FB21003FBD34`, exported `2026-09-21T17:52:53.0228191Z`.
- APK: `apk-deliveries/20260922-025400-e942e84f755045a3a7d99b023597af64/LedPopV112.apk`, 271,151,144 bytes, SHA-256 `5E038E989CEC4FABC86499D8B87105C91D7CCEB137DBFFB6D275336D1701C26E`, exported `2026-09-21T17:54:00.7491310Z`. It was derived from the same AAB with bundletool 1.18.3 and the existing key. Mapping SHA-256 is `1405B7F92B5D9BE6B8CDF59000CD6D8AD34841147CB7B33FADA5A9101A603104`.
- Full Gradle output contained no build errors. Reviewed notices were the Expo-plugin-compatible AdMob app.json warning (the effective production manifest passed artifact verification), NO_COLOR/FORCE_COLOR and future Gradle 10 deprecations. No standalone lint/test command, device installation, Play upload or console change was performed. Play acceptance and versionCode 30 availability across every track remain external checks; the user uploads the AAB manually.

## Long V1.1.2(30) production export and cache correction — 2026-09-22

Run `20260922-092010-7fdc1cf3` completed from clean pinned main `e031735b7f973dca4a2aa82aa6c884d15d043a51` with production ads, the existing signing identity, four ABIs, one Gradle worker, build-only versionCode 30 and AAB-once/universal-APK conversion. The first `-ResumeNative` invocation stopped safely after 3.35 seconds because its recorded dependency/native inputs did not match; it did not cause the long compilation. The successful rerun took 3,900.84 seconds (65m00.84s): dependency installation 76.50 seconds, native generation 13.14 seconds, compilation 3,777.91 seconds including `BUILD SUCCESSFUL in 1h 2m 20s`, APK conversion 28.57 seconds and verification 30.48 seconds. Gradle reported 1,159 actionable tasks: 555 executed, 355 from cache and 249 up-to-date. All 421 recorded artifact checks passed.

Comparison with the preceding warm run at `afd29b86c1762297f9555a7cdb5a70ac663c38a9` found that the only changed dependency/native input was the root `package.json` metadata version (`1.0.6` to `1.1.2`); `package-lock.json` and the dependency graph were unchanged. Because schema 1 hashed the complete root package manifest and the native fingerprint included that dependency hash, this metadata-only change incorrectly required `npm ci`, prebuild and broad four-ABI native/R8 work. That invalidation, rather than APK conversion or the short stopped attempt, was the dominant avoidable cause.

Dependency schema 2 and native schema 4 now remove only the root `package.json.version` field from preparation fingerprints. Dependency declarations, devDependencies, scripts, overrides, lockfile, npm settings, patches, Expo/native configuration, local modules, assets, environment, toolchain and ad profile remain fingerprinted. Existing schema-1/schema-3 success records migrate only after their old hashes are reproduced from the preserved target bytes; legacy and unknown/mismatched/failed records keep the fail-closed behavior. Regression specifications cover metadata-version reuse and verified schema migration, but were not executed in this change because no build, lint or test was authorized. The implementation and documentation received static diff review only; the next authorized same-input build must measure actual reuse and timing.

- AAB: `aab-deliveries/20260922-102408-d374431e22a940018e14ddda6253ed22/LedPopV112.aab`.
- APK: `apk-deliveries/20260922-102440-ddae9ec66dde44cdab013ab3bf490e38/LedPopV112.apk`.
- Reviewed notices: Expo config-plugin-compatible AdMob app-ID warning, NO_COLOR/FORCE_COLOR, Expo RawPropsParser deprecation and future Gradle 10 compatibility. No standalone lint/test, device QA or Play upload was performed during the build.

## V1.1.2(30) production export — 2026-09-22 14:58 KST

- Run `20260922-145251-06390196` completed from clean, synchronized main `7f37cf506b86c6326f5b8eef9f7a6db0e8adaae1` with production AdMob, the existing upload signing identity, all four ABIs, one Gradle worker and build-only versionCode 30. The first `-ResumeNative` request stopped before compilation because the native fingerprint required regeneration; the successful invocation regenerated native inputs without `npm ci` and restored `.gradle`, `build`, `app/build` and `app/.cxx` at the fixed path.
- compile-ok: Gradle reported `BUILD SUCCESSFUL in 4m 32s`; 1,159 actionable tasks comprised 75 executed, 2 from cache and 1,082 up-to-date. Native generation took 24.95 seconds, compilation 273.49 seconds, APK conversion 24.93 seconds and artifact verification 24.56 seconds. Total recorded wrapper time was 355.27 seconds (5m55s).
- All 421 recorded static checks passed with zero failed checks or verifier warnings: V1.1.2(30), production AdMob, existing signer, compile/target SDK 36, Billing metadata, four ABIs, required 16 KiB ZIP/ELF alignment, matching APK/AAB payloads and same-build embedded R8 mapping.
- AAB: `aab-deliveries/20260922-145755-505334db1f524b8e93fbd79f46e4d6c1/LedPopV112.aab`, 222,857,722 bytes, SHA-256 `586399C39703E4BD747B7DD1F8D6A244B5BC30135ABA3580668D30EEC0F3D1E7`.
- APK: `apk-deliveries/20260922-145821-0fdc881b6ad8462ca153dd3a40282c65/LedPopV112.apk`, 253,042,728 bytes, SHA-256 `7C53A59B25533790B78AB7E2A589DB1D14D4286BC154BB0CFDF519A96F02D6D6`. The universal APK derives from the same AAB through pinned bundletool 1.18.3. Mapping SHA-256 is `1405B7F92B5D9BE6B8CDF59000CD6D8AD34841147CB7B33FADA5A9101A603104`.
- Reviewed non-blocking notices were the Expo-config-plugin-compatible AdMob app-ID warning, NO_COLOR/FORCE_COLOR and future Gradle 10 deprecations. Runtime QA and Play upload were not performed. The later transparent sign-board frames and Pixelation Mix selection indicator are not included in these artifacts.

## Latest V1.1.2(30) production export — 2026-09-22 19:44 KST

- Run `20260922-193040-6d14ebfe` used clean synchronized main `7d9316fdbd44ca04aa7c095288bc2047ea4dbf43`, production AdMob, existing signing, all four ABIs, one worker and build-only versionCode 30. It includes transparent sign-board frames and the Pixelation Mix selection indicator. The subsequent fullscreen photo-fill change is source-only and is not included.
- The initial ResumeNative request stopped before compilation because native inputs changed. The successful run skipped dependency installation, regenerated native configuration in 23.65 seconds and restored the existing native caches. Resource changes invalidated R8 inputs (R.jar, linked resources and keep.xml); no cache or release optimization was disabled.
- compile-ok: `BUILD SUCCESSFUL in 12m 6s`; 1,159 actionable tasks: 84 executed, 1,075 up-to-date, 0 from cache. Total wrapper time was 808.35 seconds; APK conversion 27.14 seconds and artifact verification 27.01 seconds. AAB was built once and universal APK derived through bundletool 1.18.3.
- All 421 static artifact checks passed: existing signer, production AdMob, V1.1.2(30), SDK 36, Billing metadata, four ABIs, required 16 KiB alignment, matching payloads and embedded same-build R8 mapping. Full build-log review found non-blocking Expo-plugin AdMob configuration notices, output-color notices, R8 informational rules and future Gradle 10 deprecations.
- AAB: `aab-deliveries/20260922-194317-939d30db88914e228f0c7f9ba03f9412/LedPopV112.aab`, 223,120,887 bytes; SHA-256 `036F32A64DB0C2CD5003DEBA947B083A20CFED5DFFCFC1571421BB78195F5C51`; export `2026-09-22T10:43:17.9426375Z`.
- APK: `apk-deliveries/20260922-194347-bbfb8558c2e74d29b777196feb0aa034/LedPopV112.apk`, 253,313,686 bytes; SHA-256 `270A74F3016EB6FA1A0D823740C995F62F6A6CBD0D5668886B470A233AAD5DBF`; export `2026-09-22T10:43:47.4508673Z`. Mapping SHA-256: `1405B7F92B5D9BE6B8CDF59000CD6D8AD34841147CB7B33FADA5A9101A603104`.
- Runtime QA and Play upload were not performed. Play code eligibility across all tracks remains unverified. This documentation delivery runs no additional build, lint or tests; original local records remain under the run directory.

## APK/AAB 용량 분석 — 2026-10-18

기존 산출물 ZIP을 읽기 전용으로 분석했으며 각 SHA-256은 해당 build-result.json과 일치했습니다. 단위는 MiB(1,048,576 bytes), 항목별 수치는 ZIP 내 저장 크기입니다. 총합에는 별도 ZIP·정렬·서명 오버헤드가 포함됩니다.

| 항목 | QA APK 20261016-185016-4d617d41 | Production APK 20261012-085201-058b0c72 | 같은 production AAB |
| --- | ---: | ---: | ---: |
| 네이티브 라이브러리 | 127.18 | 127.18 | 47.16 |
| 글꼴 | 93.13 | 93.13 | 93.60 |
| DEX | 6.72 | 6.72 | 6.72 |
| 이미지 | 6.39 | 6.39 | 6.27 |
| JavaScript | 5.08 | 5.06 | 2.14 |
| 빌드 메타데이터 | 0.02 | 0.02 | 55.56 |
| 기타 리소스 | 2.04 | 2.11 | 1.09 |
| 전체 파일 | 241.50 | 241.61 | 212.81 |

모두 V1.1.3(31)이지만 QA/production 및 소스가 다른 빌드이므로 차이를 최적화 효과로 해석하지 않습니다. 통합 APK는 네 가지 ABI를 포함하며 AAB와 압축 방식이 다릅니다. AAB의 매핑·디버그 심볼은 사용자 다운로드 용량과 구분하고 보존합니다. 실제 Play 다운로드·설치 크기는 측정하지 않았습니다.

현재 원격 글꼴로 선언된 Noto Serif SC/TC와 LXGW WenKai TC의 6개 파일이 분석한 산출물에도 포함되어 있고 AAB 저장 크기 합계는 약 42.29MiB입니다. 생성 리소스 잔존 여부와 당시 소스 입력을 추가 확인해야 하며, 이번 분석만으로 미사용·삭제 가능을 판정하지 않았습니다. 1KiB 이상 파일의 내용 해시 비교에서 각 산출물에 동일 파일 10개 그룹을 발견했습니다. 중복 저장 바이트 상한은 APK 약 0.374MiB, AAB 약 0.366MiB이며 주로 주간/야간 스플래시 이미지입니다. 라이선스·SDK 리소스도 포함하므로 이 수치를 삭제 가능량으로 보지 않습니다.

상세 로컬 증거: `artifacts/size-audit-20261018/inventory.json`, `report.md`. 분석 시 빌드·리소스 삭제·압축 변경·재서명은 하지 않았습니다. 10월 18일 R8 옵션 및 보상 팝업 분리는 이 기존 산출물에 포함되지 않았습니다.

## 테스트 APK 실행 차단 — 2026-10-19

현재 변경분을 포함한 `-AdProfile test -MeasureBuild` APK 생성을 요청받았으나 명령 실행 전 자동 승인 검토 서비스가 `Selected model is at capacity`로 실패했습니다. 빌드 명령은 실행되지 않았으며 새 APK는 생성되지 않았습니다. 이는 코드 컴파일 오류·호스트 메모리 부족·안전성 거부를 의미하지 않습니다. 승인 절차를 우회하지 않았으며, 최신 검증된 QA APK는 여전히 10월 16일 산출물입니다.


## 구매 연결 복구 APK — 2026-11-17

- 실행 `20261117-194130-f9692cbb`, V1.1.4 (33), dirty main `dbb1f2b59b56865435c0e64a2af34eda8c8cb75e`의 승인된 구매 연결 복구·이전 Back 수정 포함 QA용 APK입니다. 기존 서명·4개 ABI·실제 AdMob·일반 UMP·정상 보상 시간을 유지했습니다. AAB는 생성하지 않았습니다.
- 기존 G: Gradle·npm·네이티브 출력을 유지하고 `-AdProfile production -ResumeNative -VersionCode 33`으로 실행했습니다. 설치와 네이티브 생성은 생략됐습니다. Gradle 11분 6초, 전체 730.36초; 1,280개 작업 중 70개 실행, 1,210개 up-to-date. 이전 Back APK의 Gradle 12분 14초보다 68초 짧았지만 반복 측정한 성능 개선 수치로 보지 않습니다.
- 전체 로그 1,921줄 검토, BUILD SUCCESSFUL, 기존 서명·패키지·target SDK 36·ZIP 정렬과 R8 설정 확인. 동일 빌드 매핑 SHA-256 `0288FC2FF25777D5A5BBC26EF6C0F9EC34C411BCFE6AE7FF9E043AEF4E9B49BF` 보관. 기존 AGP/Gradle/Kotlin 폐기 예정 API 경고가 있습니다. AAB 지표 검증은 APK-only이므로 해당하지 않습니다.
- APK: `artifacts/apk-runs/20261117-194130-f9692cbb/apk-deliveries/20261117-195338-e24ae110b6a1464d983fcdba94fe3fc1/LedPopV114.apk`, SHA-256 `BDD078B374B0B768CE035A9465DA34D248ADB4EFC6D50524DF1FD76D7948CF5D`; export `2026-11-18T00:53:40.4581732Z` (Toronto 11월 17일 19:53).
- Galaxy 덮어 설치 후 설치 해시·번들 소스 일치와 구매 복원·연결 끊김 복구를 확인했습니다. 신규 거래와 환불 원인의 구분은 [IAP_SETUP](../IAP_SETUP.md#구매-없음-원인-및-연결-복구-후속-확인--2026-11-17)에 기록했습니다. Play 업로드·iOS 검증·Git 전달은 수행하지 않았습니다.


## Shop 디자인 포함 ARM64 테스트 APK — 2026-11-17

- 실행 `20261117-212140-85edd896`, clean main `d31d31cbb78a9412a1c01e78cf7db77951ee52a5`, V1.1.4 (33). 최신 Shop UI·Settings Back·결제 연결 복구를 포함합니다. `-AdProfile test -RewardExpiryQa -Arm64Qa -VersionCode 33`으로 기존 G: 빌드 경로·캐시·서명을 유지했습니다. AAB는 만들지 않았습니다.
- 의존성 설치는 생략했습니다. 테스트 광고 프로필로 네이티브 설정을 갱신하고 `.gradle`, `build`, `app/build`를 복원했습니다. 전체 1,326.29초(22분 6초), Gradle 17분 38초; 1,238개 작업 중 80개 실행·1개 캐시·1,157개 up-to-date. 프로필 변경에 따른 네이티브 준비와 R8 재실행이 있어 이전 ARM64 증분 빌드와 동일 조건의 속도 비교는 아닙니다.
- 전체 컴파일 출력 1,901줄 검토, BUILD SUCCESSFUL. 기존 AGP/Kotlin 폐기 예정 API·색상·manifest 병합·Expo AdMob 플러그인 경고가 남으며 유효 manifest·서명·정렬 검사는 통과했습니다. 동일 빌드 R8 매핑도 보관했습니다.
- 공식 Android AdMob 테스트 App ID·배너·보상형 ID, 일반 UMP의 네이티브 브리지와 남아 있는 SDK 구현 클래스, ARM64-only·16KiB ELF/ZIP 정렬과 번들 소스 일치를 포함한 174개 산출물 검사가 통과했습니다. R8가 UserMessagingPlatform 진입 클래스를 제거/인라인했으므로 남아 있는 동의 SDK 구현과 브리지를 실제 DEX와 대조했습니다.
- Hermes 바이트코드에서 PRO_REWARD_DURATION_MS에 연결된 60,000ms 상수와 QA 전용 저장 키를 확인했고 정식 보상 저장 키는 이 QA 번들에 없었습니다. 보상 팝업·번역은 커밋 소스와 일치하며 문구를 바꾸지 않았습니다. 영구 구매 시간 제한은 추가하지 않았습니다. 강제 EEA는 설정하지 않았고 실제 동의창·광고·보상 만료·새 Shop의 기기 실행은 이번 빌드 작업에서 확인하지 않았습니다.
- APK: `artifacts/apk-runs/20261117-212140-85edd896/apk-deliveries/20261117-214345-863069fbd58349b1bf11da787c70ba14/LedPopV114.apk`, 75.44MiB, SHA-256 `3EDC50BF2A4DF0373B96D840746F987F6102441B291ADDE6D7F6B3524A5CADC6`; export `2026-11-18T02:43:46.8872087Z` (Toronto 11월 17일 21:43). 증거: 같은 실행 폴더의 `qa-artifact-verification.json`, `qa-reward-bytecode.txt`, `stage-timings.json`.
