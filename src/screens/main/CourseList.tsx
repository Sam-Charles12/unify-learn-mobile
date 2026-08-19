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

const PASTEL_CARDS = [
  { bg: '#E8F0EC', border: '#C8DDCF', text: '#047857', icon: '#059669' }, // Sage
  { bg: '#ECEAF4', border: '#D5D2E8', text: '#6D28D9', icon: '#7C3AED' }, // Lavender
  { bg: '#E4EDF6', border: '#C8D9EA', text: '#1D4ED8', icon: '#2563EB' }, // Sky
  { bg: '#F4E9DE', border: '#E2D4C4', text: '#B45309', icon: '#D97706' }, // Cream
  { bg: '#F5EAEA', border: '#E5D0D0', text: '#BE123C', icon: '#E11D48' }, // Blush
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

      let matchedCourses: Course[] = [];

      if (profile?.enrolledCourses && Array.isArray(profile.enrolledCourses) && profile.enrolledCourses.length > 0) {
        matchedCourses = allCourses.filter((c) =>
          profile.enrolledCourses!.includes(c.id) || profile.enrolledCourses!.includes(c.code)
        );
      } else if (profile?.department) {
        const userDept = profile.department.toLowerCase().trim();
        matchedCourses = allCourses.filter((c) => {
          if (!c.departments || !Array.isArray(c.departments) || c.departments.length === 0) return false;
          const matchDept = c.departments.some(
            (d) => String(d).toLowerCase().trim() === userDept || String(d).toLowerCase().includes(userDept)
          );
          const matchLvl = !profile?.level || !c.levels || !Array.isArray(c.levels) || c.levels.map(String).includes(String(profile.level).trim());
          return matchDept && matchLvl;
        });
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
  }, [profile?.department, profile?.level, profile?.enrolledCourses, profileLoading]);

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
    const scheme = PASTEL_CARDS[index % PASTEL_CARDS.length];

    return (
      <Pressable
        onPress={() => navigation.navigate('Course', { courseId: item.id })}
        className="mb-4"
      >
        <View
          className="rounded-3xl p-5 active:opacity-90"
          style={{
            backgroundColor: scheme.bg,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.04,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: scheme.border }}
              >
                <Text style={{ color: scheme.text }} className="font-body-bold text-[12px]">
                  {item.code}
                </Text>
              </View>
              {item.credits ? (
                <Text className="font-body-medium text-[12px] text-text-secondary">
                  • {item.credits} Units
                </Text>
              ) : null}
            </View>

            {item.lecturers && item.lecturers.length > 0 ? (
              <LecturerAvatarStack lecturerIds={item.lecturers} />
            ) : null}
          </View>

          <Text className="font-headline text-[18px] text-text-primary leading-7 mb-3">
            {item.title}
          </Text>

          <View className="flex-row items-center justify-between pt-3" style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.5)' }}>
            <Text className="font-body text-[12px] text-text-secondary">
              {lecturerCount > 0
                ? `${lecturerCount} Lecturer${lecturerCount > 1 ? 's' : ''}`
                : 'Faculty Course'}
            </Text>
            <View className="flex-row items-center">
              <Text className="font-body-bold text-[12px] text-text-primary mr-1.5">
                Open Syllabus
              </Text>
              <FontAwesome5 name="arrow-right" size={10} color="#1A1A1A" />
            </View>
          </View>
        </View>
      </Pressable>
    );
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
          <View className="bg-pastel-sage px-3.5 py-1.5 rounded-full">
            <Text className="font-body-bold text-[11px] text-primary-dark">
              LASU Engineering
            </Text>
          </View>
          <View className="w-11" />
        </View>

        <Text className="font-headline text-[28px] text-text-primary leading-[34px] tracking-tight">
          Syllabus &{'\n'}Modules
        </Text>
        <Text className="font-body text-[14px] text-text-secondary mt-2">
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
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: '#ECEAF4' }}
          >
            <FontAwesome5 name="book-open" size={24} color="#7C3AED" />
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
            className="bg-primary px-6 py-4 rounded-2xl active:bg-primary-dark mb-3"
            style={{
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 6,
            }}
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 100 }}
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