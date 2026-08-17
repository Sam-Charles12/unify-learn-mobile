import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { LecturerNavigatorParamList } from '@/navigation/types';
import { cn } from '@/lib/utils';

type NavigationProp = NativeStackNavigationProp<LecturerNavigatorParamList>;
type WorkspaceRouteProp = RouteProp<LecturerNavigatorParamList, 'LecturerCourseWorkspace'>;

interface CourseDoc {
  id: string;
  code: string;
  title: string;
  tutors?: string[];
  levels?: string[];
}

const LecturerCourseWorkspace: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WorkspaceRouteProp>();
  const { courseId } = route.params;
  const { user } = useAuth();

  const [course, setCourse] = useState<CourseDoc | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'courses', courseId));
        if (snap.exists()) {
          setCourse({ id: snap.id, ...snap.data() } as CourseDoc);
        }
      } catch (e) {
        console.warn('Failed to load course workspace:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const handlePost = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing details', 'Give your announcement a title and a message.');
      return;
    }
    if (!user) return;

    setPosting(true);
    try {
      const weekNum = weekNumber.trim() ? parseInt(weekNumber, 10) : undefined;
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        body: body.trim(),
        scope: 'course',
        courseId,
        courseCode: course?.code,
        weekNumber: weekNum && !isNaN(weekNum) ? weekNum : undefined,
        lecturerName: user.displayName ?? 'Lecturer',
        senderName: user.displayName ?? 'Lecturer',
        senderRole: 'lecturer',
        lecturerId: user.uid,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Posted', 'Your announcement is now visible to students.');
      setTitle('');
      setBody('');
      setWeekNumber('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to post announcement.');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#005B96" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="bg-accent rounded-b-[28px] px-6 pt-4 pb-8 shadow-soft">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
            </Pressable>
            <Text className="font-body-bold text-white text-[15px]">Course Workspace</Text>
            <View className="w-9" />
          </View>
          <Text className="font-headline text-[22px] text-white leading-7">
            {course?.code} — {course?.title}
          </Text>
          <Text className="font-body text-[13px] text-white/75 mt-1">
            Post announcements for your students
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="bg-card rounded-[24px] border border-border p-5 shadow-soft">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-[14px] bg-primary-light items-center justify-center mr-3">
                <FontAwesome5 name="bullhorn" size={15} color="#00895A" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-[16px] text-text-primary">New announcement</Text>
                <Text className="font-body text-[12px] text-muted">
                  Students see this in their notifications instantly
                </Text>
              </View>
            </View>

            <Text className="font-body-medium text-[13px] text-text-secondary mb-2">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Assignment deadline moved"
              placeholderTextColor="#8A817C"
              className="bg-soft rounded-pill px-4 py-3.5 font-body-medium text-[15px] text-text-primary mb-4"
            />

            <Text className="font-body-medium text-[13px] text-text-secondary mb-2">Message</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write the announcement for your students…"
              placeholderTextColor="#8A817C"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="bg-soft rounded-[16px] px-4 py-3.5 font-body-medium text-[15px] text-text-primary min-h-[110px] mb-4"
            />

            <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
              Week number (optional)
            </Text>
            <TextInput
              value={weekNumber}
              onChangeText={setWeekNumber}
              placeholder="e.g. 2"
              placeholderTextColor="#8A817C"
              keyboardType="numeric"
              className="bg-soft rounded-pill px-4 py-3.5 font-body-medium text-[15px] text-text-primary mb-5"
            />

            <Pressable
              onPress={handlePost}
              disabled={posting}
              className={cn('rounded-pill py-4 items-center', posting ? 'bg-border' : 'bg-accent')}
            >
              {posting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-body-semibold text-[15px] text-white">Post announcement</Text>
              )}
            </Pressable>
          </View>

          {course?.tutors && course.tutors.length > 0 && (
            <View className="mt-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
              <Text className="font-headline text-[16px] text-text-primary mb-3">
                Tutors ({course.tutors.length})
              </Text>
              {course.tutors.map((tutorId, i) => (
                <View key={tutorId} className="flex-row items-center py-2.5 border-b border-divider/50 last:border-0">
                  <View className="w-10 h-10 rounded-pill bg-accent-light items-center justify-center mr-3">
                    <FontAwesome5 name="user-graduate" size={14} color="#005B96" />
                  </View>
                  <Text className="flex-1 font-body-medium text-[14px] text-text-primary">
                    {i + 1}. {tutorId}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LecturerCourseWorkspace;