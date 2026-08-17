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
import { useAnnouncements, Announcement, AnnouncementScope, scopeStyle } from '@/hooks/useAnnouncements';
import { RootStackParamList } from '@/navigation/types';
import { cn } from '@/lib/utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TABS: { key: AnnouncementScope | 'all'; label: string }[] = [
  { key: 'all', label: 'All Updates' },
  { key: 'course', label: 'Course Notes' },
  { key: 'department', label: 'Department' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'university', label: 'University' },
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
    const style = scopeStyle(item.scope);
    const isRead = readIds.includes(item.id);

    return (
      <View
        className={cn(
          'mb-3 rounded-2xl border p-4 shadow-soft',
          isRead ? 'bg-surface border-border opacity-85' : 'bg-surface border-primary-border shadow-card'
        )}
      >
        <View className="flex-row items-start">
          <View
            style={{ backgroundColor: style.bg, borderColor: style.border || '#E2E8F0' }}
            className="w-10 h-10 rounded-xl items-center justify-center mr-3 border"
          >
            <FontAwesome5 name={style.icon} size={15} color={style.color} />
          </View>
          
          <View className="flex-1">
            <View className="flex-row items-center mb-1 flex-wrap gap-1.5">
              {!isRead && <View className="w-2 h-2 rounded-full bg-primary mr-1" />}
              <View
                style={{ backgroundColor: style.bg }}
                className="rounded-full px-2.5 py-0.5"
              >
                <Text style={{ color: style.color }} className="font-body-bold text-[10px] uppercase tracking-wider">
                  {item.scope}
                </Text>
              </View>
              {item.courseCode ? (
                <Text className="font-body-bold text-[11px] text-text-primary">
                  {item.courseCode}
                </Text>
              ) : null}
              {item.weekNumber ? (
                <Text className="font-body-medium text-[11px] text-muted">
                  • Week {item.weekNumber}
                </Text>
              ) : null}
            </View>

            <Text
              className={cn(
                'text-[15px] leading-6',
                isRead ? 'font-body-medium text-text-secondary' : 'font-headline text-text-primary'
              )}
            >
              {item.title}
            </Text>

            <Text className="font-body text-[13px] text-text-secondary leading-5 mt-1">
              {item.body}
            </Text>

            <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-divider">
              <View className="flex-row items-center">
                {item.lecturerName || item.senderName ? (
                  <Text className="font-body-bold text-[11px] text-text-primary">
                    {item.lecturerName ?? item.senderName}
                  </Text>
                ) : null}
                {formatTime(item.createdAt?.seconds) ? (
                  <Text className="font-body text-[11px] text-muted ml-2">
                    • {formatTime(item.createdAt?.seconds)}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={() => markAsRead(item.id, !isRead)}
                className={cn(
                  'h-7 px-2.5 rounded-lg items-center justify-center flex-row border',
                  isRead
                    ? 'bg-soft border-border'
                    : 'bg-primary-light border-primary-border'
                )}
              >
                <FontAwesome5
                  name={isRead ? 'undo' : 'check'}
                  size={10}
                  color={isRead ? '#64748B' : '#059669'}
                />
                <Text
                  className={cn(
                    'ml-1 font-body-bold text-[11px]',
                    isRead ? 'text-muted' : 'text-primary-dark'
                  )}
                >
                  {isRead ? 'Unread' : 'Mark Read'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-3 pb-4 bg-surface border-b border-border">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
          >
            <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
          </Pressable>
          <Text className="font-body-bold text-text-primary text-[16px]">Academic Updates</Text>
          <Pressable
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
            className={cn(
              'rounded-xl px-3 py-1.5 border',
              unreadCount > 0
                ? 'bg-primary-light border-primary-border'
                : 'bg-soft border-border opacity-50'
            )}
          >
            <Text
              className={cn(
                'font-body-bold text-[11px]',
                unreadCount > 0 ? 'text-primary-dark' : 'text-muted'
              )}
            >
              Mark all read
            </Text>
          </Pressable>
        </View>

        <Text className="font-headline text-[24px] text-text-primary leading-8">
          Faculty Feed
        </Text>
        <Text className="font-body text-[13px] text-text-secondary mt-0.5">
          {unreadCount > 0
            ? `${unreadCount} unread academic notice${unreadCount > 1 ? 's' : ''}`
            : 'All caught up with your announcements'}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View className="py-2.5 bg-surface border-b border-border">
        <FlatList
          data={TABS}
          keyExtractor={(t) => t.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const active = tab === item.key;
            return (
              <Pressable
                onPress={() => setTab(item.key)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 border flex-row items-center',
                  active
                    ? 'bg-ink border-ink'
                    : 'bg-surface border-border'
                )}
              >
                <Text
                  className={cn(
                    'font-body-bold text-[12px]',
                    active ? 'text-white' : 'text-text-secondary'
                  )}
                >
                  {item.label}
                </Text>
                {item.key === 'all' && unreadCount > 0 && (
                  <View className="ml-1.5 min-w-[16px] h-[16px] rounded-full bg-error items-center justify-center px-1">
                    <Text className="font-body-bold text-[9px] text-white">{unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="font-body text-[13px] text-muted mt-2">Loading announcements...</Text>
        </View>
      ) : visible.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-2xl bg-soft border border-border items-center justify-center mb-3">
            <FontAwesome5 name="bell-slash" size={22} color="#94A3B8" />
          </View>
          <Text className="font-headline text-[17px] text-text-primary mb-1 text-center">
            No Notices in this Channel
          </Text>
          <Text className="font-body text-[13px] text-muted text-center">
            Announcements from your lecturers and department will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default Notifications;