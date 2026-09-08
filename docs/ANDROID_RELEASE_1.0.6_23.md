# Android release artifacts — LED POP 1.0.6 (23)

2026-09-09 생성. **compile-ok**. 로컬 컴파일과 아래 파일 검증은 통과했습니다. Google Play 업로드·검수 제출·versionCode 중복 확인·Play 매핑 등록은 수행하지 않았습니다. 새 최적화 빌드의 실기기 실행/성능 QA도 미수행입니다.

## 원본 파일과 빌드 출처

- 전달 폴더: `artifacts/releases/LEDPOP-1.0.6-23-e58e9aa/`
- [APK](../artifacts/releases/LEDPOP-1.0.6-23-e58e9aa/app-release.apk): 273,206,914 bytes.
- [AAB](../artifacts/releases/LEDPOP-1.0.6-23-e58e9aa/app-release.aab): 242,796,068 bytes.
- [동일 빌드 mapping.txt](../artifacts/releases/LEDPOP-1.0.6-23-e58e9aa/mapping.txt): 138,937,498 bytes. AAB에도 동일 파일이 포함됩니다.
- 앱 소스: `e58e9aa3d18d28eaed9b446829dda0a3d051848c`, 스냅샷 dirty=false. 기록된 소스 파일 292개의 SHA-256을 재개 전에 모두 검증했습니다.
- 빌드 실행 ID: `20260909-014021-5aaeba48`, 고정 경로 `C:/dev/Led Banner/artifacts/b`.
- 사용자가 별도로 변경된 `components/RootLayout.tsx`의 스플래시 수정을 보존하되 이번 빌드에서는 제외하도록 선택했습니다. 원본 작업 파일을 덮어쓰거나 커밋하지 않았습니다.
- 재개 래퍼: `resume-submission-e58e9aa.ps1` 보존. 확정 스냅샷에서 소스 동기화·네이티브 재생성을 생략하고 기존 검증 서명 절차를 사용했습니다. 빌드 JVM 메모리 수정은 main `291f71a`의 래퍼와 동일합니다. 이후 문서 커밋은 앱 소스 변경으로 간주하지 않습니다.

| 파일 | SHA-256 |
| --- | --- |
| APK | `007E2C3BB8C8A7F0E15303B8BAD8E3AD5C507EF1D7375317F6E9099595C5CB13` |
| AAB | `FE2C63BF52C860A81BCCAEF719366678F3F01083046177FAA82B8CF283D70D9A` |
| mapping.txt | `0DDB0DCE25A70606513368AEEAC38F2636DA5428B347B54FFA91E00B55861E63` |

## 포함 변경

숨은 미리보기·닫힌 전체 화면·비활성 앱의 marquee/Blink/effect1 애니메이션을 중단하고 진행 상태를 보존합니다. Expo Router의 포커스 컨텍스트를 사용합니다. Android 호스트가 활성/포커스를 회복할 때 기존 시스템 바 숨김을 재적용합니다. 텍스트·자간·폰트·이미지 해상도·효과 품질·속도와 키보드 기능은 이번 성능 변경에서 유지합니다. Upgrade to Pro 메뉴/라우트 제외 정책도 유지합니다.

버전 이름과 Settings 표시값은 1.0.6입니다. 내부 versionCode는 이전 로컬 22에서 23으로 변경했습니다. 사용자가 알려 준 Play 버전은 이름 1.0.5이며 숫자 versionCode는 확인되지 않았습니다. 업로드 시 23이 기존 모든 트랙/업로드보다 큰지 확인이 필요합니다.

## 컴파일 결과와 해결 이력

- 최종 Gradle: `BUILD SUCCESSFUL in 12m 40s`, 1167 actionable tasks: **120 executed / 1047 up-to-date**. 래퍼 측정 Gradle 구간은 766.1초입니다. 전체 작업 시간이나 최초 최적화 빌드 시간으로 해석하지 않습니다.
- assembleRelease와 bundleRelease를 동일 실행에서 완료했습니다. 포함된 lintVitalRelease 통과. 별도 전체 린트/실기기 테스트는 실행하지 않았습니다.
- 현재 앱 소스의 TypeScript `--noEmit` 컴파일 통과. 생성 artifacts/node_modules를 제외하고 Expo Router 포커스 import를 정정한 상태의 결과입니다. 별도 스플래시 수정은 이 검증에 포함하지 않습니다.
- 최초 최적화 실행은 Gradle이 성공했지만 R8 8.12.14의 Kotlin 2.3 메타데이터 파싱 오류가 있어 제출 대상에서 제외했습니다. 해당 실행 기록에는 `NOT_FOR_SUBMISSION.txt`를 남겼습니다.
- Kotlin 2.3.20에 맞춰 Google Maven R8 8.13.23을 고정했습니다. 다음 실행은 collectReleaseDependencies 실패 후 종료 대기 상태에 멈췄으며, JVM 메타스페이스가 기존 512 MiB 한도에 도달한 것을 확인했습니다. 상세 원인 예외는 종료 전에 출력되지 않았습니다. 해당 프로젝트의 정지한 데몬만 종료하고 2 GiB 힙/2 workers를 유지하며 메타스페이스를 1 GiB로 늘렸습니다. 캐시를 유지한 재개 실행에서 해당 작업과 전체 빌드가 통과했습니다.
- 최종 전체 **1522줄 로그**를 검토했습니다. R8 메타데이터 파싱 오류와 실패 작업 없음. 남은 안내/경고: AdMob Expo 플러그인과 다른 app.json 위치 안내, NODE_ENV 미설정 안내, SDK XML 버전/명령줄 도구 설치 위치, 다중 Kotlin daemon, Gradle 10 폐기 API. 실제 AdMob ID와 release 아티팩트를 별도로 검증했습니다.

