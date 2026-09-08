# LED POP (LED Banner App)

입력한 텍스트를 한 줄 또는 여러 줄 LED 배너로 표시하는 Expo/React Native 앱입니다. 텍스트·배경·움직임·Pixel/Gradient/Glow 효과와 프리셋을 지원하며 Android와 iOS를 대상으로 합니다.

- 메인 저장소: [ssongyc/side-led-banner-app](https://github.com/ssongyc/side-led-banner-app)
- 메인 작업 폴더: `C:/dev/Led Banner`
- 작업 지침: [AGENTS.md](AGENTS.md), 서명·빌드: [SIGNING_POLICY.md](docs/SIGNING_POLICY.md), 이전 기록: [BUILD_HISTORY.md](docs/BUILD_HISTORY.md)
- 컴파일·린트·테스트·커밋·푸시·배포는 사용자가 요청할 때만 실행합니다. 이 문서의 명령과 절차 자체는 실행 승인이 아닙니다.

## 현재 소스와 APK의 차이 (2026-09-08)

현재 소스는 Expo **57.0.20**, React Native **0.86.3**, React **19.2.3**, 앱 버전 **1.0.6**입니다. Settings의 App Version은 Expo 앱 설정을 읽습니다. 소스 버전·APK의 versionCode·스토어 배포 버전은 별개입니다.

| 항목 | 현재 소스 | 아래 85a61d6 APK |
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

**최신 APK는 아래 edaf82b 기준 빌드입니다.** 위 표의 비교 대상은 이전 85a61d6 APK이며, 최신 APK에는 표의 소스 변경이 포함됩니다. compile-ok는 각 빌드에만 적용됩니다. Expo 57 Android 실기기 UI·광고는 아래 QA 보고서 범위에서 확인했으며, 결제 및 iOS 빌드는 미검증입니다. 과거 SDK 55 기기 확인 결과를 현재 버전의 결과로 간주하지 않습니다.

SM-M336K(Android 16)에서 미리보기·전체 화면 성능 및 주요 기능 QA를 수행했습니다. [실측·QA 보고서](docs/QA_PERFORMANCE_20260908.md)를 참고하세요. 숨은 미리보기 중복 프레임 생성과 광고 종료 Google Play 시트의 시스템 바 노출을 확인했습니다. 후속 소스에는 숨은 화면 애니메이션 중단·진행 상태 보존과 Android 호스트 복귀 시 바 숨김 재적용을 반영했습니다. 새 APK 비교 측정은 미실행이며 외부 Google Play 창의 바 노출은 미해결입니다. React 렌더 횟수는 미측정입니다. Amplitude는 빌드 폴더의 키 일치만 확인했으며 실제 이벤트 수신은 미확인입니다. 자세한 상태는 [PERFORMANCE_BASELINE.md](docs/PERFORMANCE_BASELINE.md)에 기록했습니다.

## 최신 생성 APK — edaf82b 기준 (2026-09-08)

- **compile-ok**: BUILD SUCCESSFUL in **7m 5s**, 1188 tasks 중 83 executed / 1105 up-to-date. 이전 전체 빌드 40m 57s 대비 약 83% 단축. Gradle 구간 비교이며 준비·검증 시간은 별도입니다.
- [APK 다운로드](artifacts/LedPop-V1.0.6-edaf82b.apk): 286783382 bytes, SHA-256 `126bbddd5bbb4a91b8022ba1f654241e1a391557bee700f703306e4fa3696aff`.
- 앱 소스 main edaf82b22d0d97a01e879eec9dc027d043f811c6. 빌드 준비 스크립트의 SDK 메타데이터 경로만 로컬에서 수정했습니다. 존재하지 않는 SDK 루트 packages.xml 대신 설치 패키지별 source.properties를 읽습니다. 해당 수정은 미커밋이며 앱 기능 변경은 없습니다.
- 의존성 설치·네이티브 재생성 없이 고정 artifacts/b 재사용. 내부 버전 1.0.6 / versionCode 22, package com.minkyokim.sideledbannerapp, minSdk 24 / compileSdk 36 / targetSdk 36, ARM64·ARMv7·x86·x86_64 확인.
- 기존 인증서 SHA-256 730173560958735BF237CA84BA4F35BBE76A6734986929EB65F6CED63D3FD893와 APK v2 서명 일치, zipalign -P 16 통과. debuggable·CAMERA·RECORD_AUDIO 없음. ZIP 정렬 검증은 모든 기기의 실행 검증을 의미하지 않습니다.
- 매니페스트와 billing.properties에서 Billing 9.1.0 확인. AdMob App ID와 production 광고 Unit ID, IAP·구매 검증·리워드 모듈 포함 확인. [공식 Billing 지원 일정](https://developer.android.com/google/play/billing/deprecation-faq)과 [릴리스 노트](https://developer.android.com/google/play/billing/release-notes) 재확인.
- 생성된 Hermes 번들과 APK 번들 해시 일치. 소스맵에서 공백·자간 수정, 분리된 EffectSection, Sunny 목록과 리워드 변경 포함 및 Pro 화면 제외 확인.
- 전체 1575줄 로그를 검토했습니다. 빌드 내 lintVitalRelease 완료. 남은 경고: Gradle 10 폐기 API, SDK XML 버전/명령줄 도구 설치 위치, NODE_ENV 및 출력 색상 설정, Expo 플러그인을 사용하는 AdMob의 설정 위치 안내. 실제 APK AdMob 메타데이터는 정상 포함입니다.
- 기존 내부 빌드의 R8 비활성 설정 유지; 앱 난독화 mapping은 적용 대상이 아닙니다. AAB·Play 업로드는 실행하지 않았습니다. 빌드 후 Android 실기기 공백/자간·광고·성능 확인 범위와 미해결 사항은 아래 QA 보고서에 기록했습니다.
- 로그·소스 입력 해시·APK는 artifacts/apk-runs의 이번 실행 기록에, 독립 검증 결과는 artifacts/apk-edaf82b-*에 보존합니다.

## 이전 생성 APK — 85a61d6 기준

- compile-ok: C:/dev/Led Banner/artifacts/b에서 BUILD SUCCESSFUL in 40m 57s, 1188 actionable tasks 모두 실행. 전체 2015줄 로그를 보존하고 오류 및 경고를 검토했습니다.
- APK: [LedPop-V1.0.6-Expo57-85a61d6.apk](artifacts/LedPop-V1.0.6-Expo57-85a61d6.apk), 286,760,890 bytes. SHA-256: 7FC942663CB4F9D75B446730DED073CEB04C460337490935FC7CDB5D95829D65.
- 앱 소스: main 85a61d61428ed01114c97e0839f3e5f243d86818. 내부 설치용 versionName 1.0.6 / versionCode 22 유지. 이번 빌드 경로 수정은 빌드 래퍼에만 적용했고 실행한 래퍼를 artifacts/apk-85a61d6-build-wrapper.ps1로 보존했습니다.
- 실제 APK 검증: 기존 인증서 SHA-256 730173560958735BF237CA84BA4F35BBE76A6734986929EB65F6CED63D3FD893와 v2 서명 일치, package com.minkyokim.sideledbannerapp, minSdk 24, compileSdk/targetSdk 36/36, ARM64/ARMv7/x86/x86_64, ZIP 16KB 정렬 통과. debuggable·CAMERA·RECORD_AUDIO 선언 없음.
- 실제 Metro 소스맵에서 Pro 화면 및 설정 진입점 제외, showArrows=false와 undo/redo 아이콘 변경 포함을 확인했습니다. 생성된 Hermes 번들과 APK 내 번들 해시도 일치합니다. 소스맵 및 기계 판독 결과는 빌드 폴더와 artifacts/apk-85a61d6-bundle-checks.json에 보존합니다.
- 구매 검증·IAP·리워드 광고 네이티브 모듈, 기존 Premium 상품, immersive 옵션과 배경 PNG 6개 포함 확인. Billing은 manifest 및 billing.properties 모두 9.1.0. 실제 광고 설정은 기존 production App ID 및 Unit ID 유지.
- 긴 실제 경로에서 Ninja 재생성 반복으로 실패했고, 임시 드라이브 연결도 Expo의 실제 경로 재해석 때문에 해결책이 되지 않았습니다. 실제 빌드 폴더를 메인 내부 artifacts/b로 줄이고 생성된 경로 캐시만 초기화한 후 성공했습니다. 임시 드라이브 연결은 남아 있지 않습니다.
- 빌드에 포함된 lintVitalRelease 통과. 별도 테스트 및 실기기 UI·광고·결제 검증은 미실행입니다. R8은 기존 내부 빌드 설정대로 비활성으로 앱 mapping 없음; AAB 생성·Play 등록은 미실행이고 난독화 실행 검증은 하지 않았으며 스토어 준비 완료를 의미하지 않습니다.
- 남은 경고: 서드파티 deprecated API와 Kotlin 향후 호환성, Gradle 10 비호환, JVM metaspace, 중복 Kotlin daemon 및 매니페스트 replace/remove 대상 없음. 광고 SDK의 android_app_id 안내는 Expo 플러그인 경로에서 발생하며 APK의 실제 AdMob App ID를 별도로 확인했습니다. npm 설치 보고의 moderate 19건은 유지됩니다.
- 이번 APK 빌드 후 문서·래퍼 변경은 커밋·푸시하지 않았으며 스토어 업로드도 실행하지 않았습니다.

## Pro 화면과 구매 권한

Upgrade to Pro 설정 항목과 `/premium` 라우트는 제외했습니다. 구현은 [보관 화면](disabled-features/premium/PremiumScreen.tsx)에 남겨 두고 앱에서 import하지 않습니다. **사용자가 명시적으로 다시 넣어 달라고 요청하기 전까지 모든 빌드에서 제외합니다.** 일반 빌드·SDK 업데이트·출시 요청은 재활성화 승인이 아닙니다.

기존 구매 권한 확인과 영구 구매자의 광고 면제 코드는 유지합니다. IAP 모듈까지 제거한 상태는 아닙니다. Apple StoreKit과 Google Play 직접 IAP 구현 및 설정 절차는 [IAP_SETUP.md](IAP_SETUP.md)를 참고하세요. 상품 등록·Google Play 공개키 설정과 실제 결제·복원 검증은 미완료입니다. 광고 보상의 2시간 Pro는 영구 구매 권한과 별개입니다.

## 광고 동작 — 현재 소스

리워드 상태는 슬롯별 `idle/loading/loaded/showing/failed`와 실패 원인 `load/show/configuration`에서 하나의 UI 스냅샷으로 계산합니다. 중복 전역 실패 플래그는 사용하지 않습니다.

리워드 광고는 무료 사용자 상태가 확인되고 광고 SDK 초기화가 완료되면 선로딩합니다. 준비·로딩·재생 중인 광고가 있으면 같은 로드 주기를 중복 시작하지 않습니다. 광고가 열리면 다음 광고도 선로딩하며, 로드 완료만으로 재생하지 않습니다.

| 상태 | 리워드 버튼 | 고정 안내 영역 |
| --- | --- | --- |
| 준비·로딩·재시도 중 | 비활성, 광고 준비 중… | 광고를 준비하고 있어요. 잠시만 기다려 주세요. |
| 준비 완료 | 활성, 언어별 Watch Ad 문구 | 문구를 지우고 공간 유지 |
| 로드 3회 실패 | 비활성, 광고 준비 중… | 광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요. |
| 재생 실패 | 비활성, 광고 준비 중… | 광고를 재생하지 못했어요. 다시 시도해 주세요. |

- 로드: 최초 요청 → 실패 후 3초 뒤 두 번째 → 실패 후 6초 뒤 세 번째. 각 요청의 응답 시간은 별도입니다.
- 최종 로드 실패와 재생 실패에는 수동 `다시 시도`를 제공합니다. 설정 재진입·모달 재오픈은 최종 실패 상태를 초기화하지 않습니다. 이 상태는 메모리에서 관리하므로 앱 프로세스 재시작 시 새 세션으로 시작합니다.
- 재생 실패는 즉시 처리하고 실패한 광고와 대기 광고를 폐기합니다. 수동 재시도는 새 최대 3회 로드만 수행합니다. 새로 활성화된 Watch Ad를 눌러야 모달 제거 후 다음 프레임에 한 번 표시를 요청합니다.
- 영어 준비 버튼은 `Preparing Ad...`입니다. 상태·버튼 문구는 지원 언어 7개로 제공하며, 가장 긴 문구의 공간을 최초 레이아웃부터 예약합니다. 작은 화면에서는 본문만 스크롤하고 닫기·다시 시도·Watch Ad는 접근 가능하게 유지하도록 구현했습니다.
- 준비·실패 안내에 토스트·스낵바·추가 팝업을 사용하지 않습니다. 재생 실패 시 기존 리워드 모달에 안내합니다.
- 보상 이벤트를 받은 광고가 닫히면 2시간 Pro를 부여합니다. 실패 경로에서 보상을 지급하지 않습니다.
- 배너도 최초 요청과 3초·6초 재시도를 사용합니다. 최종 실패 안내는 10초 후 숨기되 영역 높이와 실패 상태는 유지하며, 문구 숨김으로 추가 요청하지 않습니다. 웹 이용 불가 안내도 10초 후 숨깁니다. 배너 컴포넌트를 새로 마운트하면 새 로드 주기이며, 리워드의 공유 실패 상태와는 별도입니다.
- 영구 구매자는 광고를 요청하지 않습니다. 구매 여부 확인 전 또는 확인 실패를 무료 사용자로 바꿔 광고를 요청하지 않습니다.
- Android 광고에는 immersive 옵션을 적용합니다. 현재 버전의 진입·재생·종료·복귀 전 구간에서 내비게이션 바가 한 프레임도 노출되지 않는지는 실기기 미검증입니다. 과거 Google Play 외부 설치 화면의 노출 제한은 이전 기록에 남아 있습니다.

## 로컬 APK 빌드 절차

실제 소스는 메인 폴더에서 수정하고, 활성 빌드 폴더는 **`C:/dev/Led Banner/artifacts/b`로 고정**합니다. 과거 `artifacts/local-builds/20260908-expo57`는 이동 전 절대 경로 캐시가 남은 보관본이며 재개하지 않습니다. 긴 경로와 임시 드라이브 연결 때문에 발생했던 실패는 이전 기록과 서명 정책에 설명돼 있습니다.

사용자가 APK 빌드를 요청하면 메인 작업 폴더에서 다음 래퍼를 실행합니다. 이 명령은 준비 후 실제 컴파일까지 수행합니다.

```powershell
& '.\scripts\build-local-apk.ps1'
```

- 기존 서명 인증서를 확인하고 동시 빌드를 막는 잠금을 확보합니다.
- 이전 APK·로그·소스 기록을 `artifacts/apk-runs/<실행 ID>/`에 보존합니다.
- `prepare-local-apk.cjs`가 Git 관리 파일과 Git에서 제외하지 않은 새 파일을 수집하고 추가·수정·삭제를 동기화합니다. 내용이 같은 파일은 다시 쓰지 않습니다. 삭제는 이전 소스 목록에 포함된 파일에만 적용합니다. 환경 파일·서명 키·생성 출력은 동기화 대상이 아닙니다.
- 패키지·lockfile·npm 설정·patch 변경 또는 설치 기록 누락 시에만 `npm ci`를 실행합니다. Expo 설정·플러그인·로컬 모듈·설정에서 참조하는 이미지·빌드 환경 파일·Node 버전·JDK/Android SDK 설치 메타데이터를 비교하고, 네이티브 입력 변경 또는 재설치 시에만 네이티브 출력을 재생성합니다. 기존 네이티브 폴더는 `artifacts/native-archives/<실행 ID>/`에 보관하며 자동 복원하지 않습니다.
- 단계 완료 기록은 설치·네이티브 준비가 성공한 뒤에만 갱신합니다. 실패한 준비를 다음 실행에서 완료 상태로 재사용하지 않습니다.
- 기존 내부 versionCode를 유지합니다. 최초 준비 시 소스와 빌드 폴더 모두 versionCode가 없으면 `-VersionCode <정수>`를 지정해야 합니다. `-ResumeNative`는 선택 사항이며 재설치·재생성이 필요하면 중단합니다.
- `--build-cache`, 네 가지 ABI, 현재 worker 제한을 유지합니다. 결과 APK·Gradle 로그·소스 해시·커밋 및 미커밋 여부·컴파일 시간을 실행별로 기록합니다.

자동화 첫 실행에서 SDK 메타데이터 경로 오류를 수정했으며, 재실행은 재설치·재생성 없이 7분 5초에 성공했습니다. 최초 실행은 기존 성공 로그와 source-revision 기록을 바탕으로 이전 소스 목록을 구성합니다. 최초 기준 기록 이전의 도구 변경과 설치/생성 파일의 수동 수정은 입력 파일 비교만으로 완전히 검증되지 않으므로 별도 확인이 필요합니다. 완성 APK의 서명·버전·SDK·ABI·내장 번들·광고/Billing·정렬 검증과 전체 로그 검토는 별도로 수행해야 합니다.

서명 원본은 `C:/AndroidSigning/com.minkyokim.sideledbannerapp`에 보관합니다. 키·비밀번호는 Git과 로그에 포함하지 않습니다. 세부 절차는 [서명 정책](docs/SIGNING_POLICY.md)을 따릅니다. 저장소 루트의 기존 `android/ios` 생성 폴더를 최신 빌드용으로 간주하지 않습니다.

`artifacts/`는 Git 제외 대상이므로 APK·로그·캐시는 클론에 포함되지 않습니다. EAS의 preview/production 설정과 로컬 내부 APK는 구분합니다. 최신 내부 APK는 R8 비활성으로 앱 mapping이 없으며, 스토어 제출 시에는 최적화 호환성·동일 빌드 mapping·AAB 포함·Play 등록을 별도로 확인해야 합니다.

## 배경 효과의 공백·자간 보존

일반 표시와 배경 효과 내부의 줄 배치는 `utils/skiaLineLayout.ts`를 공유합니다. 글자 윤곽 폭 대신 폰트의 glyph advance를 사용하고 공백에도 입력한 개수와 설정한 자간을 반영합니다. 배경 효과도 그리기에 사용하는 문자별 폰트로 폭을 계산하며, 한 줄 모드에서 선행 공백을 제거하지 않습니다. 글자 크기·배경의 표시 영역·스크롤 정책은 유지합니다. 이 수정은 edaf82b APK에 포함되어 컴파일 완료했으며, 별도 테스트·실기기 시각 검증은 미실행입니다.

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

`npm run reset-project`는 초기 템플릿 재설정용입니다. 앱 소스 디렉터리를 이동/삭제할 수 있으므로 실행 오류 해결이나 일반 개발 준비에 사용하지 않습니다.

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
│   │   └── buildCanvas.ts            # 캔버스 props 조합 유틸
│   ├── dev/
│   │   ├── proDebugFab.tsx           # Pro 상태 디버그 버튼
│   │   ├── rewardAdDebugFab.tsx      # 리워드 광고 디버그 버튼
│   │   └── sheetFetchDebugPanel.tsx  # 시트 fetch 디버그 패널
│   ├── admob/
│   │   └── bannerAd.tsx              # 설정 화면 배너 광고
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
│   ├── useRewardedAd.ts            # 리워드 광고 선로딩/표시 상태 훅
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
│   └── settingsContext.tsx          # 설정 값 컨텍스트
├── language/
│   ├── deviceLocale.ts              # 기기 로케일 변환
│   ├── effectSectionLabels.ts       # 효과 섹션 다국어 라벨
│   ├── matchSheetRows.ts            # 시트 라벨 매칭 유틸
│   ├── rewardAdLabels.ts            # 리워드 광고 라벨
│   └── textSectionLabels.ts         # 텍스트 섹션 다국어 라벨
├── utils/
│   ├── buildMarqueeTextBlob.ts      # Skia 텍스트 blob 생성
│   ├── ApiClient.ts                 # 외부 API 호출 경계
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
│   ├── build-local-apk.ps1        # 기존 서명 검증 후 Gradle 빌드
│   └── reset-project.js           # 초기 템플릿 재설정용, 일반 작업에 사용 금지
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
| [Expo](https://expo.dev/)                                                                       | ~57.0.20 | React Native 개발 프레임워크    |
| [expo-router](https://docs.expo.dev/router/introduction/)                                       | ~57.0.19 | 파일 기반 라우팅                |
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)                  | 4.5.1    | 마키 스크롤 애니메이션          |
| [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)        | ~2.32.0  | 터치/제스처 처리                |
| [expo-screen-orientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)        | ~57.0.2 | 전체화면 시 가로/세로 전환 제어 |
| [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)              | ~57.0.1 | 프리셋 버튼 그라디언트          |
| [@miblanchard/react-native-slider](https://github.com/miblanchard/react-native-slider)          | ^2.6.0   | 속도/크기/블러 등 슬라이더 UI   |
| [react-native-element-dropdown](https://github.com/hoaphantn7604/react-native-element-dropdown) | ^2.12.4  | 폰트 선택 드롭다운              |
| [react-native-svg](https://github.com/software-mansion/react-native-svg)                        | 15.15.4  | SVG 아이콘 (재생/정지 버튼 등)  |
| [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)   | ~5.7.0   | 노치/Safe Area 대응             |
| [@react-navigation/native](https://reactnavigation.org/)                                        | ^7.1.8   | 기존 의존성 (테마는 expo-router)          |
| [react-native-google-mobile-ads](https://docs.page/invertase/react-native-google-mobile-ads)    | 16.5.0  | AdMob 배너/리워드 광고          |
| [@amplitude/analytics-react-native](https://amplitude.com/docs/sdks/analytics/react-native/react-native-sdk) | ^1.8.0 | 사용 이벤트 분석 |

## Android 빌드 프로필

- `eas.json`은 원격 버전 번호를 사용합니다 (`appVersionSource: remote`).
- Android `preview`는 내부 배포 APK용이며 현재 자동 번호 증가가 없습니다. 같은 versionCode로도 소스가 다른 APK가 생성될 수 있으므로 커밋과 Build ID를 함께 기록합니다.
- Android `production`은 스토어 AAB용이며 `autoIncrement: true`입니다. 실제 versionCode는 완료된 빌드에서 확인합니다.
- V1.0.6 소스 변경 자체가 원격 versionCode 증가나 스토어 제출을 뜻하지 않습니다.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## 최신 소스 변경 메모

- Sunny's Games and Apps: `decibella2`를 `decibella` 바로 위에 배치하고 제공된 원본 아이콘 및 [OneLink](https://decibella2.onelink.me/T5UV/x5q1f7vs)를 사용합니다.
- 미사용 `language/translatorHandoff.ts`와 호출되지 않는 텍스트 계산 함수 4개를 삭제했습니다. 플랫폼별 파일, 원본 에셋, Pro 보관 화면과 빌드 캐시는 유지합니다.
- 과거 SDK 전환·보안 검사·기기 테스트·APK/AAB 상세 이력은 [이전 기록](docs/BUILD_HISTORY.md)에 보존합니다. 과거 버전·audit 수치·검증 범위는 당시 결과이며 최신 재검사를 의미하지 않습니다.

## 제출용 1.0.6 (23) 준비

- 사용자 확인 스토어 표시 버전: 1.0.5. 이번 Android 소스 버전은 1.0.6 (23)이며 Settings 표시도 기존 1.0.6을 유지합니다. Play의 가장 큰 숫자 versionCode는 확인되지 않았으므로 업로드 시 중복 여부 확인이 필요합니다.
- 숨은 화면 애니메이션 중단·재개와 Android 호스트 복귀 시 바 숨김 보강, QA 문서 및 증분 빌드 보완을 포함합니다.
- 제출 산출물은 기존 외부 서명 키로 scripts/build-local-apk.ps1 -IncludeBundle을 통해 함께 생성합니다. R8/resource shrinking과 같은 빌드의 AAB 내 매핑 일치를 검증합니다.
- 빌드 결과·해시·검증 범위는 완료 후 별도 제출 빌드 보고서로 기록합니다. Play 업로드/검수 제출은 이 파일 생성 작업에 포함되지 않습니다.

TypeScript 검증은 node_modules와 생성 산출물 artifacts를 제외합니다. 과거 빌드 복사본을 현재 소스로 중복 검사하지 않도록 범위를 고정했습니다.
