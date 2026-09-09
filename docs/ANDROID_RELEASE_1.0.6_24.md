# Android release — LED POP 1.0.6 (24)

2026-09-09: **compile-ok**. 실제 AdMob production 설정과 기존 업로드 서명으로 APK/AAB를 생성하고 로컬 산출물 검증을 완료했습니다. Play Console 업로드·검수 제출과 새 APK 실기기 실행 검증은 수행하지 않았습니다.

## 소스와 빌드 식별

- 기준 커밋: `bd567b0a6421eac453855e51af282d23f67361dd`.
- 필요한 빌드 수정: `modules/ad-immersive/android/build.gradle`에 Expo가 요구하는 defaultConfig의 versionCode 1 / versionName 1.0.0 추가. 앱 버전과 별개인 라이브러리 메타데이터입니다.
- 앱은 versionName **1.0.6**, versionCode **24**. Settings는 Expo의 1.0.6을 그대로 읽습니다. 프로젝트 app.json도 24로 맞췄습니다.
- 별도 RootLayout 스플래시 수정은 보존·제외했습니다. 광고 변경이 적용된 RootLayout은 번들 소스와 일치합니다. Upgrade to Pro 화면·라우트 제외는 유지합니다.
- 실제 입력 325개 파일의 해시가 스냅샷과 일치합니다. [source-inputs.json](../artifacts/releases/LEDPOP-1.0.6-24-bd567b0/source-inputs.json)에 기준 커밋, 명시적 수정 파일, 버전과 전체 입력 해시를 기록했습니다. 수정이 있으므로 dirty=true입니다.
- 최종 실행: `20260909-040951-480ead90`. Gradle **13m 46s**, 1203 tasks: 115 executed / 5 from cache / 1083 up-to-date. 이 시간은 마지막 재개 빌드 구간이며 앞선 네이티브 컴파일·실패·검증 시간을 포함하지 않습니다.
- 앞선 시도에서 모듈 versionName 누락, Windows 페이징 파일 부족(0x5AF), 네이티브 컴파일 완료 후 Gradle stop command 수신이 있었습니다. 설정 누락을 수정하고 Gradle/Ninja 동시 작업을 1로 제한했으며, 동일 소스의 완료 결과를 재사용해 성공했습니다. 최적화·ABI·서명을 낮추지 않았습니다.
- 실행한 빌드 드라이버, 실제 app/build.gradle·gradle.properties, 소스맵과 전체 로그를 전달 폴더에 보존했습니다. 산출물 생성 당시 추가 빌드 수정과 문서는 미커밋 상태였으며, 후속 소스 전달에 포함합니다. 이후 UI·배너 변경은 이 산출물에 포함되지 않습니다.

## 파일

| 파일 | bytes | SHA-256 |
| --- | ---: | --- |
| [app-release.apk](../artifacts/releases/LEDPOP-1.0.6-24-bd567b0/app-release.apk) | 271802799 | `95152005ce99336fde801a9b5cf6309af8533637d93745bbdf9758d2ebe13ee4` |
| [app-release.aab](../artifacts/releases/LEDPOP-1.0.6-24-bd567b0/app-release.aab) | 241435980 | `693d2652ff7dfe6109d759288d38691596ae16989ac8ba49bf40b860f37bb0b4` |
| [mapping.txt](../artifacts/releases/LEDPOP-1.0.6-24-bd567b0/mapping.txt) | 139046272 | `a04ed3050db2b6ee8682568e2857285f6687ae5a3bda265fbd31e5347c92d759` |

## 독립 검증

