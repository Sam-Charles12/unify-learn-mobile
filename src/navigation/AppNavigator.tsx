import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import Onboarding from '@/screens/onboarding/Onboarding';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

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

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />
    <Stack.Screen name="CourseList" component={CourseList} options={{ headerShown: false }} />
    <Stack.Screen name="Course" component={CoursePage} options={{ headerShown: false }} />
    <Stack.Screen name="Week" component={WeekPage} options={{ headerShown: false }} />
    <Stack.Screen name="Notifications" component={Notifications} options={{ headerShown: false }} />
    <Stack.Screen name="GradePlanner" component={GradePlanner} options={{ headerShown: false }} />
    <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
    <Stack.Screen name="Lecturer" component={LecturerProfile} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const SessionGate = () => {
  const { user } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setOnboarded(null);
      return;
    }

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const data = snap.data();
      setOnboarded(data?.onboarded === true);
    });

    return () => unsub();
  }, [user]);

  if (!user) return <AuthStack />;
  if (onboarded === null) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }
  return onboarded ? <MainStack /> : <OnboardingStack />;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <SessionGate />
      </NavigationContainer>
    </AuthProvider>
  );
}