import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/navigation/types';
import { cn } from '@/lib/utils';
import { useLecturers } from '@/hooks/useLecturers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type CourseRouteProp = RouteProp<RootStackParamList, 'Course'>;

interface CourseDoc {
  id: string;
  code: string;
  title: string;
  departments?: string[];
  levels?: string[];
  lecturers?: string[];
  tutors?: string[];
  weekAssignments?: { lecturerId: string; weeks: number[] }[];
}

interface WeekDoc {
  id: string;
  weekNumber: number;
  title: string;
  isPublished?: boolean;
  contentBlockCount?: number;
}

const CoursePage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CourseRouteProp>();
  const { courseId } = route.params;
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [weeks, setWeeks] = useState<WeekDoc[]>([]);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { lecturers } = useLecturers(course?.lecturers ?? []);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseSnap, weeksSnap, progressSnap] = await Promise.all([
          getDoc(doc(db, 'courses', courseId)),
          getDocs(collection(db, 'courses', courseId, 'weeks')),
          user ? getDoc(doc(db, 'users', user.uid, 'progress', courseId)) : null,
        ]);

        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, ...courseSnap.data() } as CourseDoc);
        }

        const weekList = weeksSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as WeekDoc)
          .filter((w) => w.isPublished !== false)
          .sort((a, b) => a.weekNumber - b.weekNumber);
        setWeeks(weekList);

        if (progressSnap?.exists()) {
          const data = progressSnap.data();
          if (Array.isArray(data.completedWeeks)) {
            setCompletedWeeks(data.completedWeeks.map(Number));
          }
        }
      } catch (e) {
        console.warn('Failed to load course:', e);
      } finally {
        setLoading(false);
      }
    };

    load();

    if (user) {
      const unsub = onSnapshot(
        doc(db, 'users', user.uid, 'progress', courseId),
        (snap) => {
          if (snap.exists() && Array.isArray(snap.data().completedWeeks)) {
            setCompletedWeeks(snap.data().completedWeeks.map(Number));
          } else {
            setCompletedWeeks([]);
          }
        },
        () => {}
      );
      return () => unsub();
    }
  }, [courseId, user]);

  const isLocked = (weekNumber: number) =>
    weekNumber > 1 && !completedWeeks.includes(weekNumber - 1);

  const progress = weeks.length
    ? Math.round((completedWeeks.filter((w) => weeks.some((x) => x.weekNumber === w)).length / weeks.length) * 100)
    : 0;

  const renderWeek = ({ item }: { item: WeekDoc }) => {
    const locked = isLocked(item.weekNumber);
    const done = completedWeeks.includes(item.weekNumber);

    return (
      <Pressable
        disabled={locked}
        onPress={() => navigation.navigate('Week', { courseId, weekId: item.id })}
        className="mb-3"
      >
        <View
          className={cn(
            'rounded-2xl border p-4 flex-row items-center justify-between shadow-soft',
            locked
              ? 'bg-soft border-border opacity-70'
              : done
              ? 'bg-surface border-border'
              : 'bg-surface border-primary shadow-card'
          )}
        >
          <View className="flex-row items-center flex-1 pr-3">
            {/* Week Status Circle */}
            <View
              className={cn(
                'w-11 h-11 rounded-xl items-center justify-center mr-3.5',
                done
                  ? 'bg-primary-light border border-primary-border'
                  : locked
                  ? 'bg-surface border border-border'
                  : 'bg-primary'
              )}
            >
              {done ? (
                <FontAwesome5 name="check" size={14} color="#059669" />
              ) : locked ? (
                <FontAwesome5 name="lock" size={13} color="#94A3B8" />
              ) : (
                <Text className="font-headline text-[15px] text-white">
                  {item.weekNumber}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="font-body-bold text-[11px] text-muted uppercase tracking-wider mb-0.5">
                Week {item.weekNumber}
              </Text>
              <Text
                className={cn(
                  'font-headline text-[15px] leading-5',
                  locked ? 'text-muted' : 'text-text-primary'
                )}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>
          </View>

          {/* Action / State Pill */}
          <View>
            {locked ? (
              <View className="bg-surface border border-border rounded-full px-2.5 py-1">
                <Text className="font-body-medium text-[11px] text-muted">Locked</Text>
              </View>
            ) : done ? (
              <View className="bg-primary-light border border-primary-border rounded-full px-3 py-1">
                <Text className="font-body-bold text-[11px] text-primary-dark">Passed</Text>
              </View>
            ) : (
              <View className="bg-primary rounded-xl px-3.5 py-2 flex-row items-center">
                <Text className="font-body-bold text-[12px] text-white mr-1.5">Study</Text>
                <FontAwesome5 name="arrow-right" size={10} color="#ffffff" />
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#059669" />
        <Text className="font-body text-[13px] text-muted mt-2">Loading syllabus...</Text>
      </SafeAreaView>
    );
  }

  const weeksFor = (lecturerId: string): string => {
    const assignment = course?.weekAssignments?.find((a) => a.lecturerId === lecturerId);
    if (!assignment || !assignment.weeks?.length) return '';
    return assignment.weeks.length > 1
      ? `Weeks ${assignment.weeks[0]}–${assignment.weeks[assignment.weeks.length - 1]}`
      : `Week ${assignment.weeks[0]}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Course Header */}
      <View className="px-5 pt-3 pb-5 bg-surface border-b border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
          >
            <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
          </Pressable>
          <View className="bg-primary-light px-3 py-1 rounded-full border border-primary-border">
            <Text className="font-body-bold text-[12px] text-primary-dark">
              {course?.code ?? 'Course'}
            </Text>
          </View>
          <View className="w-10" />
        </View>

        <Text className="font-headline text-[22px] text-text-primary leading-7" numberOfLines={2}>
          {course?.title}
        </Text>

        {/* Progress Bar */}
        <View className="mt-4 pt-4 border-t border-divider">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="font-body-semibold text-[12px] text-text-secondary">
              Course Completion
            </Text>
            <Text className="font-body-bold text-[12px] text-primary-dark">{progress}%</Text>
          </View>
          <View className="h-2.5 rounded-full bg-soft overflow-hidden border border-border/40">
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
        </View>
      </View>

      <FlatList
        data={weeks}
        keyExtractor={(item) => item.id}
        renderItem={renderWeek}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Meet Your Lecturer Bento Card */}
            {lecturers.length > 0 && (
              <View className="bg-surface rounded-2xl border border-border p-4 shadow-card mb-5">
                <Text className="font-headline text-[15px] text-text-primary mb-3">
                  Teaching Faculty ({lecturers.length})
                </Text>
                {lecturers.map((l, i) => {
                  const range = weeksFor(l.id);
                  return (
                    <Pressable
                      key={l.id}
                      onPress={() => navigation.navigate('Lecturer', { lecturerId: l.id })}
                      className={cn(
                        'flex-row items-center py-2.5',
                        i < lecturers.length - 1 && 'border-b border-divider'
                      )}
                    >
                      <View className="w-11 h-11 rounded-xl bg-accent-light border border-accent-border items-center justify-center mr-3">
                        <Text className="font-headline text-[15px] text-accent">
                          {l.name?.split(' ').slice(0, 2).map((s) => s[0]).join('') ?? '?'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-body-bold text-[14px] text-text-primary">{l.name}</Text>
                        <Text className="font-body text-[12px] text-muted mt-0.5">
                          {[l.title, range].filter(Boolean).join(' • ')}
                        </Text>
                      </View>
                      <FontAwesome5 name="chevron-right" size={11} color="#94A3B8" />
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text className="font-headline text-[17px] text-text-primary mb-3">
              Weekly Modules
            </Text>
          </>
        }
        ListEmptyComponent={
          <View className="items-center py-12 px-6">
            <View className="w-16 h-16 rounded-2xl bg-primary-light border border-primary-border items-center justify-center mb-3">
              <FontAwesome5 name="calendar-week" size={24} color="#059669" />
            </View>
            <Text className="font-headline text-[16px] text-text-primary mb-1">No Modules Published Yet</Text>
            <Text className="font-body text-[13px] text-muted text-center">
              Weekly content will be published by the course lecturer soon.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default CoursePage;