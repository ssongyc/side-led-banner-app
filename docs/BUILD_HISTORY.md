# LED POP 이전 변경·빌드 기록

README에 누적돼 있던 이전 작업 기록입니다. 각 절의 “현재”, “미검증”, “다음 빌드”는 **그 작업 당시**의 상태입니다. 현재 설정이나 작업 지시로 사용하지 마세요. 최신 소스·APK 포함 범위와 증분 빌드 절차는 [README](../README.md)를 기준으로 합니다. 과거 실기기 결과는 Expo 57 및 이후 변경의 검증을 대신하지 않습니다.

## 2026-09-07 직접 IAP 업데이트

- Apple StoreKit / Google Play Billing 상품 조회, 구매·복원, 구매 검증 및 영구 Pro 권한을 연결했습니다.
- 영구 Pro 구매자는 기존 모든 잠금 기능을 광고 없이 사용하며, 배너·보상 광고 요청과 표시를 차단합니다. 광고 보상의 2시간 Pro는 별도 상태로 유지합니다.
- 취소·승인 대기·실패·복원 내역 없음 상태를 7개 언어로 표시하고, 고정 가격 대신 스토어의 현지화 가격을 사용합니다.
- 외부 구매 관리 서비스나 서버 없이 iOS 현재 entitlement/StoreKit 검증, Android 현재 보유 내역/RSA 서명 검증을 사용합니다. 플랫폼 간 구매 이전이나 실시간 서버 환불 알림은 제공하지 않습니다.
- `constants/premium.ts`의 상품 ID, `.env.example`의 Google Play 공개키 설정, 네이티브 IAP 플러그인과 Android 검증 모듈을 추가했습니다.
- **남은 작업:** 양쪽 상품 등록·활성화, Google Play 공개키 설정 및 실기기 결제 검증. 앱 버전은 유지했습니다. 9월 7일 소스 변경 당시 빌드는 미실행이었으며, 9월 8일 Android APK 컴파일 결과는 아래에 기록합니다. iOS 빌드·스토어 업로드는 미실행입니다.
- 설정 값, 검증 제한 및 인계 체크리스트는 [IAP_SETUP.md](../IAP_SETUP.md)에 정리했습니다.

## 2026-09-08 Background Effects 추가

