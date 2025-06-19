// screens/ProfileScreen.js
import * as Notifications from 'expo-notifications';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { db } from '../firebase/config';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ route, navigation }) {
  const { user } = route.params;

  // 보호자 푸시 토큰 등록
  useEffect(() => {
    const registerPushToken = async () => {
      if (user.role === 'guardian') {
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();
        await updateDoc(doc(db, 'users', user.id), { expoPushToken });
      }
    };
    registerPushToken();
  }, [user.id]);

  // 보호자: 고령자 반응 실시간 구독
  useEffect(() => {
    if (user.role === 'guardian') {
      const q = query(
        collection(db, 'responses'),
        where('partnerId', '==', user.id)
      );
      const unsub = onSnapshot(q, snap => {
        snap.docChanges().forEach(c => {
          if (c.type === 'added') {
            const d = c.doc.data();
            const msg =
              d.response === '확인'
                ? `${d.userId}님이 알림을 확인했습니다.`
                : `${d.userId}님이 '${d.reason}'로 ${d.delayMinutes}분 미뤘습니다.`;
            Alert.alert('고령자 반응 알림', msg);
          }
        });
      });
      return () => unsub();
    }
  }, [user.id, user.role]);

  // 버튼 핸들러: role에 따라 네비게이션 분기
  const handleAlarm = () => {
    if (user.role === 'guardian') {
      navigation.navigate('GuardianAlarm', { user });
    } else {
      navigation.navigate('Alarm', { user });
    }
  };

  const handleSchedule = () => {
    if (user.role === 'guardian') {
      navigation.navigate('GuardianCalendar', { user });
    } else {
      navigation.navigate('Schedule', { user });
    }
  };

  return (
    <View style={styles.screen}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerText}>고령자 메인</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings', { user })}
        >
          <MaterialCommunityIcons name="cog-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: user.image }} style={styles.avatar} />
        </View>
        <Text style={styles.name}>{user.name}님</Text>
        <Text style={styles.subTitle}>오늘의 상태를 기록해주세요</Text>
      </View>

      {/* 액션 버튼 그룹 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FFEE93' }]}
          onPress={handleAlarm}
        >
          <MaterialCommunityIcons name="pill" size={32} color="#333" />
          <Text style={styles.actionText}>오늘 할 일</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F6C24C' }]}
          onPress={handleSchedule}
        >
          <MaterialCommunityIcons name="calendar-check" size={32} color="#333" />
          <Text style={styles.actionText}>일정 확인</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_PADDING = 20;
const AVATAR_SIZE = 100;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    width: width,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 16,
    color: '#888',
  },
  settingsButton: {
    padding: 8,
  },
  profileCard: {
    width: width * 0.9,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: CARD_PADDING,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 16,
    height: AVATAR_SIZE + 16,
    borderRadius: (AVATAR_SIZE + 16) / 2,
    backgroundColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    width: width * 0.9,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 50,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  actionText: {
    marginLeft: 12,
    fontSize: 30,
    fontWeight: '600',
    color: '#333',
  },
});
