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
          className={`rounded-2xl border p-5 flex-row items-center justify-between shadow-soft ${
            locked
              ? 'bg-soft/70 border-border/60 opacity-60'
              : done
              ? 'bg-surface border-border/80'
              : 'bg-surface border-ink shadow-card'
          }`}
        >
          <View className="flex-row items-center flex-1 pr-4">
            <View
              className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
                done
                  ? 'bg-primary-light border border-primary-border'
                  : locked
                  ? 'bg-surface border border-border'
                  : 'bg-ink'
              }`}
            >
              {done ? (
                <FontAwesome5 name="check" size={13} color="#0F5132" />
              ) : locked ? (
                <FontAwesome5 name="lock" size={12} color="#A1A1AA" />
              ) : (
                <Text className="font-headline text-[15px] text-white">
                  {item.weekNumber}
                </Text>
              )}
            </View>

            <View className="flex-1">
              <Text className="font-body-semibold text-[11px] text-muted uppercase tracking-wider mb-0.5">
                Week {item.weekNumber}
              </Text>
              <Text
                className={`font-headline text-[15px] leading-5 ${
                  locked ? 'text-muted' : 'text-text-primary'
                }`}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </View>
          </View>

          <View>
            {locked ? (
              <Text className="font-body-medium text-[12px] text-muted">Locked</Text>
            ) : done ? (
              <Text className="font-body-bold text-[12px] text-primary">Completed</Text>
            ) : (
              <View className="bg-ink rounded-xl px-4 py-2 flex-row items-center">
                <Text className="font-body-semibold text-[12px] text-white mr-1.5">Study</Text>
                <FontAwesome5 name="arrow-right" size={9} color="#FFFFFF" />
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
        <ActivityIndicator size="large" color="#0F5132" />
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
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center shadow-soft active:bg-soft"
          >
            <FontAwesome5 name="chevron-left" size={14} color="#09090B" />
          </Pressable>
          <Text className="font-body-bold text-[13px] text-primary">
            {course?.code ?? 'Course'}
          </Text>
          <View className="w-10" />
        </View>

        <Text className="font-headline text-[24px] text-text-primary leading-8 tracking-tight" numberOfLines={2}>
          {course?.title}
        </Text>

        {/* Progress Bar */}
        <View className="mt-4 pt-4 border-t border-divider">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-body-medium text-[13px] text-text-secondary">
              Course Syllabus Progress
            </Text>
            <Text className="font-headline text-[13px] text-primary">{progress}%</Text>
          </View>
          <View className="h-2 rounded-full bg-soft overflow-hidden">
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
        </View>
      </View>

      <FlatList
        data={weeks}
        keyExtractor={(item) => item.id}
        renderItem={renderWeek}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {lecturers.length > 0 && (
              <View className="bg-surface rounded-2xl border border-border/80 p-5 shadow-soft mb-6">
                <Text className="font-body-bold text-[12px] text-muted uppercase tracking-wider mb-3">
                  Teaching Faculty
                </Text>
                {lecturers.map((l, i) => {
                  const range = weeksFor(l.id);
                  return (
                    <Pressable
                      key={l.id}
                      onPress={() => navigation.navigate('Lecturer', { lecturerId: l.id })}
                      className={`flex-row items-center py-3 ${i < lecturers.length - 1 ? 'border-b border-divider' : ''}`}
                    >
                      <View className="w-10 h-10 rounded-full bg-soft items-center justify-center mr-3.5">
                        <Text className="font-headline text-[14px] text-text-primary">
                          {l.name?.split(' ').slice(0, 2).map((s) => s[0]).join('') ?? '?'}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-headline text-[14px] text-text-primary">{l.name}</Text>
                        <Text className="font-body text-[12px] text-muted mt-0.5">
                          {[l.title, range].filter(Boolean).join(' • ')}
                        </Text>
                      </View>
                      <FontAwesome5 name="chevron-right" size={10} color="#A1A1AA" />
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text className="font-headline text-[18px] text-text-primary tracking-tight mb-4">
              Weekly Syllabus
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default CoursePage;