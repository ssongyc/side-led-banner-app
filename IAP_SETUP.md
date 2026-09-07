# LED POP Premium IAP 설정

## 현재 구현과 상태

외부 결제 관리 서비스 없이 `expo-iap 5.5.1`로 Apple StoreKit과 Google Play Billing에 직접 연결합니다.
Premium은 **1회 구매하는 영구 비소모성 상품**입니다. 구독이나 소모성 상품이 아닙니다.

- 스토어에서 실제 현지화 가격을 조회하고 해당 상품/구매 옵션으로 결제합니다.
- 구매 완료 + 검증 + 거래 완료 처리 후 영구 Pro 권한을 부여합니다.
- 구매 복원, 시작/일반 앱 복귀 시 보유 내역 조회, 거래 업데이트를 처리합니다.
- 기존 광고 보상 2시간 Pro와 구매 권한은 별개입니다. 보상 시간이 끝나도 영구 구매자는 잠기지 않습니다.
- 영구 구매자는 프리셋 2~5, 잠긴 텍스트/배경 색상, 글자 크기, Pixel/Gradient/Glow 및 잠긴 배경 효과를 포함한 기존 모든 Pro 기능을 사용할 수 있습니다.
- 영구 구매자에게 배너를 마운트하지 않고 보상 광고 로딩·예약·표시 및 보상 팝업을 차단합니다.
- 구매 여부가 아직 확인되지 않으면 광고를 요청하지 않습니다. 조회 실패를 무료 사용자/구매 성공으로 바꾸지 않습니다.
- 구매 취소, 승인 대기, 조회/검증 실패, 복원할 구매 없음은 각각 표시합니다. 자동 구매 재시도는 없습니다.

**현재 스토어 상품은 미등록이고 Google Play 공개키도 미설정입니다. 실제 결제 개통이나 실기기 동작이 검증된 상태가 아닙니다.**
이번 변경은 소스·문서 업데이트입니다. 컴파일, lint, 테스트, 스토어 업로드 및 콘솔 변경은 실행하지 않았습니다. 기존 APK에는 새 IAP 코드가 포함되어 있지 않습니다.

## 변경 파일

| 파일 / 디렉터리 | 역할 |
| --- | --- |
| `app/premium.tsx` | 실제 가격, 구매·복원 버튼 및 결과 상태 |
| `utils/ApiClient.ts` | 스토어 연결, 거래 직렬 처리, 구매·복원·검증 |
| `contexts/premiumContext.tsx` | 구매 상태 구독, 시작·앱 복귀 시 확인 |
| `contexts/settingsContext.tsx` | 영구 구매와 기존 보상 Pro를 모든 잠금 조건에 연결 |
| `components/RootLayout.tsx`, `app/settings.tsx`, `app/index.tsx`, `hooks/useRewardedAd*` | 구매자의 광고 요청·표시·보상 팝업 차단 |
| `constants/premium.ts`, `.env.example` | 스토어 상품 ID 및 Google Play 공개키 설정 |
| `language/premiumLabels.ts`, `constants/settingsStyles.tsx` | 7개 언어의 상태 문구와 긴 문구를 수용하는 가격 영역 |
| `modules/purchase-verification/` | Android 구매 서명·앱·상품·토큰·완료 상태 검증 |
| `plugins/withPremiumIap.js`, `app.json` | 네이티브 IAP 및 플랫폼 설정 |
| `package.json`, `package-lock.json` | 직접 IAP 의존성과 고정 버전 |
| `README.md`, `IAP_SETUP.md` | 현재 구현, 기존 빌드와의 구분, 스토어 설정 및 미검증 범위 |

## 1. App Store Connect

앱 식별자: `com.minkyokim.sideledbannerapp`

| 항목 | 설정 |
| --- | --- |
| 상품 유형 | Non-Consumable (비소모성) |
| Product ID | `com.minkyokim.sideledbannerapp.premium` |
| 표시 이름 | LED POP Premium |
| 설명 | 모든 Pro 기능 영구 해제, 광고 제거 |
| 가격 / 판매 지역 | 콘솔에서 직접 결정 및 설정 |

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
| 구매 옵션 가격 / 판매 지역 | 콘솔에서 직접 결정 및 활성화 |

상품과 `buy` 구매 옵션을 활성화합니다. 이 UI는 기본 영구 구매 옵션 하나를 사용하며
별도 할인 offer, 대여, 사전 구매를 자동 선택하지 않습니다.
표시한 가격과 동일한 옵션의 offer token을 결제 요청에 전달합니다.
앱은 거래를 **acknowledge**하고 **consume하지 않습니다**.

Play Console의 Monetization setup / Licensing에서 이 앱의 Base64 RSA **공개키**를 복사해 설정합니다.

```dotenv
EXPO_PUBLIC_GOOGLE_PLAY_LICENSE_KEY=콘솔에서_복사한_Base64_RSA_공개키
```

로컬 Metro는 로컬 `.env`, EAS 빌드는 해당 빌드 환경에 설정합니다.
이 값은 앱에 포함되는 공개키입니다. 서비스 계정 JSON, 개인키, 비밀번호를 넣지 않습니다.
공개키 누락 시 Android 구매 버튼은 활성화되지 않으며, 서명 검증 실패 시 권한을 부여하지 않습니다.

코드의 상품 식별자는 `constants/premium.ts`에 있습니다. 다른 ID로 등록한다면 코드와 콘솔을 함께 맞춰야 합니다.
스크린샷의 $6.99 CAD는 가격 설정 지시로 간주하지 않았으며, 코드에 결제 가격을 고정하지 않았습니다.

## 3. 네이티브 구성

- `app.json`: `expo-iap`, `./plugins/withPremiumIap` 추가.
- 커스텀 플러그인: Android 결제 앱 전환/복귀용 `singleTop`, 최소 target/compile SDK 36 설정, iOS IAP capability.
- `modules/purchase-verification`: Android의 RSA 구매 서명과 서명된 package/product/token/완료 상태를 검증하는 로컬 Expo 모듈.
- `expo-modules-core 55.0.26`: 프로젝트 Expo 55와 동일한 명시적 버전.
- 설치 패키지 `openiap-versions.json`은 Google SDK 3.5.0 / Apple SDK 3.4.0을 지정합니다.
- Google SDK 3.5.0의 공개 POM은 Play Billing **9.1.0**을 지정합니다.
- 실제 Gradle 의존성 해석, 병합 manifest, target/compile SDK, APK/AAB Billing 메타데이터 및 네이티브 호환성은 **빌드 미실행으로 미검증**입니다.

새 네이티브 모듈이 있으므로 기존 APK나 Expo Go로는 동작하지 않습니다.
다음에 네이티브 빌드를 승인받아 진행할 때 이 설정으로 네이티브 프로젝트를 갱신해야 합니다.
기존 `android/`는 이전에 생성된 출력이며 이번 작업에서는 재생성하지 않았습니다.
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
