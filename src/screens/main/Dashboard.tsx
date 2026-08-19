import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PASTEL_CARDS = [
  { bg: '#E8F0EC', border: '#C8DDCF', text: '#047857', icon: '#059669' }, // Sage
  { bg: '#ECEAF4', border: '#D5D2E8', text: '#6D28D9', icon: '#7C3AED' }, // Lavender
  { bg: '#F5EAEA', border: '#E5D0D0', text: '#BE123C', icon: '#E11D48' }, // Blush
  { bg: '#F4E9DE', border: '#E2D4C4', text: '#B45309', icon: '#D97706' }, // Cream
  { bg: '#E4EDF6', border: '#C8D9EA', text: '#1D4ED8', icon: '#2563EB' }, // Sky
];

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
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
      if (!user) return;
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const allCourses = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

        let courseList: any[] = [];

        if (profile?.enrolledCourses && Array.isArray(profile.enrolledCourses) && profile.enrolledCourses.length > 0) {
          courseList = allCourses.filter((c) =>
            profile.enrolledCourses!.includes(c.id) || profile.enrolledCourses!.includes(c.code)
          );
        } else if (profile?.department) {
          const userDept = profile.department.toLowerCase().trim();
          courseList = allCourses.filter((c) => {
            if (!c.departments || !Array.isArray(c.departments) || c.departments.length === 0) return false;
            const matchDept = c.departments.some(
              (d: string) => String(d).toLowerCase().trim() === userDept || String(d).toLowerCase().includes(userDept)
            );
            const matchLvl = !profile?.level || !c.levels || !Array.isArray(c.levels) || c.levels.map(String).includes(String(profile.level).trim());
            return matchDept && matchLvl;
          });
        }

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

    if (!profileLoading) {
      load();
    }
  }, [user, profile?.department, profile?.level, profile?.enrolledCourses, profileLoading]);

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
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View className="px-6 pt-4 pb-2 flex-row items-center justify-between">
          <View className="flex-row items-center bg-pastel-sage px-3.5 py-2 rounded-full">
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
              className="w-11 h-11 rounded-full bg-glass-strong items-center justify-center active:bg-soft"
              style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                borderWidth: 1,
                borderColor: '#E7DDD5',
              }}
            >
              <FontAwesome5 name="bell" size={15} color="#1A1A1A" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose items-center justify-center px-1"
                  style={{ borderWidth: 2, borderColor: '#F8F6F3' }}
                >
                  <Text className="font-body-bold text-[8px] text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('ProfileTab')}
              className="w-11 h-11 rounded-full bg-ink items-center justify-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text className="font-headline text-[13px] text-white">
                {initials}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Hero Greeting — Bold Display Style */}
        <View className="px-6 pt-6 pb-2">
          <Text className="font-headline text-[32px] text-text-primary leading-[38px] tracking-tight">
            {getGreeting()},{'\n'}{firstName} 👋
          </Text>
          <Text className="font-body text-[15px] text-text-secondary mt-2 leading-6">
            Your semester syllabus and study progress at a glance.
          </Text>
        </View>

        {/* Hero Progress Card — Glassmorphism Inspired */}
        <View className="px-6 mt-6">
          {dataLoading ? (
            <View
              className="rounded-3xl p-8 items-center justify-center"
              style={{
                backgroundColor: 'rgba(255,255,255,0.75)',
                borderWidth: 1,
                borderColor: 'rgba(231,221,213,0.6)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.06,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <ActivityIndicator size="small" color="#059669" />
            </View>
          ) : (
            <View
              className="rounded-3xl p-6"
              style={{
                backgroundColor: 'rgba(255,255,255,0.78)',
                borderWidth: 1,
                borderColor: 'rgba(231,221,213,0.5)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.07,
                shadowRadius: 24,
                elevation: 10,
              }}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <View className="flex-row items-center mb-1">
                    <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                    <Text className="font-body-bold text-[11px] text-primary uppercase tracking-wider">
                      Syllabus Progress
                    </Text>
                  </View>
                  <Text className="font-body text-[13px] text-text-secondary mt-1 leading-5">
                    {weeksDone ?? 0} of {totalWeeks ?? 0} weekly modules{'\n'}across {courseCount ?? 0} enrolled courses.
                  </Text>
                </View>
                {/* Large percentage display */}
                <Text className="font-headline text-[42px] text-primary tracking-tight leading-[42px]">
                  {progressPct}%
                </Text>
              </View>

              {/* Progress Track */}
              <View
                className="h-3 rounded-full overflow-hidden mb-5"
                style={{ backgroundColor: '#E8F0EC' }}
              >
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </View>

              <Pressable
                onPress={() => navigation.navigate('CoursesTab')}
                className="bg-ink h-[52px] rounded-2xl flex-row items-center justify-between px-6 active:bg-ink-secondary"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Text className="font-body-semibold text-[14px] text-white">
                  Continue Active Week
                </Text>
                <FontAwesome5 name="arrow-right" size={12} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Pastel Stat Cards */}
        <View className="px-6 mt-5 flex-row gap-4">
          <View
            className="flex-1 rounded-2xl p-5"
            style={{
              backgroundColor: '#ECEAF4',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="w-10 h-10 rounded-xl bg-white/70 items-center justify-center mb-3">
              <FontAwesome5 name="check-circle" size={16} color="#7C3AED" />
            </View>
            <Text className="font-headline text-[26px] text-text-primary tracking-tight">
              {weeksDone ?? 0}
            </Text>
            <Text className="font-body-bold text-[13px] text-text-primary mt-0.5">
              Weeks Cleared
            </Text>
            <Text className="font-body text-[11px] text-text-secondary mt-0.5">
              Verified by quizzes
            </Text>
          </View>

          <View
            className="flex-1 rounded-2xl p-5"
            style={{
              backgroundColor: '#F4E9DE',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="w-10 h-10 rounded-xl bg-white/70 items-center justify-center mb-3">
              <FontAwesome5 name="award" size={16} color="#D97706" />
            </View>
            <Text className="font-headline text-[26px] text-text-primary tracking-tight">
              {points}
            </Text>
            <Text className="font-body-bold text-[13px] text-text-primary mt-0.5">
              Study Points
            </Text>
            <Text className="font-body text-[11px] text-text-secondary mt-0.5">
              +10 pts per pass
            </Text>
          </View>
        </View>

        {/* Academic Notice Banner */}
        {announcements.length > 0 && (
          <View className="px-6 mt-6">
            <Pressable
              onPress={() => navigation.navigate('NotificationsTab')}
              className="rounded-2xl p-5 active:opacity-90"
              style={{
                backgroundColor: '#F5EAEA',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center bg-rose-light px-2.5 py-1 rounded-full">
                  <Text className="font-body-bold text-[10px] text-rose uppercase tracking-wider">
                    Academic Notice
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={10} color="#8A817C" />
              </View>
              <Text className="font-headline text-[16px] text-text-primary leading-6" numberOfLines={1}>
                {announcements[0].title}
              </Text>
              <Text className="font-body text-[13px] text-text-secondary mt-1 leading-5" numberOfLines={2}>
                {announcements[0].body}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Grade Planner Card */}
        <View className="px-6 mt-6">
          <Pressable
            onPress={() => navigation.navigate('PlannerTab')}
            className="rounded-2xl p-5 flex-row items-center justify-between active:opacity-90"
            style={{
              backgroundColor: 'rgba(255,255,255,0.78)',
              borderWidth: 1,
              borderColor: 'rgba(231,221,213,0.5)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center flex-1 pr-3">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                style={{ backgroundColor: '#ECEAF4' }}
              >
                <FontAwesome5 name="calculator" size={17} color="#7C3AED" />
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
            <View className="w-9 h-9 rounded-full bg-soft items-center justify-center">
              <FontAwesome5 name="arrow-right" size={10} color="#1A1A1A" />
            </View>
          </Pressable>
        </View>

        {/* Enrolled Courses */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-headline text-[20px] text-text-primary tracking-tight">
              Your Courses
            </Text>
            <Pressable onPress={() => navigation.navigate('CoursesTab')}>
              <Text className="font-body-semibold text-[13px] text-primary">
                View all ({courses.length})
              </Text>
            </Pressable>
          </View>

          {courses.length === 0 ? (
            <View
              className="rounded-2xl p-6 items-center"
              style={{
                backgroundColor: 'rgba(255,255,255,0.78)',
                borderWidth: 1,
                borderColor: 'rgba(231,221,213,0.5)',
              }}
            >
              <Text className="font-body-semibold text-[14px] text-text-primary mb-1">
                No Enrolled Courses Found
              </Text>
              <Text className="font-body text-[12px] text-muted text-center">
                Courses will appear once added to the database or when department matching completes.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {courses.slice(0, 3).map((course, idx) => {
                const scheme = PASTEL_CARDS[idx % PASTEL_CARDS.length];
                return (
                  <Pressable
                    key={course.id}
                    onPress={() => navigation.navigate('Course', { courseId: course.id })}
                    className="rounded-2xl p-5 flex-row items-center justify-between active:opacity-90"
                    style={{
                      backgroundColor: scheme.bg,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.03,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center gap-2 mb-1.5">
                        <View
                          className="px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: scheme.border }}
                        >
                          <Text style={{ color: scheme.text }} className="font-body-bold text-[11px]">
                            {course.code}
                          </Text>
                        </View>
                        {course.credits ? (
                          <Text className="font-body text-[11px] text-text-secondary">
                            {course.credits} Units
                          </Text>
                        ) : null}
                      </View>

                      <Text className="font-headline text-[16px] text-text-primary mt-0.5 leading-6" numberOfLines={1}>
                        {course.title}
                      </Text>
                    </View>
                    <View
                      className="w-9 h-9 rounded-full items-center justify-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                    >
                      <FontAwesome5 name="chevron-right" size={11} color={scheme.icon} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;