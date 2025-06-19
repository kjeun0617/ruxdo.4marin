  // App.js
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase/config';
import { getCurrentUser } from './services/auth';
import { navigationRef } from './navigation/navigationRef';

import LoginScreen from './screens/LoginScreen';
import LoadingScreen from './screens/LoadingScreen';
import SignupScreen from './screens/SignupScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import CalendarScreen from './screens/CalendarScreen';
import GuardianCalendarScreen from './screens/GuardianCalendarScreen';

import AlarmScreen from './screens/AlarmScreen';
import GuardianAlarmScreen from './screens/GuardianAlarmScreen';
import AddAlarmScreen from './screens/AddAlarmScreen';
import AlarmDetailScreen from './screens/AlarmDetailScreen';

import StateCameraScreen from './screens/StateCameraScreen';
import StateEmotionScreen from './screens/StateEmotionScreen';
import StateResultScreen from './screens/StateResultScreen';
import GuardianStateViewScreen from './screens/GuardianStateViewScreen';
import SeniorCommentViewScreen from './screens/SeniorCommentViewScreen';

const Stack = createNativeStackNavigator();

// 푸시 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 상태 촬영 요청 알림 예약 함수
async function scheduleStateRequestNotification() {
  const now = new Date();
  const hour = Math.floor(Math.random() * 14) + 6;
  const minute = Math.floor(Math.random() * 60);
  const triggerDate = new Date(now);
  triggerDate.setHours(hour, minute, 0, 0);
  if (triggerDate <= now) triggerDate.setDate(triggerDate.getDate() + 1);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '오늘의 기록',
      body: '지금 뭘 하고 계신가요?',
      data: { type: 'stateRequest' },
    },
    trigger: triggerDate,
    categoryIdentifier: 'stateRequest',
  });
}

export default function App() {
  useEffect(() => {
    (async () => {
      // 권한 요청
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('알림 권한이 필요합니다.');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      // 사용자 확인 및 알림 예약
      const user = await getCurrentUser();
      if (user && user.role === 'senior') {
        await scheduleStateRequestNotification();
      }

      // 카테고리 설정
      await Notifications.setNotificationCategoryAsync('alarmCategory', [
        { identifier: 'confirm', buttonTitle: '확인' },
        { identifier: 'snooze', buttonTitle: '미루기' },
      ]);
      await Notifications.setNotificationCategoryAsync('stateRequest', [
        { identifier: 'confirmState', buttonTitle: '확인' },
        { identifier: 'snoozeState', buttonTitle: '미루기' },
      ]);
    })();

    // 알림 응답 리스너
    const subscription = Notifications.addNotificationResponseReceivedListener(
      async response => {
        const action = response.actionIdentifier;
        const { type, alarmId } = response.notification.request.content.data;
        const user = await getCurrentUser();
        if (!user) return;

        const userId = user.id;
        const partnerId = user.partnerId;

        // 상태 요청 처리
        if (type === 'stateRequest') {
          if (action === 'confirmState' && navigationRef.isReady()) {
            navigationRef.navigate('StateCamera');
          } else if (action === 'snoozeState') {
            Alert.alert(
              '지금 촬영할 수 없어요',
              '5분 뒤 다시 알려드릴까요?',
              [
                {
                  text: '네',
                  onPress: async () => {
                    const newTime = new Date();
                    newTime.setMinutes(newTime.getMinutes() + 5);
                    await Notifications.scheduleNotificationAsync({
                      content: {
                        title: '재알림',
                        body: '지금 상태를 촬영해주세요.',
                        data: { type: 'stateRequest' },
                      },
                      trigger: {
                        hour: newTime.getHours(),
                        minute: newTime.getMinutes(),
                      },
                    });
                  },
                },
                { text: '취소', style: 'cancel' },
              ]
            );
          }
          await scheduleStateRequestNotification();
          return;
        }

        // 일반 알림 처리
        const sendPushToGuardian = async message => {
          const guardianRef = doc(db, 'users', partnerId);
          const snap = await getDoc(guardianRef);
          if (!snap.exists()) return;
          const token = snap.data().expoPushToken;
          if (token) {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: token, sound: 'default', title: '알림 반응', body: message }),
            });
          }
        };

        if (action === 'confirm') {
          const message = `${userId}님이 알림을 확인했습니다.`;
          await setDoc(doc(db, 'responses', `${alarmId}_${Date.now()}`), {
            alarmId,
            userId,
            partnerId,
            response: '확인',
            timestamp: new Date(),
          });
          await sendPushToGuardian(message);
        } else if (action === 'snooze') {
          Alert.prompt('사유', '왜 미루시나요?', async reason => {
            if (!reason) return;
            const delay = 10;
            const newTime = new Date();
            newTime.setMinutes(newTime.getMinutes() + delay);
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '⏰ 미뤄진 알림',
                body: `${delay}분 후 알림: ${reason}`,
                data: { alarmId },
              },
              trigger: { hour: newTime.getHours(), minute: newTime.getMinutes() },
            });
            await setDoc(doc(db, 'responses', `${alarmId}_${Date.now()}`), {
              alarmId,
              userId,
              partnerId,
              response: '미루기',
              reason,
              delayMinutes: delay,
              timestamp: new Date(),
            });
            await sendPushToGuardian(`${userId}님이 알림을 ${delay}분 미뤘습니다.`);
          });
        }
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Schedule" component={CalendarScreen} />
          <Stack.Screen name="Alarm" component={AlarmScreen} />
          <Stack.Screen name="GuardianAlarm" component={GuardianAlarmScreen} options={{ title: '보호자 알람' }} />
          <Stack.Screen name="AddAlarm" component={AddAlarmScreen} />
          <Stack.Screen name="AlarmDetail" component={AlarmDetailScreen} />
          <Stack.Screen name="StateCamera" component={StateCameraScreen} />
          <Stack.Screen name="StateEmotion" component={StateEmotionScreen} />
          <Stack.Screen name="StateResult" component={StateResultScreen} />
          <Stack.Screen name="GuardianCalendar" component={GuardianCalendarScreen} />
          
          <Stack.Screen name="GuardianStateView" component={GuardianStateViewScreen} />
          <Stack.Screen name="SeniorCommentView" component={SeniorCommentViewScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
