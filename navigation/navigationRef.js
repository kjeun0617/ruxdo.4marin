// src/navigation/navigationRef.js
import { createNavigationContainerRef } from '@react-navigation/native';

// 알림 리스너 = 스크린 외부 함수
// props 통해 구현 불가 ,  전역에서 접근 가능한 참조 객체 생성
export const navigationRef = createNavigationContainerRef();
