import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, collection, getDocs, query, where } from 'firebase/firestore';
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
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [courseIds, setCourseIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const data = userSnap.data();
        if (Array.isArray(data?.dismissedAnnouncements)) {
          setDismissed(data.dismissedAnnouncements);
        }

        if (!profile?.department) return;
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

  const { announcements, loading } = useAnnouncements({ dismissed, courseIds });

  const visible = tab === 'all' ? announcements : announcements.filter((a) => a.scope === tab);

  const toggleDismiss = async (announcement: Announcement) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const isDismissed = dismissed.includes(announcement.id);
      await setDoc(
        userRef,
        {
          dismissedAnnouncements: isDismissed
            ? arrayRemove(announcement.id)
            : arrayUnion(announcement.id),
        },
        { merge: true }
      );
      setDismissed((prev) =>
        isDismissed ? prev.filter((id) => id !== announcement.id) : [...prev, announcement.id]
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    }
  };

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
    const dismissedItem = dismissed.includes(item.id);

    return (
      <View className={cn('mb-3 rounded-[20px] border p-4', dismissedItem ? 'bg-surface border-border opacity-60' : 'bg-card border-border shadow-soft')}>
        <View className="flex-row items-start">
          <View style={{ backgroundColor: style.bg }} className="w-10 h-10 rounded-[14px] items-center justify-center mr-3">
            <FontAwesome5 name={style.icon} size={15} color={style.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
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
            <Text className="font-body-semibold text-[15px] text-text-primary leading-6">
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
              <Pressable onPress={() => toggleDismiss(item)} className="w-8 h-8 rounded-full bg-background items-center justify-center">
                <FontAwesome5
                  name={dismissedItem ? 'undo' : 'times'}
                  size={13}
                  color="#8A817C"
                />
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
          <View className="w-9" />
        </View>
        <Text className="font-headline text-[22px] text-white leading-7">
          Academic feed
        </Text>
        <Text className="font-body text-[13px] text-white/75 mt-1">
          Updates from your university, faculty, department and courses
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
              'rounded-pill px-4 py-2 mr-2',
              tab === item.key ? 'bg-accent' : 'bg-card border border-border'
            )}
          >
            <Text className={cn('font-body-semibold text-[13px]', tab === item.key ? 'text-white' : 'text-muted')}>
              {item.label}
            </Text>
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