import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RootStackParamList } from '@/navigation/types';
import { cn } from '@/lib/utils';

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

const CARD_THEMES = [
  { bg: '#CFF5E6', icon: 'book-open', color: '#00895A' },
  { bg: '#DCEEFF', icon: 'calculator', color: '#005B96' },
  { bg: '#E5D45A', icon: 'atom', color: '#8B9658' },
  { bg: '#E78B73', icon: 'flask', color: '#B45309' },
  { bg: '#B7D8F5', icon: 'cogs', color: '#005B96' },
  { bg: '#BFD9D2', icon: 'chart-pie', color: '#00895A' },
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
    const theme = CARD_THEMES[index % CARD_THEMES.length];
    const lecturerCount = item.lecturers?.length ?? 0;

    return (
      <Pressable
        onPress={() => navigation.navigate('Course', { courseId: item.id })}
        className="mb-4"
        >
        <View className="bg-card rounded-lg border border-border p-5 shadow-soft">
          <View className="flex-row items-center">
            <View
              style={{ backgroundColor: theme.bg }}
              className="w-14 h-14 rounded-pill items-center justify-center mr-4"
            >
              <FontAwesome5 name={theme.icon} size={22} color={theme.color} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="font-body-bold text-[15px] text-primary-dark">
                  {item.code}
                </Text>
                {item.credits ? (
                  <View className="bg-background rounded-pill px-2 py-0.5">
                    <Text className="font-body-medium text-[11px] text-muted">
                      {item.credits} credits
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="font-body-medium text-[15px] text-text-primary" numberOfLines={1}>
                {item.title}
              </Text>
            </View>
            <View className="items-end">
              {lecturerCount > 0 ? (
                <View className="flex-row -space-x-2 mb-1">
                  {[...Array(Math.min(lecturerCount, 3))].map((_, i) => (
                    <View
                      key={i}
                      className="w-7 h-7 rounded-full bg-primary border-2 border-card items-center justify-center"
                    >
                      <Text className="font-body-bold text-[10px] text-white">
                        {item.lecturers?.[i]?.charAt(0) ?? '?'}
                      </Text>
                    </View>
                  ))}
                  {lecturerCount > 3 && (
                    <View className="w-7 h-7 rounded-full bg-surface border-2 border-card items-center justify-center">
                      <Text className="font-body-bold text-[10px] text-muted">
                        +{lecturerCount - 3}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}
              <Text className="font-body-medium text-[11px] text-muted">
                {lecturerCount > 0 ? `${lecturerCount} Lecturer${lecturerCount > 1 ? 's' : ''}` : ''}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="bg-primary rounded-b-[28px] px-6 pt-4 pb-8 shadow-soft">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
            <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
          </Pressable>
          <Text className="font-body-bold text-white text-[15px]">My Courses</Text>
          <View className="w-9" />
        </View>
        <Text className="font-headline text-[24px] text-white leading-8">
          {profile?.name?.split(' ')[0] ? `Hello, ${profile.name.split(' ')[0]}` : 'Hello'}
        </Text>
        <Text className="font-body text-[13px] text-white/75 mt-1">
          Courses for your {profile?.level ? `L${profile.level}` : ''} {profile?.department ? profile.department.toUpperCase() : ''} programme
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      ) : indexError ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 rounded-pill bg-[#FDE8E8] items-center justify-center mb-4">
            <FontAwesome5 name="database" size={26} color="#B91C1C" />
          </View>
          <Text className="font-headline text-[20px] text-text-primary mb-2 text-center">
            Database index needed
          </Text>
          <Text className="font-body text-[14px] text-muted text-center leading-5">
            Firestore needs a composite index for this query. In the Firebase console, go to
            Firestore Database → Indexes and create the suggested index, then pull to refresh.
          </Text>
        </View>
      ) : courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 rounded-pill bg-primary-light items-center justify-center mb-4">
            <FontAwesome5 name="book-open" size={28} color="#00895A" />
          </View>
          <Text className="font-headline text-[20px] text-text-primary mb-2 text-center">
            No courses yet
          </Text>
          <Text className="font-body text-[14px] text-muted text-center leading-5">
            Courses for your department and level will appear here once they're published.
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourse}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default CourseList;