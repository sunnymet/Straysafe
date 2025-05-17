// app/(tabs)/profile.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

interface UserProfile {
  fullName: string;
  email: string;
  role: string;
  contact: string;
}

interface NotificationData {
  type: string;
  caseId: string;
  volunteerName: string;
  timestamp: any;
}

interface Notification extends NotificationData {
  id: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [user]);

  // Listen for in-app notifications
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const notifs: Notification[] = snap.docs.map(d => {
        const data = d.data() as NotificationData;
        return { ...data, id: d.id };
      });
      setNotifications(notifs);

      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data() as NotificationData;
          Alert.alert(
            'Case Claimed',
            `${data.volunteerName} has claimed your report (ID: ${data.caseId}).`
          );
        }
      });
    });
    return () => unsub();
  }, [user]);

  // New handler to sign out and redirect
  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (loadingProfile) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile</Text>

      <Text style={styles.label}>Name:</Text>
      <Text style={styles.value}>{profile?.fullName || user?.displayName}</Text>

      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{profile?.email || user?.email}</Text>

      <Text style={styles.label}>Role:</Text>
      <Text style={styles.value}>{profile?.role}</Text>

      <Text style={styles.label}>Contact:</Text>
      <Text style={styles.value}>{profile?.contact}</Text>

      <View style={styles.signOut}>
        <Button title="Sign Out" color="red" onPress={handleSignOut} />
      </View>

      <Text style={styles.notifHeader}>🔔 Recent Notifications</Text>
      {notifications.length === 0 ? (
        <Text style={styles.noNotif}>No notifications yet.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.notifItem}>
              <Text>
                {item.type === 'case_claimed'
                  ? `${item.volunteerName} claimed case ${item.caseId}`
                  : 'Unknown notification'}
              </Text>
              <Text style={styles.timestamp}>
                {new Date(item.timestamp.seconds * 1000).toLocaleString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 10 },
  value: { fontSize: 16, marginBottom: 4 },
  signOut: { marginTop: 20, marginBottom: 30 },
  notifHeader: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  noNotif: { fontStyle: 'italic', color: '#666' },
  notifItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
