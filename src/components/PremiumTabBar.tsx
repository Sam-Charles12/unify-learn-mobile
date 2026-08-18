import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
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
    <View
      style={{
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 28 : 16,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 10,
        paddingHorizontal: 8,
        // Simulated glassmorphism — soft diffused shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(231,221,213,0.5)',
      }}
    >
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
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            {isFocused ? (
              // Active: dark circle with white icon (Dribbble style)
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#1A1A1A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <FontAwesome5 name={icon} size={18} color="#FFFFFF" solid />
                {isNotifications && unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: '#E11D48',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                      borderWidth: 2,
                      borderColor: '#1A1A1A',
                    }}
                  >
                    <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 9, color: '#fff' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              // Inactive: just icon, no label
              <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50, position: 'relative' }}>
                <FontAwesome5 name={icon} size={18} color="#8A817C" />
                {isNotifications && unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: '#E11D48',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 3,
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                    }}
                  >
                    <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 8, color: '#fff' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export default PremiumTabBar;