- APK v2 서명 검증 및 AAB `jar verified` 통과. 두 파일의 인증서 SHA-256은 기존 `730173560958735bf237ca84ba4f35bbe76a6734986929eb65f6ced63d3fd893`와 일치합니다. 인증서 만료는 2053-11-01입니다.
- APK/AAB의 applicationId `com.minkyokim.sideledbannerapp`, versionName 1.0.6 / versionCode 24 확인. minSdk 24, compileSdk 36, targetSdk 36, debuggable=false. CAMERA·RECORD_AUDIO 없음.
- Billing 9.1.0을 AAB Manifest와 APK billing.properties에서 확인했습니다. [Google 지원 일정](https://developer.android.com/google/play/billing/deprecation-faq)과 [릴리스 노트](https://developer.android.com/google/play/billing/release-notes)를 재확인했습니다.
- 4개 ABI(arm64-v8a, armeabi-v7a, x86, x86_64), 네이티브 라이브러리 108개 확인. APK ZIP 16KB 정렬, 64비트 ELF LOAD 16KB 정렬, AAB PAGE_ALIGNMENT_16K 확인.
- APK/AAB 네이티브 라이브러리·DEX·Hermes 바이트 일치. APK Hermes는 이번 생성 번들과도 일치합니다.
- R8 8.13.23 매핑 생성·난독화 확인. 실제 R8 설정에 dontoptimize/dontobfuscate 없음. AAB의 BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map이 보존한 mapping.txt와 동일합니다. 최적화 APK 실행 검증과 Play 매핑 등록은 별도 미검증입니다.
- 제출 스냅샷의 TypeScript `tsc --noEmit` 통과. Gradle의 필수 lintVitalRelease 통과. 별도 린트 명령·앱 테스트는 실행하지 않았습니다.

## 실제 광고와 아이콘

| 항목 | APK/AAB에서 확인한 Android 값 |
| --- | --- |
| 광고 프로필 | production |
| AdMob App ID | ca-app-pub-3506417530430977~7354080715 |
| Banner Unit ID | ca-app-pub-3506417530430977/9971880471 |
| Rewarded Unit ID | ca-app-pub-3506417530430977/6499152286 |

내장 Expo config의 선택된 production 프로필과 Manifest App ID를 확인했습니다. Native banner/rewarded SDK 클래스와 LedPopAdImmersiveModule이 실제 DEX에 포함됩니다. 광고 관련 네이티브 JS 소스가 스냅샷과 일치합니다. 웹 진단·광고 시뮬레이션 구현과 ProDebugFab은 네이티브 번들에서 제외됐습니다. SDK의 테스트 상수 존재 여부를 실제 테스트 광고 사용 여부로 오인하지 않고, 선택된 설정과 호출 소스를 검사했습니다.

Sunny 목록 아이콘 13개의 WebP 바이트가 소스 파일과 정확히 일치하게 APK에 포함됐습니다. 앞선 무손실 픽셀 비교 결과를 유지하며, 이번 작업에서 별도의 실기기 화면 비교는 하지 않았습니다.

## 남은 경고와 확인 범위

전체 1576줄 Gradle 로그를 읽고 작업 행과 진단 출력을 검토했습니다. AdMob의 다른 app.json 위치 안내(Expo 플러그인 사용, 실제 ID 검증 통과), SDK XML/명령줄 도구 위치, Manifest remove/replace 대상 없음, Gradle 10 폐기 API 경고가 남습니다.

AAB 서명 검사는 통과했으나 자체 서명 신뢰 체인, timestamp 미포함, POSIX 속성 및 ZIP 마지막 Manifest 때문에 JarInputStream에서 Manifest를 인식하지 못하는 경고가 남습니다. ZIP 1497개 항목에 중복 없음, local header/central directory 이름 일치, JarFile 서명 검증 및 bundletool 구조 검증을 확인했습니다. 원본 AAB를 재포장하지 않았고 경고 없는 파일로 표현하지 않습니다.

실제 광고 노출·No fill·수익/계정 상태, 새 배너의 기기별 배치, Android 3버튼/제스처 내비게이션 전환, 결제·복원, iOS 빌드는 미검증입니다. 외부 Google Play Activity의 시스템 바 제어 불가 제한은 유지합니다. Play Console의 최대 versionCode 조회·업로드·검수·매핑 등록은 미실행입니다. 로컬 검증은 Play 승인이나 버전 코드 중복 없음의 증명이 아닙니다.

검증 세부 결과는 전달 폴더의 metadata-verification.json, advertising-verification.json, native-and-mapping-verification.json, aab-zip-layout.json과 서명·bundletool 로그에 보존했습니다. 비밀 키·비밀번호는 포함하지 않습니다.
