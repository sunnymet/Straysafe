// app/(tabs)/allcases.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

interface CaseType {
  id: string;
  description: string;
  photoURL?: string;
  location: { latitude: number; longitude: number };
  status?: string;
  volunteerName?: string;
  volunteerContact?: string;
  createdAt?: { toMillis: () => number };
}

export default function AllCases() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const isVolunteer = profile?.role === 'volunteer';

  const [cases, setCases] = useState<CaseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Subscribe to Firestore reports
  useEffect(() => {
    if (!isVolunteer) return setLoading(false);
    const unsub = onSnapshot(
      collection(db, 'reports'),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<CaseType, 'id'>) }))
          .filter(c => c.status !== 'claimed')  // only unclaimed
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setCases(list);
        setLoading(false);
      },
      err => {
        console.error(err);
        Alert.alert('Error', 'Could not load cases.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [isVolunteer]);

  // Claim a case
  const claimCase = async (item: CaseType) => {
    if (!user || !profile) return;
    setClaimingId(item.id);
    try {
      await updateDoc(doc(db, 'reports', item.id), {
        assignedTo: user.uid,
        status: 'claimed',
        volunteerName: profile.fullName,
        volunteerContact: profile.contact,
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not claim the case.');
    } finally {
      setClaimingId(null);
    }
  };

  // Compute initial map region around first case (or fallback)
  const initialRegion = useMemo(() => {
    if (cases.length) {
      const { latitude, longitude } = cases[0].location;
      return {
        latitude,
        longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
    // default region
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
  }, [cases]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!isVolunteer || cases.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'All Cases' }} />
        <View style={styles.center}>
          <Text style={styles.empty}>No unclaimed cases.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'All Cases' }} />

      {/* Map with markers */}
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {cases.map(item => (
          <Marker
            key={item.id}
            coordinate={item.location}
            title={`Case ${item.id}`}
            description={item.description}
            onCalloutPress={() => router.push(`/assigned/${item.id}`)}
          />
        ))}
      </MapView>

      {/* List below for detail + claim */}
      <FlatList
        data={cases}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const locText = `Lat: ${item.location.latitude.toFixed(4)}, Lon: ${item.location.longitude.toFixed(4)}`;
          return (
            <View style={styles.card}>
              {item.photoURL && <Image source={{ uri: item.photoURL }} style={styles.image} />}

              <Text style={styles.caseId}>Case ID: {item.id}</Text>
              <Text style={styles.desc}>{item.description}</Text>

              <Text
                style={[styles.loc, styles.link]}
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/dir/?api=1&destination=${item.location.latitude},${item.location.longitude}`
                  )
                }
              >
                {locText}
              </Text>

              <TouchableOpacity
                style={[styles.button, claimingId === item.id && styles.buttonDisabled]}
                onPress={() => claimCase(item)}
                disabled={claimingId === item.id}
              >
                {claimingId === item.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Claim</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  map: {
    width,
    height: height * 0.3,   // map takes top 30% of screen
  },
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
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  caseId: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  desc: { fontSize: 16, marginBottom: 8 },
  loc: { fontSize: 14, color: '#666', marginBottom: 12 },
  link: {
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '500' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 18, color: '#666' },
});
