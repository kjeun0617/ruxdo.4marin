// services/auth.js
import { db } from '../firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 새로운 사용자 생성
 * role==='guardian'인 경우에만 partnerPhone으로 고령자 사용자 탐색
 * phone 및 partnerPhone 검사는 값이 있을 때만 수행
 */
export async function createUser(userData) {
  const { id, name, password, phone, partnerPhone, role, image } = userData;
  const userRef = doc(db, 'users', id);

  // 1) 본인 전화번호 중복 확인 (선택사항)
  if (phone) {
    const phoneQ = query(
      collection(db, 'users'),
      where('phone', '==', phone)
    );
    const phoneSnap = await getDocs(phoneQ);
    if (!phoneSnap.empty) {
      throw new Error('이미 가입된 전화번호입니다.');
    }
  }

  // 2) 보호자 가입 시 파트너(고령자) 전화번호 조회 및 매칭
  let partnerId = '';
  if (role === 'guardian' && partnerPhone) {
    const partQ = query(
      collection(db, 'users'),
      where('phone', '==', partnerPhone)
    );
    const partSnap = await getDocs(partQ);
    if (!partSnap.empty) {
      const partnerDoc = partSnap.docs[0];
      partnerId = partnerDoc.id;
      // 상호 파트너 ID 업데이트
      await updateDoc(doc(db, 'users', partnerId), { partnerId: id });
    } else {
      throw new Error('등록된 고령자(파트너)를 찾을 수 없습니다.');
    }
  }

  // 3) 사용자 문서 저장
  await setDoc(userRef, {
    id,
    name,
    password,
    phone: phone || '',
    role,
    image: image || '',
    ...(role === 'guardian' && { partnerPhone }),
    partnerId,
  });
}

/**
 * 로그인 처리
 * partnerId가 없으면 partnerPhone으로 1:1 매칭 수행
 */
export async function loginUser(id, password) {
  const userRef = doc(db, 'users', id);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('존재하지 않는 아이디입니다.');

  const userData = userSnap.data();
  if (userData.password !== password) throw new Error('비밀번호가 틀렸습니다.');

  // 로그인 후 partnerId가 없으면 연결 시도
  if (!userData.partnerId && userData.partnerPhone) {
    const q = query(
      collection(db, 'users'),
      where('phone', '==', userData.partnerPhone)
    );
    const matchSnap = await getDocs(q);
    if (!matchSnap.empty) {
      const partnerDoc = matchSnap.docs[0];
      const partnerId = partnerDoc.id;
      // 상호 연결
      await updateDoc(userRef, { partnerId });
      await updateDoc(doc(db, 'users', partnerId), { partnerId: id });
      userData.partnerId = partnerId;
    }
  }

  // 디바이스에 세션 저장
  await AsyncStorage.setItem('user', JSON.stringify(userData));
  return userData;
}

/**
 * 현재 로그인한 사용자 조회
 */
export const getCurrentUser = async () => {
  const userJSON = await AsyncStorage.getItem('user');
  return userJSON ? JSON.parse(userJSON) : null;
};
