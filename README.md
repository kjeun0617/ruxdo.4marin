## 소개
|**곁애**|
|:---:|
|img|
|고령자와 보호자를 잇는 간접 소통 어플|

## 환경
**react native expo** 제작
<br /> **firebase firestore** 연동
<br /> **APK 빌드**로 **Android 환경** 구동 확인

## 파일 구성
**곁애-app/**
<br />App.js
<br />firebase/
<br />    └── config.js → firebase database 연동 ID
<br />components/
<br />    ~~└── CameraModal.js~~
<br />    └── NotificationPopup.js → 앱 외 알림 팝업
<br />screens/
<br />    ├── AddAlarmScreen.js
<br />    ├── AlarmDetailScreen.js
<br />    ├── AlarmScreen.js
<br />    ├── CalendarScreen.js
<br />    ├── GuardianCalendarScreen.js
<br />    ├── GuardianStateViewScreen.js
<br />    ├── LoadingScreen.js
<br />    ├── LoginScreen.js
<br />    ├── ProfileScreen.js
<br />    ├── SeniorCommentViewScreen.js
<br />    ├── SettingScreen.js
<br />    ├── SignupScreen.js
<br />    ~~├── StateCameraScreen.js~~
<br />    ~~├── StateEmotionScreen.js~~
<br />    ~~└── StateResultScreen.js~~
<br />~~components/~~
<br />    ~~└── InputField.js~~ 
<br />navigation/
<br />    └── navigationRef.js → 전역 접근 참조 객체

## 해결해야할 문제 
local 환경 속, 앱 외 팝업 알림이 제대로 작동하지 않는 문제



## 향후 발전 방향
- **자동 입력** : 고령자 불필요한 앱 상호작용 줄임
<br /> 알람 : 처방전 등 사진 촬영 이용한 복약 시간 자동 입력
<br /> 알람 : 입력한 기상, 취침 시간으로 고령자 활동 시간 적절히 분활해 3끼 알람 적용
<br /> 일정 : 정기적인 일정 분석해 향후에도 동일 적용 제안(ex 한 달에 한 번 병원 방문 일정, 반복할 것인지)
<br />

- **이벤트 성 기능** : 앱 사용에 재미 요소 추가
<br /> 돌발 사진 촬영 : 고령자 하루 일과 중 부정기적으로 
