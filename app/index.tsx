// app/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo or Hero Image */}
        <Image
          source={require('../assets/straysafe-hero.png')}
          style={styles.hero}
        />

        {/* App Title */}
        <Text style={styles.title}>Welcome to StraySafe</Text>

        {/* Description */}
        <Text style={styles.description}>
          StraySafe is your community’s helping paw 🐾.  
          Report stray or injured animals and connect with volunteers ready  
          to rescue, rehabilitate, and find them loving homes.  
          Join us in making a difference—one animal at a time.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  hero: {
    width: width * 0.6,
    height: width * 0.6,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  loginButton: {
    backgroundColor: '#0066cc',
  },
  signupButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
