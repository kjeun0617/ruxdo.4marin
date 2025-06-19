import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Brightness from 'expo-brightness';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

// 포그라운드 알림 처리
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const FONT_SIZES = {
  small: { label: '작게', multiplier: 0.9 },
  medium: { label: '보통', multiplier: 1.0 },
  large: { label: '크게', multiplier: 1.4 },
};

const BRIGHTNESS_LEVELS = {
  low: { label: '어둡게', value: 0.3 },
  medium: { label: '보통', value: 0.6 },
  high: { label: '밝게', value: 1.0 },
};

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [brightness, setBrightness] = useState('medium');
  const [fontSize, setFontSize] = useState('medium');
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    loadSettings();
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(n => {
      setNotification(n);
      console.log('알림 수신:', n);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(r => {
      console.log('알림 클릭:', r);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  async function registerForPushNotificationsAsync() {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    if (Device.isDevice) {
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const result = await Notifications.requestPermissionsAsync();
        status = result.status;
      }
      if (status !== 'granted') {
        Alert.alert(
          '알림 권한 필요',
          '앱 밖에서도 알림을 받으려면 권한이 필요합니다.\n설정에서 알림 권한을 허용해주세요.',
          [{ text: '확인' }]
        );
        return;
      }
      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ||
          Constants?.easConfig?.projectId;
        if (!projectId) throw new Error('Project ID not found');
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('푸시 토큰:', token);
      } catch (e) {
        console.warn(e);
      }
    } else {
      Alert.alert('알림 오류', '실제 기기에서만 푸시 알림을 사용할 수 있습니다.');
    }
    return token;
  }

  async function loadSettings() {
    try {
      const fs = await AsyncStorage.getItem('fontSize');
      const ns = await AsyncStorage.getItem('notifications');
      const bs = await AsyncStorage.getItem('brightness');
      if (fs) setFontSize(fs);
      if (ns !== null) setNotificationsEnabled(JSON.parse(ns));
      if (bs) {
        setBrightness(bs);
        await Brightness.setBrightnessAsync(BRIGHTNESS_LEVELS[bs].value);
      }
    } catch (e) {
      console.warn('설정 로드 실패:', e);
    }
  }

  async function toggleNotifications() {
    if (!notificationsEnabled) {
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const res = await Notifications.requestPermissionsAsync();
        status = res.status;
      }
      if (status !== 'granted') {
        Alert.alert('권한 필요', '알림 권한이 필요합니다.');
        return;
      }
      setNotificationsEnabled(true);
      await AsyncStorage.setItem('notifications', 'true');
      Alert.alert('앱 밖 알림 켜짐', '다른 화면에서도 알림을 받을 수 있습니다.');
    } else {
      setNotificationsEnabled(false);
      await AsyncStorage.setItem('notifications', 'false');
      Alert.alert('앱 밖 알림 꺼짐', '앱을 열었을 때만 알림을 표시합니다.');
    }
  }

  async function changeBrightness(level) {
    setBrightness(level);
    await AsyncStorage.setItem('brightness', level);
    await Brightness.setBrightnessAsync(BRIGHTNESS_LEVELS[level].value);
    Alert.alert('밝기 변경', `${BRIGHTNESS_LEVELS[level].label}로 설정되었습니다.`);
  }

  async function changeFontSize(size) {
    setFontSize(size);
    await AsyncStorage.setItem('fontSize', size);
    Alert.alert('글자 크기 변경', `${FONT_SIZES[size].label}로 설정되었습니다.`);
  }


  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const fm = FONT_SIZES[fontSize].multiplier;
  const ds = createDynamicStyles(fm);

  return (
    <View style={styles.container}>
      <Text style={ds.title}>⚙️ 설정</Text>

      {/* 글자 크기 설정 */}
      <View style={styles.section}>
        <Text style={ds.sectionTitle}>📝 글자 크기</Text>
        <View style={styles.optionContainer}>
          {Object.entries(FONT_SIZES).map(([key, { label }]) => (
            <TouchableOpacity
              key={key}
              style={[styles.optionButton, fontSize === key && styles.selectedOption]}
              onPress={() => changeFontSize(key)}
            >
              <Text style={[ds.optionButtonText, fontSize === key && styles.selectedText]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={ds.previewText}>미리보기: 글자 크기 적용 예시</Text>
      </View>

      {/* 앱 밖 알림 */}
      <View style={styles.section}>
        <Text style={ds.sectionTitle}>🔔 앱 밖 알림</Text>
        <View style={styles.row}>
          <Text style={ds.label}>알림 받기</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#ccc', true: '#4CAF50' }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>
        <Text style={ds.notificationDescription}>
          {notificationsEnabled
            ? '✅ 앱 밖 알림 활성화됨'
            : '❌ 앱을 열었을 때만 알림 표시'}
        </Text>
      </View>

      {/* 밝기 설정 */}
      <View style={styles.section}>
        <Text style={ds.sectionTitle}>☀️ 화면 밝기</Text>
        <View style={styles.optionContainer}>
          {Object.entries(BRIGHTNESS_LEVELS).map(([key, { label }]) => (
            <TouchableOpacity
              key={key}
              style={[styles.optionButton, brightness === key && styles.selectedOption]}
              onPress={() => changeBrightness(key)}
            >
              <Text style={[ds.optionButtonText, brightness === key && styles.selectedText]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={ds.brightnessDescription}>
          현재 밝기: {BRIGHTNESS_LEVELS[brightness].label}
        </Text>
      </View>

      {/* 로그아웃 */}
      <View style={styles.section}>
        <Text style={ds.sectionTitle}>🚪 로그아웃</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={ds.logoutButtonText}>🔐 로그아웃</Text>
        </TouchableOpacity>
      </View>

      <Text style={ds.version}>버전: {Constants.manifest?.version || '1.0.0'}</Text>
    </View>
  );
}

const createDynamicStyles = fm =>
  StyleSheet.create({
    title: { fontSize: 28 * fm, fontWeight: 'bold', textAlign: 'center', margin: 16 },
    sectionTitle: { fontSize: 20 * fm, fontWeight: '600', marginBottom: 8 },
    label: { fontSize: 16 * fm },
    optionButtonText: { fontSize: 14 * fm },
    previewText: { fontSize: 14 * fm, fontStyle: 'italic', marginTop: 4 },
    notificationDescription: { fontSize: 12 * fm, marginTop: 4 },
    brightnessDescription: { fontSize: 12 * fm, marginTop: 4 },
    logoutButtonText: { fontSize: 16 * fm, color: '#d32f2f', fontWeight: 'bold' },
    logoutSubText: { fontSize: 12 * fm, color: '#666' },
    version: { fontSize: 12 * fm, color: 'gray', textAlign: 'center', marginTop: 8 },
  });

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  section: { marginBottom: 24, padding: 16, backgroundColor: '#f2f2f2', borderRadius: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  optionButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  selectedOption: { backgroundColor: '#007AFF' },
  selectedText: { color: '#fff' },
  logoutButton: {
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
});
