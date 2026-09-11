# LED POP Android 1.0.8 (26)

2026-09-11: **compile-ok**. Google Play 제출용 production APK/AAB 생성 및 로컬 산출물 검증을 완료했습니다. Play 업로드·검수 제출과 이번 산출물의 실기기 QA는 실행하지 않았습니다.

## 소스와 포함 범위

- 빌드 당시 로컬 main `9f533079060b908706bebcbeac6c8c1c5972c71a`의 확정 소스, 별도 소스 override 없음. 이후 문서·UI 변경은 이 산출물에 포함되지 않습니다.
- versionName **1.0.8**, versionCode **26**. Settings는 Expo 버전을 읽어 **V1.0.8**을 표시합니다. Play Console의 최고 숫자 버전 코드는 별도 확인하지 않았습니다.
- Android 완료(✔) 버튼 흰색 표시, 배경 효과의 여러 줄 시작 위치 통일, 네이티브 네비게이션 바 숨김 호출, 하트 독립 스크롤, 사진 contain 변경이 실제 번들의 확정 소스와 일치함을 확인했습니다. 실제 기기에서의 개선 효과는 이번 빌드로 재검증하지 않았습니다.
- 별도 `components/RootLayout.tsx` 스플래시 변경, 작업 중인 AAB 파일명 스크립트 변경은 보존·제외했습니다. 실행한 빌드 래퍼는 확정 커밋에서 추출해 기록 폴더에 보존했습니다.
- Upgrade to Pro 화면/라우트 및 웹 광고 진단 코드는 네이티브 번들에서 제외됐습니다. Pixel Blur 미구현 상태는 유지됩니다.

## 산출물 검증

- APK 25개 검사, AAB 메타데이터 20개 검사 통과. bundletool validate 통과.
- APK/AAB 모두 기존 업로드 인증서 SHA-256 `730173560958735bf237ca84ba4f35bbe76a6734986929eb65f6ced63d3fd893`와 일치.
- 실제 AdMob production App/Unit 설정과 광고 네이티브 클래스 포함 확인. 실제 광고 수신·재생·보상은 미검증.
- 실효 compileSdk/targetSdk 36, minSdk 24. ARM64, ARMv7, x86, x86_64 유지. APK ZIP/64비트 ELF의 16KB 정렬 및 AAB PAGE_ALIGNMENT_16K 확인.
- 실제 manifest 및 billing.properties의 Play Billing 9.1.0 확인.
- R8 8.13.23 최적화·난독화 매핑 생성 및 같은 빌드 AAB의 내장 매핑과 바이트 일치 확인. 최적화 후 실기기 동작 및 Play 매핑 등록은 미검증.
- APK/AAB의 108개 네이티브 라이브러리, DEX, Hermes 번들, app.config 일치. AAB ZIP 중복 항목 없음, local header 이름 일치.
- 기존 13개 Sunny 아이콘의 바이트 일치 확인.

## 빌드 시간과 증빙

고정 `artifacts/b`에서 의존성 설치를 생략하고 버전 변경에 필요한 네이티브 설정을 재생성했습니다. 네 가지 ABI 앱 코드가 재컴파일됐습니다. Gradle **1시간 7분 52초**, 1203개 작업 중 **749 executed / 422 FROM-CACHE / 32 UP-TO-DATE**. 기록 생성부터 결과 기록까지 **4133.5초(약 1시간 8분 53초)**이며, 이후 산출물 검증 시간은 포함하지 않습니다.

기록 폴더: `artifacts/apk-runs/20260911-005046-12ab25c8`. 같은 빌드의 mapping/configuration/usage/resources/seeds, native debug symbols, JavaScript source maps, 입력 해시, 전체 prebuild/Gradle 로그, 검증 스크립트와 결과를 보존했습니다. 이전 릴리스 원본도 유지했습니다.

## 파일과 SHA-256

- APK: `artifacts/apk-runs/20260911-005046-12ab25c8/apk-deliveries/20260911-015934-d408c0a75315443bb1c59c0613244864/LedPopV108.apk`
- AAB: `artifacts/apk-runs/20260911-005046-12ab25c8/app-release.aab`
- APK SHA-256: `660286a34f1295ee07a4d9059bbebdc6d5047722f18a933d7578e23679b1d93c`
- AAB SHA-256: `801d4a367343c47c4c2c9cb36f4b6662e6f48f2fc95d7ef7a4a492ab0507c2eb`
- mapping.txt SHA-256: `a04ed3050db2b6ee8682568e2857285f6687ae5a3bda265fbd31e5347c92d759`

## 경고와 한계

전체 prebuild 출력과 Gradle 1600줄을 검토했습니다. Expo config plugin 사용 시 나오는 광고 app.json 안내는 실제 manifest의 production App ID로 대조했습니다. Manifest remove/replace 대상 부재, NO_COLOR/FORCE_COLOR, Gradle 10 사용 중단 예정 기능 경고가 남습니다. AAB jarsigner는 `jar verified`이지만 자체 서명 인증서 체인, timestamp 부재, POSIX 속성 및 Manifest 위치에 따른 JarInputStream 경고가 있습니다. JarFile 서명, ZIP 구조와 bundletool 검증은 통과했으나 경고 없는 파일로 표현하지 않습니다.

별도 테스트/린트 명령은 실행하지 않았으며 release 의존 작업인 lintVital은 빌드 과정에서 실행됐습니다. 스토어 업로드, 원격 push, 실기기 QA는 이번 작업에서 실행하지 않았습니다. 로컬 산출물 검증은 Google Play 접수·승인이나 네비게이션 바 미노출을 증명하지 않습니다.
