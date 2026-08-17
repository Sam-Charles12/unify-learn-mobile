import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export interface TimetableEntry {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle?: string;
  day: string;
  startTime: string;
  endTime: string;
  classroom: string;
  lecturerId?: string;
  lecturerName?: string;
  department?: string;
  level?: number;
  faculty?: string;
  semester?: string;
  status?: 'scheduled' | 'cancelled' | 'rescheduled';
  cancellationNote?: string;
  expectedCount?: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')}${suffix}`;
};

const Timetable: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { profile } = useUserProfile();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dept = profile?.department;
    const lvl = profile?.level;
    if (!dept || !lvl) return;
    (async () => {
      try {
        const audience = `${dept.toLowerCase()}-${lvl}`;
        const snap = await getDocs(
          query(collection(db, 'timetable'), where('audience', '==', audience))
        );
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as TimetableEntry)
          .filter((e) => !e.semester || e.semester === 'first')
          .sort((a, b) => {
            const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
            if (dayDiff !== 0) return dayDiff;
            return a.startTime.localeCompare(b.startTime);
          });
        setEntries(list);
      } catch (e) {
        console.warn('Failed to load timetable:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.department, profile?.level]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayEntries = entries.filter((e) => e.day === today);
  const hasCancelledToday = todayEntries.some((e) => e.status === 'cancelled');

  const grouped = DAYS.map((day) => ({
    day,
    items: entries.filter((e) => e.day === day),
  }));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="bg-accent rounded-b-[28px] px-6 pt-4 pb-8 shadow-soft">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
            <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
          </Pressable>
          <Text className="font-body-bold text-white text-[15px]">Timetable</Text>
          <View className="w-9" />
        </View>
        <Text className="font-headline text-[22px] text-white leading-7">
          {profile?.department ? `${profile.department.toUpperCase()} — L${profile.level ?? ''}` : 'Weekly Schedule'}
        </Text>
        <Text className="font-body text-[13px] text-white/75 mt-1">
          First semester, Monday to Friday
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#005B96" />
        </View>
      ) : entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 rounded-pill bg-accent-light items-center justify-center mb-4">
            <FontAwesome5 name="calendar-alt" size={26} color="#005B96" />
          </View>
          <Text className="font-headline text-[20px] text-text-primary mb-2 text-center">
            No classes scheduled
          </Text>
          <Text className="font-body text-[14px] text-muted text-center leading-5">
            Your classes will appear here once the timetable is published.
          </Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.day}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            todayEntries.length > 0 ? (
              <View
                className={`rounded-[20px] p-4 mb-6 border ${
                  hasCancelledToday
                    ? 'bg-[#FDE8E8] border-[#DC2626]/30'
                    : 'bg-primary-light border-primary/20'
                }`}
              >
                <View className="flex-row items-center mb-1">
                  <FontAwesome5
                    name={hasCancelledToday ? 'exclamation-triangle' : 'calendar-check'}
                    size={14}
                    color={hasCancelledToday ? '#B91C1C' : '#00895A'}
                  />
                  <Text
                    className={`ml-2 font-body-bold text-[14px] ${
                      hasCancelledToday ? 'text-[#B91C1C]' : 'text-primary-dark'
                    }`}
                  >
                    Today — {today}
                  </Text>
                </View>
                {todayEntries.map((e) => (
                  <View key={e.id} className="mt-1.5">
                    <Text className={`font-body-medium text-[13px] text-text-primary ${e.status === 'cancelled' ? 'line-through' : ''}`}>
                      {e.courseCode} · {formatTime(e.startTime)} – {formatTime(e.endTime)}
                      {e.status === 'cancelled' ? ' (cancelled)' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item: group }) => (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <View
                  className={`w-9 h-9 rounded-[12px] items-center justify-center mr-2 ${
                    group.day === today ? 'bg-accent' : 'bg-glass-strong'
                  }`}
                >
                  <Text
                    className={`font-headline text-[12px] ${
                      group.day === today ? 'text-white' : 'text-accent'
                    }`}
                  >
                    {group.day.slice(0, 3).toUpperCase()}
                  </Text>
                </View>
                <Text className="font-headline text-[16px] text-text-primary">{group.day}</Text>
                {group.day === today && (
                  <View className="ml-2 px-2 py-0.5 rounded-pill bg-accent-light">
                    <Text className="font-body-bold text-[10px] text-accent">TODAY</Text>
                  </View>
                )}
              </View>

              {group.items.length === 0 ? (
                <Text className="font-body text-[12px] text-muted mb-3 ml-1">
                  No classes
                </Text>
              ) : (
                group.items.map((entry) => {
                  const cancelled = entry.status === 'cancelled';
                  return (
                    <View
                      key={entry.id}
                      className={`bg-card rounded-[20px] border p-4 mb-3 shadow-soft ${
                        cancelled ? 'border-border opacity-60' : 'border-border'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View
                          className={`w-12 h-12 rounded-[16px] items-center justify-center mr-3 ${
                            cancelled ? 'bg-error/10' : 'bg-accent-light'
                          }`}
                        >
                          <FontAwesome5
                            name={cancelled ? 'calendar-times' : 'book-open'}
                            size={17}
                            color={cancelled ? '#B91C1C' : '#005B96'}
                          />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text
                              className={`font-body-bold text-[15px] text-primary-dark ${
                                cancelled ? 'line-through' : ''
                              }`}
                            >
                              {entry.courseCode}
                            </Text>
                            {cancelled && (
                              <View className="ml-2 px-2 py-0.5 rounded-pill bg-error">
                                <Text className="font-body-bold text-[9px] text-white">CANCELLED</Text>
                              </View>
                            )}
                          </View>
                          <Text className="font-body-medium text-[13px] text-text-primary mt-0.5" numberOfLines={1}>
                            {entry.courseTitle ?? entry.courseCode}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row flex-wrap mt-3 pt-3 border-t border-divider/50">
                        <View className="flex-row items-center mr-5">
                          <FontAwesome5 name="clock" size={11} color="#8A817C" />
                          <Text className="font-body-medium text-[12px] text-text-secondary ml-1.5">
                            {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <FontAwesome5 name="map-marker-alt" size={11} color="#8A817C" />
                          <Text className="font-body-medium text-[12px] text-text-secondary ml-1.5" numberOfLines={1}>
                            {entry.classroom}
                          </Text>
                        </View>
                      </View>

                      {entry.lecturerName && (
                        <View className="flex-row items-center mt-2">
                          <FontAwesome5 name="chalkboard-teacher" size={11} color="#8A817C" />
                          <Text className="font-body-medium text-[12px] text-muted ml-1.5">
                            {entry.lecturerName}
                          </Text>
                        </View>
                      )}

                      {cancelled && entry.cancellationNote ? (
                        <View className="mt-2 bg-[#FDE8E8] rounded-[12px] px-3 py-2">
                          <Text className="font-body-medium text-[12px] text-[#B91C1C]">
                            {entry.cancellationNote}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Timetable;