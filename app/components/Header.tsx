// app/components/Header.tsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function Header() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/header-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>StraySafe</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 4,
  },
  logo: { width: 32, height: 32, marginRight: 12 },
  title: { fontSize: 18, fontWeight: '600' },
});
