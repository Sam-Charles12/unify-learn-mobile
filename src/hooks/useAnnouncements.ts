import { useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query, where, doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

export type AnnouncementScope = 'university' | 'faculty' | 'department' | 'course' | 'classrep';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: AnnouncementScope;
  faculty?: string;
  department?: string;
  courseId?: string;
  courseCode?: string;
  lecturerName?: string;
  weekNumber?: number;
  level?: string;
  senderName?: string;
  senderRole?: string;
  isActive?: boolean;
  createdAt?: { seconds: number };
}

const SCOPES: Record<string, { icon: string; bg: string; color: string }> = {
  university: { icon: 'university', bg: '#DCEEFF', color: '#005B96' },
  faculty: { icon: 'building', bg: '#CFF5E6', color: '#00895A' },
  department: { icon: 'sitemap', bg: '#E5D45A', color: '#8B9658' },
  course: { icon: 'book', bg: '#BFD9D2', color: '#00895A' },
  classrep: { icon: 'users', bg: '#E78B73', color: '#B45309' },
};

export const scopeStyle = (scope: AnnouncementScope) =>
  SCOPES[scope] ?? { icon: 'bullhorn', bg: '#F2F2F2', color: '#8A817C' };

interface AnnouncementFilters {
  courseIds: string[];
}

export const useAnnouncements = ({ courseIds }: AnnouncementFilters) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubRead = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        const data = snap.data();
        if (Array.isArray(data?.readAnnouncements)) {
          setReadIds(data.readAnnouncements);
        }
      },
      (err) => console.warn('Read-state listener failed:', err)
    );

    const unsubAnn = onSnapshot(
      query(collection(db, 'announcements'), where('isActive', '==', true)),
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);

        const relevant = all.filter((a) => {
          if (!profile?.department) return false;
          switch (a.scope) {
            case 'university':
              return true;
            case 'faculty':
              return a.faculty === 'engineering';
            case 'department':
              return a.department === profile.department;
            case 'course':
              return !!a.courseId && courseIds.includes(a.courseId);
            case 'classrep':
              return (
                a.department === profile.department &&
                (!a.level || a.level === profile.level)
              );
            default:
              return false;
          }
        });

        relevant.sort((a, b) =>
          (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
        );

        setAnnouncements(relevant);
        setLoading(false);
      },
      (err) => {
        console.warn('Announcements listener failed:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubRead();
      unsubAnn();
    };
  }, [user, profile?.department, profile?.level, courseIds.join(',')]);

  const markAsRead = useCallback(
    async (announcementId: string, read: boolean) => {
      if (!user) return;
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            readAnnouncements: read ? arrayUnion(announcementId) : arrayRemove(announcementId),
          },
          { merge: true }
        );
        setReadIds((prev) =>
          read ? [...prev, announcementId] : prev.filter((id) => id !== announcementId)
        );
      } catch (e) {
        console.warn('Failed to update read state:', e);
      }
    },
    [user]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user || announcements.length === 0) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { readAnnouncements: announcements.map((a) => a.id) },
        { merge: true }
      );
      setReadIds(announcements.map((a) => a.id));
    } catch (e) {
      console.warn('Failed to mark all as read:', e);
    }
  }, [user, announcements]);

  const unreadIds = announcements.filter((a) => !readIds.includes(a.id)).map((a) => a.id);
  const unreadCount = unreadIds.length;

  return { announcements, readIds, unreadCount, markAsRead, markAllAsRead, loading };
};