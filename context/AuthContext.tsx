// context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
  fullName: string;
  email: string;
  role: 'reporter' | 'volunteer';
  contact: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Only auth + profile loading
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
