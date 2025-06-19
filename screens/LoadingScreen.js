// screens/LoadingScreen.js
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function LoadingScreen({ route, navigation }) {
  const { user } = route.params;

  useEffect(() => {
    // 1초 뒤에 Profile로 이동 (스택 초기화)
    const t = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [
          { name: 'Profile', params: { user } }
        ]
      });
    }, 1000);

    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
      <Text style={styles.text}>로그인 중…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    marginTop: 16,
    fontSize: 18,
    color: '#333'
  }
});
