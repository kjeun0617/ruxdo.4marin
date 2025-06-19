// screens/GuardianStateViewScreen.js
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../firebase/config';

export default function GuardianStateViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { photoUri, emotion } = route.params;

  const [comment, setComment] = useState('');

  const sendCommentToSenior = async () => {
    const partnerId = 'senior_001';
    const guardianId = 'guardian_001';

    const seniorRef = doc(db, 'users', partnerId);
    const seniorSnap = await getDoc(seniorRef);

    if (seniorSnap.exists()) {
      const seniorData = seniorSnap.data();
      const expoPushToken = seniorData.expoPushToken;

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
            title: '보호자의 댓글 도착',
            body: '보호자가 오늘의 상태에 댓글을 남겼습니다. 확인하시겠습니까?',
            data: { type: 'comment', comment, from: guardianId },
          }),
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('댓글을 입력해주세요');
      return;
    }
    await sendCommentToSenior();
    Alert.alert('댓글이 전송되었습니다');
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.photo} />
      <Text style={styles.text}>{emotion}</Text>
      <TextInput
        style={styles.input}
        placeholder="고령자에게 남길 말..."
        value={comment}
        onChangeText={setComment}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>댓글 전송</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fefefe',
  },
  photo: {
    width: 250,
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