## 독립 파일 검증

| 항목 | 결과 |
| --- | --- |
| package / 버전 | com.minkyokim.sideledbannerapp / 1.0.6 (23), APK·AAB 일치 |
| SDK | min 24 / compile 36 / target 36, 실제 manifest 및 생성 구성 확인 |
| 기존 업로드 인증서 | APK v2 검증 및 AAB JAR 검증 통과, SHA-256 아래 값과 일치 |
| 디버그·권한 | debuggable 아님, CAMERA/RECORD_AUDIO 없음 |
| ABI | arm64-v8a, armeabi-v7a, x86, x86_64 모두 유지 |
| Billing | 실제 manifest 및 billing.properties 모두 9.1.0 |
| 광고 | 기존 production AdMob App ID 포함; 테스트 광고 설정으로 변경하지 않음 |
| APK ZIP 정렬 | zipalign -c -P 16 4 통과 |
| 네이티브 정렬 | 총 108개 .so 검사, 모든 64비트 ELF LOAD 16KB 정렬 통과 |
| AAB 구조/정렬 | bundletool 1.18.3 validate 통과, PAGE_ALIGNMENT_16K |
| 코드 일치 | APK·AAB의 모든 DEX, Hermes 번들, 네이티브 라이브러리 바이트 일치 |
| 앱 소스 일치 | 생성 Hermes=APK, 6개 핵심 성능/텍스트 소스맵 내용=확정 스냅샷, Pro 화면/라우트 제외 |
| R8 | 실제 compiler 8.13.23, 난독화 항목 존재, 전역 dontoptimize/dontobfuscate/dontshrink 없음 |
| 매핑 | 동일 빌드 mapping.txt 보존, AAB BUNDLE-METADATA/proguard.map 바이트·해시 일치 |
| 네이티브 심볼 | AAB의 별도 BUNDLE-METADATA debug symbols 유지. Java/Kotlin mapping 대체물 아님 |
| 최적화 후 실기기 실행 | 미검증 |
| Play 업로드·매핑 연결·검수 | 미실행 |

인증서 SHA-256: `730173560958735BF237CA84BA4F35BBE76A6734986929EB65F6CED63D3FD893`.

AAB jarsigner는 `jar verified`를 반환했습니다. 자체 서명 인증서의 신뢰 체인/타임스탬프 미포함/POSIX 속성 안내 및 Manifest가 ZIP 마지막에 있어 JarInputStream에서 인식하지 못한다는 경고가 남습니다. 중복 ZIP 항목 없음과 local header/central directory 이름 일치를 확인했고, JarFile 서명 검증과 bundletool 구조 검증이 통과했습니다. 경고 없는 파일이나 Play 승인 완료로 표현하지 않습니다. 원본 AAB를 재포장하지 않았습니다.

## 남은 실제 검증

이전 [실기기 QA](QA_PERFORMANCE_20260908.md)는 edaf82b/22 APK의 결과입니다. 새 R8 빌드에서 같은 조건의 프레임 시간·메모리 비교, 화면 전환/백그라운드 복귀, Blink/효과 연속성, 광고/결제 SDK 실행 확인이 필요합니다. React 렌더 횟수와 Amplitude 실제 이벤트 수신은 미측정/미확인입니다.

광고 종료 시 **외부 Google Play Activity의 내비게이션 바 노출은 미해결**입니다. 호스트 바 숨김 변경만으로 해결됐다고 주장하지 않습니다. iOS·태블릿·모든 언어·제스처 모드·결제/복원 검증도 이번 파일 생성으로 완료되지 않습니다.

## 보존 근거

전달 폴더에 build-result.json, source-inputs.json, 전체 로그와 로그 검토 JSON, 서명/manifest/bundletool 출력, native-and-mapping-verification.json, metadata-verification.json, aab-zip-layout.json, 실제 R8 configuration/usage/resources, 소스맵 및 검증 스크립트를 함께 보존했습니다. 비밀 키/비밀번호는 포함하지 않았고 산출물 폴더는 Git에 커밋하지 않습니다.

공식 기준: [Kotlin/R8 호환성](https://developer.android.com/build/kotlin-support), [Billing 지원 일정](https://developer.android.com/google/play/billing/deprecation-faq), [16KB 페이지 크기](https://developer.android.com/guide/practices/page-sizes).
