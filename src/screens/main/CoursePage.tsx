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
        className={cn('mb-3 rounded-[20px] border p-4 flex-row items-center', 
          locked ? 'bg-surface border-border opacity-70' : 'bg-card border-border shadow-soft')}
        >
        <View
          className={cn(
            'w-11 h-11 rounded-full items-center justify-center mr-4',
            done ? 'bg-primary' : locked ? 'bg-background' : 'bg-primary-light'
          )}
        >
          {done ? (
            <FontAwesome5 name="check" size={16} color="#ffffff" />
          ) : locked ? (
            <FontAwesome5 name="lock" size={15} color="#8A817C" />
          ) : (
            <Text className="font-headline text-[16px] text-primary-dark">{item.weekNumber}</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-body-medium text-[11px] text-muted uppercase tracking-wide mb-0.5">
            Week {item.weekNumber}
          </Text>
          <Text className={cn('font-body-semibold text-[15px]', locked ? 'text-muted' : 'text-text-primary')} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <View className="ml-2">
          {locked ? (
            <View className="bg-background rounded-pill px-3 py-1">
              <Text className="font-body-medium text-[11px] text-muted">Locked</Text>
            </View>
          ) : done ? (
            <View className="bg-primary-light rounded-pill px-3 py-1">
              <Text className="font-body-medium text-[11px] text-primary-dark">Done</Text>
            </View>
          ) : (
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
              <FontAwesome5 name="chevron-right" size={12} color="#ffffff" />
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#00A86B" />
      </SafeAreaView>
    );
  }

  const lecturerCount = course?.lecturers?.length ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="bg-primary rounded-b-[28px] px-6 pt-4 pb-8 shadow-soft">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
            <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
          </Pressable>
          <Text className="font-body-bold text-white text-[15px]">{course?.code ?? 'Course'}</Text>
          <View className="w-9" />
        </View>

        <Text className="font-headline text-[22px] text-white leading-7" numberOfLines={2}>
          {course?.title}
        </Text>

        <View className="flex-row items-center mt-3">
          {lecturerCount > 0 ? (
            <View className="flex-row -space-x-2 mr-3">
              {[...Array(Math.min(lecturerCount, 3))].map((_, i) => (
                <View key={i} className="w-7 h-7 rounded-full bg-white/25 border-2 border-primary items-center justify-center">
                  <Text className="font-body-bold text-[10px] text-white">
                    {course?.lecturers?.[i]?.charAt(0) ?? '?'}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text className="font-body-medium text-[12px] text-white/80">
            {lecturerCount > 0
              ? `${lecturerCount} Lecturer${lecturerCount > 1 ? 's' : ''}`
              : 'Course'}
          </Text>
        </View>

        <View className="mt-4">
          <View className="flex-row justify-between mb-1.5">
            <Text className="font-body-medium text-[12px] text-white/80">Overall progress</Text>
            <Text className="font-body-bold text-[12px] text-white">{progress}%</Text>
          </View>
          <View className="h-2 rounded-pill bg-white/20 overflow-hidden">
            <View className="h-full rounded-pill bg-white" style={{ width: `${progress}%` }} />
          </View>
        </View>
      </View>

      <FlatList
        data={weeks}
        keyExtractor={(item) => item.id}
        renderItem={renderWeek}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="font-headline text-[18px] text-text-primary mb-4">Course weeks</Text>
        }
        ListEmptyComponent={
          <View className="items-center py-16 px-10">
            <View className="w-20 h-20 rounded-pill bg-primary-light items-center justify-center mb-4">
              <FontAwesome5 name="calendar-week" size={26} color="#00895A" />
            </View>
            <Text className="font-headline text-[18px] text-text-primary mb-2">No weeks yet</Text>
            <Text className="font-body text-[14px] text-muted text-center leading-5">
              Course content hasn't been published yet. Check back soon.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default CoursePage;