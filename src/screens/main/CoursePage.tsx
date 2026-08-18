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
          className="rounded-2xl p-5 flex-row items-center justify-between"
          style={{
            backgroundColor: locked
              ? '#F2EDE8'
              : done
              ? '#E8F0EC'
              : 'rgba(255,255,255,0.82)',
            borderWidth: locked ? 0 : 1,
            borderColor: locked
              ? 'transparent'
              : done
              ? '#C8DDCF'
              : '#1A1A1A',
            opacity: locked ? 0.55 : 1,
            shadowColor: locked ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: locked ? 0 : 3 },
            shadowOpacity: locked ? 0 : 0.05,
            shadowRadius: locked ? 0 : 10,
            elevation: locked ? 0 : 3,
          }}
        >
          <View className="flex-row items-center flex-1 pr-4">
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-4"
              style={{
                backgroundColor: done
                  ? '#ECFDF5'
                  : locked
                  ? 'rgba(255,255,255,0.5)'
                  : '#1A1A1A',
                borderWidth: done ? 1 : 0,
                borderColor: done ? '#A7F3D0' : 'transparent',
              }}
            >
              {done ? (
                <FontAwesome5 name="check" size={14} color="#059669" />
              ) : locked ? (
                <FontAwesome5 name="lock" size={12} color="#8A817C" />
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
              <View className="bg-ink rounded-xl px-4 py-2.5 flex-row items-center">
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
        <ActivityIndicator size="large" color="#059669" />
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
            className="w-11 h-11 rounded-full items-center justify-center active:opacity-80"
            style={{
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderWidth: 1,
              borderColor: '#E7DDD5',
            }}
          >
            <FontAwesome5 name="chevron-left" size={14} color="#1A1A1A" />
          </Pressable>
          <View className="bg-pastel-sage px-3 py-1 rounded-full">
            <Text className="font-body-bold text-[13px] text-primary">
              {course?.code ?? 'Course'}
            </Text>
          </View>
          <View className="w-11" />
        </View>

        {/* Bold Display Title — Dribbble "Spatial Aptitude" style */}
        <Text className="font-headline text-[28px] text-text-primary leading-[34px] tracking-tight" numberOfLines={2}>
          {course?.title}
        </Text>

        {/* Progress Bar */}
        <View className="mt-5 flex-row items-center gap-4">
          <View className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#E8F0EC' }}>
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
          <Text className="font-headline text-[16px] text-primary">{progress}%</Text>
        </View>
      </View>

      <FlatList
        data={weeks}
        keyExtractor={(item) => item.id}
        renderItem={renderWeek}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {lecturers.length > 0 && (
              <View
                className="rounded-2xl p-5 mb-6"
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
                      <View
                        className="w-11 h-11 rounded-full items-center justify-center mr-3.5"
                        style={{ backgroundColor: '#ECEAF4' }}
                      >
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
                      <FontAwesome5 name="chevron-right" size={10} color="#8A817C" />
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text className="font-headline text-[20px] text-text-primary tracking-tight mb-4">
              Weekly Syllabus
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default CoursePage;