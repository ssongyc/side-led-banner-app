# Android 재생 화면 네비게이션 바 — 2026-09-10

## 실기기 확인

Galaxy SM-M336K(RFCW90A7BSW), 설치 LED POP versionName 1.0.7 / versionCode 25에서 확인했습니다. 앱을 앞으로 가져온 뒤 재생 화면의 `Close fullscreen`과 하단 `android:id/navigationBarBackground`가 함께 존재했습니다. 바 영역은 [0,2264][1080,2408]입니다. 수정 전 UI/Window 증빙은 `artifacts/qa-nav-1.0.7`에 보존했습니다. 광고는 재생/클릭하지 않았습니다.

## 원인 및 변경

설치된 expo-navigation-bar의 NavigationBar.android.ts는 `hidden !== currentValues.hidden`인 경우에만 네이티브 setHidden을 호출합니다. 이전에 true를 요청한 뒤 Android 창이 바를 다시 표시해도 JS 캐시는 true이므로, 기존 onShow/회전/복귀 재호출이 네이티브로 전달되지 않습니다. 이전 생명주기 호출 추가만으로는 충분하지 않았습니다.

`utils/SystemChrome.ts`의 재적용 경로를 기존 ExpoNavigationBar 네이티브 모듈의 setHidden(true) 호출로 변경했습니다. 네이티브 구현은 메인 스레드에서 Activity 및 등록된 추가 Modal 창 모두에 적용합니다. 초기 설정은 Expo 선언형 컴포넌트 기본값도 true로 유지합니다. 실패는 로그로 보고하며, 숨김/표시 토글·타이머·반복 루프·화면 덮개는 추가하지 않았습니다. 화면 표시/크기 변경/앱 복귀의 기존 경계를 사용합니다.

## 검증 상태

수정 전 실기기 노출과 소스 원인을 확인했습니다. 수정 후 컴파일·새 APK 설치·실기기 재검증은 미실행입니다. 따라서 해결 완료나 단일 프레임 노출 없음으로 보고하지 않습니다. 다음 승인된 빌드/QA에서 세로·가로 진입, 반복 회전, 백그라운드 복귀와 세 버튼/제스처 모드를 검증해야 합니다. Android가 사용자 시스템 제스처로 일시 표시하는 바까지 앱에서 절대 차단할 수 있다고 보증하지 않습니다.

RootLayout의 별도 스플래시 변경은 보존했으며 커밋/푸시하지 않았습니다.
