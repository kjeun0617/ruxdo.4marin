// screens/SeniorCommentViewScreen.js
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SeniorCommentViewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { photoUri, emotion, comment, from } = route.params;

  const handleConfirm = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.photo} />
      <Text style={styles.emotion}>{emotion}</Text>
      <Text style={styles.commentTitle}>보호자의 댓글</Text>
      <Text style={styles.comment}>
        {comment}
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>확인</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  photo: {
    width: 250,
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  emotion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  commentTitle: {
    fontSize: 16,
    marginBottom: 6,
    color: '#555',
  },
  comment: {
    fontSize: 16,
    paddingHorizontal: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
