// app/(tabs-reporter)/report.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc as firestoreDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from '../../services/firebase';
import { createReport } from '../../services/reportService';

const { height } = Dimensions.get('window');

export default function ReportScreen() {
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Request and set initial location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location services.');
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setRegion(r => ({
        ...r,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }));
      setLoadingLocation(false);
    })();
  }, []);

  // Pick an image from the library
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Upload the picked image to Firebase Storage
  const uploadImageAsync = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `reports/${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  // Handle report submission
  const handleSubmit = async () => {
    if (!description || !imageUri || loadingLocation) {
      Alert.alert('Incomplete', 'Please fill all fields and select a location.');
      return;
    }
    setLoadingSubmit(true);
    try {
      // 1) Upload image
      const imageUrl = await uploadImageAsync(imageUri);

      // 2) Fetch reporter info
      const reporterSnap = await getDoc(
        firestoreDoc(db, 'users', auth.currentUser!.uid)
      );
      const reporterData = reporterSnap.exists() ? reporterSnap.data() : {};

      // 3) Create the Firestore report
      const caseId = await createReport({
        description,
        photoURL: imageUrl,
        location: { latitude: region.latitude, longitude: region.longitude },
        reportedBy: auth.currentUser!.uid,
      });

      // 4) Patch reporter name/contact onto the report
      const reportRef = firestoreDoc(db, 'reports', caseId);
      await updateDoc(reportRef, {
        reporterName: (reporterData as any).fullName || auth.currentUser!.email || '',
        reporterContact: (reporterData as any).contact || '',
      });

      // 5) Notify volunteers via your callable Cloud Function
   
  
      Alert.alert('Report submitted', `Case ID: ${caseId}`);
      // Reset form
      setDescription('');
      setImageUri(null);
      setShowMap(false);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Submission failed.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loadingLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Report</Text>
      <TextInput
        style={styles.input}
        placeholder="Description"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {showMap && (
        <>
          <Text style={styles.mapLabel}>Adjust location:</Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
          >
            <Marker
              coordinate={{ latitude: region.latitude, longitude: region.longitude }}
              draggable
              onDragEnd={e =>
                setRegion(prev => ({ ...prev, ...e.nativeEvent.coordinate }))
              }
            />
          </MapView>
        </>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.buttonText}>Pick Image</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowMap(prev => !prev)}
        >
          <Text style={styles.buttonText}>
            {showMap ? 'Hide Map' : 'Select Location'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loadingSubmit}
        >
          {loadingSubmit ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    minHeight: height * 0.2,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  mapLabel: { fontSize: 16, marginBottom: 8 },
  map: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  locationButton: {
    flex: 1,
    backgroundColor: '#FF5722',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: { color: '#fff', fontWeight: '500' },
});
