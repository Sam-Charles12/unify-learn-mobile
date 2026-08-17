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

  const renderCourse = ({ item }: { item: Course }) => {
    const lecturerCount = item.lecturers?.length ?? 0;

    return (
      <Pressable
        onPress={() => navigation.navigate('Course', { courseId: item.id })}
        className="mb-3"
      >
        <View className="bg-surface rounded-2xl border border-border p-5 shadow-card active:bg-soft">
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="bg-primary-light px-3 py-1 rounded-full border border-primary-border">
                <Text className="font-body-bold text-[13px] text-primary-dark">
                  {item.code}
                </Text>
              </View>
              {item.credits ? (
                <View className="bg-soft px-2.5 py-1 rounded-full border border-border">
                  <Text className="font-body-medium text-[11px] text-text-secondary">
                    {item.credits} Units
                  </Text>
                </View>
              ) : null}
            </View>

            {item.lecturers && item.lecturers.length > 0 ? (
              <View className="flex-row items-center gap-1.5">
                <LecturerAvatarStack lecturerIds={item.lecturers} />
              </View>
            ) : null}
          </View>

          <Text className="font-headline text-[17px] text-text-primary leading-6 mb-2">
            {item.title}
          </Text>

          <View className="flex-row items-center justify-between pt-2 border-t border-divider">
            <Text className="font-body-medium text-[12px] text-muted">
              {lecturerCount > 0
                ? `${lecturerCount} Assigned Lecturer${lecturerCount > 1 ? 's' : ''}`
                : 'Faculty Course'}
            </Text>
            <View className="flex-row items-center">
              <Text className="font-body-bold text-[12px] text-primary-dark mr-1.5">
                Start Week
              </Text>
              <FontAwesome5 name="arrow-right" size={10} color="#059669" />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-3 pb-5 bg-surface border-b border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
          >
            <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
          </Pressable>
          <Text className="font-body-bold text-text-primary text-[16px]">Enrolled Courses</Text>
          <View className="w-10" />
        </View>

        <Text className="font-headline text-[24px] text-text-primary leading-8">
          Faculty Syllabus
        </Text>
        <Text className="font-body text-[13px] text-text-secondary mt-0.5">
          {profile?.department
            ? `${profile.department.toUpperCase()} • Level ${profile.level ?? ''}`
            : 'Department Curriculum'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="font-body text-[13px] text-muted mt-2">Loading courses...</Text>
        </View>
      ) : indexError ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-2xl bg-rose-bg border border-rose-border items-center justify-center mb-4">
            <FontAwesome5 name="database" size={24} color="#E11D48" />
          </View>
          <Text className="font-headline text-[18px] text-text-primary mb-2 text-center">
            Database Index Required
          </Text>
          <Text className="font-body text-[13px] text-text-secondary text-center leading-5">
            Firestore composite index is building for this query. Pull down to refresh in a moment.
          </Text>
        </View>
      ) : courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-2xl bg-primary-light border border-primary-border items-center justify-center mb-4">
            <FontAwesome5 name="book-open" size={24} color="#059669" />
          </View>
          <Text className="font-headline text-[18px] text-text-primary mb-1 text-center">
            No Published Courses
          </Text>
          <Text className="font-body text-[13px] text-text-secondary text-center leading-5">
            Weekly modules for your department will appear here as lecturers publish them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
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