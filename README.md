# LED POP (LED Banner App)

> 현재 메인 작업 저장소: https://github.com/ssongyc/side-led-banner-app

사용자가 입력한 텍스트를 LED 배너로 표시하는 Expo/React Native 앱입니다.

## 현재 상태

- 현재 소스 버전: **V1.0.6**. Settings의 App Version은 `app.json`의 버전을 읽습니다.
- 최근 생성 APK: **V1.0.6 / versionCode 22**, 내부 설치용 preview 빌드 `eb8f5b17-3e90-43db-bbe5-2d369e362249`. JavaScript 번들이 내장되어 Metro 없이 실행합니다. 사용자 실기기 테스트에서 네비바 스와이프 표시, 콘텐츠 터치 숨김과 버튼/스크롤, 전체 화면 및 광고 복귀 후 동작이 모두 통과했습니다. 이후 헤더 여백/폰트 변경은 이 APK에 포함되지 않았습니다.
- Upgrade to Pro는 구매 화면 UI만 구현되어 있습니다. 상품 조회, 결제, 복원 및 구매를 통한 Pro 권한 활성화는 미연동입니다.
- 아래 빌드 기록은 생성된 산출물 기록이며 Google Play/App Store의 현재 배포 버전을 뜻하지 않습니다.

## Features

- 사용자가 입력한 텍스트를 Banner 형태로 표시.
- 한 줄/ 여러 줄 재생 모드 선택 가능.
- 텍스트 스타일, 배경 스타일, 이펙트 설정 가능
- iOS/Android 대상

## 사전 요구사항

- Node.js 20.19.4 이상 (설치된 React Native 0.83.10의 engines 요구사항 기준)
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

2. 의존성 설치

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
│   ├── premium.tsx              # Upgrade to Pro 구매 화면 UI (결제 미연동)
│   ├── credits.tsx              # 크레딧 화면
│   ├── sunnyList.tsx            # Sunny 앱/게임 목록 화면
│   └── openSourceInfo.tsx       # 오픈소스 정보 화면
├── components/
│   ├── settings/
│   │   ├── backgroundSection.tsx     # 배경 설정 UI
│   │   ├── effectSection.tsx         # 이펙트 설정 UI
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
│   ├── textSectionLabels.ts         # 텍스트 섹션 다국어 라벨
│   └── translatorHandoff.ts         # 번역 핸드오프 메모
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
├── scripts/
│   └── reset-project.js           # 프로젝트 초기화 스크립트
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
| [Expo](https://expo.dev/)                                                                       | ^55.0.31 | React Native 개발 프레임워크    |
| [expo-router](https://docs.expo.dev/router/introduction/)                                       | ~55.0.18 | 파일 기반 라우팅                |
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)                  | 4.2.1    | 마키 스크롤 애니메이션          |
| [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)        | ~2.30.0  | 터치/제스처 처리                |
| [expo-screen-orientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)        | ~55.0.20 | 전체화면 시 가로/세로 전환 제어 |
| [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)              | ~55.0.18 | 프리셋 버튼 그라디언트          |
| [@miblanchard/react-native-slider](https://github.com/miblanchard/react-native-slider)          | ^2.6.0   | 속도/크기/블러 등 슬라이더 UI   |
| [react-native-element-dropdown](https://github.com/hoaphantn7604/react-native-element-dropdown) | ^2.12.4  | 폰트 선택 드롭다운              |
| [react-native-svg](https://github.com/software-mansion/react-native-svg)                        | 15.15.3  | SVG 아이콘 (재생/정지 버튼 등)  |
| [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)   | ~5.6.0   | 노치/Safe Area 대응             |
| [@react-navigation/native](https://reactnavigation.org/)                                        | ^7.1.8   | 네비게이션 & 테마 관리          |
| [react-native-google-mobile-ads](https://docs.page/invertase/react-native-google-mobile-ads)    | ^16.3.3  | AdMob 배너/리워드 광고          |
| [@amplitude/analytics-react-native](https://amplitude.com/docs/sdks/analytics/react-native/react-native-sdk) | ^1.8.0 | 사용 이벤트 분석 |

## SDK 54 당시 타입 및 호환성 오류 수정 기록

다음은 SDK 55 이전 기록입니다. 현재 선언은 keyboard-controller 1.20.7, expo-file-system ~55.0.26이며 아래 과거 버전을 다시 설치하지 않습니다.

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
- $6.99 CAD는 디자인 플레이스홀더입니다. 결제 담당자는 app/premium.tsx의 displayedPrice를 스토어에서 받은 현지화된 실제 가격에 연결해야 합니다. 현재 상품 조회 및 결제는 미연동입니다.
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

- 현재 구현은 구매 화면 UI입니다. 가격 영역과 구매 복원 문구에는 결제/복원 동작이 연결되어 있지 않습니다. 이 화면으로 구매하거나 Pro 권한을 활성화할 수 없습니다.
- $6.99 CAD는 제공된 디자인의 고정 표시이며 스토어에서 조회한 실제 가격이 아닙니다. 결제 연동 시 스토어 상품의 현지화된 가격으로 연결해야 합니다.
- 상품 조회, 결제, 구매 복원, 구매 검증 및 Pro 권한 반영은 결제 담당자가 구현할 예정입니다. 외부 호출은 기존 utils/ApiClient.ts 경계 정책을 따라야 합니다.
- 최초 UI 구현은 V1.0.5 APK `54c50af`에 포함되어 컴파일됐습니다. 이후 V1.0.6에서 변경한 아이콘 크기/색상, Android 안전 영역, 가격 위치 및 미사용 코드 정리는 e75a4bb APK에 포함됩니다. 이후 SDK 55 개발 빌드에서 주요 화면을 확인했지만 결제 기능은 여전히 미연동입니다. 검증 범위는 각 빌드 기록을 따릅니다.

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

## Android 빌드 프로필

- `eas.json`은 원격 버전 번호를 사용합니다 (`appVersionSource: remote`).
- Android `preview`는 내부 배포 APK용이며 현재 자동 번호 증가가 없습니다. 같은 versionCode로도 소스가 다른 APK가 생성될 수 있으므로 커밋과 Build ID를 함께 기록합니다.
- Android `production`은 스토어 AAB용이며 `autoIncrement: true`입니다. 실제 versionCode는 완료된 빌드에서 확인합니다.
- V1.0.6 소스 변경 자체가 원격 versionCode 증가나 스토어 제출을 뜻하지 않습니다.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).
