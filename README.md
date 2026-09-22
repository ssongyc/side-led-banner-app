# LED POP (LED Banner App)

입력한 텍스트를 한 줄 또는 여러 줄 LED 배너로 표시하는 Expo/React Native 앱입니다. 텍스트·배경·움직임·Pixel/Gradient/Glow 효과와 프리셋을 지원하며 Android와 iOS를 대상으로 합니다.

- 메인 저장소: [ssongyc/side-led-banner-app](https://github.com/ssongyc/side-led-banner-app)
- 메인 작업 폴더: `C:/dev/Led Banner`
- 작업 지침: [AGENTS.md](AGENTS.md), 서명·빌드: [SIGNING_POLICY.md](docs/SIGNING_POLICY.md), 이전 기록: [BUILD_HISTORY.md](docs/BUILD_HISTORY.md), Android 빌드 최적화: [ANDROID_BUILD_OPTIMIZATION.md](docs/ANDROID_BUILD_OPTIMIZATION.md)
- 컴파일·린트·테스트·커밋·푸시·배포는 사용자가 요청할 때만 실행합니다. 이 문서의 명령과 절차 자체는 실행 승인이 아닙니다.

## 현재 문서의 기준

현재 소스 버전은 **1.1.3 (app.json의 Android versionCode 31)**이며 Settings는 Expo 버전을 읽어 **V1.1.3**을 표시합니다. 소스 설정, 로컬 빌드의 버전 코드, 실제 스토어 배포 버전은 별개입니다.

- 최근 기록된 로컬 APK/AAB는 **1.1.2 (30)**, clean main `89a54ffdb3c7291fe5833895b78295ab6f8290b7`, 실행 ID `20260922-202155-81159740`입니다. 30은 빌드 시 명시한 override입니다. 기존 서명·production AdMob으로 AAB를 한 번 빌드하고 동일 AAB에서 universal APK를 생성했습니다. 전체 래퍼 시간은 298.42초(약 4분 58초), Gradle은 3분 57초이며 73 executed / 1086 up-to-date입니다. 의존성 설치와 네이티브 생성은 생략하고 기존 네이티브 출력과 캐시를 재사용했습니다. 정적 검사 421개가 모두 통과했습니다. [실행 기록](artifacts/apk-runs/20260922-202155-81159740/build-result.json)과 [단계별 시간](artifacts/apk-runs/20260922-202155-81159740/stage-timings.json)을 참고하세요. 표지판 투명 프레임, Pixelation Mix 선택 표시와 Play 사진 여백 채움이 포함됩니다. 이 산출물의 실기기 QA와 Play 업로드는 미실행입니다.
- `5cf3182`에는 방향별 배너 재사용, 광고 진단·문구 정리, 스크롤의 미지원 JS 속성 제거, 검증 하네스 갱신, Android 캐시·작업 이력 재사용 개선이 포함되었습니다. 당시 타입 검사와 상태 검증 **26개가 통과**했습니다. 최신 Android APK/AAB의 생성·로컬 검증 범위는 위 실행 기록을 따릅니다. 이전 설치 APK에서는 Android 실기기의 세 탭 스크롤·화면 복귀·테스트 광고 보상 흐름을 확인했으며 최신 산출물의 재검증을 뜻하지 않습니다. iOS 빌드·실기기 동작은 미검증이며, 이번 증분 시간은 캐시 복원 변경만의 효과를 따로 측정한 결과가 아닙니다.
- V1.1.2에는 iOS Play 종료의 상태 표시줄 선복원·네이티브 안전 영역·페이드 제거와 어두운 상태 표시줄, Amplitude 초기화·사용자 식별 후 새 앱 실행당 한 번 기록하는 `App Opened`가 반영되어 있습니다. [UI 기록](docs/UI_INTERACTION_1.0.9_27.md)과 [현재 광고 동작·검증 제한](docs/ADVERTISING.md)을 참고하세요.
- V1.1.3 TestFlight 준비에서는 production iOS의 임의 HTTP 허용을 차단하고, 사용하지 않는 카메라·마이크·ATT 선언과 ATT 패키지를 제거했습니다. Expo SDK 57 호환 패치 버전으로 동기화했으며 `expo install --check`와 production config introspection은 통과했습니다. 사용자가 제공한 Xcode 오류 화면에서는 rewarded 패치가 설치된 SDK에 없는 `GADResponseInfo.adNetworkClassName`을 참조해 실패했고, 현재 공식 경로인 `loadedAdNetworkResponseInfo.adNetworkClassName`과 Google 제공 상수를 사용하도록 패치 원본을 수정했습니다. 수정 후 실제 Xcode/EAS 빌드·CocoaPods·서명·IPA·TestFlight 처리는 미검증입니다. [iOS 감사 기록](docs/SIGNING_POLICY.md#ios-testflight-source-audit--2026-09-22)을 참고하세요.
- Galaxy SM-M336K(Android 16)의 당시 설치 APK에서 Test Ad 재생·닫기, 보상 후 잠금 해제·재시작 유지와 이전 보상의 2시간 초과 후 재잠금을 확인했습니다. 정확한 만료 경계 순간은 측정하지 않았습니다. 화면·성능·로그 및 검증 한계는 [9월 22일 QA 기록](docs/QA_20260910.md#2026-09-22--최신-v112-30-설치-apk-최종-qa)에 정리했습니다. 접근성 수정은 소스에만 반영됐으며 새 APK의 TalkBack 검증이 필요합니다. iOS, 구매·복원, 광고 조기 종료, production 공급률·수익 및 Play 처리·버전 코드 사용 가능 여부는 미검증입니다. 날짜별 단락과 커밋·푸시 미실행 표기는 각 작업 당시의 역사적 기록입니다.

## 과거 소스 변경 이력 — 2026-09-09~10

- 배너: 최초 요청·실패 후 6초·다시 실패 후 12초의 3회가 모두 실패하면 안내를 10초 표시합니다. 안내 종료 후 60초 뒤에 동일한 3회 주기를 딱 한 번 추가합니다. 추가 주기도 실패하면 안내를 10초 표시하고 중단합니다. 화면 해제 시 타이머를 취소하며 추가 주기는 배너 로드 실패에만 적용합니다. 현재 로드 재시도 간격은 배너·리워드·SDK 초기화 모두 6초·12초이며, 기존 24번 산출물의 3초·6초 간격과 구분합니다.
- 보상 모달과 개발용 CSV 시트: 닫기·이미지·본문·안내·버튼·여백을 하나의 세로 스크롤 영역에 포함했습니다. Safe Area 안에서 확대하며 드래그 시 버튼 실행을 억제합니다. 상태별 긴 문구 예약과 기존 광고 표시 순서를 유지합니다.
- Settings 하단: Sunny 로고/Innovation Lab은 왼쪽, Terms/Privacy는 오른쪽 정렬. 기존 좌우 20px 여백과 크기를 유지합니다.
- 빌드 기록: 1.0.6 (24) 산출물 검증 보고서, 버전 코드, 소스 입력 기록과 Gradle/Ninja 동시 작업 제한을 정리했습니다. 기본 빌드는 현재 작업 소스를 사용하며, 지정 커밋 빌드는 명시적인 선택 기능입니다.
- 원격 main의 Skia.PathBuilder 변경 및 __DEV__ 조건의 Pro 토글을 함께 보존했습니다. 기존 24번 산출물의 디버그 코드 제외 검증은 그 산출물에만 적용됩니다.
- 이번 전달에서는 컴파일·린트·테스트·실기기 검증·새 APK/AAB 생성·스토어 업로드를 실행하지 않았습니다. 별도 RootLayout 스플래시 수정은 로컬에 보존하고 커밋에서 제외합니다.

## 과거 APK·AAB — 1.0.6 (24), 2026-09-09

**compile-ok**: bd567b0 + 광고 모듈 버전 설정 수정. 실제 AdMob production 프로필과 기존 서명으로 빌드했습니다. 최종 재개 Gradle 13m 46s이며 앞선 네이티브 컴파일 시간은 별도입니다.

- APK/AAB는 당시 로컬 `artifacts/releases/LEDPOP-1.0.6-24-bd567b0/`에 생성됐지만 현재 작업 폴더에는 보존되어 있지 않습니다. [검증·해시·제한 보고서](docs/ANDROID_RELEASE_1.0.6_24.md)는 유지합니다.
- SDK 36, Billing 9.1.0, 4개 ABI/16KB 정렬, 기존 인증서, AAB 동일 빌드 R8 매핑 검증 통과. 실제 광고 설정·네이티브 모듈과 아이콘 13개 포함, 웹 진단·Pro 화면 제외를 확인했습니다.
- 별도 스플래시 수정은 보존·제외했습니다. 새 APK 실기기 QA·광고 노출·Play 제출·versionCode 중복·Play 매핑 등록은 미검증입니다. 빌드 중 필요한 추가 수정과 검증 문서는 후속 소스 전달에 포함합니다.

## 이전 생성 APK·AAB — 1.0.6 (23), 2026-09-09

**compile-ok**: 확정 앱 소스 e58e9aa, 최종 Gradle 12m 40s (120 executed / 1047 up-to-date). 기존 인증서, SDK 36, Billing 9.1.0, 4개 ABI, 16KB 정렬 및 AAB 동일 빌드 R8 8.13.23 매핑 검증을 통과했습니다.

- APK/AAB는 당시 로컬 `artifacts/releases/LEDPOP-1.0.6-23-e58e9aa/`에 생성됐지만 현재 작업 폴더에는 보존되어 있지 않습니다. [검증·해시·제한 보고서](docs/ANDROID_RELEASE_1.0.6_23.md)는 유지합니다.
- 별도 RootLayout 스플래시 수정은 사용자 선택에 따라 보존하되 빌드에서 제외했습니다. 성능 후속 수정과 Pro 화면 제외는 포함됩니다.
- 새 최적화 APK 실기기 QA·Play 업로드/검수·versionCode 중복 확인·Play 매핑 등록은 미실행입니다. 외부 Google Play 광고 종료 창의 내비게이션 바 노출은 미해결입니다.

## 85a61d6 → edaf82b 변경 비교 (과거 기록)

아래 표는 두 과거 빌드 시점의 비교입니다. 현재 소스 버전은 상단 「현재 문서의 기준」을, 의존성 선언은 「주요 라이브러리」를 참고하세요. 소스 버전·APK의 versionCode·스토어 배포 버전은 별개입니다.

| 항목 | edaf82b 생성 전 소스 당시 상태 | 85a61d6 APK |
| --- | --- | --- |
| Expo 57 및 Kotlin 2.3.20 빌드 수정 | 반영 | 포함·컴파일 완료 |
| HELLO / 위치 안내 / TODAY IS 배경 3종 | 반영 | PNG 6개 포함 확인 |
| 키보드 이동 화살표 숨김·undo/redo 아이콘 변경 | 반영 | 번들 포함 확인 |
| Upgrade to Pro 메뉴·라우트 제외 | 적용 | 번들 제외 확인 |
| decibella2 추가·decibella 소문자 표기 | 반영 | 미포함 |
| 배너 실패 문구 10초 후 숨김 | 반영 | 미포함 |
| 리워드 최종 실패 유지·재생 실패 수동 복구·Preparing Ad... | 반영 | 미포함 |
| 미사용 번역 파일·텍스트 함수 정리 | 반영 | 미포함 |
| 배경 효과의 공백·자간 및 문자별 폰트 폭 수정 | 소스 반영·실행 검증 전 | 미포함 |
| EffectSection의 텍스트·그라데이션·배경 UI 분리 | 소스 반영·실행 검증 전 | 미포함 |
| 리워드 상태 정리·APK 자동 준비·캐시 사용 | 소스 반영 | 미포함·자동화 실행 및 시간 미측정 |

위 표는 과거 85a61d6 APK와의 비교 기록입니다. 아래 edaf82b APK에는 표의 소스 변경이 포함됩니다. 제출용 빌드의 소스·검증 결과는 별도 릴리스 기록을 기준으로 확인합니다. compile-ok는 각 빌드에만 적용됩니다. Expo 57 Android 실기기 UI·광고는 아래 QA 보고서 범위에서 확인했으며, 결제 및 iOS 빌드는 미검증입니다. 과거 SDK 55 기기 확인 결과를 현재 버전의 결과로 간주하지 않습니다.

SM-M336K(Android 16)에서 미리보기·전체 화면 성능 및 주요 기능 QA를 수행했습니다. [실측·QA 보고서](docs/QA_PERFORMANCE_20260908.md)를 참고하세요. 숨은 미리보기 중복 프레임 생성과 광고 종료 Google Play 시트의 시스템 바 노출을 확인했습니다. 후속 소스에는 숨은 화면 애니메이션 중단·진행 상태 보존과 Android 호스트 복귀 시 바 숨김 재적용을 반영했습니다. 새 APK 비교 측정은 미실행이며 외부 Google Play 창의 바 노출은 미해결입니다. React 렌더 횟수는 미측정입니다. Amplitude는 빌드 폴더의 키 일치만 확인했으며 실제 이벤트 수신은 미확인입니다. 자세한 상태는 [PERFORMANCE_BASELINE.md](docs/PERFORMANCE_BASELINE.md)에 기록했습니다.

## 이전 내부 APK — edaf82b 기준 (2026-09-08)

- **compile-ok**: BUILD SUCCESSFUL in **7m 5s**, 1188 tasks 중 83 executed / 1105 up-to-date. 이전 전체 빌드 40m 57s 대비 약 83% 단축. Gradle 구간 비교이며 준비·검증 시간은 별도입니다.
- APK는 당시 로컬 `artifacts/LedPop-V1.0.6-edaf82b.apk`에 생성됐지만 현재 작업 폴더에는 보존되어 있지 않습니다. 기록 크기 286783382 bytes, SHA-256 `126bbddd5bbb4a91b8022ba1f654241e1a391557bee700f703306e4fa3696aff`.
- 앱 소스 main edaf82b22d0d97a01e879eec9dc027d043f811c6. 빌드 준비 스크립트의 SDK 메타데이터 경로만 로컬에서 수정했습니다. 존재하지 않는 SDK 루트 packages.xml 대신 설치 패키지별 source.properties를 읽습니다. 해당 수정은 이후 675f492에 커밋했으며 앱 기능 변경은 없습니다.
- 의존성 설치·네이티브 재생성 없이 고정 artifacts/b 재사용. 내부 버전 1.0.6 / versionCode 22, package com.minkyokim.sideledbannerapp, minSdk 24 / compileSdk 36 / targetSdk 36, ARM64·ARMv7·x86·x86_64 확인.
- 기존 인증서 SHA-256 730173560958735BF237CA84BA4F35BBE76A6734986929EB65F6CED63D3FD893와 APK v2 서명 일치, zipalign -P 16 통과. debuggable·CAMERA·RECORD_AUDIO 없음. ZIP 정렬 검증은 모든 기기의 실행 검증을 의미하지 않습니다.
- 매니페스트와 billing.properties에서 Billing 9.1.0 확인. AdMob App ID와 production 광고 Unit ID, IAP·구매 검증·리워드 모듈 포함 확인. [공식 Billing 지원 일정](https://developer.android.com/google/play/billing/deprecation-faq)과 [릴리스 노트](https://developer.android.com/google/play/billing/release-notes) 재확인.
- 생성된 Hermes 번들과 APK 번들 해시 일치. 소스맵에서 공백·자간 수정, 분리된 EffectSection, Sunny 목록과 리워드 변경 포함 및 Pro 화면 제외 확인.
- 전체 1575줄 로그를 검토했습니다. 빌드 내 lintVitalRelease 완료. 남은 경고: Gradle 10 폐기 API, SDK XML 버전/명령줄 도구 설치 위치, NODE_ENV 및 출력 색상 설정, Expo 플러그인을 사용하는 AdMob의 설정 위치 안내. 실제 APK AdMob 메타데이터는 정상 포함입니다.
- 기존 내부 빌드의 R8 비활성 설정 유지; 앱 난독화 mapping은 적용 대상이 아닙니다. AAB·Play 업로드는 실행하지 않았습니다. 빌드 후 Android 실기기 공백/자간·광고·성능 확인 범위와 미해결 사항은 아래 QA 보고서에 기록했습니다.
- 로그·소스 입력 해시·APK는 artifacts/apk-runs의 이번 실행 기록에, 독립 검증 결과는 artifacts/apk-edaf82b-*에 보존합니다.

## 이전 생성 APK — 85a61d6 기준

- compile-ok: C:/dev/Led Banner/artifacts/b에서 BUILD SUCCESSFUL in 40m 57s, 1188 actionable tasks 모두 실행. 전체 2015줄 로그를 보존하고 오류 및 경고를 검토했습니다.
- APK는 당시 로컬 `artifacts/LedPop-V1.0.6-Expo57-85a61d6.apk`에 생성됐지만 현재 작업 폴더에는 보존되어 있지 않습니다. 기록 크기 286,760,890 bytes, SHA-256: 7FC942663CB4F9D75B446730DED073CEB04C460337490935FC7CDB5D95829D65.
- 앱 소스: main 85a61d61428ed01114c97e0839f3e5f243d86818. 내부 설치용 versionName 1.0.6 / versionCode 22 유지. 이번 빌드 경로 수정은 빌드 래퍼에만 적용했고 실행한 래퍼를 artifacts/apk-85a61d6-build-wrapper.ps1로 보존했습니다.
- 실제 APK 검증: 기존 인증서 SHA-256 730173560958735BF237CA84BA4F35BBE76A6734986929EB65F6CED63D3FD893와 v2 서명 일치, package com.minkyokim.sideledbannerapp, minSdk 24, compileSdk/targetSdk 36/36, ARM64/ARMv7/x86/x86_64, ZIP 16KB 정렬 통과. debuggable·CAMERA·RECORD_AUDIO 선언 없음.
- 실제 Metro 소스맵에서 Pro 화면 및 설정 진입점 제외, showArrows=false와 undo/redo 아이콘 변경 포함을 확인했습니다. 생성된 Hermes 번들과 APK 내 번들 해시도 일치합니다. 소스맵 및 기계 판독 결과는 빌드 폴더와 artifacts/apk-85a61d6-bundle-checks.json에 보존합니다.
- 구매 검증·IAP·리워드 광고 네이티브 모듈, 기존 Premium 상품, immersive 옵션과 배경 PNG 6개 포함 확인. Billing은 manifest 및 billing.properties 모두 9.1.0. 실제 광고 설정은 기존 production App ID 및 Unit ID 유지.
- 긴 실제 경로에서 Ninja 재생성 반복으로 실패했고, 임시 드라이브 연결도 Expo의 실제 경로 재해석 때문에 해결책이 되지 않았습니다. 실제 빌드 폴더를 메인 내부 artifacts/b로 줄이고 생성된 경로 캐시만 초기화한 후 성공했습니다. 임시 드라이브 연결은 남아 있지 않습니다.
- 빌드에 포함된 lintVitalRelease 통과. 별도 테스트 및 실기기 UI·광고·결제 검증은 미실행입니다. R8은 기존 내부 빌드 설정대로 비활성으로 앱 mapping 없음; AAB 생성·Play 등록은 미실행이고 난독화 실행 검증은 하지 않았으며 스토어 준비 완료를 의미하지 않습니다.
- 남은 경고: 서드파티 deprecated API와 Kotlin 향후 호환성, Gradle 10 비호환, JVM metaspace, 중복 Kotlin daemon 및 매니페스트 replace/remove 대상 없음. 광고 SDK의 android_app_id 안내는 Expo 플러그인 경로에서 발생하며 APK의 실제 AdMob App ID를 별도로 확인했습니다. npm 설치 보고의 moderate 19건은 유지됩니다.
- 해당 APK 생성 직후에는 문서·래퍼 변경이 미커밋 상태였습니다. 이후 전달 이력과 현재 작업 상태는 Git 기록을 따르며, 이 문장은 현재 미커밋 여부를 뜻하지 않습니다. 당시 스토어 업로드는 실행하지 않았습니다.

## Pro 화면과 구매 권한

Upgrade to Pro 설정 항목과 `/premium` 라우트는 제외했습니다. 구현은 [보관 화면](disabled-features/premium/PremiumScreen.tsx)에 남겨 두고 앱에서 import하지 않습니다. **사용자가 명시적으로 다시 넣어 달라고 요청하기 전까지 모든 빌드에서 제외합니다.** 일반 빌드·SDK 업데이트·출시 요청은 재활성화 승인이 아닙니다.

기존 구매 권한 확인과 영구 구매자의 광고 면제 코드는 유지합니다. IAP 모듈까지 제거한 상태는 아닙니다. Apple StoreKit과 Google Play 직접 IAP 구현 및 설정 절차는 [IAP_SETUP.md](IAP_SETUP.md)를 참고하세요. 상품 등록·Google Play 공개키 설정과 실제 결제·복원 검증은 미완료입니다. 광고 보상의 2시간 Pro는 영구 구매 권한과 별개입니다.

## 광고 동작 — 현재 소스

현재 광고 구현은 큰 적응형 배너, SDK 초기화의 제한된 재시도, test/production 분리, 명시적 웹 진단 모드와 Android Activity 몰입형 처리를 포함합니다. [광고 구현 및 검증 제한](docs/ADVERTISING.md)을 참고하세요. 최신 소스와 로컬 산출물의 차이는 상단 「현재 문서의 기준」을 참고하세요. Android 한 기기에서 Test Ad 배너 표시와 보상 광고 재생·닫기·기능 잠금 해제를 확인했습니다. 전체 기기별 배치, 광고 조기 종료·만료 및 production 공급률·수익 검증을 의미하지 않습니다.


리워드 상태는 슬롯별 `idle/loading/loaded/showing/failed`와 실패 원인 `load/show/open-timeout/expiry/unavailable/initialization/configuration`에서 하나의 UI 스냅샷으로 계산합니다. 중복 전역 실패 플래그는 사용하지 않습니다.

리워드 광고는 무료 사용자 상태가 확인되고 광고 SDK 초기화가 완료되면 선로딩합니다. 준비·로딩·재생 중인 광고가 있으면 같은 로드 주기를 중복 시작하지 않습니다. 광고가 열리면 다음 광고도 선로딩하며, 로드 완료만으로 재생하지 않습니다.

| 상태 | 리워드 버튼 | 고정 안내 영역 |
| --- | --- | --- |
| 준비·로딩·재시도 중 | 비활성, 광고 준비 중… | 광고를 준비하고 있어요. 잠시만 기다려 주세요. |
| 응답이 45초 이상 지연 | 비활성, 광고 준비 중… | 광고 준비가 지연되고 있어요. 응답을 기다리고 있습니다. |
| 준비된 광고 만료 | 비활성, 기존 다시 시도 제공 | 준비된 광고가 만료됐어요. 다시 준비해 주세요. |
| 준비 완료 | 활성, 언어별 Watch Ad 문구 | 문구를 지우고 공간 유지 |
| 로드 3회 실패 | 비활성, 광고 준비 중… | 광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요. |
| 재생 실패 | 비활성, 광고 준비 중… | 광고를 재생하지 못했어요. 다시 시도해 주세요. |

- 로드: 최초 요청 → 실패 후 6초 뒤 두 번째 → 실패 후 12초 뒤 세 번째. 각 요청의 응답 시간은 별도입니다.
- 최종 로드 실패와 재생 실패에는 수동 `다시 시도`를 제공합니다. Settings 화면을 실제로 나갔다가 다시 진입하면 최종 로드 실패 주기를 새로 시작할 수 있으며, 같은 화면에서 모달만 다시 여는 동작은 초기화하지 않습니다. 이 상태는 메모리에서 관리하므로 앱 프로세스 재시작 시 새 세션으로 시작합니다.
- SDK가 재생 실패를 확정하면 기존 다음 슬롯을 현재 슬롯으로 승격하며 진행 중 요청·횟수·예정 시각을 보존합니다. 표시 요청 후 15초 동안 OPENED가 없으면 별도 지연 오류를 알리되, SDK 종료가 확인될 때까지 표시 소유권을 유지합니다. 수동 재시도가 가능한 상태에서 다시 시도하면 새 최대 3회 로드만 수행합니다. 새로 활성화된 Watch Ad를 눌러야 모달 제거 후 다음 프레임에 한 번 표시를 요청합니다. 닫기·바깥 영역·Android 뒤로가기는 닫힘 페이드를 유지하지 않고 카드와 반투명 배경을 같은 커밋에서 즉시 제거합니다.
- 영어 준비 버튼은 `Preparing Ad...`입니다. 상태·버튼 문구는 지원 언어 7개로 제공하며, 가장 긴 문구의 공간을 최초 레이아웃부터 예약합니다. 작은 화면에서는 닫기·이미지·본문·안내·다시 시도·Watch Ad를 포함한 전체 콘텐츠를 하나의 세로 영역으로 스크롤하도록 구현했습니다. 모든 언어·화면 크기에서의 제스처와 레이아웃 검증은 미실행입니다.
- 준비·실패 안내에 토스트·스낵바·추가 팝업을 사용하지 않습니다. 재생 실패 시 기존 리워드 모달에 안내합니다.
- 현재 광고의 EARNED_REWARD를 받으면 2시간 Pro를 즉시 한 번만 부여합니다. CLOSED는 광고 정리와 다음 슬롯 승격에 사용합니다. 실패·시간 초과만으로 보상을 만들지 않습니다. 현재 네이티브 구현은 Google 어댑터 응답만 재생 대상으로 허용하고 보상 이벤트가 종료보다 먼저 오는 계약에 따라 CLOSED에서 리소스를 정리합니다. 종료가 확인되지 않은 표시 요청은 진짜 SDK 결과를 기다립니다.
- 네이티브 배너는 최초 요청과 실패 후 6초·12초 재시도를 사용합니다. 3회 실패 안내를 10초 표시한 뒤 60초 더 기다려 동일한 주기를 한 번만 추가합니다. 추가 주기도 실패하면 안내를 10초 표시하고 중단합니다. 앱 루트의 배너 호스트가 네이티브 요청을 유지하고 Settings는 자리와 표시 여부를 연결합니다. 화면 이탈·백그라운드에서는 새 앱 요청과 재시도 타이머를 멈추되 기존 요청·결과·시도 횟수·마감 시각을 보존합니다. 재진입은 같은 광고 또는 남은 대기를 이어가며 성공·실패 예산을 초기화하지 않습니다. AdMob 콘솔의 Android/iOS 배너 자동 새로고침은 Disabled로 저장·재확인했습니다. 실제 기기의 숨김·재표시와 요청 횟수는 별도 미검증입니다. 일반 웹의 미지원 안내와 명시적 웹 진단은 별도 경로입니다. 자세한 범위는 [광고 문서](docs/ADVERTISING.md)를 참조하세요.
- Settings 배너는 Android/iOS 모두 방향별 최대 2개 호스트를 유지해 같은 방향으로 돌아오면 기존 광고를 재사용합니다. 너비 변경은 250ms 안정화 후 처리하며, 진행 중인 요청과 실패 예산을 보존합니다. 구매 확인 상태와 2시간 영상 광고 면제는 별개입니다. 현재 정책·검증 제한은 [광고 문서](docs/ADVERTISING.md#current-correction--orientation-reuse-and-visibility)를 참고하세요.
- 초기화·배너·리워드의 45초 지연 안내는 실패 판정이나 재요청이 아닙니다. 늦게 도착한 SDK 결과를 처리하며 지연만으로 수동 재시도를 활성화하지 않습니다. 리워드 만료는 버튼·기존 상태 영역을 갱신하고 자동 팝업이나 자동 재생을 시작하지 않습니다. 대기·광고 유효시간은 경과시간 기준이며 로그의 UTC 시각과 구분합니다.
- 영구 구매자는 광고를 요청하지 않습니다. 구매 여부 확인 전 또는 확인 실패를 무료 사용자로 바꿔 광고를 요청하지 않습니다.
- Android 광고에는 immersive 옵션을 적용합니다. 현재 버전의 진입·재생·종료·복귀 전 구간에서 내비게이션 바가 한 프레임도 노출되지 않는지는 실기기 미검증입니다. 과거 Google Play 외부 설치 화면의 노출 제한은 이전 기록에 남아 있습니다.

## 로컬 APK 빌드 절차

실제 소스는 메인 폴더에서 수정하고, 활성 빌드 폴더는 **`C:/dev/Led Banner/artifacts/b`로 고정**합니다. 과거 `artifacts/local-builds/20260908-expo57`는 이동 전 절대 경로 캐시가 남은 보관본이며 재개하지 않습니다. 긴 경로와 임시 드라이브 연결 때문에 발생했던 실패는 이전 기록과 서명 정책에 설명돼 있습니다.

사용자가 APK 빌드를 요청하면 메인 작업 폴더에서 다음 래퍼를 실행합니다. 이 명령은 준비 후 실제 컴파일까지 수행합니다.

```powershell
pwsh -NoProfile -File .\scripts\build-local-apk.ps1
```

- PowerShell 7 이상만 지원합니다. 래퍼는 Windows PowerShell 5.1에서 빌드 준비 전에 중단합니다. 네이티브 도구의 stderr 경고는 로그로 보존하고 각 호출 직후 캡처한 종료 코드로 성공·실패를 판정합니다.
- Windows 메모리와 실행 중인 Gradle/Flutter/Expo·EAS CLI 빌드를 먼저 확인합니다. 여유 물리 메모리가 4GiB 미만이거나 다른 빌드가 감지되거나 조회할 수 없으면 중단합니다. 프로세스를 종료하거나 자동 대기·재시도하지 않습니다. 이 점검은 Gradle 실행 직전에도 반복합니다. 4GiB는 보수적인 시작 기준이며 빌드 중 메모리 여유를 보장하지 않습니다. 기존 서명 인증서를 확인하고 같은 프로젝트의 동시 빌드를 막는 잠금을 확보합니다.
- 이전 APK·로그·소스 기록을 `artifacts/apk-runs/<실행 ID>/`에 보존합니다.
- `prepare-local-apk.cjs`가 Git 관리 파일과 Git에서 제외하지 않은 새 파일을 수집하고 추가·수정·삭제를 동기화합니다. 내용이 같은 파일은 다시 쓰지 않습니다. 삭제는 이전 소스 목록에 포함된 파일에만 적용합니다. 환경 파일·서명 키·생성 출력은 동기화 대상이 아닙니다.
- 패키지의 의존성·스크립트·overrides, lockfile·npm 설정·patch 변경 또는 설치 기록 누락 시에만 `npm ci --prefer-offline`을 실행합니다. 루트 `package.json`의 앱 메타데이터 `version`만 바뀐 경우에는 재설치나 네이티브 재생성을 요구하지 않습니다. lockfile 검증과 설치 스크립트는 유지하고 npm 다운로드 캐시를 우선 사용합니다. 지정된 UTF-8 빌드 입력 텍스트와 추적된 설정 예시 `.env.example`의 CRLF/LF 차이는 입력 해시에서만 무시합니다. 실제 로컬 `.env*`, patch·바이너리·실제 동기화 파일·소스 기록 해시는 원본 바이트를 유지합니다. 기존 성공 해시는 보존된 입력으로 이전 해시를 재현한 경우에만 새 형식으로 이전하며, 실패·불일치·알 수 없는 해시 형식은 재사용하지 않습니다. Expo 설정·플러그인·로컬 모듈·설정에서 참조하는 이미지·실제 빌드 환경 파일·Node 버전·JDK/Android SDK 설치 메타데이터를 비교하고, 네이티브 입력 변경 또는 재설치 시에만 네이티브 출력을 재생성합니다. 기존 네이티브 폴더는 `artifacts/native-archives/<실행 ID>/`에 보관합니다. 재생성 성공 후 생성 캐시인 `android/.gradle`, `android/build`, `android/app/build`, `android/app/.cxx`만 기존의 동일한 절대 경로로 되돌립니다. 네이티브 소스·매니페스트·Gradle 설정은 새 생성 결과를 사용하고, 변경 입력의 무효화는 Gradle이 판단합니다. 실행별 `source-plan.json`과 `cache-reuse.json`에 준비 계획과 복원한 캐시를 기록합니다.
- 단계 완료 기록은 설치·네이티브 준비가 성공한 뒤에만 갱신합니다. 실패한 준비를 다음 실행에서 완료 상태로 재사용하지 않습니다.
- 기본 versionCode는 소스 app.json 값을 사용하며 `-VersionCode`로 명시적으로 지정할 수 있습니다. 자동 증가는 하지 않습니다. 최초 준비 시 소스와 빌드 폴더 모두 versionCode가 없으면 `-VersionCode <정수>`를 지정해야 합니다. `-ResumeNative`는 선택 사항이며 재설치·재생성이 필요하면 중단합니다.
- Android 버전 이름·versionCode만 바뀌거나 iOS/web 전용 Expo 설정만 바뀐 경우 Android 네이티브 출력을 재생성하지 않습니다. 동기화 후 생성된 android/app/build.gradle의 버전 필드만 정확히 한 번 갱신하며, 예상한 생성 형식이 아니면 중단합니다.
- 출시용 -IncludeBundle은 bundleRelease로 AAB를 한 번 만든 뒤 고정된 bundletool 1.18.3과 기존 업로드 키로 로컬 설치용 universal APK를 파생합니다. Play 검수 제출물은 AAB이며, APK는 로컬 설치·QA용입니다. -MeasureBuild를 지정하면 Gradle 프로파일을 실행 기록에 보존합니다.
- `--build-cache`, 네 가지 ABI, 현재 worker 제한을 유지합니다. 결과 APK·Gradle 로그·소스 해시·커밋 및 미커밋 여부를 실행별로 기록합니다. `stage-timings.json`에는 사전 점검·소스 준비·설치·네이티브 생성/설정·컴파일·APK 변환·파일 내보내기·검증의 시간과 성공/실패/건너뜀을 남깁니다. 실행한 설치·prebuild 로그도 같은 기록 폴더에 보관합니다.

자동화 첫 실행에서 SDK 메타데이터 경로 오류를 수정했으며, 재실행은 재설치·재생성 없이 7분 5초에 성공했습니다. 최초 실행은 기존 성공 로그와 source-revision 기록을 바탕으로 이전 소스 목록을 구성합니다. 최초 기준 기록 이전의 도구 변경과 설치/생성 파일의 수동 수정은 입력 파일 비교만으로 완전히 검증되지 않으므로 별도 확인이 필요합니다. 완성 APK의 서명·버전·SDK·ABI·내장 번들·광고/Billing·정렬 검증과 전체 로그 검토는 별도로 수행해야 합니다.

서명 원본은 `C:/AndroidSigning/com.minkyokim.sideledbannerapp`에 보관합니다. 키·비밀번호는 Git과 로그에 포함하지 않습니다. 세부 절차는 [서명 정책](docs/SIGNING_POLICY.md)을 따릅니다. 저장소 루트의 기존 `android/ios` 생성 폴더를 최신 빌드용으로 간주하지 않습니다.

`artifacts/`는 Git 제외 대상이므로 APK·로그·캐시는 클론에 포함되지 않습니다. EAS의 preview/production 설정과 로컬 내부 APK는 구분합니다. 과거 내부 APK는 R8 비활성이었고, 1.0.6 (23) APK/AAB는 동일 빌드 R8 매핑 검증을 완료했습니다. 이후 소스 변경의 빌드·실기기 검증과 Play 등록 여부는 각 릴리스 기록을 따릅니다.

## 배경 효과의 공백·자간 보존

일반 표시와 배경 효과 내부의 줄 배치는 `utils/skiaLineLayout.ts`를 공유합니다. 글자 윤곽 폭 대신 폰트의 glyph advance를 사용하고 공백에도 입력한 개수와 설정한 자간을 반영합니다. 배경 효과도 그리기에 사용하는 문자별 폰트로 폭을 계산하며, 한 줄 모드에서 선행 공백을 제거하지 않습니다. 글자 크기·배경의 표시 영역·스크롤 정책은 유지합니다. 이 수정은 edaf82b APK에 포함되어 컴파일 완료했으며, 이후 2026-09-08 QA에서 위치 안내 배경의 한글 공백 유지를 확인했습니다. 모든 폰트·배경·언어 조합을 검증한 것은 아닙니다. [QA 범위](docs/QA_PERFORMANCE_20260908.md)를 참고하세요.

## 효과 설정 컴포넌트 경계

`EffectSection`에서 Context를 한 번 읽고 `TextEffects`, `GradientEffects`, `BackgroundEffects`에 필요한 값과 기존 갱신 함수를 전달합니다. 상태 저장소와 바깥 ScrollView는 유지하며 하위 컴포넌트에 별도 상태나 레이아웃용 View를 추가하지 않았습니다. 효과 선택·해제, Pixel 선택 시 Bold 제한과 언어별 폰트, Glow/Blink 저장값, Gradient 기본값, 배경 잠금·광고 모달 연결은 기존 코드를 이동했습니다. 이번 분리는 edaf82b APK에 포함되어 컴파일 및 빌드 내 lintVitalRelease를 완료했습니다. 별도 린트·테스트·실기기 확인은 미실행입니다.

## 사전 요구사항

- Node.js `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0` (React Native 0.86.3 요구사항; 현재 호스트 24.14.1)
- npm (`package-lock.json` 기준으로 의존성 설치)
- Expo CLI는 프로젝트의 `expo` 패키지를 통해 사용합니다. 별도 전역 설치는 필요하지 않습니다.
- EAS 원격 빌드 시 EAS CLI와 `led-banner-app` Expo 프로젝트 접근 권한이 필요합니다.
- 로컬 Android 빌드/에뮬레이터에는 Android Studio와 Android SDK가 필요합니다. 로컬 iOS 빌드에는 macOS와 Xcode가 필요합니다.

## 설치 및 실행 방법

1. 프로젝트 클론

```bash
git clone https://github.com/ssongyc/side-led-banner-app.git
cd side-led-banner-app
```

2. 최초 클론 시 의존성 설치

```bash
npm ci
```

3. 환경 설정

`.env.example`을 참고해 로컬 `.env`에 `EXPO_PUBLIC_AMPLITUDE_API_KEY`를 설정합니다. 예시 문자열은 실제 키가 아닙니다. EAS 빌드는 선택한 프로필의 원격 환경 설정을 사용합니다. `EXPO_PUBLIC_*` 값은 앱 번들에 포함되므로 비밀 키를 넣지 않습니다.

4. 개발 서버 실행

```bash
npm start
```

AdMob 등 네이티브 모듈이 있어 Expo Go만으로 전체 기능을 검증할 수 없습니다. 해당 모듈이 포함된 개발 빌드를 사용합니다. 웹 미리보기 역시 실기기 광고·노치·시스템 UI 검증을 대신하지 않습니다.

실제 앱 진입점은 `package.json`의 `expo-router/entry`와 `app/_layout.tsx`입니다. 루트 `index.js`는 사용하지 않습니다. `development` APK는 Metro에서 개발 코드를 받으며 `preview` APK와 `production` AAB는 코드를 내장합니다. EAS 환경 변수는 로컬 Metro에 자동 전달되지 않으므로 로컬 환경 설정도 필요합니다.

## 프로젝트 구조

주요 소스 파일을 요약한 구조입니다. `node_modules/`, `.expo/`, `artifacts/`는 의존성·캐시·빌드 산출물이며 아래에서 생략합니다.

```
side-led-banner-app/
├── app/
│   ├── _layout.tsx              # 플랫폼별 루트 진입점 연결
│   ├── index.tsx                # 메인 화면 (배너 편집기)
│   ├── settings.tsx             # 앱 설정 화면
│   ├── credits.tsx              # 크레딧 화면
│   ├── sunnyList.tsx            # Sunny 앱/게임 목록 화면
│   └── openSourceInfo.tsx       # 오픈소스 정보 화면
├── components/
│   ├── settings/
│   │   ├── backgroundSection.tsx     # 배경 설정 UI
│   │   ├── effectSection.tsx         # Context 연결·스크롤·효과 UI 조합
│   │   ├── effects/
│   │   │   ├── TextEffects.tsx       # 효과 칩·Glow/Blink 슬라이더·Pixel Mix
│   │   │   ├── GradientEffects.tsx   # Gradient 선택 시 프리셋 UI
│   │   │   └── BackgroundEffects.tsx # 배경 프리셋·잠금 UI
│   │   ├── textSection.tsx           # 텍스트 설정 UI
│   │   └── settingsSliderBlock.tsx   # 설정용 슬라이더 블록
│   ├── animation/
│   │   ├── BackgroundEffectLayer.tsx # 배경 이펙트 레이어
│   │   ├── HeartBackgroundTicker.tsx # 하트 배경 티커
│   │   ├── MarqueeCanvas.tsx         # Skia 마퀴 캔버스
│   │   └── useMarqueeCanvasProps.ts  # 화면 수명의 캔버스 props·picture/paint 재사용
│   ├── dev/
│   │   ├── proDebugFab.tsx           # Pro 상태 디버그 버튼
│   │   ├── rewardAdDebugFab.tsx      # 리워드 광고 디버그 버튼
│   │   └── sheetFetchDebugPanel.tsx  # 시트 fetch 디버그 패널
│   ├── admob/
│   │   ├── bannerAd.tsx              # Settings 자리 예약·루트 네이티브 배너 호스트
│   │   └── bannerAd.web.tsx          # 웹 안내·명시적 진단 배너
│   ├── skia/
│   │   └── GradientBackdrop.tsx      # 그라데이션 배경
│   ├── previewPanel.tsx              # 미리보기 패널
│   ├── ledBannerFullScreen.tsx       # 전체화면 LED 배너 모달
│   ├── rewardAdModal.tsx             # 리워드 광고 모달
│   ├── colorPicker.tsx               # 색상 선택 컴포넌트
│   ├── slider.tsx                    # 슬라이더 컴포넌트
│   ├── RootLayout.tsx                 # 공통 루트 레이아웃 (테마, 네비게이션)
│   ├── RootLayoutEntry.tsx            # Android/iOS 루트 진입점
│   └── RootLayoutEntry.web.tsx        # CanvasKit 초기화를 포함한 웹 루트 진입점
├── ads/
│   ├── AdClient.tsx               # 네이티브 광고 SDK 경계
│   ├── AdClient.web.ts            # 명시적 웹 진단 이벤트
│   ├── rewardedState.ts           # 리워드 슬롯·타이머·보상 조건
│   ├── bannerState.ts             # 세션 배너 요청 예산·재시도 마감 시각
│   ├── adConfiguration.ts         # 플랫폼·프로필 검증
│   ├── adTrace.ts                 # 120개 추적 기록, 개발 모드 콘솔
│   ├── initializeMobileAds.ts     # 공유 SDK 초기화·백그라운드 대기·지연 안내
│   ├── initializeMobileAds.web.ts # 웹 초기화 미지원
│   └── webAdDiagnostics.web.ts    # 진단 상태 선택
├── hooks/
│   ├── useMarqueeAnimation.ts      # 마키 스크롤 애니메이션 로직
│   ├── useBlinkOpacityStyle.ts     # 깜빡임(불투명도) 스타일 훅
│   ├── useBackgroundAnimation.ts   # 배경 이펙트 애니메이션 훅
│   ├── useGoogleSheets.ts          # Google Sheet 로드 훅
│   ├── usePreviewPanelCanvas.ts    # 미리보기 캔버스 훅
│   ├── useSkiaAppearanceFont.ts    # Skia 폰트 훅
│   ├── useSpeechBubble.ts          # 말풍선 레이아웃 훅
│   ├── useTextInput.ts             # 입력창 상태 훅
│   ├── useTextMetrics.ts           # 텍스트 크기 계산 훅
│   ├── useTilePicture.ts           # 타일 picture 생성 훅
│   ├── useRewardedAd.ts            # 네이티브 리워드 상태 구독
│   ├── useRewardedAd.web.ts        # 웹 진단 이벤트·보상 연결
│   ├── use-color-scheme.ts         # 다크/라이트 모드 감지
│   └── use-color-scheme.web.ts     # 웹용 컬러 스킴
├── constants/
│   ├── styles.tsx                   # 공통 스타일
│   ├── btnStyles.tsx                # 버튼 스타일
│   ├── colorPalette.tsx             # 텍스트/배경 색상 팔레트
│   ├── appFonts.ts                  # 앱 폰트 정의
│   ├── gradientBackgroundPresets.ts # 그라데이션 배경 프리셋
│   ├── language.ts                  # 앱 언어 타입
│   ├── settingsStyles.tsx           # 설정 화면 스타일
│   └── speechBubblePresets.ts       # 말풍선 프리셋
├── contexts/
│   ├── settingsContext.tsx          # 상태·저장 수명주기 및 Context 연결
│   ├── premiumContext.tsx           # 구매 권한 구독
│   └── settings/
│       ├── presetModel.ts           # 타입·기본값·프리셋 변환 규칙
│       └── useSettingsLocalization.ts # 언어·시트·라벨·폰트 로드
├── language/
│   ├── deviceLocale.ts              # 기기 로케일 변환
│   ├── effectSectionLabels.ts       # 효과 섹션 다국어 라벨
│   ├── matchSheetRows.ts            # 시트 라벨 매칭 유틸
│   ├── rewardAdLabels.ts            # 리워드 광고 라벨
│   └── textSectionLabels.ts         # 텍스트 섹션 다국어 라벨
├── utils/
│   ├── buildMarqueeTextBlob.ts      # Skia 텍스트 blob 생성
│   ├── ApiClient.ts                 # 구매·구매 검증 경계 (광고는 ads/AdClient)
│   ├── SystemChrome.ts              # Android 네비바 등 시스템 UI 제어
│   ├── TextScaling.ts               # 앱 텍스트 시스템 크기 영향 차단
│   ├── glyphLedPanels.ts            # Pixel LED 패널 계산
│   ├── pixelColorMix.ts             # Pixel 색상 혼합 유틸
│   ├── presetStorage.ts             # 프리셋 저장 유틸
│   ├── recordTile.ts                # 마퀴 타일 기록 유틸
│   ├── skiaBubbleTextLayout.ts      # 말풍선 텍스트 레이아웃
│   ├── textSizing.ts                # 텍스트 크기 계산 유틸
│   └── viewMode.ts                  # 보기 모드 유틸
├── assets/
│   ├── fonts/
│   ├── images/
│   └── svg/
│       ├── deleteAllButton.tsx    # 입력 초기화 버튼 SVG
│       ├── playOptionButton.tsx   # 한줄/여러줄 재생 버튼 SVG
│       ├── playResumeButton.tsx   # 재생/정지 버튼 SVG
│       └── sliderButtons.tsx      # 슬라이더 버튼 SVG
├── disabled-features/premium/
│   └── PremiumScreen.tsx          # Pro 화면 보관본, 앱에서 import하지 않음
├── docs/
│   ├── SIGNING_POLICY.md          # 서명·증분 APK 절차
│   └── BUILD_HISTORY.md           # 이전 변경·빌드 기록
├── scripts/
│   └── build-local-apk.ps1        # 기존 서명 검증 후 Gradle 빌드
├── app.json                       # Expo 앱 설정
├── eas.json                       # EAS 빌드/배포 설정
├── package-lock.json
├── package.json
├── tsconfig.json                  # TypeScript 설정
└── eslint.config.js               # ESLint 설정
```

## 주요 라이브러리

아래 버전은 `package.json`에 선언된 범위입니다. 정확한 설치 버전은 `package-lock.json`을 기준으로 확인합니다.

| 라이브러리                                                                                      | 버전     | 용도                            |
| ----------------------------------------------------------------------------------------------- | -------- | ------------------------------- |
| [Expo](https://expo.dev/)                                                                       | ~57.0.24 | React Native 개발 프레임워크    |
| [expo-router](https://docs.expo.dev/router/introduction/)                                       | ~57.0.22 | 파일 기반 라우팅                |
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)                  | 4.5.1    | 마키 스크롤 애니메이션          |
| [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)        | ~2.32.0  | 터치/제스처 처리                |
| [expo-screen-orientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)        | ~57.0.2 | 전체화면 시 가로/세로 전환 제어 |
| [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)              | ~57.0.2 | 프리셋 버튼 그라디언트          |
| [@miblanchard/react-native-slider](https://github.com/miblanchard/react-native-slider)          | ^2.6.0   | 속도/크기/블러 등 슬라이더 UI   |
| [react-native-element-dropdown](https://github.com/hoaphantn7604/react-native-element-dropdown) | ^2.12.4  | 폰트 선택 드롭다운              |
| [react-native-svg](https://github.com/software-mansion/react-native-svg)                        | 15.15.4  | SVG 아이콘 (재생/정지 버튼 등)  |
| [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)   | ~5.7.0   | 노치/Safe Area 대응             |
| [react-native-google-mobile-ads](https://docs.page/invertase/react-native-google-mobile-ads)    | 16.5.0 | AdMob 배너/리워드 광고          |
| [@amplitude/analytics-react-native](https://amplitude.com/docs/sdks/analytics/react-native/react-native-sdk) | ^1.8.0 | 사용 이벤트 분석 |

## Android 빌드 프로필

- `eas.json`은 원격 버전 번호를 사용합니다 (`appVersionSource: remote`).
- Android `preview`는 내부 배포 APK용이며 현재 자동 번호 증가가 없습니다. 같은 versionCode로도 소스가 다른 APK가 생성될 수 있으므로 커밋과 Build ID를 함께 기록합니다.
- Android `production`은 스토어 AAB용이며 `autoIncrement: true`입니다. 실제 versionCode는 완료된 빌드에서 확인합니다.
- 앱 표시 버전 변경 자체가 원격 versionCode 증가나 스토어 제출을 뜻하지 않습니다.



## 최신 소스 변경 메모

- Sunny's Games and Apps: `decibella2`를 `decibella` 바로 위에 배치하고 원본 디코딩 픽셀을 유지한 무손실 WebP 아이콘 및 [OneLink](https://decibella2.onelink.me/T5UV/x5q1f7vs)를 사용합니다.
- 미사용 `language/translatorHandoff.ts`와 호출되지 않는 텍스트 계산 함수 4개를 삭제했습니다. 플랫폼별 파일, 원본 에셋, Pro 보관 화면과 빌드 캐시는 유지합니다.
- 과거 SDK 전환·보안 검사·기기 테스트·APK/AAB 상세 이력은 [이전 기록](docs/BUILD_HISTORY.md)에 보존합니다. 과거 버전·audit 수치·검증 범위는 당시 결과이며 최신 재검사를 의미하지 않습니다.

## 스토어 버전과 제출 상태

Play Console의 현재 출시 버전과 최대 versionCode는 확인하지 못했습니다. 현재 소스 설정은 1.1.3 (31)이며, 최근 기록된 로컬 APK/AAB는 1.1.2 (30)으로 생성·정적 검증했습니다. 파일 생성은 업로드·심사 제출·승인을 의미하지 않습니다. 향후 제출 시 Play Console의 실제 최대 versionCode와 동일 빌드 매핑 등록 여부를 별도로 확인해야 합니다.

TypeScript 검증은 node_modules와 생성 산출물 artifacts를 제외합니다. 과거 빌드 복사본을 현재 소스로 중복 검사하지 않도록 범위를 고정했습니다.

## Sunny 목록 아이콘 최적화

앱 아이콘 13개를 무손실 WebP로 연결했습니다. 해상도와 디코딩 픽셀을 유지하며 참조 파일 합계는 32.3% 감소했습니다. [변경 내용과 검증 범위](docs/SUNNY_ICON_OPTIMIZATION.md)를 참고하세요.


## 광고 모듈 분리 (소스 변경)

광고 경계는 ads/AdClient.tsx, 리워드 상태 머신은 ads/rewardedState.ts로 분리했습니다. hooks/useRewardedAd.ts는 상태 구독과 보상 콜백 연결만 담당합니다. 광고 설정·초기화·추적·웹 진단도 ads/로 모았습니다. decibella 2의 iOS 복귀 커버는 LED POP에서 필요성이 검증되지 않아 적용하지 않았습니다. 기존 APK/AAB에 미포함이며 컴파일·실기기 검증은 미실행입니다. 자세한 범위는 docs/ADVERTISING.md를 참고하세요.

## 설정 Provider 책임 분리 (소스 변경)

Decibella 2의 store/audioMeterStore에서 기능별 모듈을 조합하는 방식을 참고해, 기존 React Context를 유지하면서 순수 설정 규칙과 언어 처리를 분리했습니다.

- contexts/settings/presetModel.ts: BannerConfig/프리셋 타입, 기본값, 기존 Pro 제한 정규화, 텍스트 줄 수 규칙, 프리셋 복사·변환·이전 데이터 복원 규칙.
- contexts/settings/useSettingsLocalization.ts: 기기 언어 해석, 시트 조회·리비전, 라벨 함수, 로케일 폰트 로드.
- contexts/settingsContext.tsx: 상태 소유·업데이트, 저장·복원 순서, Pro 만료와 프리셋 선택, Context 값 연결. 기존 공개 타입과 함수는 재노출해 소비자의 import를 유지합니다.

ContentContext/RestContext, 저장 키·포맷, 초기값과 갱신 규칙은 유지합니다. Zustand 도입이나 선택적 구독 전환은 하지 않았으며, 이번 분리가 렌더 횟수나 프레임 시간을 줄였다는 의미는 아닙니다. 성능 이득은 미측정입니다. 이 분리 작업에서 컴파일·린트·테스트·새 빌드는 실행하지 않았습니다. 소스와 문서는 후속 main 전달에 포함합니다.
## 미사용 공개 API 정리

소스 참조 조사에서 기존 내부 보조 함수의 불필요한 export와, 새 지연 폰트 준비 흐름으로 대체되어 호출되지 않는 `loadRemainingFonts`, `prefetchRemoteFonts`, `getSkiaFontAssets`를 제거했습니다. Expo 템플릿 초기화 스크립트와 명령, 교체된 투명 스플래시와 참조되지 않는 직접 의존성 4개도 제거했습니다. 앱 라우트에서 도달하지 않는 독립 소스 파일은 없었습니다. 보관된 Pro 화면·구매/복원 API·광고 추적 API, 플랫폼별 구현, WebP 변환 원본, 폰트 라이선스, 서명·빌드 기록은 유지합니다. 리워드 안내 7개 언어는 실제 지급 시간인 2시간과 맞췄습니다. V1.1.1 릴리스 시도 `20260914-164757-b630a61e`는 `npm ci`가 잠긴 `zod` 파일의 `EBUSY` 오류로 중단되어 네이티브 생성·컴파일·산출물 생성은 시작되지 않았습니다. 현재 전달에서는 빌드·린트·테스트를 다시 실행하지 않았습니다.

## 유지보수 우선순위

광고 SDK·리워드·배너 상태 및 설정 모델·언어 처리 분리를 유지합니다. 추가 전체 구조 재편이나 Zustand 전환보다 현재 변경의 동작 검증을 우선합니다. 프리셋 저장·복원 및 Pro 만료 처리는 향후 관련 변경이 필요할 때 분리 후보로 검토합니다. 이번 main 전달은 소스와 문서만 포함하며 별도 RootLayout 스플래시 수정은 제외합니다. 새 빌드·실기기 검증·스토어 업로드는 수행하지 않았습니다.

## 성능 추가 조사 — 2026-09-10

[메모리·프레임 보고서](docs/QA_MEMORY_FRAMES_20260910.md): 동일 입력 20회 전환에서 GL 메모리 초기 증가 후 안정화, 화면 버퍼 반환을 확인했습니다. 안정 재생 구간에서는 BufferStuffing이 표시 간격의 끊김보다 추가 버퍼 지연과 부합했습니다. 무한 누수 부재나 모든 기기의 성능을 보증하는 결과는 아닙니다.

후속 소스 개선: Canvas 재마운트 때 picture/paint를 재사용하도록 화면 수명으로 이동했고, 같은 크기의 레이아웃 이벤트는 상태를 갱신하지 않습니다. 리소스 회귀 테스트 4개 통과. 새 APK의 GPU 메모리·프레임 비교는 아직 미실행입니다.

main 전달 범위: QA 보고서·광고 만료 방어·picture/paint 재사용·중복 레이아웃 갱신 억제·회귀 테스트 소스를 함께 전달합니다. 이전 단계의 커밋/푸시 미실행 표기는 당시 기록이며, 별도 RootLayout 변경과 로컬 artifacts는 이번 전달에서 제외합니다. 새 빌드/실기기 개선량 검증은 아직 수행하지 않았습니다.

설치 APK 22c54a0의 [실기기 QA 결과](docs/QA_22C54A0_20260910.md): 동일 조건 20회 후 PSS 약 662→648MiB, GL 367→342MiB를 관찰했으나 단일 비교이며 BufferStuffing은 남아 있습니다. 회귀 테스트 25개 통과. 실제 광고 재생/보상과 iOS·태블릿은 미검증입니다.

## 하트 배경 스크롤 경계 수정 — 2026-09-10

하트 배경이 텍스트 마퀴의 반복 좌표를 공유해, 텍스트가 한 주기를 마치고 0으로 돌아갈 때 하트 타일의 위상도 갑자기 바뀌는 경로를 수정했습니다. `useHeartBackgroundScroll`은 기존 속도(`textMoveSpeed × 3` logical px/s)로 UI 프레임 간 이동량을 누적하며 텍스트 길이·반복 경계와 독립적으로 움직입니다. 일반/Pixel 미리보기와 전체 화면의 하트 타일 렌더러에 이 좌표를 전달합니다. 이미지·타일 크기·텍스트 스크롤은 유지하며 기존 태블릿 일반 전체 화면의 정적 이미지도 유지합니다. 화면 비활성/앱 백그라운드에서는 중단하고, 속도 0에서는 기존처럼 정지 위치로 돌아갑니다.

정적 소스 검토만 완료했습니다. 컴파일·린트·테스트·새 APK·실기기 재생 검증은 실행하지 않았습니다. 다음 승인된 QA에서는 짧은/긴 텍스트의 여러 반복 경계, 일반/Pixel, 속도 변경 및 화면 복귀를 확인해야 합니다.

## Android 전체 화면 네비게이션 바 — 2026-09-10

전체 화면 재생 Modal의 `onShow`와 화면 크기 변경·앱 foreground 복귀 시 기존 SystemChrome 경계에서 네비게이션 바 숨김을 재적용합니다. 기존 표시 전 effect/터치 처리만으로 누락되던 창 표시 및 회전 경계를 보완했습니다. 설치된 expo-navigation-bar의 setHidden은 Activity와 등록된 추가 Modal 창 모두에 적용합니다. 타이머·반복 숨김 루프·덮개는 추가하지 않았습니다. 컴파일·테스트·APK 빌드는 미실행이며, 실제 가로/세로 재생 및 복귀 시 세 버튼/제스처 모드 노출 여부는 다음 승인된 실기기 QA에서 확인해야 합니다. OS 제스처로 일시 표시되는 시스템 바까지 절대 차단한다고 보증하지 않습니다.

## 사진 배경 전체 표시 — 2026-09-10

당시 사용자 사진 배경은 일반 미리보기/전체 화면과 Pixel 모드에서 `contain`으로 표시하도록 변경했습니다. 원본 종횡비와 사진 전체를 보존하고 남는 공간에는 선택한 배경색을 표시했습니다. 이후 Play 전체 화면의 여백 처리 변경은 아래 2026-09-22 후속 기록을 따릅니다. 당시 정적 검토만 수행했으며 컴파일·린트·테스트·APK 빌드는 실행하지 않았습니다.

## 이번 변경 전달 및 Blur 확인 — 2026-09-10

하트 배경 연속 스크롤, 전체 화면 네비게이션 바 재적용, 사진 contain 표시 및 설치 APK QA 기록을 함께 전달합니다. 일반 사진 배경 Blur는 미리보기/전체 화면에서 `backgroundBlur / 8`로 연결되어 있습니다. Pixel 배경에는 Blur 값 전달/렌더링이 없으며 이번 변경에서 구현하지 않았습니다. contain 변경은 일반 Blur 연결을 유지합니다. 이는 소스 확인 결과이며 실제 Blur 재생 검증은 미실행입니다.

이번 소스 수정 이후 컴파일·린트·테스트·새 APK는 실행하지 않았습니다. QA 보고서는 수정 이전 설치 APK의 결과입니다. 별도로 보존 중인 RootLayout 스플래시 수정과 APK 파일명 변경 스크립트는 이번 커밋 범위에서 제외합니다.


[Android 1.0.7(25) 릴리스 기록](docs/ANDROID_RELEASE_1.0.7_25.md): compile-ok. 기존 서명/실제 AdMob APK·AAB와 매핑 검증 완료. Play 업로드 및 새 APK 실기기 QA는 미실행.

APK 전달 파일명은 실제 versionName 기준 `<AppName>V<점 없는 버전>.apk`를 사용합니다(1.0.7 → `LedPopV107.apk`). 빌드별 디렉터리에서 원본 서명과 해시를 보존하며 AAB 파일명은 유지합니다.


[1.0.7 네비게이션 바 실기기 조사](docs/QA_NAVIGATION_1.0.7.md): 재생 화면의 하단 바 노출 확인. Expo JS hidden 캐시로 재적용 호출이 생략되는 경로를 SystemChrome에서 직접 네이티브 호출로 수정했습니다. 수정 후 빌드/실기기 검증은 미실행입니다.


2026-09-11 최신 1.0.7(25) 제출본은 `artifacts/apk-runs/20260911-000341-2ec246e8`입니다. 네비게이션 바 수정 포함, compile-ok 및 로컬 APK/AAB 검증 완료. 이전 AAB 미업로드 확인 후 버전 유지. 수정 후 실기기 QA/Play 업로드는 미실행입니다.


키보드 도구막대의 완료(✔) 버튼은 Unicode 글자 대신 벡터 `check` 아이콘을 사용합니다. iOS에서는 도구막대 대비 색상을 따라 어두운 iPhone 막대에서 흰색, 밝은 iPad 막대에서 진회색으로 표시합니다. Android 완료 버튼은 흰색을 유지합니다. 버튼 동작·크기와 Undo/Redo 활성 상태는 유지합니다.


배경 효과 내부의 여러 줄 텍스트는 가장 긴 줄을 기준으로 블록 위치를 계산하고 모든 줄을 같은 X 좌표에서 시작합니다. 줄별 가운데 정렬 때문에 짧은 줄이 늦게 진입하던 경로를 수정했습니다. 미리보기/전체 화면의 공통 Skia 배치에 적용되며 자간·공백·줄 간격·속도는 유지합니다. 작성된 선행 공백도 유지하므로 선행 공백이 있는 줄의 첫 글자는 그만큼 뒤에 표시됩니다. 컴파일·린트·테스트·빌드는 실행하지 않았습니다.

이번 main 전달에는 완료(✔) 버튼 흰색 고정과 배경 효과의 공통 줄 시작점 정렬, 2026-09-11 재빌드 기록을 포함합니다. 해당 UI 수정은 직전 1.0.7(25) APK/AAB 생성 이후의 변경이며 기존 산출물에는 포함되지 않습니다. 이 main 전달 당시에는 수정 후 컴파일·테스트·실기기 검증을 실행하지 않았습니다. 이후 아래 1.0.8(26) 빌드에서 해당 소스의 번들 포함과 산출물 검증을 완료했으며, 실기기 검증은 남아 있습니다. 별도 스플래시 및 AAB 파일명 스크립트 변경은 보존·제외합니다.


## Android 출시 산출물 — 1.0.8(26)

[Android 1.0.8(26) 릴리스 기록](docs/ANDROID_RELEASE_1.0.8_26.md): **compile-ok**. 기존 서명과 실제 AdMob production 설정의 APK/AAB 생성 및 로컬 산출물 검증을 완료했습니다. Settings는 V1.0.8을 표시합니다. 완료 버튼 흰색·배경 효과 여러 줄 정렬·네비게이션 바 수정의 번들 포함을 확인했습니다. 이번 파일의 실기기 QA와 Play 업로드는 미실행이며, 기존 1.0.7 산출물과 검증 기록은 보존합니다.

## 2026-09-11 후속 편집 화면 레이아웃·방향 정책

[편집 화면 레이아웃 및 방향 정책](docs/EDITOR_LAYOUT_ORIENTATION_20260911.md)에 iOS 완료 아이콘 대비, 폰·태블릿 공통 디스플레이 높이, 메인·설정 화면 세로 고정과 Play 모드 양방향 회전을 기록했습니다. 이 후속 소스는 위 1.0.8(26) Android 산출물 생성 이후 변경됐으며 새 빌드·실기기 검증은 아직 실행하지 않았습니다.

## Android 출시 산출물 — 1.0.9(27)

[1.0.9(27) UI 상호작용 변경 기록](docs/UI_INTERACTION_1.0.9_27.md)에 iPad Watch Ad 버튼의 고정 곡률, 사진 불러오기 버튼의 44×44 유효 터치 영역과 첫 탭 처리, 공통 설정 슬라이더의 실시간 드래그·반응형 폭 개선을 기록했습니다. Settings는 V1.0.9를 표시합니다.

[Android 1.0.9(27) 릴리스 기록](docs/ANDROID_RELEASE_1.0.9_27.md): **compile-ok**. main `85dbc1c`에서 실제 AdMob production 설정, 기존 업로드 서명, SDK 36, Billing 9.1.0, 4개 ABI, R8 8.13.23 매핑 및 16 KiB 정렬을 검증한 AAB와 동일 AAB에서 생성한 universal APK를 보존했습니다. Gradle은 `bundleRelease`만 실행해 11분 49초가 걸렸으며 1.0.8(26)의 1시간 7분 52초보다 약 82.6% 단축됐습니다. 실기기 QA, 실제 광고 노출·보상 확인과 Play 업로드·매핑 등록은 수행하지 않았습니다.

## iPad 슬라이더 드래그 후속 수정

공통 슬라이더의 드래그 중 외부 값 재설정과 Text·Background·Effects 스크롤 뷰의 iOS 터치 취소 경로를 보완했습니다. 후속 개선은 iPhone·iPad·Android 전체에 적용되며, 손잡이는 연속적으로 이동하고 실제 설정 값이 바뀔 때만 갱신을 전달합니다. 손을 떼면 기존 증감 단위의 최종 값으로 정렬합니다. 실시간 값 전달과 Pro 잠금은 유지하며 실제 반응 속도 개선량은 미측정입니다. 이 변경은 위 1.0.9(27) 출시 파일에 포함되지 않으며 빌드·린트·테스트와 실기기 확인은 미실행입니다. [변경 내용과 확인할 항목](docs/UI_INTERACTION_1.0.9_27.md)을 참고하세요.

## 출시 검증 통합 및 R8 조사 — 2026-09-12

IncludeBundle 출시 빌드는 단일 검증 스크립트로 기존 서명·매니페스트·광고·SDK/Billing·ABI·정렬·동일 빌드 매핑 검사를 수행합니다. APK/AAB 압축 파일은 각각 한 번 열어 재사용하며, 서로 독립적인 외부 서명·메타데이터·정렬 검사는 최대 2개만 병렬 실행합니다. 검증 항목, 실패 처리, 개별 출력과 소요 시간 기록은 유지하며 Python 3.11 이상이 필요합니다. MeasureBuild에서는 R8 재실행 입력 사유를 추가 기록합니다. 최근 R8 실행에는 버전 변경이 포함됐으며, 불필요한 R8 실행으로 확정하지 않았습니다. 검증 병렬화는 소스 검토만 완료했고 실제 시간 단축은 다음 승인된 빌드에서 측정해야 합니다. [상세 변경과 다음 확인 항목](docs/ANDROID_BUILD_OPTIMIZATION.md)을 참고하세요.

출시 빌드의 안전 기본값은 Configuration Cache 끔, 비재사용 Daemon, Gradle worker 1개입니다. Configuration Cache는 생성된 Expo/React Native Gradle 설정이 구성 단계에서 Node 프로세스를 실행하여 엄격 모드 검증에 실패했으므로 출시 빌드에 사용하지 않습니다. 일반 APK/AAB 생성에서는 `-MeasureBuild`를 생략하고, 네이티브 입력이 그대로인 JS/UI 변경에만 `-ResumeNative`를 사용합니다. AAB를 한 번 빌드한 뒤 동일 AAB에서 universal APK를 만드는 기존 방식과 모든 검증을 유지합니다. [현재 권장 절차](docs/ANDROID_BUILD_OPTIMIZATION.md)를 참고하세요.

## 버전 변경 — V1.1.1

Expo 앱 버전을 1.1.1, Android versionCode를 29로 변경했습니다. Settings는 Expo 설정을 읽어 V1.1.1로 표시합니다. iOS buildNumber는 별도로 변경하지 않았습니다. main `14b698f`의 1.1.1(29) production APK/AAB는 `20260914-224723-f9b4673c` 실행에서 생성·정적 검증했습니다. Google Play 업로드와 실기기 실행은 아직 수행하지 않았습니다.

## 버전 변경 — V1.1.3

현재 Expo 앱 버전을 1.1.3, Android versionCode를 31로 변경했습니다. Settings는 Expo 설정을 읽어 V1.1.3을 표시합니다. iOS buildNumber와 EAS 원격 빌드 번호는 변경하지 않았습니다. 기존 1.1.2(30) APK/AAB는 과거 산출물이며, 이번 버전 변경 후 새 빌드는 아직 생성하지 않았습니다.

2026-09-12 출시 후속 기록: main 2b6dc16의 1.0.9(27)은 `20260912-002428-05bfeae8` 실행에서 APK/AAB 생성과 통합 정적 검증을 완료했습니다. 위 구현 당시의 미빌드 문구와 구분합니다. 슬라이더 후속 변경은 해당 산출물에 포함되며 실기기 검증은 미실행입니다. Gradle 5분, 73 executed / 1122 up-to-date, R8 UP-TO-DATE였습니다. keytool의 정상 stderr 안내 처리만 빌드 래퍼에서 보완했고 종료 코드·인증서 검증은 유지했습니다. 새 V1.1.0 및 선택 빌드 옵션은 이 산출물에 포함되지 않습니다.


## 광고·입력·시작 복구 개선 — 2026-09-12

- Settings 실제 재진입 시 재시도 가능한 최종 리워드 실패 주기를 다시 시작합니다. 준비·재시도·재생 중에는 기존 광고를 재사용하며 6초/12초 재시도와 사용자 요청 후 표시를 유지합니다. 보상 이벤트는 같은 광고의 OPENED 이후에만 인정하고, 중복 이벤트는 정상 보상 자격을 취소하지 않습니다.
- Amplitude 초기화·식별자 설정·이벤트 8곳·flush를 기존 ApiClient로 모았습니다. 이벤트 인자와 호출 시점, deviceId를 userId로 지정하는 방식 및 SDK 저장/복원 설정은 유지합니다. [광고·분석 상세](docs/ADVERTISING.md)
- Text·Background·Effects의 iOS 터치 취소 금지를 해제하고 슬라이더는 가로 드래그가 확인된 뒤에만 터치를 점유하도록 변경했습니다. 기존 외형·범위·step·Pro 잠금은 유지합니다.
- 저장 설정 읽기 실패 시 기본 프리셋으로 덮어쓰지 않고 원본과 자동 저장 차단 상태를 유지합니다. 오류 안내와 수동 재읽기를 제공합니다. 스플래시 숨김 실패에도 사용자 안내와 수동 재시도를 추가했습니다. 이번 전달에는 검토·개선 대상으로 승인된 스플래시 진입 제어와 복구 코드를 함께 포함합니다. [UI·복구 상세와 확인 항목](docs/UI_INTERACTION_1.0.9_27.md)
- Subway 비교에서 의존성 제거, 원격 번역의 고정 데이터 대체, 일반 UI 글자의 일괄 배율 변경은 기능·표시 영향 때문에 적용하지 않았습니다. 기존 Sunny 다국어 문구의 별도 미커밋 변경은 이번 전달에서 제외합니다.

이번 변경은 소스와 문서에만 반영합니다. 빌드·린트·테스트는 실행하지 않았으며 iPhone/iPad/Android 제스처·오류 복구와 실제 광고·Amplitude 수신은 미검증입니다. 기존 출시 파일은 이번 소스를 포함하지 않습니다.

## Android release maintenance (2026-09-14)

- Updated source dependencies/toolchain: expo=~57.0.22; react-native=0.86.3; react-native-google-mobile-ads=^16.5.0; @amplitude/analytics-react-native=^1.8.0. These recorded versions are source settings, not a claim of current latest versions or verified release compatibility.
- Rewarded-ad changes separate earned reward delivery from ad dismissal; current-instance earned callbacks grant once, while dismissal handles cleanup or native-picker presentation. Runtime behavior remains unverified.
- For the next authorized APK/AAB build, use the existing signing/release entrypoint. Preserve build/dependency caches; avoid routine clean, reinstall or native regeneration. Resolve dependencies once when necessary and share APK/AAB build work only where the framework and current wrapper support it.
- Enable Gradle build caching on the actual host; the Windows workstation default is configured in the user's Gradle properties. Remote EAS/CI does not inherit that setting. Configuration cache and worker/daemon overrides require project-specific compatibility evidence.
- Preserve signing identity, exact same-build R8 mapping and applicable symbols, artifact SDK/version/ad-profile checks, hashes, delivery filename and export timestamp. Record build-phase durations in the next authorized build; no measured speedup is claimed.
- Delivery workflow: update affected existing documents once, stage only task-owned changes, commit to main and verify origin/main. This update did not run builds, lint, tests or Play uploads. Existing published binaries are unchanged.

## iOS 설정 스크롤·Watch Ad 표시 후속 수정 — 2026-09-14

Text·Background·Effects의 각 ScrollView에 남은 화면 높이를 사용하는 `flex: 1` 패널 스타일을 적용했습니다. 이전 터치 인계 수정 뒤에도 높이 제약이 없어 콘텐츠가 부모에서 잘리고 내부 스크롤 거리가 생기지 않던 공통 원인을 보완한 것으로, 세 탭은 콘텐츠가 화면보다 길 때 각각 독립적으로 상하 스크롤합니다. 리워드 팝업의 Watch Ad 배경 이미지에는 버튼 전체 너비·높이를 명시해 iPad에서 배경 일부만 표시되는 경로를 수정했습니다. 기존 슬라이더 조작, 설정값, 광고 준비·표시·보상 순서는 유지합니다.

[세부 UI 변경 기록](docs/UI_INTERACTION_1.0.9_27.md)에 원인, 적용 범위와 검증 한계를 기록했습니다. 이번 변경은 소스와 문서 diff만 확인했으며, 요청에 따라 빌드·린트·테스트와 iPhone/iPad 실기기 검증은 실행하지 않았습니다. 기존 APK/AAB에는 포함되지 않습니다.


## TestFlight build preparation — 2026-09-16

The existing EAS production iOS profile now pins Expo SDK 57's Xcode 26.6 build image. Production iOS configuration stops when the public Amplitude SDK key is missing, blank or the supplied example value, preventing a build with silently disabled App Opened analytics. Remote build-number auto-increment and existing signing identity selection are unchanged. No iOS build, upload, credential or remote environment change was performed. See [the source audit and outstanding signing/archive checks](docs/SIGNING_POLICY.md#ios-testflight-source-audit--2026-09-16). V1.1.2 and recent UI changes remain unverified on iPhone/iPad.


## Android APK/AAB preparation audit — 2026-09-16

The release wrapper now checks bundletool integrity and signing certificate validity before compilation, and performs basic signature/version/SDK/ZIP-alignment checks for APK-only exports. The source preparer hashes the incoming environment template to avoid a stale pre-sync fingerprint. Full combined APK/AAB verification remains unchanged. These source changes have not been build/test verified; see [the audit record](docs/ANDROID_BUILD_OPTIMIZATION.md#android-preflight-audit--2026-09-16). V1.1.2 still uses local versionCode 29; confirm an unused Play code before submission.

### Settings banner lifecycle — 2026-09-19 (source only)

The app-root banner host retains the native request and attempt budget when Settings is left. Returning reuses the pending/completed request; new app-controlled retries pause while absent and resume against the existing deadline. Settings keeps its reserved layout area. See [advertising lifecycle details and outstanding device checks](docs/ADVERTISING.md#september-19-settings-banner-lifecycle-correction-source-only). No build, lint, tests or device verification was performed for this change.

### Android/iOS ad-rate review — 2026-09-20 (source only)

Rewarded loading now preserves pending work and retry deadlines across background/foreground transitions without issuing new background requests. The show boundary rechecks entitlement, and local diagnostics distinguish banner impressions from loads and correlate rewarded request/error/disposal events. See [the screenshot comparison, findings and remaining evidence](docs/ADVERTISING.md#september-20-androidios-rate-review-source-only). No build, lint, tests, device QA or measured rate improvement is claimed.

### Ad preparation follow-up — 2026-09-20 (source only)

Added a delayed-response notice without cancelling or duplicating SDK requests, live rewarded-expiry button updates with existing manual recovery, foreground-only SDK initialization retries preserving deadlines, and monotonic timing for ad validity/waits. Seven-language status text remains in the existing inline area. See [implementation and unperformed device checks](docs/ADVERTISING.md#september-20-follow-up-delayed-loads-expiry-and-session-clocks-source-only). Build, lint, tests, commit and push were not run.

### 광고 정리 및 문서 일치 확인 — 2026-09-20

광고 파일·API의 앱/플랫폼별 참조와 QA 참조를 확인했습니다. 삭제할 미사용 광고 파일은 발견하지 못했으며, 외부 소비자가 없는 웹 내부 타입 `DiagnosticAdEvent`의 export만 제거했습니다. 웹의 명시적 미지원 경계, 진단 코드와 `getAdTrace` QA 용도는 유지합니다.

기존 `scripts/qa-ad-state.cjs`는 보존 대상입니다. 이 9월 20일 기록 당시에는 새 `performance.now()` 기준과 초기화 구독 API의 동기화가 필요했습니다. 이후 `5cf3182`에서 하네스를 갱신했고 26개 상태 검증이 통과했습니다. 과거 통과 기록은 해당 당시 소스의 결과이며 현재 광고 변경의 통과 증거가 아닙니다. 이번 정리에서는 빌드·린트·테스트·커밋·푸시를 실행하지 않았습니다.

## Pending changes consolidated — 2026-09-20

The previously uncommitted TestFlight and Android preparation changes documented above are included in this delivery. The previously excluded Sunny label change is also included: the Settings entry uses the approved localized Sunny Games & Apps labels in all seven supported languages, without a remote Sheet override for this entry. Other labels retain their existing resolution.

The latest Android release attempt stopped before compilation at the memory gate; no new APK/AAB was produced. See the [build attempt record](docs/ANDROID_BUILD_OPTIMIZATION.md#release-attempt--2026-09-20). This documentation/commit delivery does not run builds, lint, tests or device QA.

## V1.1.2(30) local production artifacts — 2026-09-20

The resumed release build completed with production AdMob configuration. The APK and AAB were written under local `artifacts/apk-runs/20260920-214301-06a96479/` but are not retained in the current workspace; the recorded local signature/version/SDK/ads/ABI/alignment/mapping checks passed. Build source: 64db761 plus the then-uncommitted Expo Router import correction in bannerAd.tsx, included in this final source delivery. VersionCode 30 is a build override; app.json remains 29. Device QA, live ad serving and all-track Play code eligibility remain outstanding. See [timing, hashes, warnings and verification limits](docs/ANDROID_BUILD_OPTIMIZATION.md#successful-local-v11230-export--2026-09-20).

## Next Android build preparation

The existing release wrapper now batches pinned Git-source reads, fixes the development-server IP/port only for release builds to avoid host-network-dependent resource changes, and isolates iOS-only analytics validation from Android native inputs. Cache reuse, one AAB build followed by APK extraction, four ABIs and all signing/artifact checks remain. The first adoption may regenerate native configuration once. These changes are source-reviewed, not build/timing verified; see [incremental preparation details](docs/ANDROID_BUILD_OPTIMIZATION.md#incremental-preparation-improvements--2026-09-20-source-only).

## Splash transition policy follow-up — 2026-09-20

The existing path already disables the native exit fade, keeps an opaque #1a1a1a loader over the prepared screen, and removes it only after storage, selected-language fonts, main layout and Skia preview readiness. There is no fixed minimum branding delay or splash-to-main opacity animation. Existing explicit startup recovery remains unchanged; no splash code change was needed in this review.

Source and call-site inspection only: no build, lint, tests or device QA ran for this review. Existing artifact/QA records remain historical and do not establish absence of overlap, blank frames or flicker in this revision. Fast/slow cold starts, startup errors and affected return paths remain to be observed on actual Android/iOS devices. The authoritative shared rule is C:/Users/ssong/.codex/skills/mobile-app-production/references/layout-platform.md, Splash-to-main transition.


## Shared policy delta review — 2026-09-20

- Settings iOS banners now have independent retained orientation/available-width sessions. Only the visible eligible geometry starts its first request; returning to an existing geometry reuses its native view, request count and retry deadline. Hidden slots retain callbacks and are excluded from touch/accessibility. Android keeps one Settings session. Google SDK refresh failures still do not discard a loaded creative.
- Settings no longer substitutes V1.0.0 when Expo version metadata is absent; it displays an unavailable dash. Source stays V1.1.2/code 29. Existing native inputs can differ from Expo inputs; the authorized release wrapper owns regeneration/synchronization, and this review does not claim artifact version equality.
- Reviewed existing rewarded startup/Settings preload, native modal handoff, Premium operation/verification boundary and opaque startup-preview readiness. Store verification and SDK/OS behavior are not established by this source review.

Reviewed the shared-policy changes since `development-policies` commit `2d86ce0`: ad lifecycle/rotation and callback ownership, purchase integrity, splash handoff, version source/register rules, and release-mapping applicability. Execution-only guidance (ad QA authorization, artifact/device/store validation) is not an app feature and was not executed. Existing release entrypoints were inspected for mapping handling; no artifact validation is claimed. No app version was changed, so this task does not certify or rewrite the live version register. Build, lint, tests, device QA, store/console changes and uploads were not performed.


## Policy clarification follow-up (012793e) — 2026-09-20

- No new code correction was identified for this delta. The existing Premium interface separates paymentPending from operation state, rejects duplicate purchases and allows manual restore. Reconciliation uses the actual store and installed verifier; unresolved pending cancellation and late-callback ordering still need exact-platform evidence, not a synthetic timeout result.
- build-local-apk.ps1 makes AAB work conditional on IncludeBundle. Existing EAS remote numbering and local version-code overrides are distinct from app.json and remain documented separately. No source version, remote counter or version-register cell was changed.
- Shown reward attempts retain their reward-only listener until an earned callback; an early-close terminal cleanup boundary is not established. Source retention is not proof of bounded native resources or live reward delivery.

Reviewed the shared-policy changes from 714a660 to 012793e (artifact applicability, version-source exceptions, pending transactions and retained reward callbacks). Findings above are scoped source inspection, not full app compliance. Existing approved ad/recovery exceptions remain. No build, lint, tests, dependency installation, device QA, credential/store changes or upload ran. Documentation and source changes are delivered separately per repository.

## Splash frame scheduling — 2026-09-21

RootLayout now requests the native splash handoff on requestAnimationFrame and retains one hideAsync promise across readiness-effect reruns. Cleanup cancels an unissued frame and ignores stale results; it does not duplicate an in-flight native dismissal. Only the existing explicit failure-retry action clears the promise. Main-first bypass, complete artwork/text readiness and manual startup recovery remain unchanged; no fixed wait was added. This is the React Native equivalent of explicitly scheduling a frame, not use of Flutter APIs.

Source review only; build, lint, tests and device startup verification were not performed.


## 미사용 API·문서 정리 — 2026-09-21

Git 관리 소스의 참조를 확인하여 `utils/fontPreload.ts` 내부에서만 호출하는 `collectPriorityFontIds`와 `loadFontIds`의 불필요한 export를 제거했습니다. 함수와 폰트 로딩 동작은 유지합니다. 삭제할 미사용 실행 파일은 확인하지 못했습니다. 플랫폼별 구현, Expo Router 진입점, QA용 `getAdTrace`, 명시적으로 보관한 `disabled-features/premium` 및 기존 빌드 증거는 유지했습니다. 이번 정리는 소스·문서 확인만 수행했으며 빌드·린트·테스트·커밋·푸시는 실행하지 않았습니다.


### 후속 참조·README 정리

내부에서만 사용하는 `GOOGLE_SHEET_CSV_URL`, `parseAppLanguagePreference`, `SKIA_BLOCK_HEIGHT_SAFETY_PX`의 불필요한 export를 제거했습니다. 함수·상수와 실행 동작은 유지하며, 확실한 미사용 파일은 확인하지 못해 삭제하지 않았습니다. 플랫폼별 구현, 보관된 Premium 화면, QA 도구와 빌드 증빙은 보존합니다. 현재 기준의 Android QA 설명을 갱신하되 날짜별 과거 기록은 유지했습니다. 이번 정리에서는 빌드·린트·테스트·커밋·푸시를 실행하지 않았습니다.

## 미사용 API·README 정리 — 2026-09-22

외부 참조가 없는 SettingsFooter와 입력창 내부 치수 상수 CONTENTS_INPUT_LINE_HEIGHT·CONTENTS_INPUT_VIEWPORT_MARGIN의 export를 제거했습니다. 구현과 실행 동작은 유지합니다. 삭제할 미사용 실행 파일은 확인하지 못했으며 플랫폼별 구현·QA 도구·명시적으로 보관한 Premium 화면·기존 산출물은 유지했습니다. 최신 산출물과 QA 기준을 9월 22일로 갱신했습니다. 이번 정리에서는 빌드·린트·테스트·커밋·푸시를 실행하지 않았습니다.

후속 정적 참조 조사에서 외부 소비자가 없는 내부 타입·상수·보조 함수 45개의 불필요한 export를 제거했습니다. 구현과 실행 동작은 유지합니다. 앱 라우트 기준으로 도달하지 않는 실행 소스는 발견되지 않았으며, 의도적으로 비활성 보관 중인 Premium 화면과 그 API, QA 하네스가 사용하는 `getAdTrace`, 플랫폼별 구현과 원본 자산은 유지했습니다. 하단의 오래된 1.1.1 미빌드 설명은 현재 소스 1.1.2 (29)와 최근 로컬 산출물 1.1.2 (30) 기록에 맞췄습니다.

## Pixel 효과 정사각형 블록 정리 — 2026-09-22

Pixel 효과를 원형 LED 도트에서 일반적인 정사각형 픽셀 블록으로 변경했습니다. 텍스트·외곽선·사진·그라데이션·Effect 1·기존 말풍선 프레임은 동일한 80% 블록/20% 셀 간격과 얇은 내부 가장자리 처리를 사용하며, 픽셀 크기는 글자 크기와 관계없이 4~6 논리 픽셀 범위로 제한합니다. 글자 마스크의 1px 확장을 제거해 획이 뭉치는 경로를 줄였습니다.

기본 배경 전체에 표시하던 회색 꺼진 LED 격자는 제거했습니다. 선택한 배경색을 평평하게 유지하고, 사진·그라데이션·Effect 1·기존 말풍선 프레임이 있을 때만 정사각형 픽셀을 그리며 픽셀 사이에서는 선택한 배경색이 보입니다. 언어별 픽셀 폰트, 텍스트·배경 색상, 속도, Blink·Glow·Gradient·Outline 조합, 미리보기/전체 화면 좌표와 Pro 잠금은 유지합니다.

최근 추가된 Name·Location·Today 표지판 3종은 Pixel 캔버스 내부 이미지 경로에서 공통 배경 효과 오버레이로 이동했습니다. 런타임은 원본의 제목·아이콘·색상 테두리를 보존하고 흰색 본문만 투명화한 `_Frame.png` 자산을 사용합니다. 따라서 일반/Pixel 모드의 미리보기와 전체 화면 모두에서 선택한 사진이나 배경이 프레임 본문 안에 표시됩니다. 불투명 원본 PNG는 [Figma 출처와 재생성 근거](assets/images/SignBoard_SOURCES.md)를 보존하는 마스터이며 런타임 참조와 구분합니다.

Pixelation Mix는 선택 시 주황색 3px 테두리와 체크 배지를 표시하고 접근성 `selected` 상태를 제공합니다. 미선택 상태는 회색 1px 테두리와 낮은 불투명도로 구분하며 버튼의 전체 배치 크기는 유지합니다.

정리 과정에서 사진과 일반 효과가 공유하던 동일 셰이더의 중복 별칭, 더 이상 의미가 없는 CircleGrid 판별 API, 읽지 않던 locale·dot-size 매개변수, 내부 전용 상수·타입 재-export와 표지판 이동 후 불필요해진 Pixel 이미지 해석을 제거했습니다. 후속 참조 조사에서 새 프레임·Pixelation 관련 API는 모두 사용 중이었으며 삭제할 실행 파일이나 API는 확인되지 않았습니다. 원본 표지판 PNG는 출처 마스터, 새 `_Frame.png`는 런타임 자산으로 각각 역할이 있어 보존합니다.

Galaxy SM-M336K에서 Background 탭 위에 남은 Effects 축소 화면과 `× Cancel`은 LED POP 컴포넌트가 아니라 `com.samsung.android.app.smartcapture`가 소유한 시스템 `CancelContainer`·드래그 표면으로 확인했습니다. 홈 화면에서도 유지됐으며 터치 해제 후 사라져 앱 탭 전환 상태와 무관함을 확인했습니다. 새 투명 프레임 6개는 제공 사진 합성과 알파·크기·참조를 정적으로 확인했고 모두 원본보다 작았습니다. 이번 후속 작업에서는 빌드·린트·테스트를 실행하지 않았으므로 새 프레임과 Mix 표시는 다음 승인된 빌드에서 실기기 확인이 필요합니다.

## Android 사진 선택 전환 정리 — 2026-09-22

Android에서 사진 라이브러리 선택을 완료한 뒤 시스템 자르기 화면이 열리기 전 앱의 Background 화면이 잠깐 다시 노출되던 전환을 제거했습니다. 권한 확인 후 전체 화면 검은 커버를 먼저 표시하고, 커버가 실제로 열린 시점에 시스템 사진 선택기를 호출하며 선택·취소·오류가 끝나면 커버를 즉시 해제합니다. iOS의 기존 사진 선택 흐름은 유지합니다. 이 소스 변경은 새 Android APK에서 실행 검증하지 않았습니다.

## Play 사진 여백 채움 및 참조 정리 — 2026-09-22

사용자 사진 배경은 편집 미리보기에서 `contain`으로 표시합니다. Play 전체 화면에서는 같은 사진의 `cover` 보조층으로 화면 비율 차이에서 생기는 여백을 채우고, 그 위에 `contain` 원본을 표시해 사진 전체와 원래 종횡비를 보존합니다. 일반 모드의 보조층은 확대부가 거슬리지 않도록 흐리게 표시하며, Pixel 모드는 보조층과 원본을 함께 기존 픽셀 셰이더로 처리합니다. 프레임·텍스트·효과의 합성 순서는 유지합니다. 이 후속 변경은 정적 검토만 수행했으며 컴파일·린트·테스트·APK 빌드는 실행하지 않았습니다.

일반 모드의 보조층 Blur는 최소 24이며 원본의 사용자 Blur 설정은 유지합니다. Pixel 보조층에는 별도 Blur를 추가하지 않고 기존 픽셀 처리를 적용합니다. 세로·가로 Play에 적용되며 편집 미리보기는 기존 contain을 유지합니다. 원본 화질 향상이나 추가 확대 방지는 contain 원본 레이어에 대한 설명이며, 보조층은 화면을 채우기 위해 확대·잘림이 발생합니다. 구현 당시의 기존 APK/AAB에는 이 변경이 포함되지 않았습니다. 이후 실행 `20260922-202155-81159740`의 V1.1.2 (30) 산출물에는 포함됐으며, 해당 변경의 실제 기기 화면·성능은 아직 검증하지 않았습니다.

후속 참조 확인에서 사진 채움 상수, fillViewport 속성, PixelBackgroundImage 및 두 화면의 배경 렌더링 경로는 모두 사용 중입니다. 이번 범위에서 삭제할 미사용 파일·API는 확인되지 않았습니다. README의 최신 빌드 기준과 AdMob 의존성 고정 버전 표기를 실제 기록·package.json에 맞췄습니다. 빌드·린트·테스트·커밋·푸시는 실행하지 않았습니다.

## 미사용 의존성·README 정리 — 2026-09-22

현재 앱 코드, Expo 설정과 설치 패키지의 dependency/peer 관계를 대조해 직접 참조가 없는 `@react-navigation/bottom-tabs`, `@react-navigation/elements`, `@react-navigation/native`, 중복 직접 선언된 `expo-symbols`, 기능과 코드 참조가 없는 `expo-web-browser` 및 해당 config plugin을 제거했습니다. Expo Router가 자체 의존하는 `expo-symbols`는 간접 의존성으로 유지됩니다. 자동 테마에 필요한 `expo-system-ui`, 시작 화면에서 사용하는 `lottie-react-native`와 `assets/splash.json`, 플랫폼별 구현·보관된 Premium 화면·QA 도구·원본 자산·기존 빌드 증거는 유지합니다.

README의 최신 로컬 산출물 기준을 실제 마지막 성공 실행 `20260922-202155-81159740`으로 수정했습니다. 이 산출물은 사진 여백 채움까지 포함하지만 현재 소스 버전 V1.1.3 (31)과 이번 의존성 정리는 포함하지 않는 V1.1.2 (30) 과거 산출물입니다. 이번 정리에서는 빌드·린트·테스트·커밋·푸시를 실행하지 않았습니다.

### iOS 광고 패치 적용 안내

수정된 소스가 Mac 작업 폴더에 전달된 뒤, 프로젝트 루트에서 `node plugins/patchRewardedCleanup.cjs`를 실행하면 기존 설치본에도 수정이 적용됩니다. 일반 의존성 설치에서는 package.json의 postinstall이 같은 패치를 호출합니다. 수정 전 소스에서 명령만 다시 실행하면 해결되지 않습니다. 패치는 새 설치본·이전 패치 설치본·이미 수정된 설치본을 구분하며, SDK 버전이나 예상 코드가 다르면 오류로 중단합니다.

`iosRewardPrevious`는 실행할 구형 API가 아니라 기존 설치본을 갱신하는 문자열 기준이므로 유지합니다. 최근 패치와 광고 API 참조 확인에서 추가로 삭제할 미사용 파일·API는 확인되지 않았습니다. 이번 정리에서는 빌드·린트·테스트를 실행하지 않았으며, iOS 재빌드와 보상 동작은 미검증입니다.
