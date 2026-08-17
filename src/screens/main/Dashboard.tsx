import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QUICK_STATS = [
  { icon: 'book-open', label: 'Courses', value: 'â€”' },
  { icon: 'check-circle', label: 'Weeks done', value: 'â€”' },
  { icon: 'award', label: 'Points', value: 'â€”' },
];

const Dashboard: React.FC = () => {
  const { signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigation = useNavigation<NavigationProp>();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error: any) {
      console.error('Logout failed:', error);
    } finally {
      setSigningOut(false);
    }
  };

  const firstName = profile?.name?.split(' ')[0];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="bg-primary rounded-b-[28px] px-6 pt-4 pb-10 shadow-soft">
          <View className="flex-row items-center justify-between mb-5">
            <View className="w-10 h-10 rounded-full bg-white/15 items-center justify-center">
              <FontAwesome5 name="graduation-cap" size={17} color="#ffffff" />
            </View>
            <Pressable
              onPress={handleLogout}
              disabled={signingOut}
              className="w-9 h-9 rounded-full bg-white/15 items-center justify-center"
            >
              {signingOut ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <FontAwesome5 name="sign-out-alt" size={14} color="#ffffff" />
              )}
            </Pressable>
          </View>

          <Text className="font-headline text-[26px] text-white leading-9">
            {firstName ? `Hello, ${firstName}` : 'Hello'}
          </Text>
          <Text className="font-body text-[13px] text-white/75 mt-1">
            {profile?.department ? `${profile.department.toUpperCase()} - L${profile.level ?? ''}` : 'Welcome to Unify Learn'}
          </Text>
        </View>

        <View className="-mt-6 mx-5 bg-card rounded-[24px] border border-border p-4 shadow-soft">
          <View className="flex-row justify-around">
            {QUICK_STATS.map((stat) => (
              <View key={stat.label} className="items-center">
                <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center mb-1.5">
                  <FontAwesome5 name={stat.icon} size={14} color="#00895A" />
                </View>
                <Text className="font-headline text-[16px] text-text-primary">{stat.value}</Text>
                <Text className="font-body-medium text-[11px] text-muted">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="px-6 mt-7">
          <Text className="font-headline text-[18px] text-text-primary mb-1">Continue learning</Text>
          <Text className="font-body text-[13px] text-muted mb-4">
            Pick up where you left off or explore new courses.
          </Text>

          <Pressable
            onPress={() => navigation.navigate('CourseList')}
            className="bg-card rounded-[24px] border border-border p-5 shadow-soft mb-4"
            >
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-[18px] bg-primary items-center justify-center mr-4">
                <FontAwesome5 name="book-open" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-[16px] text-text-primary">
                  Browse my courses
                </Text>
                <Text className="font-body text-[12px] text-muted mt-0.5">
                  {profile?.department && profile?.level
                    ? `${profile.department.toUpperCase()} - L${profile.level}`
                    : 'View your department courses'}
                </Text>
              </View>
              <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
                <FontAwesome5 name="arrow-right" size={13} color="#ffffff" />
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate('CourseList')}
            className="bg-primary rounded-[24px] p-5 shadow-soft"
            >
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-[18px] bg-white/15 items-center justify-center mr-4">
                <FontAwesome5 name="layer-group" size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-[16px] text-white">
                  All course materials
                </Text>
                <Text className="font-body text-[12px] text-white/75 mt-0.5">
                  Notes, quizzes and exams, week by week
                </Text>
              </View>
              <View className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
                <FontAwesome5 name="arrow-right" size={13} color="#ffffff" />
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;