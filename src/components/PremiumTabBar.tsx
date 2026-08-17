import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { db } from '@/config/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

const ICONS: Record<string, string> = {
  DashboardTab: 'home',
  CoursesTab: 'book-open',
  PlannerTab: 'chart-line',
  NotificationsTab: 'bell',
  ProfileTab: 'user',
};

let cachedCourseIds: string[] | null = null;

const useCourseIds = () => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [courseIds, setCourseIds] = React.useState<string[]>(cachedCourseIds ?? []);

  React.useEffect(() => {
    if (cachedCourseIds) return;
    if (!user || !profile?.department) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'courses'),
          where('departments', 'array-contains', profile.department)
        );
        const snap = await getDocs(q);
        const ids = snap.docs.map((d) => d.id);
        cachedCourseIds = ids;
        setCourseIds(ids);
      } catch (e) {
        console.warn('Failed to load course ids:', e);
      }
    })();
  }, [user, profile?.department]);

  return courseIds;
};

const PremiumTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const courseIds = useCourseIds();
  const { unreadCount } = useAnnouncements({ courseIds });

  return (
    <View className="bg-surface border-t border-border px-3 pt-2 pb-6 flex-row justify-around items-center shadow-soft">
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icon = ICONS[route.name] ?? 'circle';
        const isNotifications = route.name === 'NotificationsTab';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} className="items-center px-3 py-1">
            <View
              className={
                isFocused
                  ? 'w-12 h-8 rounded-full bg-primary-light items-center justify-center'
                  : 'w-12 h-8 items-center justify-center'
              }
            >
              <FontAwesome5
                name={icon}
                size={17}
                color={isFocused ? '#059669' : '#64748B'}
                solid={isFocused}
              />
              {isNotifications && unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-error items-center justify-center px-1 border-2 border-surface">
                  <Text className="font-body-bold text-[9px] text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className={
                isFocused
                  ? 'font-body-bold text-[11px] text-primary-dark mt-1'
                  : 'font-body-medium text-[11px] text-muted mt-1'
              }
            >
              {descriptors[route.key].options.tabBarLabel as string}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default PremiumTabBar;