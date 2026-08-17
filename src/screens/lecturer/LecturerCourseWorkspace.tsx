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
import { Button } from '@/components/ui/button';

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
      Alert.alert('Incomplete Form', 'Please provide both a title and message for your announcement.');
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
        lecturerName: user.displayName ?? 'Course Lecturer',
        senderName: user.displayName ?? 'Course Lecturer',
        senderRole: 'lecturer',
        lecturerId: user.uid,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Broadcast Sent', 'Announcement published and notification pushed to enrolled students.');
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
        <ActivityIndicator size="large" color="#059669" />
        <Text className="font-body text-[13px] text-muted mt-2">Loading course workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-5 pt-3 pb-5 bg-surface border-b border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
            >
              <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
            </Pressable>
            <View className="bg-primary-light px-3 py-1 rounded-full border border-primary-border">
              <Text className="font-body-bold text-[12px] text-primary-dark">
                {course?.code}
              </Text>
            </View>
            <View className="w-10" />
          </View>
          <Text className="font-headline text-[22px] text-text-primary leading-7" numberOfLines={2}>
            {course?.title}
          </Text>
          <Text className="font-body text-[13px] text-text-secondary mt-0.5">
            Faculty Course Management & Student Broadcasts
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="bg-surface rounded-2xl border border-border p-5 shadow-card">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-xl bg-primary-light border border-primary-border items-center justify-center mr-3">
                <FontAwesome5 name="bullhorn" size={15} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="font-headline text-[16px] text-text-primary">Post Announcement</Text>
                <Text className="font-body text-[12px] text-muted">
                  Instant push broadcast to all registered students
                </Text>
              </View>
            </View>

            <Text className="font-body-semibold text-[13px] text-text-primary mb-1.5">Announcement Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Assignment deadline rescheduled"
              placeholderTextColor="#94A3B8"
              className="bg-surface rounded-xl px-4 py-3 font-body text-[15px] text-text-primary border border-border mb-4"
            />

            <Text className="font-body-semibold text-[13px] text-text-primary mb-1.5">Announcement Message</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Provide full instructions or academic notices..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="bg-surface rounded-xl px-4 py-3 font-body text-[15px] text-text-primary border border-border min-h-[110px] mb-4"
            />

            <Text className="font-body-semibold text-[13px] text-text-primary mb-1.5">
              Specific Week Number (Optional)
            </Text>
            <TextInput
              value={weekNumber}
              onChangeText={setWeekNumber}
              placeholder="e.g. 4"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              className="bg-surface rounded-xl px-4 py-3 font-body text-[15px] text-text-primary border border-border mb-5"
            />

            <Button
              variant="default"
              size="lg"
              loading={posting}
              onPress={handlePost}
            >
              Broadcast Announcement
            </Button>
          </View>

          {course?.tutors && course.tutors.length > 0 && (
            <View className="mt-4 bg-surface rounded-2xl border border-border p-5 shadow-card">
              <Text className="font-headline text-[15px] text-text-primary mb-3">
                Assigned Course Tutors ({course.tutors.length})
              </Text>
              {course.tutors.map((tutorId, i) => (
                <View key={tutorId} className="flex-row items-center py-2.5 border-b border-divider last:border-0">
                  <View className="w-9 h-9 rounded-xl bg-accent-light border border-accent-border items-center justify-center mr-3">
                    <FontAwesome5 name="user-graduate" size={13} color="#4F46E5" />
                  </View>
                  <Text className="flex-1 font-body-semibold text-[13px] text-text-primary">
                    Tutor #{i + 1}: {tutorId}
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