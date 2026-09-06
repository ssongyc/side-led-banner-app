# LED Banner App

> 현재 메인 작업 저장소: https://github.com/ssongyc/side-led-banner-app

사용자가 입력한 텍스트를 Banner 형태로 표시하는 앱 입니다.

## Features

- 사용자가 입력한 텍스트를 Banner 형태로 표시.
- 한 줄/ 여러 줄 재생 모드 선택 가능.
- 텍스트 스타일, 배경 스타일, 이펙트 설정 가능
- ios/ android 모두 지원

## 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- (선택) EAS CLI — 빌드/배포 시 필요
- Android Studio 설치

## 설치 및 실행 방법

1. 프로젝트 클론

```bash
git clone https://github.com/ssongyc/side-led-banner-app.git
cd side-led-banner-app
```

2. 의존성 설치

```bash
npm install
```

3. 앱 실행

```bash
npm start
```

## 프로젝트 구조

```
side-led-banner-app/
├── app/
│   ├── _layout.tsx              # 루트 레이아웃 (테마, 네비게이션)
│   ├── index.tsx                # 메인 화면 (배너 편집기)
│   ├── settings.tsx             # 앱 설정 화면
│   ├── premium.tsx              # Upgrade to Pro 구매 화면 UI (결제 미연동)
│   ├── sunnyList.tsx            # Sunny 앱/게임 목록 화면
│   └── openSourceInfo.tsx       # 오픈소스 정보 화면
├── components/
│   ├── settings/
│   │   ├── backgroundSection.tsx     # 배경 설정 UI
│   │   ├── backgroundPhotoSheet.tsx  # 배경 사진 설정 시트
│   │   ├── effectSection.tsx         # 이펙트 설정 UI
│   │   ├── PixelColorMixButton.tsx   # Pixel 색상 혼합 버튼
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
│   └── slider.tsx                    # 슬라이더 컴포넌트
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
│   ├── speechBubblePresets.ts       # 말풍선 프리셋
│   └── sunnyApps.ts                 # Sunny 앱 목록
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

| 라이브러리                                                                                      | 버전     | 용도                            |
| ----------------------------------------------------------------------------------------------- | -------- | ------------------------------- |
| [Expo](https://expo.dev/)                                                                       | ~54.0.37 | React Native 개발 프레임워크    |
| [expo-router](https://docs.expo.dev/router/introduction/)                                       | ~6.0.21  | 파일 기반 라우팅                |
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/)                  | ~4.1.1   | 마키 스크롤 애니메이션          |
| [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/)        | ~2.28.0  | 터치/제스처 처리                |
| [expo-screen-orientation](https://docs.expo.dev/versions/latest/sdk/screen-orientation/)        | ~9.0.9   | 전체화면 시 가로/세로 전환 제어 |
| [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/)              | ~15.0.8  | 프리셋 버튼 그라디언트          |
| [@miblanchard/react-native-slider](https://github.com/miblanchard/react-native-slider)          | ^2.6.0   | 속도/크기/블러 등 슬라이더 UI   |
| [react-native-element-dropdown](https://github.com/hoaphantn7604/react-native-element-dropdown) | ^2.12.4  | 폰트 선택 드롭다운              |
| [react-native-svg](https://github.com/software-mansion/react-native-svg)                        | 15.12.1  | SVG 아이콘 (재생/정지 버튼 등)  |
| [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)   | ~5.6.0   | 노치/Safe Area 대응             |
| [@react-navigation/native](https://reactnavigation.org/)                                        | ^7.1.8   | 네비게이션 & 테마 관리          |
| [react-native-google-mobile-ads](https://docs.page/invertase/react-native-google-mobile-ads)    | ^16.3.3  | AdMob 배너/리워드 광고          |
| [@amplitude/analytics-react-native](https://amplitude.com/docs/sdks/analytics/react-native/react-native-sdk) | ^1.8.0 | 사용 이벤트 분석 |

## V1.0.5 업데이트

- 앱 버전을 `1.0.5`로 변경하고 설정 화면의 App Version 표시를 `V1.0.5`로 맞췄습니다.
- 저장된 앱 언어, 기기/시스템 언어, 영어 순서로 언어를 결정합니다. 중국어는 번체 조건(`zh-Hant`, `zh-TW`, `zh-HK`, `zh-MO`)을 먼저 검사한 뒤 나머지 `zh-*`를 간체로 처리합니다.
- 앱 소유 텍스트가 스마트폰 시스템 텍스트 크기에 영향을 받지 않도록 기본 Text/TextInput scaling을 차단했습니다.
- Android 네비게이션 바 숨김 처리를 시스템 UI 경계로 분리했고, iOS 주요 화면은 Status Bar safe area 아래에 배치했습니다.
- 외부 API 호출은 `utils/ApiClient.ts` 경계로 모았습니다. Google Sheets 로드는 이 경계를 통해 호출합니다.
- 리워드 광고는 앱 시작 및 Settings 진입 시 선로딩하고, 실패 시 3초/6초 후 최대 3회까지 제한해서 시도합니다. 광고 표시 버튼은 모달이 화면에서 제거된 뒤 다음 프레임에 광고를 표시합니다.
- 배너 광고는 visible placement 마운트 후 요청하고, 실패 시 3초/6초 후 최대 3회까지 제한해서 시도합니다.
- 사용하지 않는 것으로 확인된 파일과 이미지 에셋을 삭제했고, PNG 이미지는 화질 변화 없는 무손실 최적화만 적용했습니다.
- 명백한 중복 레이아웃 상태 업데이트와 production debug component 마운트만 좁게 정리했습니다.
- Expo SDK 54 권장 패키지 버전으로 정리했습니다. `expo install --check --npm`는 통과하며, `expo doctor`는 AsyncStorage 중복 1건만 남습니다.
- Amplitude를 `^1.8.0`으로 업데이트했습니다. 최신 정식 버전에서도 내부 `@react-native-async-storage/async-storage@1.24.0` 의존성이 남아 있어 중복 경고는 해소되지 않았습니다.
- Android에서 사용하지 않는 `RECORD_AUDIO` 권한을 삭제했고, `expo-image-picker`가 생성할 수 있는 `CAMERA`/`RECORD_AUDIO` 권한은 `blockedPermissions`로 차단했습니다. 사용하지 않는 iOS 카메라 권한 문구도 제거했습니다.
- Amplitude 초기화 후 deviceId를 `setUserId`로 전달하고, 앱 기능에는 영향을 주지 않는 프로덕션 콘솔 로그를 개발 모드로 제한했습니다.

## 설정 및 구매 화면 업데이트 (2026-09-06)

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
- 이 변경에서는 앱 버전과 Android versionCode를 변경하지 않았습니다. 컴파일, 린트, 테스트 및 실기기 화면/결제 검증은 수행하지 않았습니다.
- 아래 Android 빌드 기록은 기존 빌드 기록이며 이번 UI 변경을 포함한 새 APK/AAB를 뜻하지 않습니다.

## Android 빌드 기록

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
Known build warnings:

- `expo doctor` reported duplicate native module dependencies for `@react-native-async-storage/async-storage`.
- `expo install --check --npm` passes with the Expo SDK 54 package versions currently installed.
- `npm install` reported 33 audit findings after the compatible dependency updates. These were reported but not automatically changed.
This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).
