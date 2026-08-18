import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RootStackParamList } from '@/navigation/types';
import LecturerAvatarStack from '@/components/week/LecturerAvatarStack';
import { seedSampleCourses } from '@/lib/seedCourses';

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
  const { profile, loading: profileLoading } = useUserProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchCourses = async () => {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      const allCourses = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));

      let matchedCourses = allCourses;

      if (profile?.department) {
        const userDept = profile.department.toLowerCase().trim();
        const deptMatches = allCourses.filter((c) => {
          if (!c.departments || !Array.isArray(c.departments) || c.departments.length === 0) {
            return true;
          }
          return c.departments.some(
            (d) => String(d).toLowerCase().trim() === userDept || String(d).toLowerCase().includes(userDept)
          );
        });

        if (deptMatches.length > 0) {
          matchedCourses = deptMatches;
        }

        if (profile?.level) {
          const userLevel = String(profile.level).trim();
          const levelMatches = matchedCourses.filter((c) => {
            if (!c.levels || !Array.isArray(c.levels) || c.levels.length === 0) return true;
            return c.levels.map((l) => String(l).trim()).includes(userLevel);
          });
          if (levelMatches.length > 0) {
            matchedCourses = levelMatches;
          }
        }
      }

      setCourses(matchedCourses);
    } catch (e: any) {
      console.warn('Failed to load courses:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!profileLoading) {
      fetchCourses();
    }
  }, [profile?.department, profile?.level, profileLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const handleSeed = async () => {
    setSeeding(true);
    const ok = await seedSampleCourses();
    setSeeding(false);
    if (ok) {
      Alert.alert('Sample Syllabus Added', 'Sample LASU Engineering courses and weekly modules have been loaded.');
      fetchCourses();
    } else {
      Alert.alert('Notice', 'Could not add sample courses. Please check your internet connection or Firestore permissions.');
    }
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
      ) : courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-2xl bg-soft border border-border items-center justify-center mb-4">
            <FontAwesome5 name="book-open" size={24} color="#71717A" />
          </View>
          <Text className="font-headline text-[18px] text-text-primary mb-1 text-center">
            No Courses Found
          </Text>
          <Text className="font-body text-[13px] text-muted text-center leading-5 mb-5">
            Your Firestore database does not have courses matching your department ({profile?.department?.toUpperCase() || 'General'}) yet.
          </Text>
          
          <Pressable
            onPress={handleSeed}
            disabled={seeding}
            className="bg-primary px-6 py-3.5 rounded-xl active:bg-primary-dark shadow-soft mb-3"
          >
            {seeding ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="font-body-bold text-[14px] text-white">
                Load Sample Engineering Courses
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={onRefresh}
            className="py-2"
          >
            <Text className="font-body-semibold text-[13px] text-text-secondary">Pull to Refresh</Text>
          </Pressable>
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