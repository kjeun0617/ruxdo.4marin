// screens/StateEmotionScreen.js
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const emotions = [
  { label: '신나요', description: '신나는 하루' },
  { label: '행복해요', description: '행복한 하루' },
  { label: '슬퍼요', description: '조금 우울한 하루' },
  { label: '화나요', description: '짜증나는 하루' },
  { label: '지쳐요', description: '지치는 하루' },
];

export default function StateEmotionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { photo } = route.params;

  const handleSelectEmotion = (emotion) => {
    navigation.navigate('StateResult', {
      photo,
      emotion,
    });
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.photo} />
      <Text style={styles.prompt}>오늘 기분은 어떤가요?</Text>
      <View style={styles.buttonsContainer}>
        {emotions.map((e, index) => (
          <TouchableOpacity key={index} style={styles.emotionButton} onPress={() => handleSelectEmotion(e)}>
            <Text style={styles.buttonText}>{e.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  prompt: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  emotionButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
  },
});
