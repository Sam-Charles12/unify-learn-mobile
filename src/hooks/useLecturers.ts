import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

export interface Lecturer {
  id: string;
  name: string;
  title?: string;
  faculty?: string;
  department?: string;
  email?: string;
  officeHours?: string;
  bio?: string;
  photoURL?: string;
  contactEnabled?: boolean;
}

export const useLecturers = (ids: string[]) => {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ids || ids.length === 0) {
      setLecturers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const snap = await getDocs(collection(db, 'lecturers'));
        if (cancelled) return;
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Lecturer);
        const found = ids
          .map((id) => all.find((l) => l.id === id))
          .filter((l): l is Lecturer => !!l);
        setLecturers(found);
      } catch (e) {
        console.warn('Failed to load lecturers:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ids.join(',')]);

  return { lecturers, loading };
};