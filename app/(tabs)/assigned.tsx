// app/(tabs)/assigned.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Button,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import {
  collection,
  onSnapshot,
  updateDoc,
  doc as fireDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';

interface Report {
  id: string;
  description: string;
  photoURL?: string;
  location: { latitude: number; longitude: number };
  status: string;
  reporterName: string;
  reporterContact: string;
  reportedBy: string;
  assignedTo?: string;
  closingComment?: string;
  createdAt?: any;
  closedAt?: any;
}

export default function AssignedScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [closingComment, setClosingComment] = useState('');
  const [targetReport, setTargetReport] = useState<Report | null>(null);

  // Real-time listener filtered & sorted in JS
  useEffect(() => {
    if (authLoading || !user) return;

    const unsub = onSnapshot(
      collection(db, 'reports'),
      snap => {
        const list = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as Omit<Report, 'id'>) }))
          .filter(r => r.assignedTo === user.uid)
          .sort(
            (a, b) =>
              (b.createdAt?.toMillis?.() || 0) -
              (a.createdAt?.toMillis?.() || 0)
          );
        setReports(list);
        setLoading(false);
      },
      err => {
        console.error('Error loading assigned reports:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [authLoading, user]);

  const openCloseModal = (report: Report) => {
    setTargetReport(report);
    setClosingComment('');
    setModalVisible(true);
  };

  const handleCloseCase = async () => {
    if (!targetReport || !user) return;
    if (!closingComment.trim()) {
      Alert.alert('Validation', 'Please enter a closing comment.');
      return;
    }

    try {
      const reportRef = fireDoc(db, 'reports', targetReport.id);
      await updateDoc(reportRef, {
        status: 'closed',
        closingComment: closingComment.trim(),
        closedAt: serverTimestamp(),
      });

      setModalVisible(false);
      Alert.alert('Success', 'Case closed.');
      // no notification logic
    } catch (err) {
      console.error('Error closing case:', err);
      Alert.alert('Error', 'Could not close case.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!reports.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No cases assigned to you yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.photoURL && (
              <TouchableOpacity
                onPress={() => router.push(`/assigned/${item.id}`)}
              >
                <Image source={{ uri: item.photoURL }} style={styles.image} />
              </TouchableOpacity>
            )}

            <Text style={styles.caseId}>Case ID: {item.id}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Text style={styles.meta}>
              Reporter: {item.reporterName} ({item.reporterContact})
            </Text>
            <Text style={styles.location}>
              📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>

            {item.status !== 'closed' && (
              <Button
                title="Close Case"
                color="red"
                onPress={() => openCloseModal(item)}
              />
            )}
          </View>
        )}
      />

      {/* Closing Comment Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Closing Comment</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter closing comment"
              multiline
              value={closingComment}
              onChangeText={setClosingComment}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, styles.cancelBtn]}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCloseCase}
                style={[styles.modalBtn, styles.submitBtn]}
              >
                <Text style={styles.modalBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  card: {
    marginBottom: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 8 },
  caseId: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 16, marginBottom: 6 },
  meta: { fontSize: 14, color: '#555', marginBottom: 4 },
  location: { fontSize: 12, color: '#666', marginBottom: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { fontSize: 18, color: '#666' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalInput: {
    height: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  cancelBtn: { backgroundColor: '#ccc' },
  submitBtn: { backgroundColor: '#28a745' },
  modalBtnText: { color: '#fff', fontWeight: '600' },
});
