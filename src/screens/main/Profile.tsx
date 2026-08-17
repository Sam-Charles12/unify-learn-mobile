import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RootStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const Profile: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [weeksDone, setWeeksDone] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      if (!user || !profile?.department || !profile?.level) return;
      try {
        const q = query(
          collection(db, 'courses'),
          where('departments', 'array-contains', profile.department)
        );
        const snap = await getDocs(q);
        const courses = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((c) => !Array.isArray(c.levels) || c.levels.includes(profile.level ?? ''));
        setCourseCount(courses.length);

        const progressSnap = await getDocs(collection(db, 'users', user.uid, 'progress'));
        let done = 0;
        progressSnap.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.completedWeeks)) done += data.completedWeeks.length;
        });
        setWeeksDone(done);
      } catch (e) {
        console.warn('Failed to load profile stats:', e);
      }
    })();
  }, [user, profile?.department, profile?.level]);

  const initials = (profile?.name ?? user?.email ?? 'U')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  const fields = [
    { label: 'Matriculation Number', value: profile?.matric || 'Not recorded' },
    { label: 'University Email', value: user?.email || '—' },
    { label: 'Department', value: profile?.department?.toUpperCase() || '—' },
    { label: 'Current Level', value: profile?.level ? `Level ${profile.level}` : '—' },
    { label: 'Faculty', value: 'Faculty of Engineering (LASU)' },
  ];

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center shadow-soft active:bg-soft"
            >
              <FontAwesome5 name="chevron-left" size={14} color="#09090B" />
            </Pressable>
            <Text className="font-body-bold text-text-primary text-[15px]">Student Profile</Text>
            <View className="w-10" />
          </View>

          {/* Profile Identity Card */}
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full bg-ink items-center justify-center mr-4 shadow-soft">
              <Text className="font-headline text-[22px] text-white">
                {loading ? '…' : initials}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-headline text-[22px] text-text-primary leading-7 tracking-tight">
                {profile?.name || 'LASU Student'}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="bg-primary-light px-2.5 py-0.5 rounded-full border border-primary-border">
                  <Text className="font-body-bold text-[11px] text-primary-dark uppercase">
                    {profile?.role || 'Student'}
                  </Text>
                </View>
                <Text className="font-body text-[12px] text-muted ml-2">
                  {profile?.department?.toUpperCase() || ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Academic Stats with Tasteful Color Touches */}
        <View className="px-6 mt-4 flex-row gap-3">
          <View className="flex-1 bg-cobalt-light border border-cobalt-border rounded-2xl p-4 items-center shadow-soft">
            <Text className="font-headline text-[22px] text-cobalt">
              {courseCount ?? 0}
            </Text>
            <Text className="font-body-bold text-[11px] text-cobalt mt-0.5">Enrolled</Text>
          </View>

          <View className="flex-1 bg-primary-light border border-primary-border rounded-2xl p-4 items-center shadow-soft">
            <Text className="font-headline text-[22px] text-primary">
              {weeksDone ?? 0}
            </Text>
            <Text className="font-body-bold text-[11px] text-primary mt-0.5">Weeks Done</Text>
          </View>

          <View className="flex-1 bg-amber-light border border-amber-border rounded-2xl p-4 items-center shadow-soft">
            <Text className="font-headline text-[22px] text-amber">
              {(weeksDone ?? 0) * 10}
            </Text>
            <Text className="font-body-bold text-[11px] text-amber mt-0.5">Study Pts</Text>
          </View>
        </View>

        {/* Details Card */}
        <View className="px-6 mt-6">
          <View className="bg-surface rounded-2xl border border-border/80 p-6 shadow-soft">
            <Text className="font-body-bold text-[12px] text-muted uppercase tracking-wider mb-3">
              Academic Registration
            </Text>
            {fields.map((f, idx) => (
              <View
                key={f.label}
                className={`py-3.5 ${idx < fields.length - 1 ? 'border-b border-divider' : ''}`}
              >
                <Text className="font-body text-[12px] text-muted">{f.label}</Text>
                <Text className="font-body-semibold text-[14px] text-text-primary mt-0.5">{f.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sign Out Button */}
        <View className="px-6 mt-6">
          <Pressable
            onPress={handleLogout}
            disabled={signingOut}
            className="bg-surface border border-border rounded-2xl py-4 items-center flex-row justify-center active:bg-soft shadow-soft"
          >
            {signingOut ? (
              <ActivityIndicator size="small" color="#BE123C" />
            ) : (
              <Text className="font-body-semibold text-[14px] text-error">
                Sign Out of Account
              </Text>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;