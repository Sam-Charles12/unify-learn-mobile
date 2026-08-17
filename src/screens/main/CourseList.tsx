import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RootStackParamList } from '@/navigation/types';
import LecturerAvatarStack from '@/components/week/LecturerAvatarStack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Course {
  id: string;
  code: string;
  title: string;
  lecturers?: string[];
  tutors?: string[];
  credits?: number;
  departments?: string[];
  levels?: string[];
}

const COURSE_COLOR_SCHEMES = [
  { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', icon: '#2563EB' }, // Cobalt
  { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', icon: '#059669' }, // Emerald
  { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', icon: '#7C3AED' }, // Violet
  { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', icon: '#D97706' }, // Amber
  { bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E', icon: '#0D9488' }, // Teal
];

const CourseList: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { profile } = useUserProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [indexError, setIndexError] = useState(false);

  const fetchCourses = async () => {
    if (!profile?.department || !profile?.level) return;
    try {
      const q = query(
        collection(db, 'courses'),
        where('departments', 'array-contains', profile.department)
      );
      const snap = await getDocs(q);
      const filtered = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Course))
        .filter((c) => !Array.isArray(c.levels) || c.levels.includes(profile.level ?? ''));
      setCourses(filtered);
    } catch (e: any) {
      if (e?.code === 'failed-precondition' && String(e?.message ?? '').includes('index')) {
        setIndexError(true);
      } else {
        console.warn('Failed to load courses:', e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (profile?.department && profile?.level) {
      fetchCourses();
    }
  }, [profile?.department, profile?.level]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const renderCourse = ({ item, index }: { item: Course; index: number }) => {
    const lecturerCount = item.lecturers?.length ?? 0;
    const scheme = COURSE_COLOR_SCHEMES[index % COURSE_COLOR_SCHEMES.length];

    return (
      <Pressable
        onPress={() => navigation.navigate('Course', { courseId: item.id })}
        className="mb-4"
      >
        <View className="bg-surface rounded-2xl border border-border/80 p-5 shadow-soft active:bg-soft">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center gap-2">
              <View
                style={{ backgroundColor: scheme.bg, borderColor: scheme.border }}
                className="px-3 py-1 rounded-full border"
              >
                <Text style={{ color: scheme.text }} className="font-body-bold text-[12px]">
                  {item.code}
                </Text>
              </View>
              {item.credits ? (
                <Text className="font-body-medium text-[12px] text-muted">
                  • {item.credits} Units
                </Text>
              ) : null}
            </View>

            {item.lecturers && item.lecturers.length > 0 ? (
              <LecturerAvatarStack lecturerIds={item.lecturers} />
            ) : null}
          </View>

          <Text className="font-headline text-[17px] text-text-primary leading-6 mb-3">
            {item.title}
          </Text>

          <View className="flex-row items-center justify-between pt-3 border-t border-divider">
            <Text className="font-body text-[12px] text-muted">
              {lecturerCount > 0
                ? `${lecturerCount} Lecturer${lecturerCount > 1 ? 's' : ''}`
                : 'Faculty Course'}
            </Text>
            <View className="flex-row items-center">
              <Text className="font-body-bold text-[12px] text-text-primary mr-1.5">
                Open Syllabus
              </Text>
              <FontAwesome5 name="arrow-right" size={10} color="#09090B" />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Spacious Header */}
      <View className="px-6 pt-4 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center shadow-soft active:bg-soft"
          >
            <FontAwesome5 name="chevron-left" size={14} color="#09090B" />
          </Pressable>
          <View className="bg-primary-light px-3 py-1 rounded-full border border-primary-border">
            <Text className="font-body-bold text-[11px] text-primary-dark">
              LASU Engineering
            </Text>
          </View>
          <View className="w-10" />
        </View>

        <Text className="font-headline text-[26px] text-text-primary leading-8 tracking-tight">
          Syllabus & Modules
        </Text>
        <Text className="font-body text-[14px] text-text-secondary mt-1">
          {profile?.department
            ? `${profile.department.toUpperCase()} • Level ${profile.level ?? ''}`
            : 'Department Curriculum'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#059669" />
        </View>
      ) : indexError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-headline text-[18px] text-text-primary mb-2 text-center">
            Database Index Building
          </Text>
          <Text className="font-body text-[13px] text-text-secondary text-center leading-5">
            Pull down to refresh in a moment.
          </Text>
        </View>
      ) : courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-headline text-[18px] text-text-primary mb-1 text-center">
            No Published Courses
          </Text>
          <Text className="font-body text-[13px] text-muted text-center">
            Weekly modules will appear here as lecturers publish them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CourseList;