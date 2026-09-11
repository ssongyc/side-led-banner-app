# LED POP 1.0.9 (27) UI 상호작용 변경

2026-09-11 후속 소스 변경 기록입니다. 이 문서는 새 빌드 완료 기록이 아닙니다.

## 버전

- Expo 앱 버전을 **1.0.9**로 변경했습니다.
- Android `versionCode`를 **27**로 변경했습니다.
- Settings의 App Version은 `Constants.expoConfig.version`을 읽으므로 **V1.0.9**로 표시됩니다.
- 기존 1.0.8(26) APK/AAB에는 아래 변경이 포함되지 않습니다.

## iPad Watch Ad 버튼

- 원본 `Watch_Ad_Button.png`는 277×56 이미지입니다. iPad의 넓은 폭에 전체 이미지를 단순 확대하면서 양끝 곡률도 늘어나던 경로를 수정했습니다.
- iOS에서는 상하좌우 27px `capInsets`를 적용해 양끝 모양을 고정하고 가운데 영역만 늘립니다.
- 버튼 컨테이너는 높이 56 기준 반지름 28과 모서리 클리핑을 적용합니다.
- Android는 기존 `expo-image` 렌더링을 유지합니다. 광고 준비 상태, 활성 조건, 탭 처리 및 광고 표시 순서는 변경하지 않았습니다.

## iPad 사진 불러오기 버튼

- 32×32 버튼에 상하좌우 6px `hitSlop`을 추가하여 유효 터치 영역을 44×44로 확대했습니다.
- 배경 설정 `ScrollView`에 `keyboardShouldPersistTaps="handled"`를 적용해 남아 있는 키보드가 첫 버튼 탭을 소비하지 않도록 했습니다.
- 사진 권한 요청, 편집, 품질 및 배경 저장 방식은 유지합니다.

## 공통 설정 슬라이더

- controlled 값 갱신마다 thumb 이동을 다시 애니메이션하던 `animateTransitions`를 제거했습니다.
- 공통 `step`을 Slider에도 직접 전달하여 드래그 값과 저장 값의 간격을 일치시켰습니다.
- Slider 조작 영역 높이를 48로 확보했습니다.
- 최초 화면 폭으로 고정하던 트랙 폭을 제거하고 `flex: 1`로 현재 사용 가능한 폭을 사용합니다. 폰·태블릿 및 화면 크기 변경에 대응합니다.
- minus/plus 버튼, 값 범위, 값 표시 및 설정 저장 콜백은 유지합니다.

## 검증 범위

JSON 구문과 Git diff 공백 오류를 정적으로 확인했습니다. 컴파일·린트·테스트·새 APK/AAB·iPad 실기기 검증은 실행하지 않았습니다. 실제 iPad에서는 Watch Ad 양끝, 사진 버튼 첫 탭, 각 설정 슬라이더의 누름·드래그·해제 동작을 새 빌드로 확인해야 합니다.

## iPad 슬라이더 드래그 후속 수정

- 1.0.9(27) 출시 산출물 생성 이후 iPad에서 드래그가 잘 시작되지 않거나 끊긴다는 제보에 대응한 소스 변경입니다. 기존 APK/AAB에는 포함되지 않습니다.
- 공통 Slider는 드래그 시작 값을 보관하고, 드래그 중 value prop을 고정하여 상위 설정 갱신이 내부 thumb 위치를 반복 재설정하는 경로를 차단합니다. onValueChange는 계속 전달하므로 설정 값과 숫자 표시는 실시간으로 갱신하고, 드래그 종료 시 외부 값 동기화를 재개합니다.
- Text, Background, Effects의 ScrollView에 directionalLockEnabled, delaysContentTouches=false, canCancelContentTouches=false를 적용했습니다. Text와 Effects에도 keyboardShouldPersistTaps="handled"를 적용했습니다.
- Size의 Pro 잠금, 값 범위와 step은 유지합니다. 잠금 표시 상태의 Size는 의도적으로 조작할 수 없습니다.
- 라이브러리와 앱 소스에서 확인한 값 재설정 및 iOS 터치 취소 경로를 보완한 것입니다. 실제 iPad에서 원인이 재현되거나 개선 효과가 확인된 결과는 아닙니다.
- 이번 후속 변경에서는 빌드·린트·테스트를 실행하지 않았습니다. 다음 승인된 iPad QA에서는 트랙/손잡이 누르기, 양방향 드래그, 해제 시 위치, 세로 스크롤 및 버튼 영역에서 시작하는 드래그, 키보드 표시 상태와 Pro 잠금/해제를 확인해야 합니다. iPhone·Android 회귀 확인도 남아 있습니다.
