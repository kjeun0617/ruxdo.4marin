// screens/GuardianCalendarScreen.js
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

// 한국어 로케일 등록
LocaleConfig.locales['kr'] = {
  monthNames: [...Array(12)].map((_, i) => `${String(i+1).padStart(2,'0')}월`),
  monthNamesShort: [...Array(12)].map((_, i) => `${String(i+1).padStart(2,'0')}월`),
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'kr';

export default function GuardianCalendarScreen({ route }) {
  // guardian user (has .id and .partnerId for senior)
  const { user } = route.params;
  const seniorUid = user.partnerId;

  const [selectedDate, setSelectedDate] = useState('');
  const [seniorSchedules, setSeniorSchedules] = useState({});
  const [guardianSchedules, setGuardianSchedules] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [time, setTime] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [currentDate] = useState(new Date());

  // 이번 달 senior & guardian 일정 불러오기
  useEffect(() => {
    (async () => {
      if (!seniorUid || !user.id) return;

      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth()+1).padStart(2,'0');
      const todayKey = `${year}-${month}-${String(currentDate.getDate()).padStart(2,'0')}`;
      setSelectedDate(todayKey);

      const sData = {}, gData = {};
      for (let day=1; day<=31; day++) {
        const dateKey = `${year}-${month}-${String(day).padStart(2,'0')}`;
        // senior
        const sSnap = await getDoc(doc(db,'users',seniorUid,'schedules',dateKey));
        if (sSnap.exists()) sData[dateKey] = sSnap.data().items;
        // guardian
        const gSnap = await getDoc(doc(db,'users',user.id,'schedules',dateKey));
        if (gSnap.exists()) gData[dateKey] = gSnap.data().items;
      }
      setSeniorSchedules(sData);
      setGuardianSchedules(gData);
    })();
  }, [seniorUid, user.id, currentDate]);

  // 일정 추가 (guardian이 senior 일정에 추가)
  const handleAddSchedule = async () => {
    if (!seniorUid || !selectedDate || !time || !content) return;
    const newEntry = { time, content, statusValue: status };
    const ref = doc(db,'users',seniorUid,'schedules',selectedDate);
    try {
      await setDoc(ref, { items: arrayUnion(newEntry) }, { merge: true });
      setSeniorSchedules(prev => {
        const updated = [...(prev[selectedDate]||[]), newEntry];
        return { ...prev, [selectedDate]: updated };
      });
      setTime(''); setContent(''); setStatus(false); setIsAdding(false);
    } catch (e) {
      console.error(e);
      Alert.alert('에러','일정 저장에 실패했습니다.');
    }
  };

  // senior 일정 삭제
  const handleDelete = async idx => {
    if (!seniorUid || !selectedDate) return;
    const items = seniorSchedules[selectedDate]||[];
    const updated = items.filter((_,i)=>i!==idx);
    const ref = doc(db,'users',seniorUid,'schedules',selectedDate);
    try {
      await setDoc(ref,{ items: updated },{ merge:true });
      setSeniorSchedules(prev=>({ ...prev, [selectedDate]: updated }));
    } catch (e) {
      console.error(e);
      Alert.alert('에러','삭제에 실패했습니다.');
    }
  };

  // 시간 선택기 콜백
  const onChangeTime = (_, sel) => {
    setShowPicker(false);
    if (sel) {
      setSelectedTime(sel);
      setTime(sel.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', hour12:true }));
    }
  };

  // 캘린더 마크 생성 (senior+guardian 합산)
  const getMarkedDates = () => {
    const marked = {};
    const allDates = new Set([
      ...Object.keys(seniorSchedules),
      ...Object.keys(guardianSchedules),
    ]);
    allDates.forEach(dateKey => {
      const senior = seniorSchedules[dateKey]||[];
      const guard = guardianSchedules[dateKey]||[];
      const dots = [
        ...senior.map(() => ({ color:'#FF1493' })), // senior dot
        ...guard.map(() => ({ color:'green' })),    // guardian dot
      ];
      marked[dateKey] = { dots, marked:true };
    });
    return marked;
  };

  // 만남 가능 시간 계산 (양쪽 모두 동일 시간에 statusValue true인 경우)
  const getMeetingTimes = () => {
    const senior = seniorSchedules[selectedDate]||[];
    const guard = guardianSchedules[selectedDate]||[];
    return senior
      .filter(s=>s.statusValue)
      .map(s=>s.time)
      .filter(time => guard.some(g=>g.statusValue && g.time===time));
  };

  return (
    <KeyboardAvoidingView
      style={{flex:1}}
      behavior={Platform.OS==='ios'?'padding':undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Calendar
          current={currentDate.toISOString().split('T')[0]}
          hideDayNames
          markedDates={getMarkedDates()}
          markingType="multi-dot"
          renderHeader={ds => {
            const d = new Date(ds);
            const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0');
            return <Text style={styles.monthHeader}>{y}년 {m}월</Text>;
          }}
          onDayPress={d => { setSelectedDate(d.dateString); setIsAdding(false); }}
          theme={{
            textDayFontWeight:'600', textDayHeaderFontWeight:'600',
            textDayFontSize:16, textMonthFontSize:18, weekVerticalMargin:5
          }}
          style={styles.calendar}
        />

        {selectedDate!=='' && (
          <View style={styles.scheduleBox}>
            <Text style={styles.title}>{selectedDate} 일정</Text>

            {/* 만남 가능 표시 */}
            {getMeetingTimes().length>0 && (
              <Text style={styles.meetingBanner}>
                ✅ 만남 가능 시간: {getMeetingTimes().join(', ')}
              </Text>
            )}

            {/* senior 일정 */}
            { (seniorSchedules[selectedDate]||[]).map((it, idx) => (
              <View key={`s-${idx}`} style={styles.itemRow}>
                <Text style={styles.seniorText}>🕒 {it.time} {it.content}</Text>
                <Button
                  title="삭제" color="red"
                  onPress={()=> Alert.alert('삭제','삭제하시겠습니까?',[
                    {text:'취소',style:'cancel'},
                    {text:'삭제',style:'destructive',onPress:()=>handleDelete(idx)}
                  ])}
                />
              </View>
            )) }

            {/* guardian 일정 (읽기 전용) */}
            { (guardianSchedules[selectedDate]||[]).map((it, idx) => (
              <View key={`g-${idx}`} style={styles.itemRow}>
                <Text style={styles.guardText}>🗒 {it.time} {it.content}</Text>
              </View>
            )) }

            {/* 일정 추가 UI */}
            {!isAdding
              ? <Button title="➕ 일정 추가" onPress={()=>setIsAdding(true)} />
              : (
                <View style={styles.form}>
                  <Button title="시간 선택" onPress={()=>setShowPicker(true)} />
                  <Text>선택된 시간: {time}</Text>
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
                    <Text>가능 여부</Text>
                    <Switch value={status} onValueChange={setStatus} />
                  </View>
                  <Button title="저장" onPress={handleAddSchedule} />
                  <Button title="취소" onPress={()=>setIsAdding(false)} />
                </View>
              )
            }
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding:16, backgroundColor:'#fff', flexGrow:1 },
  monthHeader: { fontSize:20, fontWeight:'bold', textAlign:'center', marginVertical:10 },
  calendar: { marginTop:64 },
  scheduleBox: { marginTop:20 },
  title: { fontSize:18, fontWeight:'bold', marginBottom:10 },
  meetingBanner: { backgroundColor:'#e0f7e9', padding:8, borderRadius:6, marginBottom:10 },
  itemRow: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    marginBottom:8, paddingVertical:6, borderBottomWidth:1, borderColor:'#eee'
  },
  seniorText: { color:'#d32f2f' },
  guardText:  { color:'#388e3c' },
  form: { marginTop:16 },
  input: { borderWidth:1, borderColor:'#ccc', padding:8, borderRadius:6, marginVertical:8 },
  switchRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
});
