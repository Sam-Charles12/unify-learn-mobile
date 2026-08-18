import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthContext';

export interface UserProfile {
  uid: string;
  name?: string;
  matric?: string;
  email?: string;
  department?: string;
  level?: string;
  role?: string;
  onboarded?: boolean;
  enrolledCourses?: string[];
  createdAt?: Date;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? ({ uid: user.uid, ...snap.data() } as UserProfile) : null);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  return { profile, loading };
};