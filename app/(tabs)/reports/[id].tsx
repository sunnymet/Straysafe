// app/(tabs-reporter)/reports/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Linking,               // ← import Linking
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import * as Location from 'expo-location';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';

interface Report {
  id: string;
  description: string;
  photoURL?: string;
  location: { latitude: number; longitude: number };
  status: string;
  reporterName: string;
  reporterContact: string;
  volunteerName?: string;
  volunteerContact?: string;
  closingComment?: string;
  createdAt?: Timestamp;
  closedAt?: Timestamp;
}

export default function ReporterReportDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string>('');

  // Fetch the report from Firestore
  useEffect(() => {
    const ref = doc(db, 'reports', id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setReport({ id: snap.id, ...(snap.data() as Omit<Report, 'id'>) });
        } else {
          setReport(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching report:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  // Reverse-geocode once we have coords
  useEffect(() => {
    if (!report) return;
    (async () => {
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: report.location.latitude,
          longitude: report.location.longitude,
        });
        const parts = [
          place.name,
          place.street,
          place.city,
          place.region,
          place.country,
        ].filter(Boolean);
        setAddress(parts.join(', '));
      } catch (e) {
        console.error('Reverse geocode error:', e);
        setAddress('');
      }
    })();
  }, [report]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Report not found.</Text>
      </View>
    );
  }

  const createdAt = report.createdAt
    ? report.createdAt.toDate().toLocaleString()
    : 'N/A';
  const closedAt = report.closedAt
    ? report.closedAt.toDate().toLocaleString()
    : undefined;

  // Google Maps directions URL
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.location.latitude},${report.location.longitude}`;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Case ${report.id}` }} />

      {report.photoURL && (
        <Image source={{ uri: report.photoURL }} style={styles.image} />
      )}

      <Text style={styles.caseId}>Case ID: {report.id}</Text>

      <Text style={styles.label}>Status:</Text>
      <Text style={styles.value}>{report.status}</Text>

      <Text style={styles.label}>Reported By:</Text>
      <Text style={styles.value}>
        {report.reporterName}{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL(`tel:${report.reporterContact}`)}
        >
          ({report.reporterContact})
        </Text>
      </Text>

      <Text style={styles.label}>Claimed By:</Text>
      {report.volunteerName ? (
        <Text style={styles.value}>
          {report.volunteerName}{' '}
          <Text
            style={styles.link}
            onPress={() =>
              report.volunteerContact &&
              Linking.openURL(`tel:${report.volunteerContact}`)
            }
          >
            ({report.volunteerContact})
          </Text>
        </Text>
      ) : (
        <Text style={styles.value}>Unclaimed</Text>
      )}

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{report.description}</Text>

      <Text style={styles.label}>Location:</Text>
      <Text
        style={[styles.value, styles.link]}
        onPress={() => Linking.openURL(mapsUrl)}
      >
        {address
          ? address
          : `Lat: ${report.location.latitude.toFixed(4)}, Lon: ${report.location.longitude.toFixed(4)}`}
      </Text>

      <Text style={styles.label}>Created At:</Text>
      <Text style={styles.value}>{createdAt}</Text>

      {report.status === 'closed' && closedAt && (
        <>
          <Text style={styles.label}>Closed At:</Text>
          <Text style={styles.value}>{closedAt}</Text>

          <Text style={styles.label}>Closing Comment:</Text>
          <Text style={styles.value}>{report.closingComment}</Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 18, color: '#666' },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  caseId: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '500', marginTop: 8 },
  value: { fontSize: 14, marginBottom: 4 },
  link: {
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
});
