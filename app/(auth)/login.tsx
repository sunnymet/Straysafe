// app/(auth)/login.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,               // ← import Image
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const router = useRouter();
  const { user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const handleLogin = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setError(e.message.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* —— INFO / HOME SECTION —— */}
        <View style={styles.infoSection}>
          <Image
            source={require('../../assets/dog-icon.png')}
            style={styles.logo}
          />
          <Text style={styles.appTitle}>Welcome to StraySafe</Text>
          <Text style={styles.infoText}>
            StraySafe is a community-driven charity that empowers you to report
            stray and injured animals, and connects dedicated volunteers who can
            help. Together, we rescue, rehabilitate, and find loving homes
            for every stray.
          </Text>
        </View>

        {/* —— LOGIN FORM —— */}
        <View style={styles.formSection}>
          {error !== '' && <Text style={styles.error}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Log In</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.link}>Don’t have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  infoSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  formSection: {
    width: '100%',
  },
  error: {
    color: '#b00020',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#0066cc',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  link: {
    color: '#0066cc',
    textAlign: 'center',
    marginTop: 8,
  },
});
