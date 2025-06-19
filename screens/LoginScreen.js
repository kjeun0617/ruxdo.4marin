// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { loginUser } from '../services/auth';

export default function LoginScreen({ navigation }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!id || !password) {
      Alert.alert('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }
    try {
      const userData = await loginUser(id, password);
      navigation.replace('Loading', { user: userData });
    } catch (error) {
      console.error(error);
      Alert.alert('로그인 실패', error.message);
    }
  };

  const goToSignup = () => navigation.navigate('Signup');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* 상단 로고 */}
          <Image
            source={require('../assets/logo.png')} // 프로젝트에 맞게 로고 파일 추가
            style={styles.logo}
          />

          {/* 제목 */}
          <Text style={styles.title}>4Marin</Text>

          {/* 입력폼 */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="아이디"
              value={id}
              onChangeText={setId}
              autoCapitalize="none"
              returnKeyType="next"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {/* 버튼 */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={goToSignup}>
              <Text style={styles.secondaryButtonText}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginTop: 60,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 40,
    color: '#333',
  },
  form: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 24,
    marginBottom: 16,
  },
  buttons: {
    width: '100%',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: 'rgb(71, 110, 227)',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'rgb(71, 110, 227)',
    fontSize: 20,
    fontWeight: '500',
  },
});