- Figma Style Sheet의 3개 배경을 기존 Speech 효과 뒤에 추가했습니다: **HELLO / MY NAME IS**, **Please take me here**, **TODAY IS**.
- 원본 가로·세로 PNG 6개를 로컬 에셋으로 저장했습니다. 편집 미리보기는 가로 원본, 전체 화면은 실제 화면 방향에 맞는 원본을 사용합니다. 제목과 위치 아이콘은 원본 영어 아트워크를 유지합니다.
- 흰색 본문 영역에 맞춰 배너 텍스트 박스의 너비·높이·상단 여백을 설정했습니다. 사용자 글자색·폰트·움직임 설정은 유지하며, Pixel 모드에서도 프레임 아트워크는 원본 색상으로 표시합니다.
- 기존 배경과 같은 Pro 잠금·광고 보상 해제·프리셋 저장 흐름에 연결했습니다. 영구 Premium 구매자는 광고 없이 사용합니다.
- 키보드 코드는 변경하지 않았습니다. 정적 diff/에셋 참조만 확인했으며 컴파일·린트·테스트·배포는 실행하지 않았습니다. 기존 APK에는 이 추가분이 포함되지 않습니다. 기기별 레이아웃·효과 조합은 미검증입니다.
- 원본: [Figma Style Sheet](https://www.figma.com/design/2yU4ley6gw6hGPMWOzT7lU/LED-Banner?node-id=278-2125). 노드 및 에셋 대응은 [배경 원본 기록](../assets/images/SignBoard_SOURCES.md)에 있습니다.

## 2026-09-08 Expo 57 로컬 APK 완료

- compile-ok: C:/LedPopBuild/20260908-expo57에서 assembleRelease 완료. BUILD SUCCESSFUL in 54m 33s, 1188 tasks (1046 executed / 142 up-to-date).
- APK: [LedPop-V1.0.6-Expo57-local.apk](../artifacts/LedPop-V1.0.6-Expo57-local.apk), 286,779,966 bytes. SHA-256: F440FD1F5FFA3148C619DD82836705115FD33C30209F51D635FC7E4120AF659B.
- 소스: main 227d57b의 작업 사본 + StyleSheet.absoluteFill 수정 + Kotlin 2.3.20 compiler/classpath 플러그인. Expo 57.0.20 / RN 0.86.3. 내부 설치용 버전 1.0.6/22이며 스토어 업로드용 버전 갱신이 아닙니다.
- 실제 APK 확인: package com.minkyokim.sideledbannerapp, minSdk 24, compileSdk/targetSdk 36/36, ARM64/ARMv7/x86/x86_64, v2 서명 기존 인증서 일치, ZIP 16KB 정렬 통과. debuggable 및 CAMERA/RECORD_AUDIO 권한 없음.
- 내장 JavaScript 번들, IAP·구매 서명 검증·리워드 광고 모듈, Premium 상품, 새 배경 PNG 6개를 확인했습니다. Billing은 manifest와 billing.properties 모두 9.1.0입니다. 앱은 production AdMob App ID 및 배너/리워드 Unit ID를 사용하며 SDK 내장 TestIds 상수의 존재는 테스트 광고 활성화를 뜻하지 않습니다.
- 생성된 release 설정의 R8은 기존 preview와 동일하게 비활성입니다. minifyReleaseWithR8 작업 및 앱 mapping은 없으며, 스토어 최적화·mapping 등록 완료를 뜻하지 않습니다. AAB/Play 업로드는 하지 않았습니다.
- 빌드에 포함된 lintVitalRelease는 통과했습니다. Gradle 10 비호환 deprecation, 서드파티 API 경고 및 Gradle metaspace 경고가 남습니다. 별도 린트·기기 실행·광고 표시/보상·실제 결제는 미검증입니다.
- D 드라이브에 생성했던 빌드 파일과 서명 키를 사용자 요청으로 C 드라이브로 이동했습니다. 빌드 76,937개 파일 복사 대조 후 D 원본을 제거했고, 서명 파일은 해시/인증서 검증 후 이동했습니다. 새 경로는 C:/LedPopBuild/20260908-expo57 및 C:/AndroidSigning/com.minkyokim.sideledbannerapp입니다. 이동 중 중단된 빌드와 이전 절대 경로 캐시 오류를 해결한 뒤 C에서 위 빌드를 완료했습니다.
- 재현/서명 정책: [docs/SIGNING_POLICY.md](../docs/SIGNING_POLICY.md), scripts/build-local-apk.ps1. 키/비밀번호는 외부 폴더에만 보관합니다. 이번 빌드 관련 수정은 커밋·푸시하지 않았습니다.

## 2026-09-08 Expo 57 APK 빌드 시도 (이전 기록)

- 기준 소스: main 227d57b + 아래 컴파일 수정. APK는 아직 생성되지 않았습니다.
- TypeScript 컴파일에서 RN 0.86의 제거된 absoluteFillObject 참조가 발견되어 StyleSheet.absoluteFill로 수정했습니다. 수정 후 npx tsc --noEmit 통과.
- EAS 56469913-098d-43ae-b933-db239b1779c6: Google Mobile Ads 25.4.0의 Kotlin 2.3 메타데이터와 실제 Kotlin 2.1 컴파일러 충돌로 실패.
- EAS ba3f7ecd-678c-4fe6-8bb9-7fddac1b0ec4: Kotlin 2.3.21 적용 후 Expo Pika 0.3.2-2.3.21 패키지 미배포로 실패.
- plugins/withAndroidKotlin.js에서 Gradle 속성과 실제 Kotlin 컴파일러 classpath를 모두 2.3.20으로 지정했습니다. Maven Central에 Pika 0.3.2-2.3.20이 존재함을 확인했습니다. 컴파일러 검증 우회나 SDK/광고 라이브러리 다운그레이드는 없습니다.
- 최종 2.3.20 수정의 세 번째 제출은 EAS 무료 Android 월간 빌드 한도 소진으로 접수되지 않았습니다. EAS가 표시한 초기화일은 2026-10-01입니다. 이 최종 조합의 네이티브 컴파일은 미검증입니다.
- 두 실행에서 Expo Doctor 21/21 통과, compileSdk/targetSdk 36/36 확인. npm moderate 19건은 남아 있습니다. 기존 EAS 서명 SHA-256은 이전 APK와 일치했습니다. 새 APK 서명/ABI/번들/광고 모듈/Billing/R8 산출물 검증 및 실기기 동작은 APK 미생성으로 수행하지 못했습니다.
- 로컬 기본 서명 경로 D:/AndroidSigning/com.minkyokim.sideledbannerapp 및 프로젝트 credentials.json은 없습니다. 기존 키를 생성·교체·내보내기하지 않았고 유료 플랜 결제·스토어 업로드·커밋·푸시는 실행하지 않았습니다.
- 빌드 로그는 무시된 artifacts/apk-56469913-*, artifacts/apk-ba3f7ecd-*, artifacts/apk-expo57-final-submit.log에 보존합니다.

## 2026-09-08 변경 묶음

- 메인 브랜치 반영 범위: Background Effects 3종과 원본 에셋, Expo 57 및 광고 SDK 업데이트, IAP 상품 타입 수정, 관련 문서.
- 아래 APK 컴파일 기록은 SDK 55 빌드 기록입니다. Expo 57 변경에 대한 컴파일·린트·테스트·배포는 별도 요청 전까지 실행하지 않습니다.

## 2026-09-08 SDK 업데이트

- `react-native-google-mobile-ads`를 16.3.3에서 16.5.0으로 업데이트하고 정확한 버전으로 고정했습니다. package-lock도 함께 갱신했으며 변경된 설치 패키지는 1개입니다.
- 패키지가 지정하는 Google Mobile Ads 네이티브 SDK는 Android 25.0.0 → 25.4.0, iOS 13.1.0 → 13.5.0입니다. 이는 의존성 설정 확인이며 새 APK/IPA에서 해석된 버전 검증은 아닙니다. 앱의 SDK 36 설정, 실제 광고 ID, 재시도·보상·immersive API 호출은 유지합니다.
- Expo **55.0.31 → 57.0.20**, React Native **0.83.10 → 0.86.3**, React/React DOM **19.2.0 → 19.2.3**으로 전환했습니다. SDK 56·57의 마이그레이션 항목을 함께 반영했습니다.
- 사용자의 키보드 변경 제한 해제에 따라 keyboard-controller **1.20.7 → 1.21.9**를 적용했습니다. 기존 키보드 UI·입력 동작은 재설계하지 않았습니다. Reanimated **4.5.1**, Worklets **0.10.1**, Gesture Handler **2.32.0**, Skia **2.6.2**, TypeScript **6.0.3** 및 관련 Expo 패키지를 SDK 권장 조합으로 정렬했습니다.
- 제거된 `InteractionManager`를 `requestIdleCallback`/취소 API로, `StyleSheet.absoluteFillObject`를 `absoluteFill`로 교체했습니다. 테마는 `expo-router`에서 가져오며, 내비게이션 바는 `NavigationBar.setHidden(true)`와 플러그인 `hidden: true`를 사용합니다.
- expo-modules-core 직접 의존성을 제거했습니다. Expo가 관리하는 **57.0.16** 한 개가 해석되며, IAP가 참조하는 Android Gradle 호환 파일이 존재합니다. Skia 사전 빌드 네이티브 라이브러리 설치를 완료했습니다.
- npm 설치와 `npm ls --depth=0`, 패키지 잠금 파일·SDK 공식 버전표 대조를 수행했고 버전 불일치는 없습니다. 이는 컴파일·런타임 검증이 아닙니다. Expo Doctor와 보안 audit는 재실행하지 않았으며, 과거 경고가 모두 해결됐다고 판단하지 않습니다.
- iOS 최소 버전은 **16.4**, iOS 빌드 도구는 **Xcode 26.4 이상**이 필요합니다. Android target/compile SDK 최소 36 소스 설정은 유지했으며 SDK 57의 실제 병합 manifest·서명 산출물은 아직 미검증입니다.
- 기존 무시된 android/ios 생성 폴더는 SDK 55 산출물일 수 있어 그대로 빌드하면 안 됩니다. 다음 승인된 네이티브 빌드에서 기존 서명을 보존하며 SDK 57 설정으로 갱신해야 합니다. SDK 57의 prebuild는 기본적으로 native 폴더를 재생성하므로 직접 실행 전에 생성 폴더 소유권과 서명을 확인합니다.
- IAP 5.5.1 및 Billing 설정, 기존 광고 정책과 새 배경 3종은 유지했습니다. 기존 APK `1cfedbc5`는 SDK 55 파일이며 이번 전환이 포함되지 않습니다. 이번 업데이트는 설치 및 정적 diff 확인만 수행했고 컴파일·린트·테스트·배포는 실행하지 않았습니다.
- 근거: [Expo 57](https://expo.dev/changelog/sdk-57), [Expo 56 마이그레이션](https://expo.dev/changelog/sdk-56), [키보드 1.21.9](https://github.com/kirillzyusko/react-native-keyboard-controller/releases/tag/1.21.9), [광고 16.5.0](https://github.com/invertase/react-native-google-mobile-ads/releases/tag/v16.5.0).

## 2026-09-08 APK 컴파일

- IAP 상품 조회 결과의 `in-app` 타입을 명시적으로 좁혀 TypeScript 컴파일 오류를 수정했습니다. `npx tsc --noEmit` 통과. 키보드 코드는 변경하지 않았습니다.
- `compile-ok`: Android preview 빌드 `1cfedbc5-0306-4113-8e65-68e9aebb89b0` 완료, Gradle `BUILD SUCCESSFUL in 29m 23s`. 기준 커밋 `c451d3a` + 위 타입 수정.
- APK: [LedPop-V1.0.6-preview-1cfedbc5.apk](../artifacts/LedPop-V1.0.6-preview-1cfedbc5.apk), 271,250,364 bytes. SHA-256 `7DEDC40EEAC6261F5F24111E646499E5BE42C462D11B6FFF47F67E4BCB91A7B4`.
- 실제 APK: package `com.minkyokim.sideledbannerapp`, 버전 `1.0.6/22`, minSdk 24, compileSdk/targetSdk 36/36, ARM64/ARMv7/x86/x86_64. 기존 인증서 v2 서명 일치 및 ZIP 16 KB 정렬 검사 통과. CAMERA/RECORD_AUDIO와 debuggable 표시 없음.
- Billing manifest 메타데이터와 `billing.properties` 모두 9.1.0. IAP·구매 서명 검증·리워드 광고 네이티브 모듈과 내장 번들 확인. 실제 AdMob ID를 사용하는 빌드이며 광고 노출·보상은 실기기 미검증입니다.
- 기존 preview 설정은 앱 R8 난독화를 활성화하지 않았으며 `:app:minifyReleaseWithR8` 실행과 앱 mapping 파일은 없습니다. 최적화 호환성 및 스토어 배포 준비 완료를 뜻하지 않습니다. AAB 생성·Play mapping 등록·기기 테스트·별도 린트는 미실행입니다.
- EAS 자동 Expo Doctor: 19/20 통과. IAP 호환성을 위해 직접 고정한 `expo-modules-core` 의존성 검사 1건 실패. npm moderate 19건이 남아 있습니다.

## 2026-09-08 보상 광고 모달 업데이트

- 상태 영역과 Watch Ad 문구는 모든 지원 언어의 준비·실패·버튼 문구를 최초 네이티브 레이아웃에서 같은 너비와 글꼴로 겹쳐 배치해 가장 높은 문구만큼 공간을 예약합니다. 측정용 문구는 보이지 않고 접근성 트리에서도 제외되며, 상태 변경에 따른 추가 높이 측정이나 팝업 확대가 없습니다.
- 모달 최대 너비는 스마트폰 380, 태블릿 560 논리 픽셀입니다. 부모의 상하 safe area를 중복 적용하지 않고 좌우 inset과 화면 내 여백을 확보합니다.
- 높이가 부족하면 혜택·상태 문구가 있는 본문만 세로 스크롤됩니다. 닫기와 하단 다시 시도/Watch Ad는 스크롤 밖에 유지합니다. Watch Ad는 최소 높이 56, 닫기·다시 시도는 최소 44이며 글자 축소·말줄임·줄 수 제한을 사용하지 않습니다.
- 모든 번역을 크기 예약 대상으로 포함했지만 스마트폰·태블릿의 실제 표시, 안전 영역 및 터치 동작은 아직 실기기 미검증입니다.
- 로딩 및 3초·6초 재시도 중에는 “광고를 준비하고 있어요. 잠시만 기다려 주세요.”를 표시하며, 비활성 버튼은 “광고 준비 중…”으로 표시합니다.
- 준비 완료 시 상태 문구를 비우고 Watch Ad를 활성화합니다.
- 3회 로딩 실패 후 “광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.”와 수동 “다시 시도”를 표시합니다. Watch Ad는 계속 비활성화하며 한국어 버튼 문구는 “광고 준비 중…”을 유지합니다.
- 수동 재시도는 최종 로딩 실패 상태에서만 새로운 최대 3회 로딩을 시작합니다. 로딩 성공으로 광고를 자동 재생하지 않습니다.
- 토스트·스낵바·추가 팝업은 사용하지 않습니다. 닫힘이 반영된 다음 프레임에, 준비된 광고에 대한 새 사용자 동작으로만 표시를 요청합니다.
- 키보드 관련 코드는 수정하지 않았습니다. 이 모달 업데이트는 9월 8일 APK `1cfedbc5`에 포함되어 컴파일됐습니다. 실제 기기 테스트와 스토어 배포는 미실행입니다.

## SDK 54 당시 타입 및 호환성 오류 수정 기록

다음은 SDK 55 이전 기록입니다. 현재 선언은 keyboard-controller 1.21.9, expo-file-system ~57.0.6이며 아래 과거 버전을 다시 설치하지 않습니다.

- 당시 react-native-keyboard-controller 1.18.5 API에 맞춰 KeyboardToolbar.Content/Done 대신 content/doneText 속성을 사용합니다. 실행 취소/다시 실행 콜백과 체크 표시를 유지하고 닫기는 라이브러리 기본 버튼이 처리합니다.
- expo-file-system ~19.0.24를 직접 의존성으로 선언했습니다. 실제 설치 버전은 기존 Expo 내부 버전과 동일한 19.0.24이며, 원격 폰트 로더 코드는 변경하지 않았습니다.
- 당시 tsc --noEmit 및 expo install --check --npm 검사를 통과했습니다. 이후 APK 컴파일 결과는 아래 빌드 기록을 따릅니다. 키보드/다운로드 동작의 별도 실기기 검증은 기록되어 있지 않습니다.

## 보안 의존성 업데이트

- 기존 의존성 범위 안에서 brace-expansion (1.1.18/2.1.4/5.0.9), fast-uri (3.1.7), js-yaml (3.15.2/4.3.2), nanoid (3.3.18), @humanfs/node (0.16.8), @xmldom/xmldom (0.8.15)을 갱신했습니다. 필요한 @humanfs/core 갱신과 @humanfs/types 추가도 포함합니다.
- 변경은 package-lock.json과 로컬 설치 상태에 반영했습니다. 보안 갱신 단계에서는 직접 의존성 선언과 Expo/Router/Amplitude/AsyncStorage 버전을 유지했으며 강제 override는 추가하지 않았습니다.
- SDK 55 호환 의존성 정렬 후 npm audit는 19건(moderate 19, high/critical 0)입니다. 결과는 조회 시점 기준이며 강제 audit fix는 적용하지 않았습니다.
- AsyncStorage 통합 후 Expo Doctor는 20/20을 통과했습니다. 남은 npm audit 경고는 moderate 19건이며 high/critical은 0건입니다. 아래 결과는 2026-09-07 검증 기준입니다.

### AsyncStorage 통합 및 Amplitude 검증 (2026-09-07)

- `package.json`의 npm `overrides`로 `@react-native-async-storage/async-storage`를 `2.2.0`으로 통일했습니다. Amplitude 1.8.0의 내부 의존성도 동일한 설치본을 사용합니다. 상위 라이브러리 의존성 선언을 재정의하는 조치이며 라이브러리 자체 업데이트로 해결된 것은 아닙니다.
- `package-lock.json` 변경 없이 `npm ci` 후 중복 설치 제거를 확인했습니다. Expo Doctor 20/20, TypeScript, ESLint, Expo 권장 의존성 검사를 통과했습니다. npm audit moderate 19건은 별도 잔여 항목입니다.
- Amplitude는 LED POP 프로젝트의 활성 API 키를 사용합니다. EAS development/preview/production 설정 일치를 확인했으며 키 값은 문서에 기록하지 않습니다. 로컬 `.env`가 없는 검증 환경에서는 Metro 프로세스의 환경 변수로 전달했습니다.
- Samsung `SM-M336K`에서 개발 APK 설치 및 현재 소스 실행을 확인했습니다. 한국어 설정의 재시작 유지를 확인한 뒤 영어로 복구했고 영어도 재실행 후 유지됐습니다. 기존 프리셋 저장 데이터가 남아 있는 것도 확인했습니다.
- Amplitude 저장 레코드에서 재실행 전후 `deviceId` 유지와 `userId == deviceId`를 확인했습니다. 실제 ID 값은 기록하지 않습니다. 확인한 실행 로그에는 Android 크래시나 JavaScript 오류가 없었습니다.
- iOS 실기기와 Amplitude 대시보드의 실제 이벤트 수신은 미검증입니다. Android 로컬 저장 검증만으로 서버 수신이나 iOS 호환성을 보장하지 않습니다.

### 잔여 의존성 위험 및 업데이트 절차 (2026-09-07)

- `npm audit --json` 재조회: moderate 19, high/critical 0. 종료 코드 1은 취약점이 남아 있음을 뜻합니다. 19개는 독립 취약점 19종이 아니라 두 advisory의 상위 의존성 전파를 포함한 패키지 항목 수입니다.
- 현재 설치: Amplitude 1.8.0, Expo 55.0.31, Expo Router 55.0.18, Expo CLI 55.0.36. `npm ls`에서 AsyncStorage는 2.2.0 단일 설치입니다. Android 실기기 검증은 위 기록을 적용하며 iOS는 미검증입니다.

| 원인 | 설치 경로 | 위험과 현재 판단 |
| --- | --- | --- |
| decode-uri-component 0.2.2 | expo-router 55.0.18 → query-string 7.1.3 → decode-uri-component; 별도 경로: @react-navigation/native 7.3.18 → core 7.21.13 → 같은 query-string | 조작된 인코딩 입력에 의한 CPU 과점유/응답 불능. 앱 실행 경로와 관련되므로 단순 개발 도구 경고로 취급하지 않습니다. |
| uuid 7.0.3 | expo 55.0.31 → @expo/config-plugins 55.0.11 → xcode 3.0.1 → uuid | v3/v5/v6의 외부 출력 버퍼 경계 검사 문제. 확인한 xcode generateUuid는 버퍼 없는 uuid.v4()를 사용하므로 이 호출은 취약 조건에 해당하지 않습니다. iOS 프로젝트 생성 도구 경로이며 모든 호출의 안전을 보장하는 결론은 아닙니다. |

- URL 계열 8항목: `decode-uri-component`, `query-string`, `@react-navigation/core`, `@react-navigation/native`, `@react-navigation/elements`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`, `expo-router`.
- uuid/도구 계열 11항목: `uuid`, `xcode`, `@expo/config-plugins`, `@expo/config`, `@expo/cli`, `@expo/local-build-cache-provider`, `@expo/metro-config`, `@expo/prebuild-config`, `expo`, `expo-splash-screen`, `react-native-google-mobile-ads`. AdMob 항목도 이 의존성 전파에 따른 것이며 광고 SDK 자체 취약점 발견을 뜻하지 않습니다.
- 외부 URL 정적 확인: `sideledbannerapp` 스킴을 받는 Expo Router의 `getLinkingConfig`는 자체 fork `getStateFromPath`를 사용하고 해당 `parseQueryParams`는 URLSearchParams를 사용합니다. 이 수신 경로에서 취약 디코더 직접 호출은 확인하지 못했습니다. React Navigation core의 기본 getStateFromPath에는 query-string.parse 호출이 남아 있습니다. 이번 확인은 악성 입력 실기기 재현이나 모든 경로의 비도달 증명이 아닙니다.
- 근거: [decode-uri-component advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr)는 0.5.0을 수정 버전으로 제시합니다. [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq)는 11.1.1/12.0.1/13.0.1 수정 계열을 제시합니다. 자식만 강제 교체하지 않고 부모 패키지의 호환 의존성 채택을 확인합니다.
- audit 제안에는 Expo 46.0.21, Router 5.1.11, AdMob 13.6.1로의 다운그레이드와 SDK 범위를 벗어난 splash-screen 변경이 포함됩니다. `npm audit fix --force`로 적용하지 않습니다.

#### 패키지를 업데이트할 때마다 수행

1. Amplitude, Expo Router 또는 Expo/내부 CLI 업데이트 작업에서 이 절을 다시 확인합니다. CLI는 Expo SDK와 맞는 버전으로 갱신하며 독립 강제 고정하지 않습니다.
2. 후보 버전의 dependencies, 공식 변경 이력, SDK 호환성을 확인합니다. `npm view @amplitude/analytics-react-native@latest version dependencies --json`으로 조회한 최신 1.8.0도 AsyncStorage `^1.17.11`을 요구하므로 현재 override 제거 조건은 충족되지 않았습니다.
3. 업데이트 후 `npm ls @react-native-async-storage/async-storage query-string decode-uri-component xcode uuid --all`과 `npm audit --json`을 확인합니다. 수치뿐 아니라 경로, advisory 범위, 실제 호출의 변화를 이 절에 기록합니다.
4. 승인된 업데이트 검증에서 Expo Doctor, Expo 권장 의존성 검사, TypeScript/ESLint 및 Android/iOS 개발 빌드와 실기기 저장/라우팅 검증을 수행합니다. 기기가 없거나 iOS 빌드가 막히면 해당 결과를 미검증으로 남깁니다.

#### 임시 override 제거 조건

- AsyncStorage override는 이 패키지 하나에만 적용합니다. 새 부모 의존성이 Expo 호환 AsyncStorage 단일 버전을 정상적으로 허용하면 해당 override를 제거하고 정상 설치로 lockfile을 갱신합니다.
- override 없는 `npm ci`와 `npm ls`에서 중복/invalid가 없어야 하고 Expo Doctor가 통과해야 합니다. 언어·프리셋 저장, 재시작 후 Amplitude deviceId 유지 및 userId 일치, Android/iOS 호환성 검증을 기록한 뒤 제거를 확정합니다. ID/API 키 값은 문서에 남기지 않습니다.
- 보안 경고는 별도 조건입니다. Router/query-string 및 Expo/config-plugins/xcode가 수정된 디코더/uuid를 채택하고 설치 트리와 audit에서 해소를 확인한 항목만 해결로 표시합니다. AsyncStorage override 제거가 npm 19건까지 해결한다는 뜻은 아닙니다.
- 이 절은 업데이트 작업 시 수행할 유지보수 절차입니다. 백그라운드 자동 감시나 자동 의존성 변경은 구성하지 않았습니다.

## Expo SDK 55 업데이트

- Expo SDK 55.0.31, React Native 0.83.10, React 19.2.0 기준으로 호환 패키지를 정렬했습니다.
- Android의 유효 compileSdk/targetSdk는 생성 APK에서 36/36으로 확인했습니다.
- 웹에서는 AdMob과 원격 폰트의 플랫폼 경계를 분리하고 Skia CanvasKit 초기화 후 RuntimeEffect를 컴파일하도록 조정했습니다. TypeScript, ESLint 및 웹 번들/HTTP 실행 검사는 통과했습니다.
- Expo Router가 `app/_layout.web.tsx`를 Android 라우트 컨텍스트에도 포함하면서 CanvasKit의 Node `fs` 참조가 Android 번들을 막는 문제를 확인했습니다. 라우트 디렉터리 밖의 `RootLayoutEntry(.web).tsx`로 플랫폼 경계를 옮겨 Android 번들과 웹 정적 export를 모두 통과시켰습니다.
- Android 개발 APK는 EAS에서 컴파일되고 Samsung Galaxy Jumper 2 (`SM-M336K`)에 설치됐습니다. 현재 소스를 Metro로 실행해 메인/Settings/Upgrade to Pro 화면, 상단 안전 영역, `V1.0.6` 표시를 확인했습니다.
- 앱 언어를 영어에서 한국어로 바꾸고 강제 종료/재실행한 뒤 한국어가 유지되는 것을 확인했으며, 테스트 후 영어로 복원하고 다시 재실행해 영어가 유지되는 것도 확인했습니다. 당시 남았던 AsyncStorage 중복은 이후 위의 통합 작업으로 제거했고 Android 저장 동작을 다시 확인했습니다.
- 실제 AdMob 리워드 광고는 준비된 광고만 한 번 표시하고 다음 슬롯을 선로딩하는 흐름을 확인했습니다. Android 광고 표시에는 SDK의 `immersiveModeEnabled`를 사용하며 광고 `AdActivity` 진입과 앱 복귀 표본에서 내비게이션 바가 숨겨졌습니다.
- 광고 CTA가 외부 Google Play (`com.android.vending`) 설치 화면을 열면 해당 외부 화면의 내비게이션 바는 표시됐습니다. 앱이나 광고 SDK가 소유하지 않는 화면이라 이 경로까지 절대 숨김을 보장할 수 없으며, 프로젝트의 “광고 중 한 프레임도 표시 금지” 요구는 이 외부 화면 경로에서는 충족되지 않습니다.
- iOS 개발 빌드는 내부 배포에 적합한 자격 증명을 EAS가 찾지 못해 시작되지 않았습니다. 새 인증서나 기기 등록은 수행하지 않았습니다.
- SDK 56은 이전 조사 당시 React Native 0.85, iOS 16.4 이상/Xcode 26.4 요구사항과 Reanimated/Worklets 앱의 Hermes 메모리 회귀를 이유로 적용하지 않았습니다. 이는 당시 판단이며 다음 업데이트 검토에서 공식 요구사항과 수정 여부를 다시 확인해야 합니다.

## V1.0.6 업데이트

- Settings, Open Source Info, Credits, Sunny's Games and Apps, Upgrade to Pro의 Back 헤더 왼쪽 여백을 15에서 10으로 통일했습니다. 오른쪽 여백은 15로 유지합니다.
- 위 다섯 화면의 헤더 제목은 스마트폰 22, 태블릿 28로 통일했습니다. `Dimensions.get("screen")`의 짧은 변이 600 이상이면 태블릿으로 분류하며, 제목에는 `moderateScale()`을 적용하지 않습니다. 시스템 글자 크기 영향을 받지 않고 긴 제목은 줄바꿈을 허용합니다. 메뉴/본문 폰트와 폰트 파일은 변경하지 않았습니다.
- 헤더 변경은 소스 정적 검토만 수행했습니다. 새 빌드, 린트, 테스트 및 실기기 검증은 수행하지 않았습니다. 앱 버전은 V1.0.6으로 유지합니다.
- 최근 정적 참조 점검으로 루트 `index.js`, `assets/firworkAnim.json`, `assets/images/settings.png`, `assets/images/icon.png`를 삭제했습니다. 합계 412,299 bytes는 소스 파일 크기이며 APK 용량 감소 실측값이 아닙니다. 이 정리는 `eb8f5b17` APK에 포함됐으며 이전 `1ca3ebb0` APK에는 포함되지 않았습니다. 사용 중인 API와 폰트 코드는 유지했습니다.

- Android 사용자 스와이프로 표시된 내비게이션 바를 즉시 다시 숨기던 가시성 리스너를 앱 루트와 LED 전체 화면에서 제거했습니다. 앱/전체 화면 진입 시 숨김은 유지하며 사용자 스와이프에 반응해 즉시 다시 숨기는 리스너는 사용하지 않습니다.
- 앱 콘텐츠의 `onTouchStart`에서 기존 `hideAndroidNavigationBar`를 호출하도록 루트 `SafeAreaProvider`, LED 전체 화면 모달, 개발용 시트 디버그 모달에 연결했습니다. 터치 응답권을 가져오거나 이벤트 전파를 중단하는 코드는 추가하지 않았습니다. Google Play 설치 패널 등 외부 앱 창에는 적용되지 않습니다.
- 터치 시 숨김 변경은 `eb8f5b17` APK에 포함됐습니다. 사용자가 하단 스와이프 표시, 콘텐츠 터치 숨김과 버튼/스크롤 정상 동작, 전체 화면 및 광고 복귀 후 동일 동작의 세 항목 모두 실기기 테스트 통과를 보고했습니다. 이는 사용자 보고이며 별도 프레임 단위 계측이나 모든 내비게이션 모드 검증을 뜻하지 않습니다.
- 리워드 광고의 Android `immersiveModeEnabled` 설정은 유지했습니다. 이 변경 이후 광고 진입/재생/종료/복귀 전체의 내비게이션 바 노출 여부는 다시 검증해야 합니다.

- 정적 성능 점검: 동일한 값의 설정/UI 업데이트는 기존 상태 객체를 유지하고, 고정 배경 팔레트 행 분할은 모듈 로드 시 한 번만 계산합니다. 폰트/애니메이션 로직은 변경하지 않았으며 실측 성능은 확인하지 않았습니다.

- 정적 참조 확인 후 미사용 appModalIcon 상수 파일, 사진 시트/Sunny 목록 스타일, SliderThumb와 전용 스타일/타입, useSettingsContent 훅, 미사용 라벨 키 목록 및 시트 로케일 별칭을 삭제했습니다. 폰트 계산 코드와 번역 인계 도구는 유지했습니다.
- Android 설정 및 Upgrade to Pro 화면에도 기기의 상단 안전 영역을 적용하고, 헤더 내부 10dp 여백을 유지합니다. `SM-M336K`에서 두 화면의 헤더가 상단 inset 아래에 배치되는 것을 확인했습니다.
- 앱 설정과 패키지 버전을 1.0.6으로 변경했습니다. Settings의 App Version은 Expo 설정을 읽어 V1.0.6으로 표시합니다. Android versionCode는 이번 변경에서 올리지 않았습니다.
- 설정 아이콘의 가로/세로 크기를 기존의 85%로 줄였습니다. 터치 영역은 유지합니다.
- 밝은 배경의 뒤로가기 아이콘은 검정, 어두운 구매 화면의 아이콘은 흰색으로 표시합니다.
- Upgrade to Pro의 가격 줄을 페이지 세로 중앙에 배치합니다. 화면 높이가 부족하면 스크롤하여 내용을 확인할 수 있습니다.
- Upgrade to Pro 가격은 스토어의 실제 현지화 가격을 표시합니다. 이전 $6.99 CAD 플레이스홀더는 사용하지 않습니다. 상품 등록 및 Google Play 공개키 설정 전에는 구매할 수 없습니다. [IAP_SETUP.md](../IAP_SETUP.md)를 참고합니다.
- 초기 V1.0.6 아이콘/안전 영역/가격 위치 변경은 e75a4bb APK에 포함됐습니다. 이후 SDK 55, 네비바 리스너 제거 및 최근 파일 삭제는 각각 별도 작업이며 아래 Build ID별 포함 범위를 따릅니다.

## V1.0.5 변경 이력

이 절은 당시 작업 기록입니다. 현재 소스 버전과 검증 상태는 위의 현재 상태 및 V1.0.6 항목을 기준으로 합니다.

- 앱 버전을 `1.0.5`로 변경하고 설정 화면의 App Version 표시를 `V1.0.5`로 맞췄습니다.
- 저장된 앱 언어, 기기/시스템 언어, 영어 순서로 언어를 결정합니다. 중국어는 번체 조건(`zh-Hant`, `zh-TW`, `zh-HK`, `zh-MO`)을 먼저 검사한 뒤 나머지 `zh-*`를 간체로 처리합니다.
- 앱 소유 텍스트가 스마트폰 시스템 텍스트 크기에 영향을 받지 않도록 기본 Text/TextInput scaling을 차단했습니다.
- Android 네비게이션 바 숨김 처리를 시스템 UI 경계로 분리했고, iOS 주요 화면은 Status Bar safe area 아래에 배치했습니다.
- Google Sheets HTTP 요청은 `utils/ApiClient.ts`의 `fetchText`를 통해 호출합니다. Amplitude와 AdMob SDK 호출은 현재 앱/광고 코드에 있으므로 모든 외부 연동이 ApiClient로 통합된 상태는 아닙니다.
- 리워드 광고는 앱 시작 및 Settings 진입 시 선로딩하고, 실패 시 3초/6초 후 최대 3회까지 제한해서 시도합니다. 광고 표시 버튼은 모달이 화면에서 제거된 뒤 다음 프레임에 광고를 표시합니다.
- 배너 광고는 visible placement 마운트 후 요청하고, 실패 시 3초/6초 후 최대 3회까지 제한해서 시도합니다.
- 사용하지 않는 것으로 확인된 파일과 이미지 에셋을 삭제했고, PNG 이미지는 화질 변화 없는 무손실 최적화만 적용했습니다.
- 명백한 중복 레이아웃 상태 업데이트와 production debug component 마운트만 좁게 정리했습니다.
- Expo SDK 54 호환 패키지 정리 당시 `expo install --check --npm`가 통과했습니다. 이번 README 점검에서 이 명령을 재실행하지 않았습니다. 최근 EAS 빌드의 진단 결과는 아래 빌드 기록에 구분했습니다.
- Amplitude를 `^1.8.0`으로 업데이트했습니다. 당시 설치한 버전에도 내부 `@react-native-async-storage/async-storage@1.24.0` 의존성이 남아 있어 중복 경고는 해소되지 않았습니다.
- Android에서 사용하지 않는 `RECORD_AUDIO` 권한을 삭제했고, `expo-image-picker`가 생성할 수 있는 `CAMERA`/`RECORD_AUDIO` 권한은 `blockedPermissions`로 차단했습니다. 사용하지 않는 iOS 카메라 권한 문구도 제거했습니다.
- Amplitude 초기화 후 deviceId를 `setUserId`로 전달하고, 앱 기능에는 영향을 주지 않는 프로덕션 콘솔 로그를 개발 모드로 제한했습니다.

## 설정 및 구매 화면 최초 구현 (V1.0.5, 커밋 54c50af)

- 메인 화면의 설정 아이콘과 설정/크레딧/오픈소스 정보/Sunny 목록/구매 화면의 뒤로가기 아이콘을 제공된 PNG 에셋으로 교체했습니다.
- 설정 화면은 iOS에서 상단 safe-area inset을 적용하며, 구매 화면에도 iOS 상단 및 하단 safe area를 적용했습니다. 실기기 노치 배치는 아직 확인하지 않았습니다.
- Language 위에 Upgrade to Pro 항목을 추가하고 /premium 화면으로 연결했습니다.
- 구매 화면에 검정 배경, 커피잔 아이콘, LED POP Premium 상품 설명, 보라색 가격 영역, 구매 복원 문구, Sunny 로고와 Terms/Privacy 링크를 추가했습니다.
- 새 문구는 한국어, 영어, 일본어, 중국어 번체/간체, 프랑스어, 스페인어로 등록했습니다. 새 화면의 Text에는 allowFontScaling={false}를 적용했습니다.
- 추가 에셋: icon_arrow_back_DT_xxhdpi.png, icon_config_DT_xxhdpi.png, icon_donation_DT_xxhdpi.png, SIL_logo_setting_mini_white_text.png (assets/images/).

### 결제 담당자 인계

- 당시 구현은 구매 화면 UI였으며 결제/복원 동작은 없었습니다. 현재 소스의 IAP 연결과 남은 설정은 [IAP_SETUP.md](../IAP_SETUP.md)를 참고합니다.
- 당시 $6.99 CAD는 제공된 디자인의 고정 표시였습니다. 현재 소스는 스토어 상품의 현지화된 가격을 조회하도록 변경되었습니다.
- 이후 상품 조회, 결제, 구매 복원, 구매 검증 및 Pro 권한 반영을 구현했습니다. 외부 호출은 기존 `utils/ApiClient.ts` 경계에 모았습니다.
- 최초 UI 구현은 V1.0.5 APK `54c50af`에 포함되어 컴파일됐습니다. 이후 V1.0.6에서 변경한 아이콘 크기/색상, Android 안전 영역, 가격 위치 및 미사용 코드 정리는 e75a4bb APK에 포함됩니다. 이후 SDK 55 개발 빌드의 화면 확인 당시에는 결제 기능이 미연동이었습니다. 2026-09-07에 추가한 IAP 코드는 이 빌드들에 포함되지 않으며, 결제 동작은 아직 미검증입니다. 검증 범위는 각 빌드 기록을 따릅니다.

## Android 빌드 기록

`artifacts/` 파일은 Git에서 제외되어 있어 저장소를 클론해도 함께 내려오지 않습니다.

### 광고 종료 패널 실기기 확인 (2026-09-07)

- Samsung `SM-M336K`의 ADB 창 정보에서 LED POP `com.google.android.gms.ads.AdActivity`가 전면일 때 navigationBars `visible=false`를 확인했습니다.
- 이후 `com.android.vending/com.google.android.finsky.transparentmainactivity.HsdpAlias`가 전면으로 전환되면서 navigationBars `visible=true`로 바뀌었습니다. `mControlTarget`도 Google Play 창이었습니다. 광고 종료 패널에서 네비바가 보이지 않아야 한다는 요구는 이 경로에서 미충족입니다.
- LED POP에서 열린 패널이지만 Google Play가 별도 소유하는 창입니다. LED POP의 가시성 리스너를 복구해 이 창을 제어할 수 있다고 가정하지 않습니다.
- 이번 확인은 창 상태 표본이며 한 프레임 단위 전체 흐름, 광고 보상, 일반 화면의 사용자 스와이프 검증은 아닙니다. 당시 설치 파일 해시를 기기에서 대조하지 않았으므로 특정 Build ID의 완전한 실기기 검증으로 간주하지 않습니다.

### 내부 설치용 APK: V1.0.6 / 22 (콘텐츠 터치 숨김, 2026-09-07)

- EAS Build ID: `eb8f5b17-3e90-43db-bbe5-2d369e362249`, `preview / INTERNAL`, 소스 커밋 `0dd6b0b1c9b2844b36e8afbad682b1343f304559`.
- 파일: `artifacts/LedPop-V1.0.6-preview-0dd6b0b-eb8f5b17.apk`, 267,796,126 bytes. SHA-256: `D703AD2691036F21391540182D198A306B97486065C0421502CB2F1CB09005E4`.
- `compile-ok`: Gradle `BUILD SUCCESSFUL in 25m 3s`, 최종 업로드 완료. TypeScript 및 EAS Expo Doctor 20/20 통과. npm moderate 19건은 남아 있습니다.
- APK의 package `com.minkyokim.sideledbannerapp`, 버전 `1.0.6/22`, minSdk 24, compileSdk/targetSdk 36/36, ARM64/ARMv7/x86/x86_64, 기존 인증서의 v2 서명 검증을 확인했습니다.
- 실제 AdMob App ID/광고 Unit ID, 네이티브 리워드 모듈, 내장 JS 번들을 확인했습니다. Metro 없이 실행합니다. ZIP 정렬 검증 통과는 네이티브 ELF/16KB 실기기 호환성 전체 검증을 뜻하지 않습니다.
- 사용자 실기기 확인: 하단 스와이프 표시, 앱 콘텐츠 터치 숨김과 버튼/스크롤, 전체 화면 및 광고 복귀 후 동작 모두 통과. 외부 Google Play 창 제어 제한 및 프레임 단위 무노출 검증은 이 결과와 구분합니다.
- 이후 Back 여백 10 및 헤더 폰트 22/28 변경은 미포함입니다. AAB 생성, Play 업로드 및 mapping 등록은 수행하지 않았습니다. R8 app minify 작업 및 app mapping은 이 빌드에서 확인되지 않았습니다.

### 이전 내부 설치용 APK: V1.0.6 / 22 (네비바 수정 포함)

- EAS Build ID: `1ca3ebb0-c895-4d8a-8ef3-20f674eb7262`, 프로필/배포: `preview / INTERNAL`.
- 파일: `artifacts/LedPop-V1.0.6-preview-1ca3ebb0.apk` (267,796,078 bytes). 검증 기록: `artifacts/LedPop-V1.0.6-preview-1ca3ebb0-verification.md`.
- SHA-256: `2683A8D1C8A73DC28C6F5071264242A337E51D020E47F91F55809D1E9924F75C`.
- `compile-ok`: Gradle `BUILD SUCCESSFUL in 30m 55s`, 전체 기록 단계 성공, 오류 수준 로그 0건. TypeScript 및 EAS Expo Doctor 20/20 통과. npm moderate 19건과 라이브러리 deprecated API 경고는 남아 있습니다.
- 빌드 소스: `ff0919d5dff041180ca3fdbf563e01c777a78cf3`와 당시 미커밋 네비바 리스너 제거 및 README 변경. EAS Git SHA만으로 업로드 소스를 식별할 수 없습니다.
- APK 검사: package `com.minkyokim.sideledbannerapp`, versionName/versionCode `1.0.6/22`, minSdk `24`, compileSdk/targetSdk `36/36`, ABI ARM64/ARMv7/x86/x86_64, debuggable 표시 없음.
- APK v2 서명 검증 통과. 기존 인증서 SHA-256 `730173560958735bf237ca84ba4f35bbe76a6734986929eb65f6ced63d3fd893`와 일치합니다.
- Manifest의 실제 AdMob App ID, 내장 JavaScript의 실제 배너/리워드 Unit ID와 immersive 옵션, DEX의 네이티브 리워드 모듈을 확인했습니다. 실제 광고 노출/보상은 이 APK에서 미검증입니다.
- `assets/index.android.bundle` 내장 확인. `zipalign -c -P 16 4` 통과는 ZIP 정렬 확인이며 네이티브 ELF 및 16KB 실기기 호환성 전체 검증은 아닙니다.
- 앱 R8 minify 작업은 실행되지 않았고 앱 mapping은 생성되지 않았습니다. AAB 및 Play mapping 등록 검증을 의미하지 않습니다.
- 빌드 완료 시 APK 실기기 검증은 수행하지 않았습니다. 이후 광고 창 상태 표본은 위 절에 별도 기록했으며 이 APK와의 해시 대조 및 네비바 스와이프/광고 전체 흐름 검증은 남아 있습니다. 구매 UI는 미연동이며 Google Play에는 업로드하지 않았습니다.

### AsyncStorage 통합 개발 APK: V1.0.6 / 22 (2026-09-07)

- EAS Build ID: `dd08ca61-8e46-4fc4-8693-2fec85814589`, 프로필/배포: `development / INTERNAL`.
- 파일: `artifacts/sdk55-asyncstorage-dedup-development.apk` (320,698,124 bytes).
- SHA-256: `983C88138B673509156BFB65D35E58DECA4A9FDB7FCA6168FDC7185AAD91B09C`.
- `compile-ok`: EAS 빌드 성공, 빌드 내 Expo Doctor 20/20 통과. 빌드 로그에서 override가 포함된 package.json과 npm ci 실행을 확인했습니다.
- APK 검사: package `com.minkyokim.sideledbannerapp`, versionName/versionCode `1.0.6/22`, compileSdk/targetSdk `36/36`, APK v2 서명 검증 성공. 기존 Android 서명 자격 증명을 사용했습니다.
- 빌드 당시 override는 미커밋 상태였으므로 EAS 메타데이터 Git SHA `c9726dc...`만으로 업로드 소스를 재현할 수 없습니다. 실제 아카이브에는 로컬 override 변경이 포함됐습니다.
- APK 크기와 해시는 아래 이전 개발 APK와 같습니다. 현재 JavaScript 소스는 Metro로 제공해 검증했으며 APK 해시만으로 이 소스 변경의 포함 여부를 판단하면 안 됩니다. 스토어 제출용 릴리스 빌드는 아닙니다.
- Android 실기기 결과와 미검증 범위는 위 AsyncStorage 통합 및 Amplitude 검증 절에 기록했습니다.

### SDK 55 개발 APK: V1.0.6 / 22

- EAS Build ID: `f42d9d4e-1a9d-44e2-9f73-c0875b153fc6`
- 프로필/배포: `development / INTERNAL`
- 파일: `artifacts/sdk55-development.apk` (320,698,124 bytes)
- SHA-256: `983C88138B673509156BFB65D35E58DECA4A9FDB7FCA6168FDC7185AAD91B09C`
- 소스: 빌드 당시 커밋되지 않은 SDK 55 작업 트리. EAS 메타데이터의 Git SHA와 동일하다고 간주하면 안 됩니다.
- 컴파일: EAS Build 성공. APK 검사에서 package `com.minkyokim.sideledbannerapp`, versionName/versionCode `1.0.6/22`, compileSdk/targetSdk `36/36`을 확인했습니다.
- ABI: ARM64/ARMv7/x86/x86_64. APK Signature Scheme v2 검증 성공, 인증서 SHA-256 `730173560958735bf237ca84ba4f35bbe76a6734986929eb65f6ced63d3fd893`.
- 실제 Android AdMob App ID와 배너/리워드 Unit ID가 설정되어 있습니다. 현재 소스를 Metro로 연결해 실제 리워드 광고의 로드, 표시, 보상, 닫기 및 다음 광고 선로딩을 확인했습니다.
- 실기기 설치와 앱 실행은 성공했습니다. 현재 소스의 Android 번들, 주요 화면, 언어 저장/복원, 앱 및 광고 `AdActivity`의 내비게이션 바 숨김을 확인했습니다. 외부 Google Play 설치 화면의 시스템 UI는 앱에서 제어할 수 없습니다.

### 이전 APK: V1.0.6 / 22 (e75a4bb)

- EAS Build ID: a804d924-b8f4-4f05-8351-02c8917ef444
- 프로필/배포: preview / INTERNAL
- 파일: artifacts/LedPop-V1.0.6-build22-e75a4bb.apk (274.28 MiB)
- SHA-256: 923249F22B8AE54B512017B90F1CB37DF7144125D4D0D62E55AD2F5550068392
- 소스: e75a4bb1304e5e1a5931516a7cb3b883c05fce9f
- 컴파일: BUILD SUCCESSFUL in 19m 8s. 로그: artifacts/a804d924-log-0.txt
- APK 검사: 기존 서명 일치, compileSdk/targetSdk 36/36, ARM64/ARMv7/x86/x86_64 포함, 실제 AdMob ID와 네이티브 모듈 포함. CAMERA/RECORD_AUDIO/BILLING 권한 없음.
- 앱 R8 작업은 실행되지 않았습니다. 실기기 UI/광고, mapping 및 Play 등록 완료를 의미하지 않습니다.
- 당시 expo doctor: 17/18 통과, AsyncStorage 중복 1건. 당시 audit: 35건. 이후 의존성 갱신 결과는 위 SDK 55 업데이트 항목을 기준으로 하며, 해당 변경은 이 APK에 포함되지 않았습니다.

### 이전 APK: V1.0.5 / 22 (54c50af)

- EAS Build ID: `f6484ea9-c439-40fb-87b8-2cd20289a8a7`
- 프로필/배포: `preview / INTERNAL`
- 파일: `artifacts/LedPop-V1.0.5-build22-54c50af.apk` (274.28 MiB)
- SHA-256: `897852A5AC945B7C3CF1DAE8AE01B57B5FC759052419098F5D53EF1539847249`
- 소스: `54c50af685d6c2778ca0693fc4b9520d3d86cc58`
- 컴파일: `BUILD SUCCESSFUL in 15m 5s`; 로그: `artifacts/f6484ea9-log-0.txt`
- APK 검사: 기존 서명 인증서 일치, compileSdk/targetSdk 36/36, ARM64/ARMv7/x86/x86_64 포함.
- AdMob: 실제 App ID와 배너/리워드 ID, 네이티브 모듈 포함 확인. 실제 광고 노출은 미검증입니다.
- CAMERA/RECORD_AUDIO/BILLING 권한은 APK 매니페스트에 없습니다. 구매 기능은 미연동입니다.
- 이 빌드에서 앱 R8 난독화 작업은 실행되지 않았습니다. 해당 빌드의 앱 mapping 파일은 확보하지 않았으며, 난독화 검증 또는 Play 등록 완료로 간주하지 않습니다.
- EAS 내장 `expo doctor`: 17/18 통과, AsyncStorage 중복 1건. 설치 단계 audit: 35건 (moderate 22, high 13). 현재 전체 의존성의 재점검 결과가 아닌 해당 빌드 당시 기록입니다.

### 이전 APK/AAB: V1.0.5 / 22

다음 두 파일은 위 APK와 별개이며 최초 구매 화면 UI 및 V1.0.6 변경을 포함하지 않습니다.

- AAB Build ID: `a257bda4-6332-4a14-a67a-89f78ed53948`
- AAB profile / distribution: `production / STORE`
- AAB artifact: `artifacts/LedPop-V1.0.5-production-build22.aab`
- AAB SHA-256: `C0F0647EE907139A51E0D345E520DE2D3C4CF74D541E3D25634FFB0BE15226C0`
- APK Build ID: `ce8ed722-75cb-422a-af04-4b2daa4fd97f`
- APK profile / distribution: `preview / INTERNAL`
- APK artifact: `artifacts/LedPop-V1.0.5-preview-build22.apk`
- APK SHA-256: `73C36FF68C4AED2AEE0DD7C1F6F64813C3F697DE0A934040315FC43867D65292`
- App version / Android versionCode: `1.0.5 / 22`
- Package: `com.minkyokim.sideledbannerapp`
- compileSdk / targetSdk: `36 / 36`
- Signing certificate SHA-256: `730173560958735bf237ca84ba4f35bbe76a6734986929eb65f6ced63d3fd893`
- Manifest AdMob App ID: `ca-app-pub-3506417530430977~7354080715`
- Manifest check: `CAMERA` and `RECORD_AUDIO` are absent in the APK and the AAB-derived universal APK.
- Google Play Billing check: no `com.android.vending.BILLING` permission or Billing Client dependency was found in source, lockfile, APK manifest, or AAB-derived manifest.

당시 빌드 경고:

- `expo doctor` reported duplicate native module dependencies for `@react-native-async-storage/async-storage`.
- 패키지 정리 당시 `expo install --check --npm`가 통과했습니다. 현재 검증을 의미하지 않습니다.
- `npm install` reported 33 audit findings after the compatible dependency updates. These were reported but not automatically changed.

## 2026-09-08 프로젝트 폴더 통합

- 메인 소스와 작업 위치: `C:/dev/Led Banner`.
- 완료된 빌드 복사본: `artifacts/local-builds/20260908-expo57`로 전체 이동했습니다. 기존 `C:/LedPopBuild`는 비어 있는 것을 확인한 뒤 제거했습니다. 위 빌드 기록의 이전 경로는 당시 실행 위치입니다.
- 이동 전후 APK 및 app.json 해시가 일치하며, 배포용으로 복사한 APK는 기존 `artifacts/LedPop-V1.0.6-Expo57-local.apk` 위치에 유지합니다.
- 빌드 스크립트는 메인 폴더 아래 `artifacts/local-builds`만 허용합니다. 이동한 복사본은 절대 경로 캐시가 남은 보관본이므로 재개를 차단했습니다. 다음 빌드는 최신 메인 소스로 새 복사본을 준비해야 합니다. 상세 절차는 `docs/SIGNING_POLICY.md`를 참고하세요.
- 서명 키는 기존 외부 경로 `C:/AndroidSigning/com.minkyokim.sideledbannerapp`에 유지합니다. 이번 통합에서는 컴파일·린트·테스트·커밋·푸시를 실행하지 않았습니다.
