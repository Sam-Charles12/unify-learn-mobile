import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  collection, getDocs, query, where, doc, updateDoc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { TimetableEntry } from '@/screens/main/Timetable';
import { LecturerNavigatorParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<LecturerNavigatorParamList>;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const formatTime = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, '0')}${suffix}`;
};

const LecturerTimetable: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'cancel' | 'reschedule' | null>(null);
  const [activeEntry, setActiveEntry] = useState<TimetableEntry | null>(null);
  const [note, setNote] = useState('');
  const [reschedDay, setReschedDay] = useState<string>('Monday');
  const [reschedStart, setReschedStart] = useState('09:00');
  const [reschedEnd, setReschedEnd] = useState('11:00');
  const [reschedRoom, setReschedRoom] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(
        query(collection(db, 'timetable'), where('lecturerId', '==', user.uid))
      );
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as TimetableEntry)
        .sort((a, b) => {
          const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
          if (dayDiff !== 0) return dayDiff;
          return a.startTime.localeCompare(b.startTime);
        });
      setEntries(list);
    } catch (e) {
      console.warn('Failed to load lecturer timetable:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const openCancel = (entry: TimetableEntry) => {
    setActiveEntry(entry);
    setNote('');
    setAction('cancel');
  };

  const openReschedule = (entry: TimetableEntry) => {
    setActiveEntry(entry);
    setReschedDay(entry.day);
    setReschedStart(entry.startTime);
    setReschedEnd(entry.endTime);
    setReschedRoom(entry.classroom);
    setAction('reschedule');
  };

  const postAnnouncement = async (entry: TimetableEntry, kind: 'cancelled' | 'rescheduled', detail: string) => {
    if (!user) return;
    await addDoc(collection(db, 'announcements'), {
      title:
        kind === 'cancelled'
          ? `Class Cancelled — ${entry.courseCode}`
          : `Class Rescheduled — ${entry.courseCode}`,
      body: detail,
      scope: 'course',
      courseId: entry.courseId,
      courseCode: entry.courseCode,
      lecturerName: user.displayName ?? 'Lecturer',
      senderName: user.displayName ?? 'Lecturer',
      senderRole: 'lecturer',
      lecturerId: user.uid,
      isActive: true,
      createdAt: serverTimestamp(),
    });
  };

  const handleCancel = async () => {
    if (!activeEntry) return;
    setSubmitting(true);
    try {
      const detail = `The ${activeEntry.day}, ${formatTime(activeEntry.startTime)} class in ${activeEntry.classroom} has been cancelled.${
        note.trim() ? `\n\n${note.trim()}` : ''
      }`;
      await updateDoc(doc(db, 'timetable', activeEntry.id), {
        status: 'cancelled',
        cancellationNote: note.trim(),
      });
      await postAnnouncement(activeEntry, 'cancelled', detail);
      Alert.alert('Class cancelled', 'Your students have been notified.');
      setAction(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to cancel class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!activeEntry) return;
    setSubmitting(true);
    try {
      const detail = `${activeEntry.courseCode} has moved to ${reschedDay}, ${formatTime(reschedStart)} – ${formatTime(reschedEnd)} in ${reschedRoom.trim() || activeEntry.classroom}.`;
      await updateDoc(doc(db, 'timetable', activeEntry.id), {
        day: reschedDay,
        startTime: reschedStart,
        endTime: reschedEnd,
        classroom: reschedRoom.trim() || activeEntry.classroom,
        status: 'rescheduled',
      });
      await postAnnouncement(activeEntry, 'rescheduled', detail);
      Alert.alert('Class rescheduled', 'Your students have been notified.');
      setAction(null);
      load();
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to reschedule class.');
    } finally {
      setSubmitting(false);
    }
  };

  const grouped: { level: string; items: TimetableEntry[] }[] = [];
  for (const entry of entries) {
    const level = String(entry.level ?? '');
    const group = grouped.find((g) => g.level === level);
    if (group) group.items.push(entry);
    else grouped.push({ level, items: [entry] });
  }
  grouped.sort((a, b) => Number(a.level) - Number(b.level));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="bg-accent rounded-b-[28px] px-6 pt-4 pb-8 shadow-soft">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
            <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
          </Pressable>
          <Text className="font-body-bold text-white text-[15px]">My Timetable</Text>
          <View className="w-9" />
        </View>
        <Text className="font-headline text-[22px] text-white leading-7">
          Teaching Schedule
        </Text>
        <Text className="font-body text-[13px] text-white/75 mt-1">
          {entries.length} session{entries.length === 1 ? '' : 's'} across your courses
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
            No sessions assigned
          </Text>
          <Text className="font-body text-[14px] text-muted text-center leading-5">
            Timetable entries for your courses will appear here.
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

              {group.items.map((entry) => {
                const cancelled = entry.status === 'cancelled';
                return (
                  <View
                    key={entry.id}
                    className={`bg-card rounded-[20px] border p-4 mb-3 shadow-soft ${
                      cancelled ? 'border-border opacity-70' : 'border-border'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-12 h-12 rounded-[16px] items-center justify-center mr-3 ${
                          cancelled ? 'bg-error/10' : 'bg-accent-light'
                        }`}
                      >
                        <FontAwesome5
                          name={cancelled ? 'calendar-times' : 'chalkboard-teacher'}
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
                          {entry.status === 'rescheduled' && (
                            <View className="ml-2 px-2 py-0.5 rounded-pill bg-[#E5D45A]">
                              <Text className="font-body-bold text-[9px] text-[#8B9658]">MOVED</Text>
                            </View>
                          )}
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
                        <FontAwesome5 name="calendar-day" size={11} color="#8A817C" />
                        <Text className="font-body-medium text-[12px] text-text-secondary ml-1.5">
                          {entry.day}
                        </Text>
                      </View>
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

                    <View className="flex-row items-center mt-2">
                      <FontAwesome5 name="users" size={11} color="#8A817C" />
                      <Text className="font-body-medium text-[12px] text-muted ml-1.5">
                        ~{entry.expectedCount ?? 0} students expected
                      </Text>
                    </View>

                    {cancelled && entry.cancellationNote ? (
                      <View className="mt-2 bg-[#FDE8E8] rounded-[12px] px-3 py-2">
                        <Text className="font-body-medium text-[12px] text-[#B91C1C]">
                          {entry.cancellationNote}
                        </Text>
                      </View>
                    ) : null}

                    {!cancelled && (
                      <View className="flex-row mt-3">
                        <Pressable
                          onPress={() => openReschedule(entry)}
                          className="flex-1 mr-2 bg-accent-light rounded-pill py-2.5 items-center flex-row justify-center"
                        >
                          <FontAwesome5 name="calendar-alt" size={12} color="#005B96" />
                          <Text className="ml-1.5 font-body-semibold text-[12px] text-accent">
                            Reschedule
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => openCancel(entry)}
                          className="flex-1 bg-[#FDE8E8] rounded-pill py-2.5 items-center flex-row justify-center"
                        >
                          <FontAwesome5 name="calendar-times" size={12} color="#B91C1C" />
                          <Text className="ml-1.5 font-body-semibold text-[12px] text-[#B91C1C]">
                            Cancel class
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        />
      )}

      {/* Cancel modal */}
      <Modal
        visible={action === 'cancel'}
        transparent
        animationType="fade"
        onRequestClose={() => setAction(null)}
      >
        <View className="flex-1 bg-black/50 px-6 items-center justify-center">
          <View className="w-full bg-surface rounded-[24px] p-6">
            <View className="w-14 h-14 rounded-pill bg-error/10 items-center justify-center mb-4">
              <FontAwesome5 name="calendar-times" size={22} color="#B91C1C" />
            </View>
            <Text className="font-headline text-[18px] text-text-primary mb-1">
              Cancel {activeEntry?.courseCode}?
            </Text>
            <Text className="font-body text-[13px] text-muted mb-4 leading-5">
              Your students will be notified instantly via an announcement.
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Reason (optional) — e.g. lecturer unavailable"
              placeholderTextColor="#8A817C"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-soft rounded-[16px] px-4 py-3.5 font-body-medium text-[14px] text-text-primary min-h-[80px] mb-5"
            />
            <View className="flex-row">
              <Pressable
                onPress={() => setAction(null)}
                disabled={submitting}
                className="flex-1 mr-2 rounded-pill py-3.5 items-center bg-soft"
              >
                <Text className="font-body-semibold text-[14px] text-muted">Keep class</Text>
              </Pressable>
              <Pressable
                onPress={handleCancel}
                disabled={submitting}
                className="flex-1 rounded-pill py-3.5 items-center bg-error"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="font-body-semibold text-[14px] text-white">Cancel class</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reschedule modal */}
      <Modal
        visible={action === 'reschedule'}
        transparent
        animationType="fade"
        onRequestClose={() => setAction(null)}
      >
        <View className="flex-1 bg-black/50 px-6 items-center justify-center">
          <View className="w-full bg-surface rounded-[24px] p-6">
            <View className="w-14 h-14 rounded-pill bg-accent-light items-center justify-center mb-4">
              <FontAwesome5 name="calendar-alt" size={22} color="#005B96" />
            </View>
            <Text className="font-headline text-[18px] text-text-primary mb-1">
              Reschedule {activeEntry?.courseCode}
            </Text>
            <Text className="font-body text-[13px] text-muted mb-4 leading-5">
              Students will be notified of the new time.
            </Text>

            <Text className="font-body-medium text-[12px] text-text-secondary mb-2">Day</Text>
            <View className="flex-row flex-wrap mb-4">
              {DAYS.map((day) => {
                const selected = reschedDay === day;
                return (
                  <Pressable
                    key={day}
                    onPress={() => setReschedDay(day)}
                    className={`mr-2 mb-2 px-3 py-2 rounded-pill ${
                      selected ? 'bg-accent' : 'bg-soft'
                    }`}
                  >
                    <Text
                      className={`font-body-semibold text-[12px] ${
                        selected ? 'text-white' : 'text-muted'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="font-body-medium text-[12px] text-text-secondary mb-2">Start (HH:MM)</Text>
                <TextInput
                  value={reschedStart}
                  onChangeText={setReschedStart}
                  placeholder="09:00"
                  placeholderTextColor="#8A817C"
                  className="bg-soft rounded-pill px-4 py-3 font-body-medium text-[14px] text-text-primary"
                />
              </View>
              <View className="flex-1">
                <Text className="font-body-medium text-[12px] text-text-secondary mb-2">End (HH:MM)</Text>
                <TextInput
                  value={reschedEnd}
                  onChangeText={setReschedEnd}
                  placeholder="11:00"
                  placeholderTextColor="#8A817C"
                  className="bg-soft rounded-pill px-4 py-3 font-body-medium text-[14px] text-text-primary"
                />
              </View>
            </View>

            <Text className="font-body-medium text-[12px] text-text-secondary mb-2">Classroom</Text>
            <TextInput
              value={reschedRoom}
              onChangeText={setReschedRoom}
              placeholder={activeEntry?.classroom}
              placeholderTextColor="#8A817C"
              className="bg-soft rounded-pill px-4 py-3 font-body-medium text-[14px] text-text-primary mb-5"
            />

            <View className="flex-row">
              <Pressable
                onPress={() => setAction(null)}
                disabled={submitting}
                className="flex-1 mr-2 rounded-pill py-3.5 items-center bg-soft"
              >
                <Text className="font-body-semibold text-[14px] text-muted">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleReschedule}
                disabled={submitting}
                className="flex-1 rounded-pill py-3.5 items-center bg-accent"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="font-body-semibold text-[14px] text-white">Save changes</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default LecturerTimetable;