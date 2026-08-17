import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const COURSE_COLOR_SCHEMES = [
  { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', dot: '#2563EB' }, // Cobalt
  { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', dot: '#059669' }, // Emerald
  { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', dot: '#7C3AED' }, // Violet
  { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', dot: '#D97706' }, // Amber
  { bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E', dot: '#0D9488' }, // Teal
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const navigation = useNavigation<NavigationProp>();

  const [courses, setCourses] = useState<any[]>([]);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [weeksDone, setWeeksDone] = useState<number | null>(null);
  const [totalWeeks, setTotalWeeks] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const { announcements, unreadCount } = useAnnouncements({ courseIds });

  useEffect(() => {
    const load = async () => {
      if (!user || !profile?.department || !profile?.level) return;
      try {
        const q = query(
          collection(db, 'courses'),
          where('departments', 'array-contains', profile.department)
        );
        const snap = await getDocs(q);
        const courseList = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((c) => !Array.isArray(c.levels) || c.levels.includes(profile.level ?? ''));

        const progressSnap = await getDocs(collection(db, 'users', user.uid, 'progress'));
        let done = 0;
        let total = 0;
        for (const course of courseList) {
          const weeksSnap = await getDocs(collection(db, 'courses', course.id, 'weeks'));
          total += weeksSnap.docs.filter((w) => w.data().isPublished !== false).length;
        }
        progressSnap.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.completedWeeks)) done += data.completedWeeks.length;
        });

        setCourses(courseList);
        setCourseCount(courseList.length);
        setWeeksDone(done);
        setTotalWeeks(total);
        setCourseIds(courseList.map((c) => c.id));
      } catch (e) {
        console.warn('Failed to load dashboard stats:', e);
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [user, profile?.department, profile?.level]);

  const firstName =
    profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';
  const initials = (profile?.name ?? user?.email ?? 'U')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');
  const points = (weeksDone ?? 0) * 10;
  const progressPct =
    totalWeeks && totalWeeks > 0 ? Math.min(100, Math.round(((weeksDone ?? 0) / totalWeeks) * 100)) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with subtle Emerald Institutional Pill */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View className="flex-row items-center bg-primary-light px-3 py-1.5 rounded-full border border-primary-border">
            <View className="w-2 h-2 rounded-full bg-primary mr-2" />
            <Text className="font-body-bold text-[12px] text-primary-dark">
              {profile?.department
                ? `${profile.department.toUpperCase()} • Level ${profile.level ?? ''}`
                : 'LASU Engineering'}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => navigation.navigate('NotificationsTab')}
              className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center shadow-soft active:bg-soft"
            >
              <FontAwesome5 name="bell" size={14} color="#09090B" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-rose border-2 border-surface items-center justify-center px-1">
                  <Text className="font-body-bold text-[8px] text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('ProfileTab')}
              className="w-10 h-10 rounded-full bg-ink items-center justify-center shadow-soft"
            >
              <Text className="font-headline text-[13px] text-white">
                {initials}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Hero Greeting Section */}
        <View className="px-6 pt-6 pb-2">
          <Text className="font-headline text-[28px] text-text-primary leading-9 tracking-tight">
            {getGreeting()}, {firstName} 👋
          </Text>
          <Text className="font-body text-[15px] text-text-secondary mt-1">
            Track your semester syllabus and active study progress.
          </Text>
        </View>

        {/* Hero Spotlight: Semester Progress (with Emerald Accents) */}
        <View className="px-6 mt-6">
          {dataLoading ? (
            <View className="bg-surface rounded-2xl border border-border/80 p-8 items-center justify-center shadow-soft">
              <ActivityIndicator size="small" color="#059669" />
            </View>
          ) : (
            <View className="bg-surface rounded-2xl border border-border/80 p-6 shadow-soft">
              <View className="flex-row justify-between items-baseline mb-3">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                  <Text className="font-body-bold text-[12px] text-primary uppercase tracking-wider">
                    Syllabus Completed
                  </Text>
                </View>
                <Text className="font-headline text-[28px] text-primary tracking-tight">
                  {progressPct}%
                </Text>
              </View>

              {/* Progress Track */}
              <View className="h-2.5 rounded-full bg-soft overflow-hidden mb-3.5 border border-border/40">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </View>

              <Text className="font-body text-[13px] text-text-secondary leading-5 mb-5">
                {weeksDone ?? 0} of {totalWeeks ?? 0} weekly modules passed across {courseCount ?? 0} enrolled courses.
              </Text>

              <Pressable
                onPress={() => navigation.navigate('CoursesTab')}
                className="bg-ink h-12 rounded-xl flex-row items-center justify-between px-5 active:bg-ink-secondary"
              >
                <Text className="font-body-semibold text-[14px] text-white">
                  Continue Active Week
                </Text>
                <FontAwesome5 name="arrow-right" size={11} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>

        {/* 2 Clean Stat Cards with Tasteful Color Touches */}
        <View className="px-6 mt-4 flex-row gap-4">
          {/* Weeks Cleared with Cobalt Touch */}
          <View className="flex-1 bg-surface rounded-2xl border border-border/80 p-5 shadow-soft">
            <View className="w-9 h-9 rounded-xl bg-cobalt-light border border-cobalt-border items-center justify-center mb-3">
              <FontAwesome5 name="check-circle" size={14} color="#2563EB" />
            </View>
            <Text className="font-headline text-[24px] text-text-primary tracking-tight">
              {weeksDone ?? 0}
            </Text>
            <Text className="font-body-bold text-[13px] text-text-primary mt-0.5">
              Weeks Cleared
            </Text>
            <Text className="font-body text-[11px] text-muted mt-0.5">
              Verified by quizzes
            </Text>
          </View>

          {/* Study Points with Sunlit Amber Touch */}
          <View className="flex-1 bg-surface rounded-2xl border border-border/80 p-5 shadow-soft">
            <View className="w-9 h-9 rounded-xl bg-amber-light border border-amber-border items-center justify-center mb-3">
              <FontAwesome5 name="award" size={14} color="#D97706" />
            </View>
            <Text className="font-headline text-[24px] text-text-primary tracking-tight">
              {points}
            </Text>
            <Text className="font-body-bold text-[13px] text-text-primary mt-0.5">
              Study Points
            </Text>
            <Text className="font-body text-[11px] text-muted mt-0.5">
              +10 pts per pass
            </Text>
          </View>
        </View>

        {/* Academic Notice Banner with Rose/Amber Accent */}
        {announcements.length > 0 && (
          <View className="px-6 mt-6">
            <Pressable
              onPress={() => navigation.navigate('NotificationsTab')}
              className="bg-surface rounded-2xl border border-border/80 p-5 shadow-soft active:bg-soft"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center bg-rose-light px-2.5 py-0.5 rounded-full border border-rose-border">
                  <Text className="font-body-bold text-[10px] text-rose uppercase tracking-wider">
                    Academic Notice
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={10} color="#A1A1AA" />
              </View>
              <Text className="font-headline text-[15px] text-text-primary leading-5" numberOfLines={1}>
                {announcements[0].title}
              </Text>
              <Text className="font-body text-[13px] text-text-secondary mt-1 leading-5" numberOfLines={2}>
                {announcements[0].body}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Grade Planner Card with Violet Accent */}
        <View className="px-6 mt-6">
          <Pressable
            onPress={() => navigation.navigate('PlannerTab')}
            className="bg-surface rounded-2xl border border-border/80 p-5 flex-row items-center justify-between shadow-soft active:bg-soft"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View className="w-11 h-11 rounded-xl bg-violet-light border border-violet-border items-center justify-center mr-3.5">
                <FontAwesome5 name="calculator" size={16} color="#7C3AED" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-[15px] text-text-primary">
                  Grade & Exam Calculator
                </Text>
                <Text className="font-body text-[13px] text-text-secondary mt-0.5 leading-5">
                  Forecast your CA & calculate target exam scores.
                </Text>
              </View>
            </View>
            <View className="w-8 h-8 rounded-full bg-soft items-center justify-center">
              <FontAwesome5 name="arrow-right" size={10} color="#09090B" />
            </View>
          </Pressable>
        </View>

        {/* Enrolled Courses with Distinct Course Pill Colors */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-headline text-[18px] text-text-primary tracking-tight">
              Enrolled Courses
            </Text>
            <Pressable onPress={() => navigation.navigate('CoursesTab')}>
              <Text className="font-body-semibold text-[13px] text-primary">
                View all ({courses.length})
              </Text>
            </Pressable>
          </View>

          <View className="gap-3">
            {courses.slice(0, 3).map((course, idx) => {
              const scheme = COURSE_COLOR_SCHEMES[idx % COURSE_COLOR_SCHEMES.length];
              return (
                <Pressable
                  key={course.id}
                  onPress={() => navigation.navigate('Course', { courseId: course.id })}
                  className="bg-surface rounded-2xl border border-border/80 p-4 flex-row items-center justify-between shadow-soft active:bg-soft"
                >
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <View
                        style={{ backgroundColor: scheme.bg, borderColor: scheme.border }}
                        className="px-2.5 py-0.5 rounded-full border"
                      >
                        <Text style={{ color: scheme.text }} className="font-body-bold text-[11px]">
                          {course.code}
                        </Text>
                      </View>
                      {course.credits ? (
                        <Text className="font-body text-[11px] text-muted">
                          {course.credits} Units
                        </Text>
                      ) : null}
                    </View>

                    <Text className="font-headline text-[15px] text-text-primary mt-0.5" numberOfLines={1}>
                      {course.title}
                    </Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={11} color="#A1A1AA" />
                </Pressable>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;