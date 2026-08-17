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
  { key: 'all', label: 'All' },
  { key: 'university', label: 'University' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'department', label: 'Department' },
  { key: 'course', label: 'Courses' },
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
  const unreadInTab = visible.filter((a) => !readIds.includes(a.id)).length;

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
          'mb-3 rounded-[20px] border p-4',
          isRead ? 'bg-surface border-border' : 'bg-card border-border shadow-soft'
        )}
      >
        <View className="flex-row items-start">
          <View style={{ backgroundColor: style.bg }} className="w-10 h-10 rounded-[14px] items-center justify-center mr-3">
            <FontAwesome5 name={style.icon} size={15} color={style.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              {!isRead && <View className="w-2 h-2 rounded-pill bg-error mr-2" />}
              <View style={{ backgroundColor: style.bg }} className="rounded-pill px-2 py-0.5 mr-2">
                <Text style={{ color: style.color }} className="font-body-bold text-[10px] uppercase tracking-wide">
                  {item.scope}
                </Text>
              </View>
              {item.courseCode ? (
                <Text className="font-body-bold text-[11px] text-text-secondary">
                  {item.courseCode}
                </Text>
              ) : null}
              {item.weekNumber ? (
                <Text className="font-body-medium text-[11px] text-muted ml-1">
                  · Week {item.weekNumber}
                </Text>
              ) : null}
            </View>
            <Text
              className={cn(
                'text-[15px] leading-6',
                isRead ? 'font-body-medium text-text-secondary' : 'font-body-semibold text-text-primary'
              )}
            >
              {item.title}
            </Text>
            <Text className="font-body text-[13px] text-text-secondary leading-5 mt-1">
              {item.body}
            </Text>
            <View className="flex-row items-center justify-between mt-2.5">
              <View className="flex-row items-center">
                {item.lecturerName || item.senderName ? (
                  <Text className="font-body-medium text-[12px] text-muted">
                    {item.lecturerName ?? item.senderName}
                  </Text>
                ) : null}
                {formatTime(item.createdAt?.seconds) ? (
                  <Text className="font-body-medium text-[12px] text-muted ml-2">
                    · {formatTime(item.createdAt?.seconds)}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => markAsRead(item.id, !isRead)}
                className={cn(
                  'h-8 px-3 rounded-pill items-center justify-center flex-row',
                  isRead ? 'bg-background' : 'bg-primary'
                )}
              >
                <FontAwesome5
                  name={isRead ? 'undo' : 'check'}
                  size={11}
                  color={isRead ? '#8A817C' : '#ffffff'}
                />
                <Text
                  className={cn(
                    'ml-1.5 font-body-semibold text-[11px]',
                    isRead ? 'text-muted' : 'text-white'
                  )}
                >
                  {isRead ? 'Unread' : 'Mark read'}
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
      <View className="bg-accent rounded-b-[28px] px-6 pt-4 pb-5 shadow-soft">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
            <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
          </Pressable>
          <Text className="font-body-bold text-white text-[15px]">Notifications</Text>
          <Pressable
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
            className={cn('rounded-pill px-3 py-1.5', unreadCount > 0 ? 'bg-white' : 'bg-white/30')}
          >
            <Text className={cn('font-body-semibold text-[11px]', unreadCount > 0 ? 'text-accent' : 'text-white/60')}>
              Mark all read
            </Text>
          </Pressable>
        </View>
        <Text className="font-headline text-[22px] text-white leading-7">
          Academic feed
        </Text>
        <Text className="font-body text-[13px] text-white/75 mt-1">
          {unreadCount > 0
            ? `${unreadCount} unread announcement${unreadCount > 1 ? 's' : ''}`
            : 'You are all caught up'}
        </Text>
      </View>

      <FlatList
        data={TABS}
        keyExtractor={(t) => t.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setTab(item.key)}
            className={cn(
              'rounded-pill px-4 py-2 mr-2 flex-row items-center',
              tab === item.key ? 'bg-accent' : 'bg-card border border-border'
            )}
          >
            <Text className={cn('font-body-semibold text-[13px]', tab === item.key ? 'text-white' : 'text-muted')}>
              {item.label}
            </Text>
            {item.key === 'all' && unreadCount > 0 && (
              <View className="ml-2 min-w-5 h-5 rounded-pill bg-error items-center justify-center px-1.5">
                <Text className="font-body-bold text-[10px] text-white">{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#005B96" />
        </View>
      ) : visible.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-20 h-20 rounded-pill bg-accent-light items-center justify-center mb-4">
            <FontAwesome5 name="bell-slash" size={26} color="#005B96" />
          </View>
          <Text className="font-headline text-[20px] text-text-primary mb-2 text-center">
            Nothing here yet
          </Text>
          <Text className="font-body text-[14px] text-muted text-center leading-5">
            Announcements for this channel will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingTop: 0, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default Notifications;