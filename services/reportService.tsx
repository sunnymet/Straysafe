// services/reportService.ts
import {
  doc,
  runTransaction,
  setDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import { db } from './firebase'; // adjust to your path

/**
 * Generates a unique case ID of the form YYYYMMDD-NNNN,
 * where NNNN is a daily counter (1→0001, 2→0002, …).
 */
async function generateCaseId(db: Firestore): Promise<string> {
  // 1) build the YYYYMMDD prefix
  const now = new Date();
  const datePrefix = now.toISOString().split('T')[0].replace(/-/g, ''); // "20250513"

  const counterRef = doc(db, 'counters', datePrefix);

  // 2) bump the counter in a transaction and return the new value
  const newCount = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    let count: number;

    if (!snap.exists()) {
      count = 1;
      tx.set(counterRef, { count });
    } else {
      const current = (snap.data().count as number) || 0;
      count = current + 1;
      tx.update(counterRef, { count });
    }

    return count;
  });

  // 3) pad and combine
  const counterStr = String(newCount).padStart(4, '0'); // e.g. "0001"
  return `${datePrefix}-${counterStr}`;               // e.g. "20250513-0001"
}

/**
 * Creates a new report in `reports/{caseId}` using our date-based ID.
 */
export async function createReport(reportData: {
  description: string;
  location: { latitude: number; longitude: number };
  photoURL?: string;
  reportedBy: string;
}) {
  const caseId = await generateCaseId(db);

  await setDoc(doc(db, 'reports', caseId), {
    ...reportData,
    status: 'unclaimed',
    createdAt: serverTimestamp(),
  });

  return caseId;
}
