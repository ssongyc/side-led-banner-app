# Sunny 목록 아이콘 무손실 최적화

2026-09-09: app/sunnyList.tsx의 앱 아이콘 13개를 무손실 WebP로 연결했습니다. 표시 크기 44×44, 원본 해상도 1024×1024, 순서·이름·링크·레이아웃은 유지합니다. 작은 공용 Back PNG는 그대로 사용합니다.

참조 이미지 파일 합계: 5,456,274 → 3,693,272 bytes, 1,763,002 bytes (32.3%) 감소. APK/AAB 전체 용량 감소나 실행 속도·메모리 개선의 실측값은 아닙니다.

Pillow 12.1.1의 WebP lossless=True, exact=True, method=6으로 인코딩했습니다. 13개 모두 원본을 RGBA로 디코딩한 결과와 새 파일의 RGBA 전체 바이트 및 크기가 일치했습니다. JPEG는 원본 JPEG를 디코딩한 픽셀을 그대로 무손실 저장했으며 추가 손실 압축은 하지 않았습니다. 원본 파일은 보존하며 목록에서는 새 WebP만 참조합니다.

| 아이콘 | 원본 bytes | WebP bytes | 감소율 |
| --- | ---: | ---: | ---: |
| Sky-Peacemaker-Finger-Force-Icon | 1,432,498 | 1,097,060 | 23.4% |
| World-Movie-Trailer-New-Icon | 222,048 | 142,342 | 35.9% |
| World-Book-Ranking-Icon | 690,075 | 323,936 | 53.1% |
| Simply-Multi-Timer-Icon | 16,795 | 11,382 | 32.2% |
| Watermelon-Checker-Icon-1024 | 311,920 | 253,288 | 18.8% |
| Wisdom-Qclock-Icon | 434,807 | 315,150 | 27.5% |
| Dual-Flashlight-Icon | 30,678 | 13,402 | 56.3% |
| Histree-Icon | 23,840 | 7,162 | 70.0% |
| Scanatory-Icon | 29,213 | 13,150 | 55.0% |
| Play-Memo-Icon | 68,860 | 30,542 | 55.6% |
| Find-Four-Icon | 1,614,258 | 1,115,594 | 30.9% |
| decibella2-Icon | 20,913 | 6,748 | 67.7% |
| decibella-Icon-1024 | 560,369 | 363,516 | 35.1% |

[Expo Image 공식 문서](https://docs.expo.dev/versions/latest/sdk/image/)의 WebP 지원을 확인했습니다. 이미지 내용은 픽셀 단위로 비교했으나 Android/iOS 실제 화면 검증은 미실행입니다. 아이콘 최적화 단계에서는 컴파일·린트·앱 테스트를 실행하지 않았습니다. 아이콘과 문서는 사용자 요청에 따른 main 브랜치 전달 범위에 포함합니다. 후속 Android 1.0.6 (24) APK/AAB에 포함됐으며 APK 안의 WebP 13개가 소스 바이트와 일치함을 검증했습니다. 실기기 화면 검증은 미실행입니다.

파일별 원본/후보 용량 및 RGBA 해시 기록: artifacts/sunny-icon-optimization/analysis.json (로컬 작업 기록).
