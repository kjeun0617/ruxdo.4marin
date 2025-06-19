// screens/AlarmScreen.js
import 'react-native-gesture-handler';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { db } from '../firebase/config';

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];

export default function AlarmScreen({ route, navigation }) {
  const { user } = route.params || {};

  if (!user || !user.id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>사용자 정보가 없습니다.</Text>
      </View>
    );
  }
  const [alarms, setAlarms] = useState([]);

  useEffect(() => {
    const fetchAlarms = async () => {
      const q = query(collection(db, 'alarms'), where('userId', '==', user.id));
      const snap = await getDocs(q);
      setAlarms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    const unsub = navigation.addListener('focus', fetchAlarms);
    return unsub;
  }, [navigation]);

  const deleteAlarm = async (id) => {
    await deleteDoc(doc(db, 'alarms', id));
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const renderLeftActions = (item) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => Alert.alert(
        '삭제 확인',
        '이 알림을 삭제하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: () => deleteAlarm(item.id) },
        ]
      )}
    >
      <Text style={styles.deleteButtonText}>삭제</Text>
    </TouchableOpacity>
  );

  const handleAuthenticate = async (item) => {
    const alarmRef = doc(db, 'alarms', item.id);
    const newCompleted = !item.completed;
    await updateDoc(alarmRef, { completed: newCompleted });

    setAlarms(prev =>
      prev.map(a =>
        a.id === item.id ? { ...a, completed: newCompleted } : a
      )
    );
  };

  const now = new Date();
  const idxToday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const idxTomorrow = (idxToday + 1) % 7;
  const strToday = daysOfWeek[idxToday], strTomorrow = daysOfWeek[idxTomorrow];

  const todayList = alarms.filter(a => a.days?.includes(strToday));
  const tomorrowList = alarms.filter(a => !a.days?.includes(strToday) && a.days?.includes(strTomorrow));
  const laterList = alarms.filter(a => !a.days?.includes(strToday) && !a.days?.includes(strTomorrow));

  const parseMin = t => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const sortedToday = [...todayList].sort((a, b) => parseMin(a.time) - parseMin(b.time));
  const past = sortedToday.filter(a => parseMin(a.time) < nowMin);
  const future = sortedToday.filter(a => parseMin(a.time) >= nowMin);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddAlarm', { user })}>
          <Text style={styles.addButtonText}>＋</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.todayBox}>
            <Text style={styles.header}>오늘의 일정</Text>
            {past.map(item => renderItem(item))}
            {future.length > 0 && (
              <View style={styles.nowLine}><Text>⌚ 현재</Text></View>
            )}
            {future.map(item => renderItem(item))}
          </View>
          <Text style={styles.header}>내일의 일정</Text>
          {tomorrowList.length === 0
            ? <Text style={styles.empty}>등록된 내일 일정이 없습니다.</Text>
            : tomorrowList.map(item => renderItem(item))}

          <Text style={styles.header}>다음에 할 일</Text>
          {laterList.length === 0
            ? <Text style={styles.empty}>등록된 일정이 없습니다.</Text>
            : laterList.map(item => renderItem(item))}
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );

  function renderItem(item) {
    const isPast = item.days?.includes(strToday) && parseMin(item.time) < nowMin;

    return (
      <Swipeable key={item.id} renderLeftActions={() => renderLeftActions(item)}>
        <TouchableOpacity
          style={[styles.card, isPast && styles.pastCard]}
          onPress={() => navigation.navigate('AlarmDetail', { alarm: item })}
        >
          <View style={styles.info}>
            <Text style={[styles.time, isPast && styles.pastText]}>{item.time}</Text>
            <Text style={[styles.title, isPast && styles.pastText]}>{item.title}</Text>
            <Text style={[styles.sub, isPast && styles.pastText]}>
              {item.repeat ? '반복' : '1회성'} / {item.days?.join(', ')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleAuthenticate(item)}
            style={[styles.checkBtn, item.completed && styles.checked]}
          >
            <Text style={styles.checkText}>{item.completed ? '✔︎' : ''}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    );
  }
}

const styles = StyleSheet.create({
  todayBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: { padding: 20, paddingTop: 60 },
  addButton: { position: 'absolute', top: 20, right: 20, zIndex: 2 },
  addButtonText: { fontSize: 56, color: '#007AFF' },
  header: { fontSize: 40, fontWeight: 'bold', marginTop: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  info: { flex: 1 },
  time: { fontSize: 32, fontWeight: '500' },
  title: { fontSize: 32 },
  sub: { fontSize: 24, color: '#666' },
  checkBtn: {
    width: 40, height: 40,
    borderWidth: 1, borderColor: '#888',
    borderRadius: 4, alignItems: 'center', justifyContent: 'center',
  },
  checked: { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  checkText: { color: '#fff', fontSize: 32 },
  nowLine: {
    borderTopWidth: 1, borderColor: '#007AFF',
    marginVertical: 10, alignItems: 'center', paddingVertical: 4,
  },
  empty: { fontStyle: 'italic', color: '#888', marginVertical: 8, fontSize: 24 },
  deleteButton: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 28 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pastCard: { backgroundColor: '#f0f0f0' },
  pastText: { color: '#999' },
});
