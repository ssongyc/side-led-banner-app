# LED POP Android 1.0.7 (25)

2026-09-10: **compile-ok**. APK/AAB 생성 및 로컬 산출물 검증 완료. Play 업로드/검수 제출과 새 버전 실기기 QA는 미실행입니다.

- main `1c33e5e8b0826b07e7cdb6a2cfc76955d404d4b8` + 명시적 app.json 버전 수정만 빌드. Settings는 Expo 버전을 읽어 V1.0.7을 표시합니다.
- versionName 1.0.7 / versionCode 25. Play Console 최고 versionCode는 확인하지 못했으므로 업로드 중복 여부는 미검증입니다.
- 별도 RootLayout 스플래시 수정 제외. 하트 독립 스크롤, 전체 화면 네비게이션 바 재적용, 사진 contain 변경의 번들 소스 일치 확인.
- 실제 AdMob production App/Unit 설정과 광고 네이티브 클래스 포함, 웹 광고 진단 및 Premium 화면/라우트 제외 확인. 실제 광고 수신/재생은 미검증입니다. Pixel Blur 미구현은 유지됩니다.
- 기존 업로드 인증서 SHA-256 `730173560958735bf237ca84ba4f35bbe76a6734986929eb65f6ced63d3fd893`로 APK/AAB 서명 검증 통과.
- 실효 compileSdk/targetSdk 36, minSdk 24, 4개 ABI, APK ZIP 및 64비트 ELF 16KB 정렬, AAB PAGE_ALIGNMENT_16K 확인.
- Billing 9.1.0을 manifest와 billing.properties에서 확인. [공식 릴리스 기록](https://developer.android.com/google/play/billing/release-notes), [지원 기한](https://developer.android.com/google/play/billing/deprecation-faq) 확인.
- R8 8.13.23 난독화 매핑 생성 및 AAB 내 동일 매핑 확인. APK/AAB 108개 네이티브 라이브러리·DEX·Hermes·앱 설정 동일. Play 매핑 등록은 미검증입니다.
- APK 검사 25개, AAB 메타데이터 검사 20개 통과. bundletool validate 및 AAB 서명 검사 통과. ZIP 1497개 항목의 중복 없음, local header 이름 일치 확인.
- Gradle 1시간 15초 / 1203 tasks: 749 executed, 422 from cache, 32 up-to-date. 기록 생성부터 build-result 기록까지 3651.3초. 이전 1.0.6 빌드는 사용자 버전 변경으로 중지했으며 이 시간에서 제외됩니다. 의존성 재설치는 생략했지만 버전 변경으로 네이티브 생성 및 4개 ABI 앱 코드 재컴파일이 발생했습니다.

## 파일과 해시

빌드 폴더: `artifacts/apk-runs/20260910-212216-6edae1df`.

- APK: `artifacts/apk-runs/20260910-212216-6edae1df/apk-deliveries/20260910-222302-3aab5fb871bd4e228209f7e4edadc817/LedPopV107.apk`
- AAB: `artifacts/apk-runs/20260910-212216-6edae1df/app-release.aab`
- APK SHA-256: `f471ec31a06f738c1bd364201b5072e2a9b06982665ec6fda4f8dcb423845f09`
- AAB SHA-256: `208b7eaeff07eed93ee27ae434bb7d7cf2f7f8e4c1893a7b8832236482cf4ee2`
- mapping.txt SHA-256: `a04ed3050db2b6ee8682568e2857285f6687ae5a3bda265fbd31e5347c92d759`

동일 폴더에 mapping/configuration/usage/resources, native-debug-symbols, JavaScript source maps, 입력 해시, 전체 로그, 검증 결과 및 실행 스크립트를 보존했습니다. 산출물 원본은 재포장하지 않았습니다.

## 경고와 검증 한계

Expo config plugin 사용 시 안내되는 광고 app.json 경고는 실제 manifest의 production App ID로 대조했습니다. Manifest remove/replace 대상 부재, NO_COLOR/FORCE_COLOR, Gradle 10 사용 중단 예정 기능 경고가 남습니다. AAB jarsigner는 jar verified이나 자체 서명 인증서 체인, timestamp 부재, POSIX 속성 및 Manifest 위치에 따른 JarInputStream 경고가 있습니다. JarFile 검증과 ZIP 구조 검사, bundletool 검증은 통과했지만 경고 없는 파일로 표현하지 않습니다.

검증 스크립트 첫 실행은 Windows 기본 인코딩으로 입력 JSON을 읽다 실패했고 Python UTF-8 모드로 재실행해 통과했습니다. 앱 빌드 실패가 아닙니다. 별도 테스트/린트 명령은 실행하지 않았으며 Gradle release 의존 작업인 lintVital은 빌드 과정에서 실행됐습니다. 산출물 생성 당시 버전 수정과 문서는 미커밋 상태였으며, 후속 main 전달 범위에 포함합니다.


## 후속 main 전달 범위

app.json의 1.0.7(25), 이 릴리스 기록과 README, 실제 빌드에 사용한 APK 파일명 처리 스크립트를 함께 전달합니다. 파일명은 실제 APK versionName에서 점을 제거한 `LedPopV107.apk`이며, 빌드별 디렉터리로 충돌을 방지하고 복사 전후 SHA-256 일치를 확인합니다. AAB 이름 및 서명된 파일 내용은 변경하지 않습니다. 기존 RootLayout 스플래시 수정은 계속 보존·제외합니다. 이번 문서/소스 전달에서 새 빌드·테스트·스토어 업로드는 실행하지 않습니다.
