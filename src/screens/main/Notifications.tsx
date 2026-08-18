import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnnouncements, Announcement, AnnouncementScope } from '@/hooks/useAnnouncements';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TABS: { key: AnnouncementScope | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'course', label: 'Course' },
  { key: 'department', label: 'Dept' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'university', label: 'Uni' },
];

const Notifications: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [tab, setTab] = useState<AnnouncementScope | 'all'>('all');
  const [courseIds, setCourseIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !profile?.department) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'courses'),
          where('departments', 'array-contains', profile.department)
        );
        const snap = await getDocs(q);
        setCourseIds(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as any))
            .filter((c) => !Array.isArray(c.levels) || c.levels.includes(profile.level ?? ''))
            .map((c) => c.id)
        );
      } catch (e) {
        console.warn('Failed to load notifications context:', e);
      }
    })();
  }, [user, profile?.department, profile?.level]);

  const { announcements, readIds, unreadCount, markAsRead, markAllAsRead, loading } =
    useAnnouncements({ courseIds });

  const visible = tab === 'all' ? announcements : announcements.filter((a) => a.scope === tab);

  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    const diff = Date.now() / 1000 - seconds;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(seconds * 1000).toLocaleDateString();
  };

  const renderItem = ({ item }: { item: Announcement }) => {
    const isRead = readIds.includes(item.id);

    return (
      <View
        className="mb-4 rounded-2xl p-5"
        style={{
          backgroundColor: isRead ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.82)',
          borderWidth: isRead ? 0 : 1,
          borderColor: isRead ? 'transparent' : 'rgba(26,26,26,0.12)',
          opacity: isRead ? 0.65 : 1,
          shadowColor: isRead ? 'transparent' : '#000',
          shadowOffset: { width: 0, height: isRead ? 0 : 3 },
          shadowOpacity: isRead ? 0 : 0.05,
          shadowRadius: isRead ? 0 : 10,
          elevation: isRead ? 0 : 3,
        }}
      >
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center gap-2">
            {!isRead && <View className="w-2 h-2 rounded-full bg-primary" />}
            <Text className="font-body-bold text-[11px] text-primary uppercase tracking-wider">
              {item.scope}
            </Text>
            {item.courseCode ? (
              <Text className="font-body-semibold text-[12px] text-text-primary">
                • {item.courseCode}
              </Text>
            ) : null}
            {item.weekNumber ? (
              <Text className="font-body text-[12px] text-muted">
                (Week {item.weekNumber})
              </Text>
            ) : null}
          </View>
          <Text className="font-body text-[11px] text-muted">
            {formatTime(item.createdAt?.seconds)}
          </Text>
        </View>

        <Text className="font-headline text-[16px] text-text-primary leading-6 mb-1.5">
          {item.title}
        </Text>

        <Text className="font-body text-[14px] text-text-secondary leading-5 mb-4">
          {item.body}
        </Text>

        <View className="flex-row items-center justify-between pt-3" style={{ borderTopWidth: 1, borderTopColor: '#F0EAE3' }}>
          <Text className="font-body-medium text-[12px] text-muted">
            {item.lecturerName ?? item.senderName ?? 'Faculty Office'}
          </Text>

          <Pressable
            onPress={() => markAsRead(item.id, !isRead)}
            className="py-1 px-3 rounded-full active:opacity-80"
            style={{ backgroundColor: '#F2EDE8' }}
          >
            <Text className="font-body-semibold text-[11px] text-text-secondary">
              {isRead ? 'Mark Unread' : 'Mark Read'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-3">
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
          <Text className="font-body-bold text-text-primary text-[15px]">Academic Feed</Text>
          <Pressable
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
            className="opacity-90"
          >
            <Text className="font-body-semibold text-[12px] text-primary">
              Mark all read
            </Text>
          </Pressable>
        </View>

        <Text className="font-headline text-[28px] text-text-primary leading-[34px] tracking-tight">
          Notices &{'\n'}Broadcasts
        </Text>
        <Text className="font-body text-[14px] text-text-secondary mt-2">
          {unreadCount > 0
            ? `${unreadCount} unread academic updates`
            : 'All notices are up to date'}
        </Text>
      </View>

      {/* Pill Tab Switcher — Dribbble style */}
      <View className="px-6 py-3">
        <View className="flex-row gap-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                className="rounded-full px-4 py-2.5"
                style={{
                  backgroundColor: active ? '#1A1A1A' : 'rgba(255,255,255,0.7)',
                  borderWidth: active ? 0 : 1,
                  borderColor: active ? 'transparent' : '#E7DDD5',
                }}
              >
                <Text
                  className={`font-body-semibold text-[13px] ${
                    active ? 'text-white' : 'text-text-secondary'
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#059669" />
        </View>
      ) : visible.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-headline text-[17px] text-text-primary mb-1 text-center">
            No Notices in this Channel
          </Text>
          <Text className="font-body text-[13px] text-muted text-center">
            Announcements from your faculty and course lecturers will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default Notifications;