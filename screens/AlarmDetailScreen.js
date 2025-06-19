// screens/AlarmDetailScreen.js
import * as Notifications from 'expo-notifications';
import { deleteDoc, doc } from 'firebase/firestore';
import { Button, StyleSheet, Text, View } from 'react-native';
import { db } from '../firebase/config';

export default function AlarmDetailScreen({ route, navigation }) {
  const { alarm } = route.params;

  const handleDelete = () => {
// 수정된 올바른 코드
Alert.alert('알림 삭제', '정말 삭제하시겠습니까?', [
  { text: '취소' },
  {
    text: '삭제',
    style: 'destructive',
    onPress: async () => {
      try {
        await deleteDoc(doc(db, 'alarms', alarm.id));
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert('삭제되었습니다');
        navigation.goBack();
      } catch (e) {
        console.error(e);
        Alert.alert('삭제 실패', e.message);
      }
    },
  },
]);

  };

  const handleEdit = () => {
    navigation.navigate('AddAlarm', { user: alarm.user, editAlarm: alarm });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{alarm.title}</Text>
      <Text>{alarm.time} / {alarm.repeat ? '반복' : '1회성'}</Text>
      <Text>요일: {alarm.days?.join(', ')}</Text>
      <Text>내용: {alarm.detail}</Text>

      <View style={styles.buttonGroup}>
        <Button title="✏️ 수정" onPress={handleEdit} />
        <Button title="🗑️ 삭제" onPress={handleDelete} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  buttonGroup: { marginTop: 20, gap: 10 },
});
