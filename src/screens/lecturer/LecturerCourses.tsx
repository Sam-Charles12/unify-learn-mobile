import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { LecturerNavigatorParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<LecturerNavigatorParamList>;

interface Course {
  id: string;
  code: string;
  title: string;
  departments?: string[];
  levels?: string[];
}

const LecturerCourses: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'courses'), where('lecturers', 'array-contains', user.uid))
        );
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Course)
          .sort((a, b) => a.code.localeCompare(b.code));
        setCourses(list);
      } catch (e) {
        console.warn('Failed to load lecturer courses:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const grouped: { level: string; items: Course[] }[] = [];
  const levelOrder = ['100', '200', '300', '400', '500'];
  for (const course of courses) {
    const level = (course.levels?.[0] ?? '300').toString();
    const group = grouped.find((g) => g.level === level);
    if (group) group.items.push(course);
    else grouped.push({ level, items: [course] });
  }
  grouped.sort(
    (a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-3 pb-5 bg-surface border-b border-border">
        <View className="flex-row items-center justify-between mb-2">
          <View className="bg-primary-light px-3 py-1 rounded-full border border-primary-border">
            <Text className="font-body-bold text-[12px] text-primary-dark">
              LASU Engineering
            </Text>
          </View>
        </View>
        <Text className="font-headline text-[24px] text-text-primary leading-8">
          Assigned Courses
        </Text>
        <Text className="font-body text-[13px] text-text-secondary mt-0.5">
          {courses.length} curriculum course{courses.length === 1 ? '' : 's'} under your management
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="font-body text-[13px] text-muted mt-2">Loading assigned courses...</Text>
        </View>
      ) : courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-2xl bg-soft border border-border items-center justify-center mb-3">
            <FontAwesome5 name="chalkboard-teacher" size={24} color="#94A3B8" />
          </View>
          <Text className="font-headline text-[18px] text-text-primary mb-1 text-center">
            No Assigned Courses
          </Text>
          <Text className="font-body text-[13px] text-muted text-center">
            Courses assigned to your faculty profile by the department will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.level}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View className="mb-5">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-lg bg-primary-light border border-primary-border items-center justify-center mr-2">
                  <Text className="font-headline text-[13px] text-primary-dark">
                    L{group.level}
                  </Text>
                </View>
                <Text className="font-headline text-[16px] text-text-primary">
                  {group.level} Level Modules
                </Text>
              </View>
              {group.items.map((course) => (
                <Pressable
                  key={course.id}
                  onPress={() =>
                    navigation.navigate('LecturerCourseWorkspace', { courseId: course.id })
                  }
                  className="bg-surface rounded-2xl border border-border p-4 shadow-card mb-3 active:bg-soft"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className="w-11 h-11 rounded-xl bg-accent-light border border-accent-border items-center justify-center mr-3">
                        <FontAwesome5 name="book-open" size={15} color="#4F46E5" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-body-bold text-[15px] text-primary-dark">
                          {course.code}
                        </Text>
                        <Text className="font-body-medium text-[13px] text-text-primary mt-0.5" numberOfLines={1}>
                          {course.title}
                        </Text>
                      </View>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-soft items-center justify-center">
                      <FontAwesome5 name="chevron-right" size={11} color="#0F172A" />
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default LecturerCourses;