// screens/CalendarPage.js
import DateTimePicker from '@react-native-community/datetimepicker';
import { arrayUnion, doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { db } from '../firebase/config';

// 한국어 로케일 설정
LocaleConfig.locales['kr'] = {
  monthNames: [...Array(12)].map((_, i) => `${String(i + 1).padStart(2, '0')}월`),
  monthNamesShort: [...Array(12)].map((_, i) => `${String(i + 1).padStart(2, '0')}월`),
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'kr';

export default function CalendarPage({ route }) {
  // route.params.user 에서 로그인된 사용자 정보(id, role 등)를 받습니다.
  const { user } = route.params;

  const [selectedDate, setSelectedDate] = useState('');
  const [scheduleData, setScheduleData] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [time, setTime] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isGuardian] = useState(user.role === 'guardian');
  const [currentDate] = useState(new Date());

  // 사용자의 이번 달 전체 일정을 Firestore에서 불러와 로컬 상태에 저장
  useEffect(() => {
    (async () => {
      if (!user?.id) return;

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const todayKey = `${year}-${month}-${String(currentDate.getDate()).padStart(2, '0')}`;
      setSelectedDate(todayKey);

      const allData = {};
      for (let day = 1; day <= 31; day++) {
        const dateKey = `${year}-${month}-${String(day).padStart(2, '0')}`;
        const ref = doc(db, 'users', user.id, 'schedules', dateKey);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          allData[dateKey] = snap.data().items;
        }
      }
      setScheduleData(allData);
    })();
  }, [user, currentDate]);

  // 새 일정을 Firestore와 로컬 상태에 모두 저장
  const handleAddSchedule = async () => {
    if (!user?.id || !selectedDate || !time || !content) return;

    const newEntry = {
      time,
      content,
      statusType: isGuardian ? 'available' : 'meeting',
      statusValue: status,
    };
    const ref = doc(db, 'users', user.id, 'schedules', selectedDate);

    try {
      await setDoc(ref, { items: arrayUnion(newEntry) }, { merge: true });
      setScheduleData(prev => {
        const updated = [...(prev[selectedDate] || []), newEntry];
        return { ...prev, [selectedDate]: updated };
      });
      // 입력 폼 초기화
      setTime('');
      setContent('');
      setStatus(false);
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      Alert.alert('에러', '일정 저장에 실패했습니다.');
    }
  };

  // 선택된 날짜의 일정 중 하나를 삭제
  const handleDeleteSchedule = async (idx) => {
    if (!user?.id) return;
    const items = scheduleData[selectedDate] || [];
    const updated = items.filter((_, i) => i !== idx);
    const ref = doc(db, 'users', user.id, 'schedules', selectedDate);

    try {
      await setDoc(ref, { items: updated }, { merge: true });
      setScheduleData(prev => ({ ...prev, [selectedDate]: updated }));
    } catch (e) {
      console.error(e);
      Alert.alert('에러', '일정 삭제에 실패했습니다.');
    }
  };

  // 시간 선택기 콜백
  const onChangeTime = (_, selected) => {
    setShowPicker(false);
    if (selected) {
      setSelectedTime(selected);
      setTime(selected.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }));
    }
  };

  // 달력에 표시할 마크 생성
  const getMarkedDates = () => {
    const marked = {};
    for (const dateKey in scheduleData) {
      const items = scheduleData[dateKey];
      if (!items?.length) continue;
      marked[dateKey] = {
        dots: items.map(item => ({
          color:
            item.statusType === 'meeting'
              ? item.statusValue ? '#FF1493' : '#0000FF'
              : item.statusValue ? 'green' : '#0000FF',
        })),
        marked: true,
      };
    }
    return marked;
  };

  // 일정 텍스트 색상 반환
  const getItemStyle = item => ({
    color:
      item.statusType === 'meeting'
        ? item.statusValue ? '#FF1493' : '#0000FF'
        : item.statusValue ? 'green' : '#0000FF',
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Calendar
          current={currentDate.toISOString().split('T')[0]}
          hideDayNames
          markedDates={getMarkedDates()}
          markingType="multi-dot"
          renderHeader={dateStr => {
            const d = new Date(dateStr);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            return <Text style={styles.monthHeader}>{y}년 {m}월</Text>;
          }}
          onDayPress={day => {
            setSelectedDate(day.dateString);
            setIsAdding(false);
          }}
          theme={{
            textDayFontWeight: '600',
            textDayHeaderFontWeight: '600',
            textDayFontSize: 16,
            textMonthFontSize: 18,
            weekVerticalMargin: 5,
          }}
          style={styles.calendar}
        />

        {selectedDate !== '' && (
          <View style={styles.scheduleBox}>
            <Text style={styles.title}>{selectedDate} 일정</Text>

            {Array.isArray(scheduleData[selectedDate]) && scheduleData[selectedDate].length > 0 ? (
              scheduleData[selectedDate].map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={getItemStyle(item)}>🕒 {item.time}</Text>
                  <Text style={getItemStyle(item)}>📌 {item.content}</Text>
                  <Text style={getItemStyle(item)}>
                    {item.statusType === 'meeting'
                      ? item.statusValue
                        ? '👥 만남 있음'
                        : '🙅‍♀️ 만남 없음'
                      : item.statusValue
                      ? '✅ 가능'
                      : '❌ 불가능'}
                  </Text>
                  <Button
                    title="삭제"
                    color="red"
                    onPress={() =>
                      Alert.alert(
                        '삭제 확인',
                        '이 일정을 삭제하시겠습니까?',
                        [
                          { text: '취소', style: 'cancel' },
                          { text: '삭제', style: 'destructive', onPress: () => handleDeleteSchedule(idx) },
                        ]
                      )
                    }
                  />
                </View>
              ))
            ) : (
              <Text style={styles.empty}>일정이 없습니다.</Text>
            )}

            {!isAdding && (
              <Button title="➕ 일정 추가" onPress={() => setIsAdding(true)} />
            )}

            {isAdding && (
              <View style={styles.form}>
                <Button title="시간 선택" onPress={() => setShowPicker(true)} />
                <Text>선택한 시간: {time}</Text>
                {showPicker && (
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={onChangeTime}
                  />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="내용"
                  value={content}
                  onChangeText={setContent}
                />
                <View style={styles.switchRow}>
                  <Text>{isGuardian ? '가능 여부' : '만남 여부'}</Text>
                  <Switch value={status} onValueChange={setStatus} />
                </View>
                <Button title="저장" onPress={handleAddSchedule} />
                <Button title="취소" onPress={() => setIsAdding(false)} />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  calendar: {
    marginTop: 64,
  },
  scheduleBox: {
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 8,
  },
  empty: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#666',
  },
  form: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});
