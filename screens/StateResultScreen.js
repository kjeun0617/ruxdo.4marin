// screens/StateResultScreen.js
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase/config';

export default function StateResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { photo, emotion } = route.params;

  useEffect(() => {
    sendPushToGuardian();
  }, []);

  const sendPushToGuardian = async () => {
    const userId = 'senior_001';
    const partnerId = 'guardian_001';
    const guardianRef = doc(db, 'users', partnerId);
    const guardianSnap = await getDoc(guardianRef);

    if (guardianSnap.exists()) {
      const guardianData = guardianSnap.data();
      const expoPushToken = guardianData.expoPushToken;

      if (expoPushToken) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: expoPushToken,
            sound: 'default',
            title: '고령자의 상태 표현',
            body: `${userId}님이 상태를 기록했습니다. 확인하시겠습니까?`,
            data: { type: 'stateShared', photoUri: photo.uri, emotion: emotion.description },
          }),
        });
      }
    }
  };

  const handleDone = () => {
    Alert.alert('완료', '오늘의 상태 기록이 전송되었습니다.');
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.photo} />
      <Text style={styles.text}>{emotion.description}</Text>
      <TouchableOpacity style={styles.button} onPress={handleDone}>
        <Text style={styles.buttonText}>확인</Text>
      </TouchableOpacity>
      {/* 저장 기능 추가 가능 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
  },
  photo: {
    width: 250,
    height: 250,
    borderRadius: 8,
    marginBottom: 20,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
