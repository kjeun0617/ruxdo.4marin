// screens/AddAlarmScreen.js
import * as Notifications from 'expo-notifications';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { db } from '../firebase/config';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
const titles = ['약 복용', '식사 시간', '산책', '기상', '취침 준비'];

export default function AddAlarmScreen({ route, navigation }) {
  const user = route.params?.user;
  const editAlarm = route.params?.editAlarm;

  const [selectedDays, setSelectedDays] = useState([]);
  const [repeat, setRepeat] = useState(true);
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (editAlarm) {
      setSelectedDays(editAlarm.days || []);
      setRepeat(editAlarm.repeat);
      setTime(editAlarm.time);
      setTitle(editAlarm.title);
      setDetail(editAlarm.detail);
    }
  }, [editAlarm]);

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // ✅ 시간 입력 핸들러 (자동 포맷: HH:MM)
  const handleTimeInput = (input) => {
    const numeric = input.replace(/\D/g, '');
    let formatted = numeric;

    if (numeric.length > 2) {
      formatted = numeric.slice(0, 2) + ':' + numeric.slice(2, 4);
    }

    setTime(formatted.slice(0, 5));
  };

  const handleSave = async () => {
    if (!time || !title) {
      alert('시간과 제목은 필수 항목입니다.');
      return;
    }

    try {
      const [hourStr, minuteStr] = time.split(':');
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(parseInt(hourStr), parseInt(minuteStr), 0, 0);

      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      let alarmId;

      if (editAlarm) {
        const alarmRef = doc(db, 'alarms', editAlarm.id);
        await updateDoc(alarmRef, {
          time,
          title,
          detail,
          repeat,
          days: selectedDays,
        });
        alarmId = editAlarm.id;
        await Notifications.cancelAllScheduledNotificationsAsync();
      } else {
        const alarmDoc = await addDoc(collection(db, 'alarms'), {
          userId: user.id,
          time,
          title,
          detail,
          repeat,
          days: selectedDays,
          createdAt: new Date(),
        });
        alarmId = alarmDoc.id;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: detail || '(상세 내용 없음)',
          data: { alarmId },
          sound: true,
          categoryIdentifier: 'alarmCategory',
        },
        trigger: {
          hour: scheduledTime.getHours(),
          minute: scheduledTime.getMinutes(),
          repeats: repeat,
        },
      });

      alert('알림이 저장되었습니다.');
      navigation.goBack();

    } catch (error) {
      console.error('알림 저장 오류:', error);
      alert('저장 실패: ' + error.message);
    }
  };


return (
  <KeyboardAwareScrollView
    contentContainerStyle={styles.container}
    enableOnAndroid={true}
    extraScrollHeight={100}
    keyboardShouldPersistTaps="handled"
  >
    <Text style={styles.label}>요일 선택</Text>
    <View style={styles.daysContainer}>
      {daysOfWeek.map((day) => (
        <TouchableOpacity
          key={day}
          style={[styles.day, selectedDays.includes(day) && styles.selected]}
          onPress={() => toggleDay(day)}
        >
          <Text style={styles.dayText}>{day}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={styles.label}>반복 여부</Text>
    <View style={styles.repeatContainer}>
      <TouchableOpacity
        onPress={() => setRepeat(true)}
        style={[styles.repeatButton, repeat && styles.selected]}
      >
        <Text style={styles.repeatText}>반복</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setRepeat(false)}
        style={[styles.repeatButton, !repeat && styles.selected]}
      >
        <Text style={styles.repeatText}>1회성</Text>
      </TouchableOpacity>
    </View>

    <Text style={styles.label}>시간 (예: 08:30)</Text>
    <TextInput
      value={time}
      onChangeText={handleTimeInput}
      style={styles.input}
      placeholder="HH:MM 형식"
      keyboardType="numeric"
      maxLength={5}
    />

    <Text style={styles.label}>제목</Text>
    <View style={styles.titlesContainer}>
      {titles.map((t) => (
        <TouchableOpacity
          key={t}
          style={[styles.titleButton, title === t && styles.selected]}
          onPress={() => setTitle(t)}
        >
          <Text>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={styles.label}>상세 내용</Text>
    <TextInput
      value={detail}
      onChangeText={setDetail}
      placeholder="내용을 입력하세요"
      style={[styles.input, { height: 100 }]}
      multiline
    />

    <Button title="알림 저장" onPress={handleSave} />
  </KeyboardAwareScrollView>
);
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  label: {
    marginTop: 15,
    marginBottom: 5,
    fontWeight: 'bold',
    fontSize: 20, // 🔺 두 배로 증가
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  day: {
    width: '13%', // 7개가 한 줄에 딱 맞게
    aspectRatio: 1, // 정사각형
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 4,
    fontSize: 20,
  },
  selected: {
    backgroundColor: '#cdeaff',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  repeatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  repeatButton: {
    width: '48%',
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    fontSize: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 18, // 🔺 입력란 글자 크기 증가
  },
  titlesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  titleButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 4,
    marginRight: 8,
    fontSize: 18,
  },
  container: {
  padding: 20,
  paddingBottom: 100,
},

});

