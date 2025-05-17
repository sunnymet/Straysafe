// services/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDd3_l97EJV46FhtYXwfc6L-ZwNN8dnPUU",
  authDomain: "straysafe-fca75.firebaseapp.com",
  projectId: "straysafe-fca75",
  storageBucket: "straysafe-fca75.firebasestorage.app",
  messagingSenderId: "489516961405",
  appId: "1:489516961405:web:428305df4729eefb186b14",
  measurementId: "G-XSN15HE35B"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
export { auth, storage, db };
