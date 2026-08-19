import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/navigation/types';
import ContentBlockRenderer, { Block } from '@/components/week/ContentBlockRenderer';
import { Button } from '@/components/ui/button';
import { logEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type WeekRouteProp = RouteProp<RootStackParamList, 'Week'>;

interface WeekDoc {
  id: string;
  weekNumber: number;
  title: string;
  contentBlocks?: Block[];
}

const WeekPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WeekRouteProp>();
  const { courseId, weekId } = route.params;
  const { user } = useAuth();

  const [week, setWeek] = useState<WeekDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [passed, setPassed] = useState(false);
  const [passBanner, setPassBanner] = useState(false);
  const scroll80Logged = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'courses', courseId, 'weeks', weekId));
        if (snap.exists()) {
          setWeek({ id: snap.id, ...snap.data() } as WeekDoc);
        }
      } catch (e) {
        console.warn('Failed to load week:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, weekId]);

  useEffect(() => {
    if (week) {
      logEvent(ANALYTICS_EVENTS.weekOpen, { courseId, weekId, weekNumber: week.weekNumber });
    }
  }, [week, courseId, weekId]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (scroll80Logged.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0 && contentOffset.y / maxScroll >= 0.8) {
      scroll80Logged.current = true;
      logEvent(ANALYTICS_EVENTS.blockScroll80, { courseId, weekId });
    }
  };

  const handlePass = async () => {
    if (!user || !week) return;
    await setDoc(
      doc(db, 'users', user.uid, 'progress', courseId),
      {
        completedWeeks: arrayUnion(week.weekNumber),
        lastAccessed: serverTimestamp(),
      },
      { merge: true }
    );
    logEvent(ANALYTICS_EVENTS.weekUnlocked, {
      courseId,
      weekNumber: week.weekNumber,
      nextWeekNumber: week.weekNumber + 1,
    });
    setPassed(true);
    setPassBanner(true);
    setTimeout(() => setPassBanner(false), 6000);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#059669" />
        <Text className="font-body text-[13px] text-muted mt-2">Loading lesson notes...</Text>
      </SafeAreaView>
    );
  }

  if (!week) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8" edges={['top']}>
        <Text className="font-headline text-[18px] text-text-primary mb-2">Week Not Found</Text>
        <Button variant="default" size="sm" onPress={() => navigation.goBack()}>
          Return to Course
        </Button>
      </SafeAreaView>
    );
  }

  const blocks = Array.isArray(week.contentBlocks) ? week.contentBlocks : [];
  const blockCount = blocks.length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Top Header — Display Typography */}
      <View className="px-6 pt-3 pb-5">
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
            <Text className="font-body-bold text-[12px] text-primary-dark">
              Week {week.weekNumber}
            </Text>
          </View>
          <View className="w-11" />
        </View>

        <Text className="font-headline text-[26px] text-text-primary leading-[32px] tracking-tight" numberOfLines={2}>
          {week.title}
        </Text>
        <Text className="font-body text-[13px] text-muted mt-2">
          {blockCount} interactive section{blockCount === 1 ? '' : 's'} in this module
        </Text>
      </View>

      {/* Completion Pass Banner */}
      {passBanner && (
        <View
          className="mx-5 mb-3 rounded-2xl p-4 flex-row items-center"
          style={{
            backgroundColor: '#E8F0EC',
            borderWidth: 1,
            borderColor: '#A7F3D0',
            shadowColor: '#059669',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <View className="w-11 h-11 rounded-xl bg-primary items-center justify-center mr-3.5">
            <FontAwesome5 name="award" size={17} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="font-headline text-[15px] text-primary-dark">
              Week {week.weekNumber} Completed! (+10 pts)
            </Text>
            <Text className="font-body text-[13px] text-primary-dark mt-0.5">
              Week {week.weekNumber + 1} syllabus has now been unlocked.
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={blocks}
        keyExtractor={(_, index) => `${week.id}-${index}`}
        renderItem={({ item }) => (
          <ContentBlockRenderer block={item} onPass={handlePass} weekNumber={week.weekNumber} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        ListFooterComponent={
          passed ? (
            <View
              className="mt-6 rounded-3xl p-6 items-center"
              style={{
                backgroundColor: 'rgba(255,255,255,0.82)',
                borderWidth: 1,
                borderColor: '#A7F3D0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 6,
              }}
            >
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                style={{ backgroundColor: '#E8F0EC' }}
              >
                <FontAwesome5 name="check-double" size={20} color="#059669" />
              </View>
              <Text className="font-headline text-[18px] text-text-primary">Week Completed</Text>
              <Text className="font-body text-[13px] text-text-secondary mt-1.5 text-center leading-5">
                Your progress has been recorded. You can proceed to Week {week.weekNumber + 1}.
              </Text>
              <Button
                variant="default"
                size="default"
                className="mt-4 w-full"
                onPress={() => navigation.goBack()}
              >
                Back to Course Syllabus
              </Button>
            </View>
          ) : (
            <View className="mt-8 items-center px-4">
              <Text className="font-body text-[12px] text-muted text-center leading-5">
                Complete the End of Week Quiz at the bottom to verify comprehension and unlock Week {week.weekNumber + 1}.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default WeekPage;