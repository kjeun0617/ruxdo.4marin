// screens/SignupScreen.js
import React, { useState } from 'react';
import {
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { createUser } from '../services/auth';
import { db } from '../firebase/config';

export default function SignupScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [phoneChecked, setPhoneChecked] = useState(false);
  const [isPhoneUnique, setIsPhoneUnique] = useState(false);

  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerChecked, setPartnerChecked] = useState(false);
  const [partnerExists, setPartnerExists] = useState(false);
  const [partnerName, setPartnerName] = useState('');

  const [role, setRole] = useState(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.5 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // 010-1234-5678 format
  const formatPhone = raw => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = text => {
    const formatted = formatPhone(text);
    setPhone(formatted);
    setPhoneChecked(false);
  };

  const handlePartnerPhoneChange = text => {
    const formatted = formatPhone(text);
    setPartnerPhone(formatted);
    setPartnerChecked(false);
  };

 const checkPhone = async () => {
  if (!phone || typeof phone !== 'string') {
    Alert.alert('입력 오류', '전화번호를 입력해주세요.');
    return;
  }
  if (!/^\d{3}-\d{4}-\d{4}$/.test(phone)) {
    Alert.alert('포맷 오류', '010-1234-5678 형식으로 입력해주세요.');
    return;
  }

  try {
    const q = query(
      collection(db, 'users'),
      where('phone', '==', phone)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      Alert.alert(
        '확인 완료',
        '사용 가능한 전화번호입니다. 등록하시겠습니까?',
        [
          {
            text: '아니요',
            style: 'cancel',
          },
          {
            text: '예',
            onPress: () => {
              setIsPhoneUnique(true);
              setPhoneChecked(true);
            },
          },
        ]
      );
    } else {
      setIsPhoneUnique(false);
      setPhoneChecked(true);
      Alert.alert('중복 확인', '이미 가입된 전화번호입니다.');
    }
  } catch (e) {
    console.error('checkPhone error:', e);
    Alert.alert('오류', '전화번호 확인 중 오류 발생');
  }
};

  const checkPartnerPhone = async () => {
    if (role !== 'guardian') return;
    if (!partnerPhone || typeof partnerPhone !== 'string') {
      Alert.alert('입력 오류', '고령자 전화번호를 입력해주세요.');
      return;
    }
    if (!/^\d{3}-\d{4}-\d{4}$/.test(partnerPhone)) {
      Alert.alert('포맷 오류', '010-1234-5678 형식으로 입력해주세요.');
      return;
    }
    try {
      const q = query(
        collection(db, 'users'),
        where('phone', '==', partnerPhone)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setPartnerExists(false);
        setPartnerChecked(true);
        Alert.alert('확인 결과', '등록된 회원이 아닙니다.');
      } else {
        const data = snap.docs[0].data();
        setPartnerName(data.name);
        
        Alert.alert(
          '연결 확인',
          `${data.name}님이 맞습니까?`,
          [
            {
              text: '아니요',
              style: 'cancel',
              onPress: () => {
                // 🔧 다시 입력 가능하도록 상태 초기화
                setPartnerExists(false);
                setPartnerChecked(false);
                setPartnerName('');
              },
            },
            {
              text: '예',
              onPress: () => {
                // ✅ 확정
                setPartnerExists(true);
                setPartnerChecked(true);
              },
            },
          ]
        );
      }
    } catch (e) {
      console.error('checkPartnerPhone error:', e);
      Alert.alert('오류', '연결 확인 중 오류 발생');
    }
  };

  const handleSignup = async () => {
    if (!phoneChecked || !isPhoneUnique) {
      Alert.alert('전화번호 중복 확인을 해주세요.');
      return;
    }
    if (role === 'guardian' && (!partnerChecked || !partnerExists)) {
      Alert.alert('고령자 연락처를 확인해주세요.');
      return;
    }
    if (!name || !id || !password || !image || !role) {
      Alert.alert('모든 항목을 입력해주세요.');
      return;
    }
    const signupData = { id, name, password, phone, image, role };
    if (role === 'guardian') signupData.partnerPhone = partnerPhone;
    try {
      await createUser(signupData);
      Alert.alert('회원가입 완료!', '이제 로그인해주세요.');
      navigation.replace('Login');
    } catch (error) {
      console.error('signup error:', error);
      Alert.alert('회원가입 실패', error.message);
    }
  };

  return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // ✅ 안드로이드는 'height'
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: 300 }]}
          keyboardShouldPersistTaps="handled" // ✅ 이걸 꼭 넣어야 입력창 터치 가능
        >
          <Text style={styles.header}>회원가입</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.plus}>＋</Text>
                <Text style={styles.pickText}>프로필 사진 선택</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.roleLabel}>계정 유형 선택</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'senior' && styles.roleSelected]}
              onPress={() => setRole('senior')}
            >
              <Text
                style={[styles.roleText, role === 'senior' && styles.roleTextSelected]}
              >
                고령자
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'guardian' && styles.roleSelected]}
              onPress={() => setRole('guardian')}
            >
              <Text
                style={[styles.roleText, role === 'guardian' && styles.roleTextSelected]}
              >
                보호자
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="이름"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="아이디"
              value={id}
              onChangeText={setId}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <View style={styles.phoneRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.phoneInput,
                  phoneChecked && isPhoneUnique && styles.disabledInput
                ]}
                placeholder="전화번호 (010-1234-5678)"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                editable={!phoneChecked || !isPhoneUnique}
                autoCorrect={false}
              />
              {phoneChecked && isPhoneUnique ? (
                  <View style={styles.confirmedBox}>
                    <Text style={styles.confirmedBoxText}>확인됨</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={checkPhone}
                  >
                    <Text style={styles.checkText}>등록확인</Text>
                  </TouchableOpacity>
                )}
            </View>

            {role === 'guardian' && (
              <View style={styles.phoneRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.phoneInput,
                    partnerChecked && partnerExists && styles.disabledInput
                  ]}
                  placeholder="고령자 전화번호 (010-1234-5678)"
                  value={partnerPhone}
                  onChangeText={handlePartnerPhoneChange}
                  keyboardType="phone-pad"
                  editable={!partnerChecked || !partnerExists}
                  autoCorrect={false}
                />
                {partnerChecked && partnerExists ? (
                    <View style={styles.confirmedBox}>
                      <Text style={styles.confirmedBoxText}>확인됨</Text>
                    </View>
                ) : (
                   <TouchableOpacity
                     style={styles.checkBtn}
                     onPress={checkPartnerPhone}
                   >
                     <Text style={styles.checkText}>연결확인</Text>
                   </TouchableOpacity>
                 )}
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleSignup}>
            <Text style={styles.submitText}>회원가입</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const PRIMARY_BLUE = '#4A90E2';
