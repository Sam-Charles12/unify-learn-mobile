import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LecturerDashboard from '@/screens/lecturer/LecturerDashboard';
import LecturerCourses from '@/screens/lecturer/LecturerCourses';
import LecturerCourseWorkspace from '@/screens/lecturer/LecturerCourseWorkspace';
import LecturerProfileEdit from '@/screens/lecturer/LecturerProfileEdit';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  LecturerDashboardTab: 'home',
  LecturerCoursesTab: 'book-open',
  LecturerProfileTab: 'user',
};

const LecturerTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View className="bg-surface border-t border-border px-3 pt-2 pb-6 flex-row justify-around items-center">
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icon = ICONS[route.name] ?? 'circle';

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
                  ? 'w-12 h-8 rounded-pill bg-accent-light items-center justify-center'
                  : 'w-12 h-8 items-center justify-center'
              }
            >
              <FontAwesome5
                name={icon}
                size={18}
                color={isFocused ? '#005B96' : '#8A817C'}
                solid={isFocused}
              />
            </View>
            <Text
              className={
                isFocused
                  ? 'font-body-semibold text-[11px] text-accent mt-1'
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

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LecturerDashboard" component={LecturerDashboard} />
  </Stack.Navigator>
);

const CoursesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LecturerCourses" component={LecturerCourses} />
    <Stack.Screen name="LecturerCourseWorkspace" component={LecturerCourseWorkspace} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LecturerProfileEdit" component={LecturerProfileEdit} />
  </Stack.Navigator>
);

const LecturerTabs = () => (
  <Tab.Navigator tabBar={(props) => <LecturerTabBar {...props} />} screenOptions={{ headerShown: false }}>
    <Tab.Screen name="LecturerDashboardTab" component={DashboardStack} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="LecturerCoursesTab" component={CoursesStack} options={{ tabBarLabel: 'Courses' }} />
    <Tab.Screen name="LecturerProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

export default LecturerTabs;