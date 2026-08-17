import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/navigation/types';
import ContentBlockRenderer, { Block } from '@/components/week/ContentBlockRenderer';

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
    setPassed(true);
    setPassBanner(true);
    setTimeout(() => setPassBanner(false), 6000);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#00A86B" />
      </SafeAreaView>
    );
  }

  if (!week) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-10" edges={['top']}>
        <Text className="font-headline text-[18px] text-text-primary">Week not found</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4 bg-primary rounded-pill px-6 py-3">
          <Text className="font-body-semibold text-[14px] text-white">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const blocks = Array.isArray(week.contentBlocks) ? week.contentBlocks : [];
  const blockCount = blocks.length;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="bg-primary rounded-b-[28px] px-6 pt-4 pb-8 shadow-soft">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
            <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
          </Pressable>
          <View className="flex-row items-center">
            <Text className="font-body-bold text-white text-[15px]">Week {week.weekNumber}</Text>
          </View>
          <View className="w-9" />
        </View>
        <Text className="font-headline text-[22px] text-white leading-7" numberOfLines={2}>
          {week.title}
        </Text>
        <Text className="font-body-medium text-[12px] text-white/75 mt-1.5">
          {blockCount} section{blockCount === 1 ? '' : 's'}
        </Text>
      </View>

      {passBanner && (
        <View className="mx-5 mt-4 bg-primary-light border border-primary rounded-[16px] p-4 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
            <FontAwesome5 name="unlock" size={15} color="#ffffff" />
          </View>
          <View className="flex-1">
            <Text className="font-headline text-[15px] text-primary-dark">
              Week {week.weekNumber} Complete!
            </Text>
            <Text className="font-body-medium text-[13px] text-primary-dark mt-0.5">
              Week {week.weekNumber + 1} has been unlocked.
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
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          passed ? (
            <View className="mt-6 bg-primary rounded-[20px] p-5 items-center">
              <View className="w-12 h-12 rounded-full bg-white/15 items-center justify-center mb-2.5">
                <FontAwesome5 name="check-double" size={18} color="#ffffff" />
              </View>
              <Text className="font-headline text-[17px] text-white">Week complete</Text>
              <Text className="font-body text-[13px] text-white/80 mt-1 text-center leading-5">
                Your progress has been saved. Week {week.weekNumber + 1} is unlocked.
              </Text>
              <Pressable
                onPress={() => navigation.goBack()}
                className="mt-4 bg-white rounded-pill px-7 py-3"
              >
                <Text className="font-body-semibold text-[14px] text-primary-dark">
                  Back to course
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-8 items-center">
              <Text className="font-body-medium text-[12px] text-muted text-center leading-5">
                Finish the End of Week Quiz to unlock the next week.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default WeekPage;