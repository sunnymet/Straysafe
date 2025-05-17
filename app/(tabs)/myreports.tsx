// app/(tabs-reporter)/myreports.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../../services/firebase';

interface ReportType {
  id: string;
  description: string;
  photoURL?: string;
  location: { latitude: number; longitude: number };
  createdAt?: Timestamp;
  status?: string;
  claimedBy?: string;
}

export default function MyReports() {
  const [reports, setReports] = useState<ReportType[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid;
  const router = useRouter();

  const fetchMyReports = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where('reportedBy', '==', uid));
      const snap = await getDocs(q);
      const list: ReportType[] = snap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ReportType, 'id'>),
      }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReports(list);
    } catch (err) {
      console.error('Error fetching my reports:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      fetchMyReports();
    }, [fetchMyReports])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>You have no reports yet.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'My Reports' }} />
      <FlatList
        data={reports}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.photoURL && (
              <Image source={{ uri: item.photoURL }} style={styles.image} />
            )}
            {/* Display Case ID below the photo */}
            <Text style={styles.caseId}>Case ID: {item.id}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.meta}>Status: {item.status || 'N/A'}</Text>
            <Text style={styles.meta}>
              Reported: {item.createdAt?.toDate().toLocaleString()}
            </Text>
            <Text style={styles.meta}>
              Location: {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>
            {item.claimedBy && (
              <Text style={styles.meta}>Claimed by: {item.claimedBy}</Text>
            )}
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push({ pathname: '/reports/[id]', params: { id: item.id } })}
            >
              <Text style={styles.buttonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { width: '100%', height: 180, borderRadius: 8, marginBottom: 8 },
  caseId: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 16, marginBottom: 8 },
  meta: { fontSize: 14, color: '#444', marginBottom: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { fontSize: 16, color: '#666' },
  button: {
    marginTop: 8,
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '500' },
});