const LIGHT_BLUE = '#E4F1FE';
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 20, alignItems: 'center', backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '700', color: PRIMARY_BLUE, marginBottom: 24 },
  imagePicker: { marginBottom: 24 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: PRIMARY_BLUE },
  profilePlaceholder: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: PRIMARY_BLUE, backgroundColor: LIGHT_BLUE, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 40, color: PRIMARY_BLUE, marginBottom: 4 },
  pickText: { fontSize: 12, color: PRIMARY_BLUE },
  form: { width: '100%' },
  input: { width: '100%', height: 48, backgroundColor: LIGHT_BLUE, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, marginBottom: 12, borderColor: PRIMARY_BLUE, borderWidth: 1 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  phoneInput: { flex: 1, marginRight: 8 },
  checkBtn: { paddingVertical: 12, paddingHorizontal: 10, backgroundColor: PRIMARY_BLUE, borderRadius: 6 },
  checkText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  roleLabel: { alignSelf: 'flex-start', fontSize: 16, fontWeight: '500', color: PRIMARY_BLUE, marginVertical: 8 },
  roleContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 24 },
  roleButton: { flex: 1, height: 48, borderRadius: 8, borderWidth: 1, borderColor: PRIMARY_BLUE, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, backgroundColor: '#fff' },
  roleSelected: { backgroundColor: PRIMARY_BLUE },
  roleText: { fontSize: 16, fontWeight: '500', color: PRIMARY_BLUE },
  roleTextSelected: { color: '#fff' },
  submitButton: { width: '100%', height: 50, borderRadius: 8, backgroundColor: PRIMARY_BLUE, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  submitText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  disabledInput: {  opacity: 0.5, },
  confirmedBox: {
  paddingVertical: 12,
  paddingHorizontal: 12,
  backgroundColor: '#ccc',
  borderRadius: 6,
  justifyContent: 'center',
  alignItems: 'center',
},
confirmedBoxText: {
  color: '#444',
  fontSize: 14,
  fontWeight: '600',
},
});
