// screens/GuardianAlarmScreen.js
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function GuardianAlarmScreen({ route, navigation }) {
  const { user } = route.params;  
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    const fetchAlarms = async () => {
      try {
        // 보호자는 partnerId(고령자 uid) 일정만 조회
        const targetId = user.role === 'guardian' 
          ? user.partnerId 
          : user.id;
        const q = query(
          collection(db, 'alarms'),
          where('userId', '==', targetId)
        );
        const snap = await getDocs(q);
        setAlarms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('알림 가져오기 오류:', e);
        Alert.alert('오류', '알림을 불러오는 데 실패했습니다.');
      }
    };

    const unsub = navigation.addListener('focus', fetchAlarms);
    return unsub;
  }, [navigation, user]);

  // 보호자는 삭제 불가, 완료 인증 불가 → 단순 조회
  const renderItem = ({ item }) => (
    <View style={styles.alarmItem}>
      <View style={styles.info}>
        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.repeat ? '반복' : '1회성'} / {item.days?.join(', ')}
        </Text>
      </View>
      {/* 완료 여부만 표시 (체크는 disabled) */}
      <View style={[styles.checkBox, item.completed && styles.checked]}>
        <Text style={styles.checkText}>{item.completed ? '✔︎' : ''}</Text>
      </View>
    </View>
  );

  // 보호자가 알람 추가: partnerId 로 고령자 uid 전달
  const goToAddAlarm = () => {
    const seniorUser = { ...user, id: user.partnerId };
    navigation.navigate('AddAlarm', { user: seniorUser });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* 추가 버튼 */}
        {user.role === 'guardian' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={goToAddAlarm}
          >
            <Text style={styles.addButtonText}>＋ 일정 추가</Text>
          </TouchableOpacity>
        )}

        <FlatList
          data={alarms}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>등록된 알림이 없습니다.</Text>
          }
          contentContainerStyle={
            alarms.length === 0 && styles.emptyContainer
          }
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  alarmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  info: { flex: 1 },
  time: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 16, marginTop: 4 },
  meta: { fontSize: 12, color: '#666', marginTop: 2 },
  checkBox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkText: { color: '#fff', fontSize: 16 },
  addButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  addButtonText: { color: '#fff', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: '#888' },
});
