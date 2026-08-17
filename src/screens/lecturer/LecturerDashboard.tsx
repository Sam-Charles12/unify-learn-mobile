import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { LecturerNavigatorParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<LecturerNavigatorParamList>;

const LecturerDashboard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [name, setName] = useState<string | null>(null);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [announcementCount, setAnnouncementCount] = useState<number | null>(null);
  const [todayClasses, setTodayClasses] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [lecturerSnap, courseSnap, annSnap, timetableSnap] = await Promise.all([
          getDoc(doc(db, 'lecturers', user.uid)),
          getDocs(query(collection(db, 'courses'), where('lecturers', 'array-contains', user.uid))),
          getDocs(collection(db, 'announcements')),
          getDocs(collection(db, 'timetable')),
        ]);

        if (lecturerSnap.exists()) {
          const data = lecturerSnap.data();
          setName(data.name ?? user.displayName ?? null);
          setAnnouncementCount(
            annSnap.docs.filter(
              (d) => d.data().lecturerId === user.uid || d.data().senderName === data.name
            ).length
          );
        } else {
          setAnnouncementCount(
            annSnap.docs.filter((d) => d.data().lecturerId === user.uid).length
          );
        }

        setCourseCount(courseSnap.size);

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setTodayClasses(
          timetableSnap.docs.filter(
            (d) => d.data().lecturerId === user.uid && d.data().day === today
          ).length
        );
      } catch (e) {
        console.warn('Failed to load lecturer dashboard:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const firstName = name?.split(' ')[0] ?? 'Lecturer';

  const stats = [
    { icon: 'book-open', label: 'My courses', value: courseCount, color: '#00895A', bg: '#CFF5E6' },
    { icon: 'bullhorn', label: 'Announcements', value: announcementCount, color: '#005B96', bg: '#DCEEFF' },
    { icon: 'chalkboard-teacher', label: "Today's classes", value: todayClasses, color: '#8B9658', bg: '#E5D45A' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0B6E8F', '#005B96']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-b-[28px] px-6 pt-4 pb-12"
        >
          <View className="flex-row items-center mb-5">
            <View className="w-11 h-11 rounded-[14px] bg-white items-center justify-center mr-3">
              <FontAwesome5 name="chalkboard-teacher" size={18} color="#005B96" />
            </View>
            <View>
              <Text className="font-headline text-[16px] text-white leading-5">Lecturer Hub</Text>
              <Text className="font-body text-[11px] text-white/70">Unify Learn</Text>
            </View>
          </View>

          <Text className="font-headline text-[26px] text-white leading-9">
            Hello, {firstName}
          </Text>
          <Text className="font-body text-[13px] text-white/75 mt-1">
            Manage your courses and reach your students
          </Text>
        </LinearGradient>

        <View className="-mt-7 mx-5 bg-card rounded-[24px] border border-border p-4 shadow-soft">
          {loading ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#005B96" />
            </View>
          ) : (
            <View className="flex-row justify-around">
              {stats.map((stat) => (
                <View key={stat.label} className="items-center">
                  <View style={{ backgroundColor: stat.bg }} className="w-11 h-11 rounded-[16px] items-center justify-center mb-1.5">
                    <FontAwesome5 name={stat.icon} size={14} color={stat.color} />
                  </View>
                  <Text className="font-headline text-[17px] text-text-primary">{stat.value ?? 0}</Text>
                  <Text className="font-body-medium text-[11px] text-muted">{stat.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="px-6 mt-7">
          <Text className="font-headline text-[18px] text-text-primary mb-1">Workspace</Text>
          <Text className="font-body text-[13px] text-muted mb-4">
            Quick access to your teaching tools.
          </Text>

          <Pressable
            onPress={() => navigation.navigate('LecturerCoursesTab')}
            className="bg-card rounded-[24px] border border-border p-5 shadow-soft mb-4"
          >
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-[18px] bg-accent-light items-center justify-center mr-4">
                <FontAwesome5 name="book-open" size={20} color="#005B96" />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-[16px] text-text-primary">My courses</Text>
                <Text className="font-body text-[12px] text-muted mt-0.5">
                  View courses and open their workspaces
                </Text>
              </View>
              <View className="w-9 h-9 rounded-full bg-accent items-center justify-center">
                <FontAwesome5 name="arrow-right" size={13} color="#ffffff" />
              </View>
            </View>
          </Pressable>

          <LinearGradient
            colors={['#00A86B', '#0E8A72']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-[24px] p-5 shadow-soft"
          >
            <Pressable onPress={() => navigation.navigate('LecturerCoursesTab')}>
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-[18px] bg-white/15 items-center justify-center mr-4">
                  <FontAwesome5 name="bullhorn" size={20} color="#ffffff" />
                </View>
                <View className="flex-1">
                  <Text className="font-body-semibold text-[16px] text-white">Post announcement</Text>
                  <Text className="font-body text-[12px] text-white/75 mt-0.5">
                    Notify students in your course
                  </Text>
                </View>
                <View className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
                  <FontAwesome5 name="arrow-right" size={13} color="#ffffff" />
                </View>
              </View>
            </Pressable>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LecturerDashboard;