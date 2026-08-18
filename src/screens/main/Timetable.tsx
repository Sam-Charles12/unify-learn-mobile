import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';
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
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const PASTEL_EVENT_COLORS = [
  { bg: '#E8F0EC', border: '#C8DDCF', accent: '#059669' }, // Sage
  { bg: '#ECEAF4', border: '#D5D2E8', accent: '#7C3AED' }, // Lavender
  { bg: '#F5EAEA', border: '#E5D0D0', accent: '#E11D48' }, // Blush
  { bg: '#F4E9DE', border: '#E2D4C4', accent: '#D97706' }, // Cream
  { bg: '#E4EDF6', border: '#C8D9EA', accent: '#2563EB' }, // Sky
];

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
};

const formatTimeShort = (t: string) => {
  const [h] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${suffix}`;
};

const Timetable: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { profile } = useUserProfile();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return DAYS.includes(today) ? today : 'Monday';
  });

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
  const dayEntries = entries.filter((e) => e.day === selectedDay);

  // Get current month and simulated dates for the day strip
  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
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
          <Text className="font-headline text-[17px] text-text-primary">{monthName}</Text>
          <View className="w-11 h-11 rounded-full bg-pastel-sage items-center justify-center">
            <FontAwesome5 name="calendar-alt" size={15} color="#059669" />
          </View>
        </View>

        {/* Day Strip — Dribbble style */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {DAYS.map((day, i) => {
            const isSelected = selectedDay === day;
            const isToday = day === today;
            // Simulated date number based on current week
            const dayOffset = i - DAYS.indexOf(today);
            const dateNum = now.getDate() + dayOffset;

            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                className="items-center px-1"
                style={{ width: 58 }}
              >
                <Text
                  className={`font-body-medium text-[12px] mb-1.5 ${
                    isSelected ? 'text-white' : 'text-muted'
                  }`}
                  style={isSelected ? { color: '#1A1A1A' } : {}}
                >
                  {SHORT_DAYS[i]}
                </Text>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? '#1A1A1A' : isToday ? '#E8F0EC' : 'transparent',
                  }}
                >
                  <Text
                    className={`font-headline text-[15px] ${
                      isSelected ? 'text-white' : isToday ? 'text-primary' : 'text-text-primary'
                    }`}
                  >
                    {dateNum > 0 ? dateNum : ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-border mx-6 mb-2" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-4"
            style={{ backgroundColor: '#ECEAF4' }}
          >
            <FontAwesome5 name="calendar-alt" size={28} color="#7C3AED" />
          </View>
          <Text className="font-headline text-[20px] text-text-primary mb-2 text-center">
            No classes scheduled
          </Text>
          <Text className="font-body text-[14px] text-muted text-center leading-5">
            Your classes will appear here once the timetable is published.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Day label */}
          <View className="flex-row items-center mb-4">
            <Text className="font-headline text-[22px] text-text-primary tracking-tight">
              {selectedDay}
            </Text>
            {selectedDay === today && (
              <View className="ml-2.5 px-2.5 py-1 rounded-full bg-pastel-sage">
                <Text className="font-body-bold text-[10px] text-primary uppercase">Today</Text>
              </View>
            )}
          </View>

          {dayEntries.length === 0 ? (
            <View
              className="rounded-2xl p-6 items-center"
              style={{
                backgroundColor: 'rgba(255,255,255,0.78)',
                borderWidth: 1,
                borderColor: 'rgba(231,221,213,0.5)',
              }}
            >
              <Text className="font-body-semibold text-[15px] text-text-primary mb-1">
                No classes on {selectedDay}
              </Text>
              <Text className="font-body text-[13px] text-muted text-center">
                {selectedDay === today ? 'You have the day free! 🎉' : 'No lectures scheduled.'}
              </Text>
            </View>
          ) : (
            /* Timeline */
            dayEntries.map((entry, idx) => {
              const cancelled = entry.status === 'cancelled';
              const scheme = PASTEL_EVENT_COLORS[idx % PASTEL_EVENT_COLORS.length];

              return (
                <View key={entry.id} className="flex-row mb-4">
                  {/* Time Gutter */}
                  <View className="w-14 items-end pr-3 pt-1">
                    <Text className="font-body-bold text-[12px] text-muted">
                      {formatTimeShort(entry.startTime)}
                    </Text>
                  </View>

                  {/* Timeline Dot + Line */}
                  <View className="items-center w-5">
                    <View
                      className="w-3 h-3 rounded-full mt-1.5"
                      style={{
                        backgroundColor: cancelled ? '#E11D48' : scheme.accent,
                        borderWidth: 2,
                        borderColor: '#F8F6F3',
                      }}
                    />
                    {idx < dayEntries.length - 1 && (
                      <View className="w-[2px] flex-1 mt-1" style={{ backgroundColor: '#E7DDD5' }} />
                    )}
                  </View>

                  {/* Event Card */}
                  <View
                    className="flex-1 ml-3 rounded-2xl p-4"
                    style={{
                      backgroundColor: cancelled ? '#FFF1F2' : scheme.bg,
                      opacity: cancelled ? 0.7 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <Text
                        className={`font-headline text-[16px] text-text-primary ${
                          cancelled ? 'line-through' : ''
                        }`}
                      >
                        {entry.courseCode}
                      </Text>
                      {cancelled && (
                        <View className="px-2 py-0.5 rounded-full bg-rose">
                          <Text className="font-body-bold text-[9px] text-white">CANCELLED</Text>
                        </View>
                      )}
                    </View>

                    <Text
                      className="font-body-medium text-[13px] text-text-secondary mb-3"
                      numberOfLines={1}
                    >
                      {entry.courseTitle ?? entry.courseCode}
                    </Text>

                    <View className="flex-row flex-wrap gap-3">
                      <View className="flex-row items-center">
                        <FontAwesome5 name="map-marker-alt" size={10} color="#8A817C" />
                        <Text className="font-body-semibold text-[12px] text-text-secondary ml-1.5">
                          Room {entry.classroom}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <FontAwesome5 name="clock" size={10} color="#8A817C" />
                        <Text className="font-body-medium text-[12px] text-text-secondary ml-1.5">
                          {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                        </Text>
                      </View>
                    </View>

                    {entry.lecturerName && (
                      <View className="flex-row items-center mt-2">
                        <View
                          className="w-6 h-6 rounded-full items-center justify-center mr-1.5"
                          style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                        >
                          <Text className="font-body-bold text-[8px] text-text-primary">
                            {entry.lecturerName.split(' ').slice(0, 2).map(s => s[0]).join('')}
                          </Text>
                        </View>
                        <Text className="font-body-medium text-[11px] text-muted">
                          {entry.lecturerName}
                        </Text>
                      </View>
                    )}

                    {cancelled && entry.cancellationNote ? (
                      <View
                        className="mt-2.5 rounded-xl px-3 py-2"
                        style={{ backgroundColor: 'rgba(225,29,72,0.08)' }}
                      >
                        <Text className="font-body-medium text-[12px] text-rose-dark">
                          {entry.cancellationNote}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Timetable;