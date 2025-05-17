// app/(auth)/register.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [contact,  setContact]  = useState('');
  const [role,     setRole]     = useState<'reporter'|'volunteer'>('reporter');
  const [busy,     setBusy]     = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !contact) {
      Alert.alert('Incomplete', 'Please fill in all fields.');
      return;
    }
    setBusy(true);
    try {
      // 1) create auth user
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      // 2) set displayName
      await updateProfile(user, { displayName: fullName });
      // 3) write to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName,
        email,
        role,
        contact,
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Registration complete');
      router.replace('/(tabs)/profile');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message.replace('Firebase: ', ''));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* —— INFO SECTION —— */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>Join StraySafe</Text>
          <Text style={styles.infoText}>
            Sign up to report stray animals or volunteer to help rescue them. Your
            support saves lives!
          </Text>
        </View>

        {/* —— SIGN UP FORM —— */}
        <View style={styles.formSection}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
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
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={contact}
            onChangeText={setContact}
          />

          <Text style={styles.label}>I want to sign up as:</Text>
          <View style={styles.roles}>
            {(['reporter','volunteer'] as const).map(r => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleButton,
                  role === r ? styles.roleButtonActive : styles.roleButtonInactive
                ]}
                onPress={() => setRole(r)}
              >
                <Text
                  style={[
                    styles.roleText,
                    role === r ? styles.roleTextActive : styles.roleTextInactive
                  ]}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, busy && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={busy}
          >
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Sign Up</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.link}>Already have an account? Log in</Text>
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
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  roles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  roleButtonInactive: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
  },
  roleText: {
    fontSize: 16,
  },
  roleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  roleTextInactive: {
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  link: {
    color: '#0066cc',
    textAlign: 'center',
    marginTop: 8,
  },
});
