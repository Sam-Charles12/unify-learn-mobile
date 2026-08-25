import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import SignUP from '@/screens/auth/SignUp';
import Login from '@/screens/auth/Login';
import ForgotPassword from '@/screens/auth/ForgotPassword';
import Dashboard from '@/screens/main/Dashboard';
import CourseList from '@/screens/main/CourseList';
import CoursePage from '@/screens/main/CoursePage';
import WeekPage from '@/screens/main/WeekPage';
import Notifications from '@/screens/main/Notifications';
import GradePlanner from '@/screens/main/GradePlanner';
import Profile from '@/screens/main/Profile';
import LecturerProfile from '@/screens/main/LecturerProfile';
import Timetable from '@/screens/main/Timetable';
import Onboarding from '@/screens/onboarding/Onboarding';
import PremiumTabBar from '@/components/PremiumTabBar';
import LecturerTabs from '@/navigation/LecturerNavigator';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { View, ActivityIndicator } from 'react-native';
import { logEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const RootNavigator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navRef = useNavigationContainerRef();

  useEffect(() => {
    return navRef.addListener('state', () => {
      const route = navRef.getCurrentRoute() as { name?: string } | undefined;
      if (route?.name) {
        logEvent(ANALYTICS_EVENTS.screenView, { screen: route.name });
      }
    });
  }, [navRef]);

  return <NavigationContainer ref={navRef}>{children}</NavigationContainer>;
};

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
    <Stack.Screen name="SignUp" component={SignUP} options={{ headerShown: false }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const OnboardingStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={Dashboard} />
    <Stack.Screen name="Timetable" component={Timetable} />
    <Stack.Screen name="Course" component={CoursePage} />
    <Stack.Screen name="Week" component={WeekPage} />
    <Stack.Screen name="Lecturer" component={LecturerProfile} />
  </Stack.Navigator>
);

const CoursesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CourseList" component={CourseList} />
    <Stack.Screen name="Course" component={CoursePage} />
    <Stack.Screen name="Week" component={WeekPage} />
    <Stack.Screen name="Lecturer" component={LecturerProfile} />
  </Stack.Navigator>
);

const PlannerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="GradePlanner" component={GradePlanner} />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Notifications" component={Notifications} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={Profile} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <PremiumTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="DashboardTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
    <Tab.Screen name="CoursesTab" component={CoursesStack} options={{ tabBarLabel: 'Courses' }} />
    <Tab.Screen name="PlannerTab" component={PlannerStack} options={{ tabBarLabel: 'Planner' }} />
    <Tab.Screen name="NotificationsTab" component={NotificationsStack} options={{ tabBarLabel: 'Alerts' }} />
    <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Profile' }} />
  </Tab.Navigator>
);

const SessionGate = () => {
  const { user } = useAuth();
  const [gate, setGate] = useState<'loading' | 'lecturer' | 'onboarding' | 'main'>('loading');

  useEffect(() => {
    if (!user) {
      setGate('loading');
      return;
    }

    let unsub: () => void;
    const check = async () => {
      const lecturerSnap = await getDoc(doc(db, 'lecturers', user.uid));
      const isLecturer = lecturerSnap.exists();

      unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        const data = snap.data();
        if (data?.role === 'lecturer' || isLecturer) {
          setGate('lecturer');
        } else if (data?.onboarded === true) {
          setGate('main');
        } else {
          setGate('onboarding');
        }
      });
    };
    check();

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  if (!user) return <AuthStack />;
  if (gate === 'loading') {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }
  if (gate === 'lecturer') return <LecturerTabs />;
  if (gate === 'onboarding') return <OnboardingStack />;
  return <MainTabs />;
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator>
        <SessionGate />
      </RootNavigator>
    </AuthProvider>
  );
}