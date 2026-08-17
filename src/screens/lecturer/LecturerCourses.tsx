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
      <View className="bg-accent rounded-b-[28px] px-6 pt-4 pb-8 shadow-soft">
        <View className="flex-row items-center justify-between mb-3">
          <View className="w-9" />
          <Text className="font-body-bold text-white text-[15px]">My Courses</Text>
          <View className="w-9" />
        </View>
        <Text className="font-headline text-[22px] text-white leading-7">
          Faculty of Engineering
        </Text>
        <Text className="font-body text-[13px] text-white/75 mt-1">
          {courses.length} course{courses.length === 1 ? '' : 's'} assigned to you
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#005B96" />
        </View>
      ) : courses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 rounded-pill bg-accent-light items-center justify-center mb-4">
            <FontAwesome5 name="chalkboard-teacher" size={26} color="#005B96" />
          </View>
          <Text className="font-headline text-[20px] text-text-primary mb-2 text-center">
            No courses assigned
          </Text>
          <Text className="font-body text-[14px] text-muted text-center leading-5">
            Courses you are assigned to will appear here once an admin adds them.
          </Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.level}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: group }) => (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="w-8 h-8 rounded-[10px] bg-primary-light items-center justify-center mr-2">
                  <Text className="font-headline text-[13px] text-primary-dark">
                    L{group.level}
                  </Text>
                </View>
                <Text className="font-headline text-[16px] text-text-primary">
                  {group.level} Level
                </Text>
              </View>
              {group.items.map((course) => (
                <Pressable
                  key={course.id}
                  onPress={() =>
                    navigation.navigate('LecturerCourseWorkspace', { courseId: course.id })
                  }
                  className="bg-card rounded-[20px] border border-border p-4 shadow-soft mb-3"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-[16px] bg-accent-light items-center justify-center mr-3">
                      <FontAwesome5 name="book-open" size={17} color="#005B96" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-body-bold text-[15px] text-primary-dark">
                        {course.code}
                      </Text>
                      <Text className="font-body-medium text-[13px] text-text-primary mt-0.5" numberOfLines={1}>
                        {course.title}
                      </Text>
                    </View>
                    <View className="w-8 h-8 rounded-full bg-accent items-center justify-center">
                      <FontAwesome5 name="chevron-right" size={12} color="#ffffff" />
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