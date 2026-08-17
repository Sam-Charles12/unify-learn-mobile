import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnnouncements, scopeStyle } from '@/hooks/useAnnouncements';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
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
    profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const initials = (profile?.name ?? user?.email ?? 'U')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');
  const points = (weeksDone ?? 0) * 10;
  const progressPct =
    totalWeeks && totalWeeks > 0 ? Math.min(100, Math.round(((weeksDone ?? 0) / totalWeeks) * 100)) : 0;

  const stats = [
    { icon: 'book-open', label: 'Courses', value: courseCount, color: '#00895A', bg: '#CFF5E6' },
    { icon: 'check-circle', label: 'Weeks done', value: weeksDone, color: '#005B96', bg: '#DCEEFF' },
    { icon: 'award', label: 'Points', value: points, color: '#8B9658', bg: '#E5D45A' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#00A86B', '#0E8A72', '#0B6E8F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-b-[28px] px-6 pt-4 pb-12"
        >
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-[14px] bg-white items-center justify-center mr-3 shadow-soft">
                <FontAwesome5 name="graduation-cap" size={18} color="#00895A" />
              </View>
              <View>
                <Text className="font-headline text-[16px] text-white leading-5">Unify Learn</Text>
                <Text className="font-body text-[11px] text-white/70">LASU Engineering</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Pressable
                onPress={() => navigation.navigate('NotificationsTab')}
                className="w-11 h-11 rounded-[14px] bg-white items-center justify-center mr-3 shadow-soft"
              >
                <FontAwesome5 name="bell" size={17} color="#005B96" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1.5 -right-1.5 min-w-5 h-5 rounded-pill bg-error border-2 border-white px-1.5 items-center justify-center">
                    <Text className="font-body-bold text-[10px] text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('ProfileTab')}
                className="w-11 h-11 rounded-[14px] bg-white items-center justify-center shadow-soft"
              >
                <Text className="font-headline text-[15px] text-primary-dark">
                  {initials}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text className="font-headline text-[26px] text-white leading-9">
            Hello, {firstName}
          </Text>
          <Text className="font-body text-[13px] text-white/75 mt-1">
            {profile?.department
              ? `${profile.department.toUpperCase()} - L${profile.level ?? ''}`
              : 'Welcome to Unify Learn'}
          </Text>
        </LinearGradient>

        <View className="-mt-7 mx-5 bg-card rounded-[24px] border border-border p-4 shadow-soft">
          {dataLoading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#00A86B" />
            </View>
          ) : (
            <View className="flex-row justify-around">
              {stats.map((stat) => (
                <View key={stat.label} className="items-center">
                  <View
                    style={{ backgroundColor: stat.bg }}
                    className="w-11 h-11 rounded-[16px] items-center justify-center mb-1.5"
                  >
                    <FontAwesome5 name={stat.icon} size={14} color={stat.color} />
                  </View>
                  <Text className="font-headline text-[17px] text-text-primary">
                    {stat.value ?? 0}
                  </Text>
                  <Text className="font-body-medium text-[11px] text-muted">{stat.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {announcements.length > 0 && (
          <Pressable
            onPress={() => navigation.navigate('NotificationsTab')}
            className="mx-5 mt-4 rounded-[20px] p-4 flex-row items-center bg-[#FFF8E1] border border-[#E5D45A]"
          >
            {(() => {
              const latest = announcements[0];
              const style = scopeStyle(latest.scope);
              return (
                <>
                  <View style={{ backgroundColor: style.bg }} className="w-10 h-10 rounded-[14px] items-center justify-center mr-3">
                    <FontAwesome5 name={style.icon} size={15} color={style.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-body-semibold text-[14px] text-text-primary" numberOfLines={1}>
                      {latest.title}
                    </Text>
                    <Text className="font-body text-[12px] text-muted" numberOfLines={1}>
                      {latest.body}
                    </Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={12} color="#8A817C" />
                </>
              );
            })()}
          </Pressable>
        )}

        <View className="mx-5 mt-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
          <View className="flex-row justify-between mb-2">
            <Text className="font-body-semibold text-[14px] text-text-primary">
              Overall progress
            </Text>
            <Text className="font-body-bold text-[14px] text-primary-dark">{progressPct}%</Text>
          </View>
          <View className="h-2.5 rounded-pill bg-soft overflow-hidden">
            <View
              className="h-full rounded-pill"
              style={{ width: `${progressPct}%`, backgroundColor: '#0E8A72' }}
            />
          </View>
          <Text className="font-body text-[12px] text-muted mt-2">
            {weeksDone ?? 0} of {totalWeeks ?? 0} weeks completed
          </Text>
        </View>

        <View className="flex-row gap-3 mx-5 mt-5">
          <Pressable
            onPress={() => navigation.navigate('PlannerTab')}
            className="flex-1 bg-card rounded-[20px] border border-border p-4 shadow-soft items-center"
          >
            <View className="w-11 h-11 rounded-[16px] bg-accent-light items-center justify-center mb-2">
              <FontAwesome5 name="chart-line" size={16} color="#005B96" />
            </View>
            <Text className="font-body-semibold text-[13px] text-text-primary text-center">
              Grade Planner
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('NotificationsTab')}
            className="flex-1 bg-card rounded-[20px] border border-border p-4 shadow-soft items-center"
          >
            <View className="w-11 h-11 rounded-[16px] bg-[#E5D45A]/50 items-center justify-center mb-2">
              <FontAwesome5 name="bell" size={16} color="#8B9658" />
            </View>
            <Text className="font-body-semibold text-[13px] text-text-primary text-center">
              Notifications
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ProfileTab')}
            className="flex-1 bg-card rounded-[20px] border border-border p-4 shadow-soft items-center"
          >
            <View className="w-11 h-11 rounded-[16px] bg-primary-light items-center justify-center mb-2">
              <FontAwesome5 name="user" size={16} color="#00895A" />
            </View>
            <Text className="font-body-semibold text-[13px] text-text-primary text-center">
              Profile
            </Text>
          </Pressable>
        </View>

        <View className="px-6 mt-7">
          <Text className="font-headline text-[18px] text-text-primary mb-1">Continue learning</Text>
          <Text className="font-body text-[13px] text-muted mb-4">
            Pick up where you left off or explore new courses.
          </Text>

          <Pressable
            onPress={() => navigation.navigate('CoursesTab')}
            className="bg-card rounded-[24px] border border-border p-5 shadow-soft mb-4"
          >
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-[18px] bg-accent-light items-center justify-center mr-4">
                <FontAwesome5 name="book-open" size={20} color="#005B96" />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-[16px] text-text-primary">
                  Browse my courses
                </Text>
                <Text className="font-body text-[12px] text-muted mt-0.5">
                  {courseCount != null
                    ? `${courseCount} course${courseCount === 1 ? '' : 's'} available`
                    : profile?.department
                      ? `${profile.department.toUpperCase()} - L${profile.level ?? ''}`
                      : 'View your department courses'}
                </Text>
              </View>
              <View className="w-9 h-9 rounded-full bg-accent items-center justify-center">
                <FontAwesome5 name="arrow-right" size={13} color="#ffffff" />
              </View>
            </View>
          </Pressable>

          <LinearGradient
            colors={['#005B96', '#0B6E8F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-[24px] p-5 shadow-soft"
          >
            <Pressable onPress={() => navigation.navigate('CoursesTab')}>
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-[18px] bg-white/15 items-center justify-center mr-4">
                  <FontAwesome5 name="layer-group" size={20} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-[16px] text-white">
                    All course materials
                  </Text>
                  <Text className="font-body text-[12px] text-white/75 mt-0.5">
                    Notes, quizzes and exams, week by week
                  </Text>
                </View>
                <View className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
                  <FontAwesome5 name="arrow-right" size={13} color="#ffffff" />
                </View>
              </View>
            </Pressable>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;