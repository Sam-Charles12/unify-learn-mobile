import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { LecturerNavigatorParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<LecturerNavigatorParamList>;

const LecturerDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [name, setName] = useState<string | null>(null);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [announcementCount, setAnnouncementCount] = useState<number | null>(null);
  const [todayClasses, setTodayClasses] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [lecturerSnap, courseSnap, annSnap, timetableSnap] = await Promise.all([
          getDoc(doc(db, 'lecturers', user.uid)),
          getDocs(query(collection(db, 'courses'), where('lecturers', 'array-contains', user.uid))),
          getDocs(collection(db, 'announcements')),
          getDocs(collection(db, 'timetable')),
        ]);

        if (lecturerSnap.exists()) {
          const data = lecturerSnap.data();
          setName(data.name ?? user.displayName ?? null);
          setAnnouncementCount(
            annSnap.docs.filter(
              (d) => d.data().lecturerId === user.uid || d.data().senderName === data.name
            ).length
          );
        } else {
          setAnnouncementCount(
            annSnap.docs.filter((d) => d.data().lecturerId === user.uid).length
          );
        }

        setCourseCount(courseSnap.size);

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setTodayClasses(
          timetableSnap.docs.filter(
            (d) => d.data().lecturerId === user.uid && d.data().day === today
          ).length
        );
      } catch (e) {
        console.warn('Failed to load lecturer dashboard:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const firstName = name?.split(' ')[0] ?? 'Lecturer';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Top Header */}
        <View className="px-5 pt-3 pb-5 bg-surface border-b border-border">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-accent-light border border-accent-border items-center justify-center mr-3">
                <FontAwesome5 name="chalkboard-teacher" size={16} color="#4F46E5" />
              </View>
              <View>
                <Text className="font-headline text-[16px] text-text-primary leading-5">Lecturer Workspace</Text>
                <Text className="font-body-medium text-[12px] text-accent">Faculty of Engineering</Text>
              </View>
            </View>

            <View className="w-10 h-10 rounded-xl bg-ink items-center justify-center shadow-soft">
              <Text className="font-headline text-[13px] text-white">
                {firstName.charAt(0)}
              </Text>
            </View>
          </View>

          <Text className="font-headline text-[24px] text-text-primary leading-8">
            Hello, {name || 'Faculty Member'} 👋
          </Text>
          <Text className="font-body text-[13px] text-text-secondary mt-0.5">
            Manage your courses, timetable, and broadcast updates to your students.
          </Text>
        </View>

        {/* Bento Metrics Row */}
        <View className="px-5 mt-4">
          {loading ? (
            <View className="bg-surface rounded-2xl border border-border p-6 items-center shadow-soft">
              <ActivityIndicator size="small" color="#4F46E5" />
            </View>
          ) : (
            <View className="flex-row gap-2.5">
              {/* Tile 1: Assigned Courses */}
              <View className="flex-1 bg-primary-light border border-primary-border rounded-2xl p-4 shadow-soft">
                <View className="w-9 h-9 rounded-xl bg-white border border-primary-border items-center justify-center mb-2.5 shadow-soft">
                  <FontAwesome5 name="book-open" size={13} color="#059669" />
                </View>
                <Text className="font-headline text-[20px] text-primary-dark">
                  {courseCount ?? 0}
                </Text>
                <Text className="font-body-bold text-[11px] text-primary-dark mt-0.5">
                  My Courses
                </Text>
              </View>

              {/* Tile 2: Announcements */}
              <View className="flex-1 bg-indigo-bg border border-indigo-border rounded-2xl p-4 shadow-soft">
                <View className="w-9 h-9 rounded-xl bg-white border border-indigo-border items-center justify-center mb-2.5 shadow-soft">
                  <FontAwesome5 name="bullhorn" size={13} color="#4F46E5" />
                </View>
                <Text className="font-headline text-[20px] text-indigo-text">
                  {announcementCount ?? 0}
                </Text>
                <Text className="font-body-bold text-[11px] text-indigo-text mt-0.5">
                  Broadcasts
                </Text>
              </View>

              {/* Tile 3: Today's Classes */}
              <View className="flex-1 bg-amber-bg border border-amber-border rounded-2xl p-4 shadow-soft">
                <View className="w-9 h-9 rounded-xl bg-white border border-amber-border items-center justify-center mb-2.5 shadow-soft">
                  <FontAwesome5 name="clock" size={13} color="#D97706" />
                </View>
                <Text className="font-headline text-[20px] text-amber-text">
                  {todayClasses}
                </Text>
                <Text className="font-body-bold text-[11px] text-amber-text mt-0.5">
                  Today's Classes
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Tools */}
        <View className="px-5 mt-5">
          <Text className="font-headline text-[17px] text-text-primary mb-3">
            Teaching Tools
          </Text>

          <Pressable
            onPress={() => navigation.navigate('LecturerCoursesTab')}
            className="bg-surface rounded-2xl border border-border p-4 flex-row items-center justify-between shadow-card mb-3 active:bg-soft"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-xl bg-primary-light border border-primary-border items-center justify-center mr-3.5">
                <FontAwesome5 name="book-open" size={16} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="font-body-bold text-[15px] text-text-primary">
                  Course Workspaces
                </Text>
                <Text className="font-body text-[12px] text-text-secondary mt-0.5">
                  View week syllabus, upload notes & monitor student progress
                </Text>
              </View>
            </View>
            <FontAwesome5 name="chevron-right" size={13} color="#94A3B8" />
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('LecturerCoursesTab')}
            className="bg-surface rounded-2xl border border-border p-4 flex-row items-center justify-between shadow-card active:bg-soft"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 rounded-xl bg-rose-bg border border-rose-border items-center justify-center mr-3.5">
                <FontAwesome5 name="bullhorn" size={16} color="#E11D48" />
              </View>
              <View className="flex-1">
                <Text className="font-body-bold text-[15px] text-text-primary">
                  Post Course Announcement
                </Text>
                <Text className="font-body text-[12px] text-text-secondary mt-0.5">
                  Push instant notifications to enrolled students
                </Text>
              </View>
            </View>
            <FontAwesome5 name="chevron-right" size={13} color="#94A3B8" />
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default LecturerDashboard;