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
  PlannerTab: 'chart-pie',
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
    <View className="bg-surface border-t border-border/70 px-4 pt-3 pb-7 flex-row justify-around items-center">
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
          <Pressable
            key={route.key}
            onPress={onPress}
            className="items-center justify-center flex-1 py-1"
          >
            <View className="items-center justify-center relative w-10 h-7">
              <FontAwesome5
                name={icon}
                size={18}
                color={isFocused ? '#0F5132' : '#A1A1AA'}
                solid={isFocused}
              />
              {isNotifications && unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-error items-center justify-center px-1 border border-surface">
                  <Text className="font-body-bold text-[8px] text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              className={`font-body-medium text-[11px] mt-1 tracking-tight ${
                isFocused ? 'font-body-bold text-primary' : 'text-muted'
              }`}
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