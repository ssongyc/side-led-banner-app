# LED POP Premium IAP 설정

> Android와 iOS의 설정에서 Shop을 열어 광고 영구 제거를 구매하거나 복원할 수 있습니다. 양쪽 스토어에서 미국 기준가 US$4.99를 확인했습니다. 현지 가격은 스토어 조회 결과를 사용합니다. 출시 파일에 포함된 범위는 [README](README.md)를 참고하세요.

## 최신 Android 출시 APK 검증 — 2026-11-18

V1.1.4 (33), 실행 `20261118-114825-c8bd2378`의 출시 APK를 Galaxy에 설치하고 SHA-256 일치를 확인했습니다. Shop에는 ₩7,500과 Buy 아래 복원 버튼 한 개가 표시됐습니다. Google Play 라이선스 테스트 결제를 취소하고 다시 열 수 있었으며, 무청구 주문 완료 후 Purchased가 표시됐습니다. 수동 복원과 앱 종료·재실행 후에도 Pro가 유지됐습니다. 사용자가 테스트 주문을 환불한 뒤에는 재실행 시 Buy가 다시 나타났고 복원 결과에서도 보유한 Pro 구매가 없었습니다. iOS 구매와 차지백은 이번 확인 범위에 포함되지 않습니다. [출시 기록](docs/ANDROID_BUILD_OPTIMIZATION.md#production-build-v114-33--2026-11-18)

## 이전 Android 출시 APK 검증 — 2026-11-17

V1.1.4 (33), 실행 `20261117-161101-575b889f`의 출시 APK를 Galaxy SM-M336K(Android 16)에 설치했고 원본 APK와 설치 파일 해시가 일치했습니다. 실제 AdMob·일반 UMP·정상 2시간 보상을 유지한 파일이며 결제는 Google Play 라이선스 테스트 계정으로 검증했습니다.

- LED POP PRO와 현지 가격 ₩7,500 표시, 구매창 취소 후 구매 버튼 복구·재진입을 확인했습니다.
- Google Play가 실제 청구 없는 테스트 주문임을 명시했고 공식 항상 승인 테스트 카드로 Payment successful을 확인했습니다. 이후 앱이 Purchase complete와 Pro active로 전환했습니다.
- 수동 Restore 성공과 완전 종료·재실행 후 Pro active 유지를 확인했습니다. 설정에 광고 WebView는 보이지 않았고 현재 앱 프로세스에서 치명적 오류·IAP 경고는 관찰되지 않았습니다.
- 479개 기본 산출물 검사와 12개 추가 구매/번들 검사를 통과했습니다. 신규 iOS 거래, 환불·차지백, 스토어 결제 대기 상태 및 이 출시 파일의 EEA 동의창·실광고 공급은 이번 실기기 검증 범위가 아닙니다. [출시 파일 기록](docs/ANDROID_BUILD_OPTIMIZATION.md#production-build-v114-33--2026-11-17)

### 같은 날 Back 수정 APK의 후속 조회

Back 수정 APK `20261117-174321-5d67f966` 설치 후 현재 Galaxy Play 계정은 보유한 Pro 구매 없음으로 응답했고 수동 복원 결과도 같았습니다. 앞 절의 구매 성공 기록은 당시 관찰 결과로 보존하며, 이 후속 조회를 구매 권한 유지 통과로 취급하지 않습니다. 앱 데이터를 삭제하거나 새 결제를 하지는 않았고, 당시에는 계정·테스트 주문의 현재 상태와 원인을 확인하지 않았습니다. 이후 확인된 환불 상태와 연결 복구 결과는 다음 절에 기록했습니다. Back 수정은 구매 로직을 변경하지 않았습니다.

## 구매 없음 원인 및 연결 복구 후속 확인 — 2026-11-17

Galaxy 후속 조회에서 구매가 없었던 직접 원인은 Play Console에서 이전 LED POP 테스트 주문이 **환불됨**으로 바뀐 것이었습니다. 주문 이력에는 21:36:34 UTC 처리, 21:57:30 UTC 환불로 표시됐습니다. 콘솔에는 환불을 실행한 주체나 사유가 표시되지 않아, acknowledge 누락에 따른 자동 환불 또는 사용자 환불이라고 단정하지 않습니다. 이번 작업에서는 환불·권한 회수·계정 변경을 실행하지 않았습니다.

별도로 같은 프로세스에서 `Billing service disconnected`와 `Billing client not ready`를 재현했습니다. 앱의 연결 완료 플래그와 SDK의 네이티브 `connectionReady`가 남아 있어 수동 Check again도 새 연결을 만들지 못했습니다. Android의 연결 끊김/준비 안 됨 오류만 연결 무효 상태로 기록하고, 다음 기존 갱신·복원 진입에서 `endConnection` 후 `initConnection`을 한 번 수행하도록 수정했습니다. 실패한 요청을 숨기거나 자동 재시도하지 않으며, 보유 권한·서명 검증·비소모성 acknowledge 기준은 유지합니다.

수정 전 설치 APK V1.1.4 (33), 실행 `20261117-174321-5d67f966`에서는 데이터 삭제 없이 프로세스를 재시작한 후 새 Google Play 라이선스 테스트 거래를 완료했습니다. 공식 항상 승인 테스트 카드와 실제 청구 없음 표시, Payment successful, Purchase complete, Pro active, 수동 Restore 성공과 프로세스 재시작 후 Pro 유지를 확인했습니다. Play Console에서도 새 주문이 23:52 UTC의 Processed 상태로 조회됐고, 메인 프리셋 잠금 해제와 배너 WebView 미표시를 확인했습니다. 이는 새 연결 복구 수정 APK의 검증 결과와 구분합니다.

### 연결 복구 수정 APK 검증 완료

같은 날 승인 후 실행 `20261117-194130-f9692cbb`의 V1.1.4 (33) APK를 기존 서명·실제 광고·일반 UMP·정상 2시간 보상 설정으로 빌드하고 Galaxy에 `adb install -r --user 0`으로 설치했습니다. 원본과 설치 APK SHA-256은 `BDD078B374B0B768CE035A9465DA34D248ADB4EFC6D50524DF1FD76D7948CF5D`로 일치합니다. 소스맵에서 실제 구매 코드와 Settings Back 코드가 소스와 일치하는 것도 확인했습니다.

- 덮어 설치 후 Pro 활성화와 수동 복원 성공을 확인했습니다.
- Play Store 서비스만 일시 종료해 연결 오류를 재현했습니다. 오류 안내 중에도 마지막 확인된 Pro를 유지했습니다. Check again과 수동 Restore 각각으로 재연결·권한 재조회를 완료했고 LED POP 프로세스 ID는 바뀌지 않았습니다. Play Store 서비스는 다시 실행됐습니다.
- 일반 앱 복귀, 완전 종료·재실행 후 Pro 유지, 재실행 후 수동 복원과 메인 프리셋 2~5 잠금 해제·배너 WebView 미표시를 확인했습니다. 마지막 재시작 프로세스에서는 치명적 오류와 IAP 경고가 없었습니다. 연결을 의도적으로 끊은 시점의 오류는 예상대로 보고됐습니다.
- 구매 회귀 검사 14개와 변경 파일의 ESLint가 통과했습니다. Gradle은 11분 6초, 전체 래퍼는 약 12분 10초였으며 의존성 설치·네이티브 생성을 건너뛰고 1,280개 작업 중 1,210개를 재사용했습니다. 전체 로그를 검토했고 기존 Gradle/Kotlin 폐기 예정 API 경고는 남습니다.

새 테스트 거래 자체는 앞 절의 Back 수정 APK에서 완료했고, 연결 복구 APK에서는 그 동일한 보유 권한의 조회·복원·재실행·연결 복구를 검증했습니다. 이미 소유 중인 비소모성 상품을 다시 결제하거나 테스트 주문을 임의 환불하지 않았습니다. 앱 데이터·스토어 계정은 유지했습니다. 이 수정이 포함된 AAB와 iOS 빌드는 만들지 않았습니다. 로컬 증거는 `artifacts/galaxy-iap-followup-20261117/verification.json`입니다.

## 현재 구현과 상태

외부 결제 관리 서비스 없이 `expo-iap 5.5.1`로 Apple StoreKit과 Google Play Billing에 직접 연결합니다.
Premium은 **1회 구매하는 영구 비소모성 상품**입니다. 구독이나 소모성 상품이 아닙니다.

- 설정 또는 보상 팝업의 Watch Ad 아래 Buy Led Pop Pro 버튼에서 같은 Shop을 엽니다. Shop 상품 카드의 광고 영구 제거 제목 위에는 `LED POP PRO`를 표시합니다.
- 스토어에서 실제 현지화 가격을 조회하고 해당 상품/구매 옵션으로 결제합니다.
- 구매 완료 + 검증 + 거래 완료 처리 후 영구 Pro 권한을 부여합니다.
- 구매 복원, 시작/일반 앱 복귀 시 보유 내역 조회, 거래 업데이트를 처리합니다.
- 기존 광고 보상 2시간 Pro와 구매 권한은 별개입니다. 보상 시간이 끝나도 영구 구매자는 잠기지 않습니다.
- 영구 구매자는 프리셋 2~5, 잠긴 텍스트/배경 색상, 글자 크기, Pixel/Gradient/Glow 및 잠긴 배경 효과를 포함한 기존 모든 Pro 기능을 사용할 수 있습니다.
- 영구 구매자에게 배너를 마운트하지 않고 보상 광고 로딩·예약·표시 및 보상 팝업을 차단합니다.
- 구매 여부가 아직 확인되지 않으면 광고를 요청하지 않습니다. 조회 실패를 무료 사용자/구매 성공으로 바꾸지 않습니다.
- 구매 취소, 승인 대기, 조회/검증 실패, 복원할 구매 없음은 각각 표시합니다. 자동 구매 재시도는 없습니다.

2026-11-17 V1.1.4 (32) Android ARM64 QA APK(실행 `20261117-062617-07cb4fe5`)에서 Play 라이선스 테스터로 현지 가격 CA$6.99와 구매 이력 없음 응답을 확인했습니다. Google Play 테스트 카드 결제 후 재실행에서 Pro 상태를 확인했고, 수동 복원과 이후 재실행에서도 Pro가 유지됐습니다.

같은 날 V1.1.4 (32) 출시용 APK와 AAB에서 Shop, 동일한 Play 공개키와 Billing 9.1.0을 확인했습니다. AAB는 Play Console 프로덕션 초안에 저장됐습니다. iOS 상품은 App Store Connect에서 제출 준비 상태이며 iOS 거래는 실기기 검증 전입니다.

### 이전 확인 기록

SDK 55 기준 2026-09-08 Android preview APK `1cfedbc5-0306-4113-8e65-68e9aebb89b0` 컴파일 완료(`compile-ok`, V1.0.6/22). IAP·구매 서명 검증 모듈을 포함합니다. TypeScript 상품 타입 오류를 수정했고 컴파일이 통과했습니다. 실제 결제 테스트, iOS 빌드, 스토어 업로드 및 콘솔 변경은 실행하지 않았습니다.

## Expo 57 후속 빌드

2026-09-08 로컬 APK LedPop-V1.0.6-Expo57-local.apk 컴파일 완료. IAP·구매 서명 검증 모듈, Billing 9.1.0(manifest/프로퍼티), SDK 36/36 및 기존 서명 일치를 확인했습니다. 당시에는 스토어 상품 등록과 공개키 설정, 결제·복원을 검증하지 않았습니다. 상세 기록은 README의 로컬 APK 완료 절을 참고합니다.

## 변경 파일

| 파일 / 디렉터리 | 역할 |
| --- | --- |
| `app/shop.tsx`, `app/settings.tsx` | Shop 진입, 스토어 가격, 구매·복원 및 결과 상태 |
| `utils/ApiClient.ts` | 스토어 연결, 거래 직렬 처리, 구매·복원·검증 |
| `contexts/premiumContext.tsx` | 구매 상태 구독, 시작·앱 복귀 시 확인 |
| `contexts/settingsContext.tsx` | 영구 구매와 기존 보상 Pro를 모든 잠금 조건에 연결 |
| `components/RootLayout.tsx`, `app/settings.tsx`, `app/index.tsx`, `hooks/useRewardedAd*` | 구매자의 광고 요청·표시·보상 팝업 차단 |
| `constants/premium.ts`, `.env.example` | 스토어 상품 ID 및 Google Play 공개키 설정 |
| `language/premiumLabels.ts`, `language/textSectionLabels.ts` | 7개 언어의 Shop 상품·동작·결제 상태 문구 |
| `modules/purchase-verification/` | Android 구매 서명·앱·상품·토큰·완료 상태 검증 |
| `plugins/withPremiumIap.js`, `app.json` | 네이티브 IAP 및 플랫폼 설정 |
| `package.json`, `package-lock.json` | 직접 IAP 의존성과 고정 버전 |
| `README.md`, `IAP_SETUP.md` | 현재 구현, 기존 빌드와의 구분, 스토어 설정 및 미검증 범위 |

## 1. App Store Connect

앱 식별자: `com.sunnyinnolab.ledpop` (2026-10-21 App Store Connect의 LED POP `6749168042`에서 확인). 아래 Product ID는 별도 식별자입니다. 2026-11-17 비소모성 상품 등록과 미국 가격을 확인했으며 상품 상태는 제출 준비 중이었습니다.

| 항목 | 설정 |
| --- | --- |
| 상품 유형 | Non-Consumable (비소모성) |
| Product ID | `com.minkyokim.sideledbannerapp.premium` |
| 표시 이름 | Remove Ads (영어·미국) |
| 설명 | Permanently removes ads in LED POP. |
| 가격 / 판매 지역 | 미국 US$4.99, 다른 지역은 App Store Connect에서 확인 |

Paid Apps 계약, 세금 및 은행 정보를 완료하고 상품 현지화, 심사 정보/스크린샷을 등록합니다.
첫 IAP는 필요한 앱 버전과 함께 심사 제출합니다. 상품의 판매/심사 가능 상태를 확인합니다.
코드에 Apple 비밀키를 넣지 않습니다. StoreKit 2의 서명 검증 및 현재 entitlement를 이용합니다.

## 2. Google Play Console

패키지: `com.minkyokim.sideledbannerapp`

| 항목 | 설정 |
| --- | --- |
| 상품 유형 | One-time product |
| Product ID | `led_pop_premium` |
| Purchase option ID | `buy` |
| 구매 옵션 | 영구 구매 (대여 아님) |
| 구매 옵션 가격 / 판매 지역 | 미국 US$4.99, 다른 지역은 Play Console에서 확인 |

2026-11-17 상품과 `buy` 구매 옵션이 활성화된 것을 확인했습니다. 이 UI는 기본 영구 구매 옵션 하나를 사용하며
별도 할인 offer, 수량 제한, 대여, 사전 구매 옵션은 자동 선택 대상에서 제외합니다.
표시한 가격과 동일한 옵션의 offer token을 결제 요청에 전달합니다.
앱은 거래를 **acknowledge**하고 **consume하지 않습니다**.

Play Console의 Monetization setup / Licensing에서 이 앱의 Base64 RSA **공개키**를 복사해 설정합니다.

```dotenv
EXPO_PUBLIC_GOOGLE_PLAY_LICENSE_KEY=콘솔에서_복사한_Base64_RSA_공개키
```

로컬 Metro는 프로젝트 루트의 Git 제외 `.env.local`을 사용합니다. Android 로컬 출시 래퍼는 별도 빌드 작업공간 `artifacts/b/.env.local`을 읽으므로 같은 공개키를 해당 파일에도 설정합니다. EAS를 사용할 때는 해당 빌드 환경에 설정합니다.
이 값은 앱에 포함되는 공개키입니다. 서비스 계정 JSON, 개인키, 비밀번호를 넣지 않습니다.
공개키 누락 시 Android 구매 버튼은 활성화되지 않으며, 서명 검증 실패 시 권한을 부여하지 않습니다.

코드의 상품 식별자는 `constants/premium.ts`에 있습니다. 다른 ID로 등록한다면 코드와 콘솔을 함께 맞춰야 합니다.
미국 가격과 지역별 가격은 각 스토어 콘솔에서 관리합니다. 앱은 표시된 현지 가격과 통화를 유지하며 USD의 달러 표시는 US$로 구분합니다. [App Store Connect 가격 설정](https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase/), [Google Play 구매 옵션](https://support.google.com/googleplay/android-developer/answer/16430488?hl=en)

## 3. 네이티브 구성

- `app.json`: `expo-iap`, `./plugins/withPremiumIap` 추가.
- 커스텀 플러그인: Android 결제 앱 전환/복귀용 `singleTop`, 최소 target/compile SDK 36 설정, iOS IAP capability.
- `modules/purchase-verification`: Android의 RSA 구매 서명과 서명된 package/product/token/완료 상태를 검증하는 로컬 Expo 모듈.
- Expo SDK 58과 React Native 0.88에서 Android 출시 빌드 및 Shop의 테스트 구매·복원을 확인했습니다. Expo가 `expo-modules-core`의 호환 버전을 관리합니다.
- 설치 패키지 `openiap-versions.json`은 Google SDK 3.5.0 / Apple SDK 3.4.0을 지정합니다.
- Google SDK 3.5.0의 공개 POM은 Play Billing **9.1.0**을 지정합니다.
- SDK 55로 생성한 2026-09-08 APK `1cfedbc5`에서 compileSdk/targetSdk 36/36, BILLING 권한 및 Billing 9.1.0(manifest + billing.properties), 신규 네이티브 모듈을 확인했습니다. 기존 인증서 서명 검증 통과. Gradle 컴파일은 통과했지만 전체 의존성 트리의 별도 출력·실기기 네이티브 동작·AAB는 미검증입니다. EAS Expo Doctor는 직접 설치한 expo-modules-core 항목 1건 실패(19/20 통과)이며 npm moderate 19건이 남습니다.

구매 검증 모듈은 Expo Go 밖의 네이티브 빌드에서 사용합니다. Android 로컬 빌드는 `scripts/build-local-apk.ps1`을 통해 생성된 `artifacts/b/android` 구성을 사용합니다.
원본 서명 정체성을 보존하고 실제 스토어 설치/구매 검증에 debug 서명을 사용하지 않습니다.

## 4. 검증 범위와 제한

iOS는 StoreKit의 서명 검증 및 현재 구매권을 확인합니다.
Android는 Play가 반환한 현재 보유 내역과 RSA 서명을 확인합니다.
별도 서버 검증, 실시간 서버 알림, 플랫폼 간 계정 동기화는 구현하지 않습니다.
로컬 서명 검증은 변조된 기기의 앱 자체 우회를 막는 서버 검증과 동일하지 않습니다.
환불/취소 상태는 스토어가 앱에 반영하는 시점 이후 다시 조회하여 적용되므로 서버 알림 수준의 즉시 회수를 보장하지 않습니다.

영구 권한은 임의의 로컬 boolean이나 광고 보상 만료일에 저장하지 않습니다.
재설치 후 같은 **해당 스토어 계정**으로 구매 복원합니다.
Apple 구매가 Google 계정에 자동 이전되거나 그 반대로 이전되는 기능은 없습니다.
스토어 조회 실패 시 확인 불가 상태가 되며 영구 기능을 임의로 열지 않습니다.

실기기 검증은 별도로 요청받은 후 다음을 확인합니다.

1. iOS Sandbox/TestFlight, Android 내부 테스트 + 라이선스 테스터에서 현지화 가격/결제창.
2. 정상 구매 후 모든 잠금 기능 해제, 배너 제거, 광고 없이 기능 사용.
3. 취소/승인 대기/결제 실패/서명 실패 시 미해제, 중복 탭 시 결제창 1개.
4. 앱 종료·재실행, 같은 스토어 계정으로 재설치·복원, 복원할 내역 없음.
5. 거래 완료 처리 실패 후 재실행/수동 복원으로 기존 거래 처리, 추가 결제 없음.
6. 환불·취소 후 스토어 반영 및 재조회, 다른 스토어 계정, 네트워크 실패.
7. 무료 사용자의 기존 2시간 광고 보상, 프리셋, 화면 전환 유지.
8. Android 3버튼/제스처 모드에서 결제 및 광고 복귀의 시스템 UI 상태.
9. release 의존성/manifest/서명/Billing 메타데이터 확인. 이 문서는 빌드/업로드 승인을 대신하지 않습니다.

## 공식 참고

- [Expo IAP 안내](https://docs.expo.dev/guides/in-app-purchases/)
- [OpenIAP 소스](https://github.com/hyodotdev/openiap/tree/main/libraries/expo-iap)
- [Apple 구매 복원](https://developer.apple.com/documentation/storekit/restoring-purchased-products)
- [Play Billing 지원 기한](https://developer.android.com/google/play/billing/deprecation-faq)
- [Play Billing 릴리스 노트](https://developer.android.com/google/play/billing/release-notes)
- [사용 SDK의 공개 Maven 의존성](https://repo.maven.apache.org/maven2/io/github/hyochan/openiap/openiap-google/3.5.0/openiap-google-3.5.0.pom)

## Shop 화면의 배치

### 구매 확인 후 Shop 화면 — 2026-11-18

영구 구매가 확인되면 구매 직후와 Shop 재진입 시 같은 화면을 표시합니다. LED POP PRO 제목 아래에 구매 완료 설명이 나타나고, 가격과 Buy 자리에는 체크 아이콘과 앱의 7개 언어로 현지화된 구매 완료 상태가 표시됩니다. 영어 표기는 Purchased입니다. 혜택 목록과 하단 로고·약관·개인정보 링크를 표시하며, 상태 아래에서 이전 구매를 복원할 수 있습니다. 이 변경은 소스에 반영됐으며 11월 17일 테스트 APK에는 포함되지 않습니다.

### 복원 버튼 위치 조정 — 2026-11-18

오른쪽 위의 구매 복원 버튼을 제거하고, 가격 → Buy → 이전 구매 복원 순서로 배치했습니다. 복원 버튼은 하나만 표시하며 기존 복원 함수와 처리 중 비활성화 조건을 유지합니다. 짧은 화면의 스크롤 배치에도 동일하게 적용됩니다. 이번 위치 조정은 소스에 반영했습니다. 11월 18일 린트·자동 검사 결과는 README에 기록했으며 새 UI의 실기기 화면 검증은 남아 있습니다.

### 참고 이미지 기반 Shop 디자인 — 2026-11-17

회색 카드 중앙 정렬을 밝은 배경의 왼쪽 정렬 본문으로 바꿨습니다. LED POP PRO 제목, 기존 Shop 설명과 광고 영구 제거 문구를 유지하고 앱의 기존 Pro 혜택 5개를 주황색 체크·얇은 구분선 목록으로 재배치했습니다. 첨부 이미지의 상품명·가격·혜택 문구는 복사하지 않았습니다.

상단과 하단에 기존 구매 복원 동작을 연결하고, 하단에는 스토어가 조회한 현지 가격과 주황색 구매 버튼을 배치했습니다. SUNNY 로고·약관·개인정보 링크는 설정과 동일한 주소를 공유합니다. 일반 높이에서는 구매 영역·푸터를 아래에 고정하고, 사용 가능한 높이가 600 미만인 화면에서는 본문과 함께 스크롤해 모든 컨트롤에 접근할 수 있게 했습니다. 공통 Back 아이콘·헤더 여백, 안전 영역과 기존 구매·오류·대기·보유 상태는 유지합니다.

디자인 적용 시점에는 소스만 변경했고 이후 승인된 ARM64 테스트 APK `20261117-212140-85edd896`에 포함했습니다. 해당 파일은 공식 테스트 광고·일반 UMP·1분 QA 보상 설정이며 기존 보상 팝업 문구와 영구 구매 의미는 유지합니다. 정적 산출물 검사를 통과했지만 새 디자인의 실기기 시각·구매 검증은 하지 않았습니다. 앞 절의 구매 검증 APK와 기존 AAB에는 이 디자인이 포함되지 않습니다.

확인된 결제 대기는 상품 ID만 기기에 저장해 재시작 후 복원합니다. Android는 성공한 구매 내역 조회로 대기 상태를 다시 조정하고 iOS는 현재 권한 목록이 비어 있어도 미결 승인 요청을 유지합니다. 조회·복원 오류가 나면 실행 중인 앱에서 마지막으로 확인한 권한을 보존합니다. 구매 직전에는 구매 권한과 상점·가격·통화·구매 옵션을 다시 확인하며, 견적이 달라지면 갱신된 가격을 표시하고 다시 눌러야 결제창을 엽니다. 실제 결제와 환불·권한 회수는 Android 테스트 거래 검증과 별도입니다.

`app/shop.tsx`는 Pro 혜택 목록과 가격·구매·복원 버튼을 표시합니다. 가격과 구매 상태에 필요한 높이를 확보하고 짧은 화면에서도 스크롤로 복원에 접근할 수 있습니다. Shop 진입과 앱 복귀 때 스토어 조회를 갱신하며, 결제 직전 견적이 달라졌다면 갱신된 가격을 보여준 뒤 사용자의 다음 탭을 기다립니다.

## Upgrade to Pro 노출 중단 (2026-09-08)

당시 사용자 요청으로 설정의 Upgrade to Pro 항목과 `/premium` 라우트를 제거하고 화면을 보관했습니다. 2026-11-17 사용자 요청으로 설정에 Shop을 다시 열고 `/shop`을 연결했습니다.


## 광고·Shop 비교 후 보완 — 2026-11-17

Wisdom Qclock의 광고 요청 수명 관리, Simply Multi Timer의 구매 이벤트 처리, Watermelon Checker의 결제 전 화면 유효성 확인을 참고했습니다. 각 앱의 다른 SDK를 교체·추가하지 않고 LED POP의 기존 `expo-iap` 경계에 적용했습니다.

- Shop 포커스를 잃으면 이전 결제 전 확인은 결제창을 열 수 없습니다. Shop을 다시 열었더라도 이전 진입에서 시작한 요청은 폐기하고 새 탭이 필요합니다. 이미 시작한 스토어 거래의 검증·완료 처리는 화면과 독립적으로 계속합니다.
- 구매 오류 리스너는 대기뿐 아니라 취소·이미 보유·일반 오류도 처리합니다. 상품 ID가 빠진 오류는 이 앱의 단일 구매 요청을 실제 실행 중일 때만 연결합니다. 관계없는 상품 이벤트는 무시합니다.
- 비동기 오류를 표시해도 진행 중인 구매·복원 잠금은 조기에 풀지 않습니다. 오류 처리도 기존 구매 작업 큐를 사용하며, 이미 검증한 영구 권한을 늦은 오류로 덮어쓰지 않습니다. 결제 대기 마커는 권한을 부여하지 않습니다.
- 화면의 새 안내 문구나 상품·가격·권한 기준은 추가하지 않았습니다. 기존 오류·취소·대기 문구와 스토어 가격을 사용합니다.

검증: `node --test scripts/qa-ad-state.cjs scripts/qa-premium-state.cjs` 40개 통과. 변경한 광고·Shop 소스와 새 구매 테스트의 ESLint 통과. 구매 테스트는 SDK 경계를 모의한 상태 검증이며 실결제·복원의 새 실기기 검증을 뜻하지 않습니다. 이 수정 후 APK/AAB/iOS 빌드·스토어 업로드는 하지 않았습니다.
