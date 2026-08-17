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
import { useAnnouncements, scopeStyle } from '@/hooks/useAnnouncements';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigation = useNavigation<NavigationProp>();

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
        const courses = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((c) => !Array.isArray(c.levels) || c.levels.includes(profile.level ?? ''));

        const progressSnap = await getDocs(collection(db, 'users', user.uid, 'progress'));
        let done = 0;
        let total = 0;
        for (const course of courses) {
          const weeksSnap = await getDocs(collection(db, 'courses', course.id, 'weeks'));
          total += weeksSnap.docs.filter((w) => w.data().isPublished !== false).length;
        }
        progressSnap.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.completedWeeks)) done += data.completedWeeks.length;
        });

        setCourseCount(courses.length);
        setWeeksDone(done);
        setTotalWeeks(total);
        setCourseIds(courses.map((c) => c.id));
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Top Institutional Header */}
        <View className="px-5 pt-3 pb-4 bg-surface border-b border-border">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-primary-light border border-primary-border items-center justify-center mr-3">
                <FontAwesome5 name="graduation-cap" size={16} color="#059669" />
              </View>
              <View>
                <Text className="font-headline text-[16px] text-text-primary leading-5">Unify Learn</Text>
                <Text className="font-body-medium text-[12px] text-primary-dark">LASU Faculty of Engineering</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => navigation.navigate('NotificationsTab')}
                className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
              >
                <FontAwesome5 name="bell" size={15} color="#0F172A" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-error border-2 border-surface px-1 items-center justify-center">
                    <Text className="font-body-bold text-[9px] text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('ProfileTab')}
                className="w-10 h-10 rounded-xl bg-ink items-center justify-center shadow-soft"
              >
                <Text className="font-headline text-[13px] text-white">
                  {initials}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Welcome Section */}
        <View className="px-5 pt-5 pb-3">
          <Text className="font-headline text-[24px] text-text-primary leading-8">
            Hello, {firstName} 👋
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-2 h-2 rounded-full bg-primary mr-2" />
            <Text className="font-body-medium text-[13px] text-text-secondary">
              {profile?.department
                ? `${profile.department.toUpperCase()} • Level ${profile.level ?? ''}`
                : 'Welcome to your academic semester'}
            </Text>
          </View>
        </View>

        {/* BENTO GRID: Main Academic Performance Spotlight */}
        <View className="px-5 mt-2">
          {dataLoading ? (
            <View className="bg-surface rounded-2xl border border-border p-8 items-center justify-center shadow-soft">
              <ActivityIndicator size="small" color="#059669" />
              <Text className="font-body text-[13px] text-muted mt-2">Syncing course materials...</Text>
            </View>
          ) : (
            <View className="gap-3">
              
              {/* Bento Primary Spotlight Card: Active Semester Progress */}
              <View className="bg-surface rounded-2xl border border-border p-5 shadow-card">
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <View className="flex-row items-center bg-primary-light px-2.5 py-1 rounded-full border border-primary-border self-start mb-2">
                      <Text className="font-body-bold text-[11px] text-primary-dark uppercase tracking-wider">
                        Semester Progress
                      </Text>
                    </View>
                    <Text className="font-headline text-[22px] text-text-primary leading-7">
                      {courseCount ?? 0} Enrolled Courses
                    </Text>
                    <Text className="font-body text-[13px] text-text-secondary mt-0.5">
                      {weeksDone ?? 0} of {totalWeeks ?? 0} syllabus weeks completed
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="font-headline text-[28px] text-primary leading-8">
                      {progressPct}%
                    </Text>
                    <Text className="font-body-medium text-[11px] text-muted">Complete</Text>
                  </View>
                </View>

                {/* Solid Emerald Progress Track */}
                <View className="h-3 rounded-full bg-soft overflow-hidden mb-4 border border-border/40">
                  <View
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progressPct}%` }}
                  />
                </View>

                <Pressable
                  onPress={() => navigation.navigate('CoursesTab')}
                  className="bg-ink py-3 px-4 rounded-xl flex-row items-center justify-between active:bg-ink-light"
                >
                  <View className="flex-row items-center">
                    <FontAwesome5 name="book-reader" size={13} color="#FFFFFF" />
                    <Text className="ml-2.5 font-body-bold text-[13px] text-white">
                      Resume Active Week
                    </Text>
                  </View>
                  <FontAwesome5 name="arrow-right" size={12} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Bento Secondary Row: 2 Asymmetric Metric Tiles */}
              <View className="flex-row gap-3">
                {/* Tile 1: Weeks Cleared */}
                <View className="flex-1 bg-indigo-bg border border-indigo-border rounded-2xl p-4 shadow-soft">
                  <View className="w-10 h-10 rounded-xl bg-white border border-indigo-border items-center justify-center mb-3 shadow-soft">
                    <FontAwesome5 name="check-circle" size={16} color="#4F46E5" />
                  </View>
                  <Text className="font-headline text-[22px] text-indigo-text">
                    {weeksDone ?? 0}
                  </Text>
                  <Text className="font-body-semibold text-[12px] text-indigo-text mt-0.5">
                    Weeks Cleared
                  </Text>
                  <Text className="font-body text-[11px] text-muted mt-1">
                    Via Weekly Quizzes
                  </Text>
                </View>

                {/* Tile 2: Academic Points */}
                <View className="flex-1 bg-amber-bg border border-amber-border rounded-2xl p-4 shadow-soft">
                  <View className="w-10 h-10 rounded-xl bg-white border border-amber-border items-center justify-center mb-3 shadow-soft">
                    <FontAwesome5 name="award" size={16} color="#D97706" />
                  </View>
                  <Text className="font-headline text-[22px] text-amber-text">
                    {points}
                  </Text>
                  <Text className="font-body-semibold text-[12px] text-amber-text mt-0.5">
                    Study Points
                  </Text>
                  <Text className="font-body text-[11px] text-muted mt-1">
                    +10 pts per quiz pass
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Latest Announcement (Academic Information Network) */}
        {announcements.length > 0 && (
          <View className="px-5 mt-4">
            <Pressable
              onPress={() => navigation.navigate('NotificationsTab')}
              className="bg-surface rounded-2xl border border-border p-4 shadow-soft"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-amber mr-2" />
                  <Text className="font-body-bold text-[11px] text-amber uppercase tracking-wider">
                    Academic Notice
                  </Text>
                </View>
                <FontAwesome5 name="chevron-right" size={11} color="#94A3B8" />
              </View>
              <Text className="font-body-bold text-[14px] text-text-primary leading-5" numberOfLines={1}>
                {announcements[0].title}
              </Text>
              <Text className="font-body text-[13px] text-text-secondary mt-1" numberOfLines={2}>
                {announcements[0].body}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Bento Functional Tools Grid */}
        <View className="px-5 mt-5">
          <Text className="font-headline text-[17px] text-text-primary mb-3">
            Academic Toolkit
          </Text>

          <View className="gap-3">
            {/* Grade Planner Tool Spotlight */}
            <Pressable
              onPress={() => navigation.navigate('PlannerTab')}
              className="bg-surface rounded-2xl border border-border p-4 flex-row items-center justify-between shadow-soft active:bg-soft"
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-12 h-12 rounded-xl bg-accent-light border border-accent-border items-center justify-center mr-3.5">
                  <FontAwesome5 name="calculator" size={18} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="font-body-bold text-[15px] text-text-primary">
                    Grade & Score Planner
                  </Text>
                  <Text className="font-body text-[12px] text-text-secondary mt-0.5">
                    Calculate CA, Test scores & target exam requirements
                  </Text>
                </View>
              </View>
              <View className="w-8 h-8 rounded-full bg-soft items-center justify-center">
                <FontAwesome5 name="arrow-right" size={12} color="#0F172A" />
              </View>
            </Pressable>

            {/* Sub-tools 2-column grid */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => navigation.navigate('CoursesTab')}
                className="flex-1 bg-surface rounded-2xl border border-border p-4 shadow-soft active:bg-soft"
              >
                <View className="w-10 h-10 rounded-xl bg-primary-light border border-primary-border items-center justify-center mb-2.5">
                  <FontAwesome5 name="book-open" size={15} color="#059669" />
                </View>
                <Text className="font-body-bold text-[14px] text-text-primary">
                  Course Modules
                </Text>
                <Text className="font-body text-[11px] text-muted mt-0.5">
                  Curriculum notes & tests
                </Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('NotificationsTab')}
                className="flex-1 bg-surface rounded-2xl border border-border p-4 shadow-soft active:bg-soft"
              >
                <View className="w-10 h-10 rounded-xl bg-rose-bg border border-rose-border items-center justify-center mb-2.5">
                  <FontAwesome5 name="bullhorn" size={14} color="#E11D48" />
                </View>
                <Text className="font-body-bold text-[14px] text-text-primary">
                  Faculty Feed
                </Text>
                <Text className="font-body text-[11px] text-muted mt-0.5">
                  {unreadCount > 0 ? `${unreadCount} unread notices` : 'Up to date'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Quick Access to Courses */}
        <View className="px-5 mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-headline text-[17px] text-text-primary">
              My Courses
            </Text>
            <Pressable onPress={() => navigation.navigate('CoursesTab')}>
              <Text className="font-body-bold text-[13px] text-primary-dark">
                View All →
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => navigation.navigate('CoursesTab')}
            className="bg-surface rounded-2xl border border-border p-4 flex-row items-center justify-between shadow-card"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-11 h-11 rounded-xl bg-primary-light border border-primary-border items-center justify-center mr-3">
                <FontAwesome5 name="layer-group" size={16} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="font-body-bold text-[14px] text-text-primary">
                  {profile?.department ? `${profile.department.toUpperCase()} Department Courses` : 'Department Curriculum'}
                </Text>
                <Text className="font-body text-[12px] text-text-secondary mt-0.5">
                  Week-by-week notes, examples & pass gates
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

export default Dashboard;