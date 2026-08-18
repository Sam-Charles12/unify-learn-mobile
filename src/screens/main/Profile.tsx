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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-11 h-11 rounded-full items-center justify-center active:opacity-80"
              style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                borderWidth: 1,
                borderColor: '#E7DDD5',
              }}
            >
              <FontAwesome5 name="chevron-left" size={14} color="#1A1A1A" />
            </Pressable>
            <Text className="font-body-bold text-text-primary text-[15px]">Student Profile</Text>
            <View className="w-11" />
          </View>

          {/* Profile Identity */}
          <View className="flex-row items-center">
            <View
              className="w-16 h-16 rounded-full bg-ink items-center justify-center mr-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <Text className="font-headline text-[22px] text-white">
                {loading ? '…' : initials}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-headline text-[24px] text-text-primary leading-[30px] tracking-tight">
                {profile?.name || 'LASU Student'}
              </Text>
              <View className="flex-row items-center mt-1.5">
                <View className="bg-pastel-sage px-2.5 py-1 rounded-full">
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

        {/* Pastel Stat Cards */}
        <View className="px-6 mt-4 flex-row gap-3">
          <View
            className="flex-1 rounded-2xl p-4 items-center"
            style={{ backgroundColor: '#E4EDF6' }}
          >
            <Text className="font-headline text-[24px] text-cobalt">
              {courseCount ?? 0}
            </Text>
            <Text className="font-body-bold text-[11px] text-cobalt mt-0.5">Enrolled</Text>
          </View>

          <View
            className="flex-1 rounded-2xl p-4 items-center"
            style={{ backgroundColor: '#E8F0EC' }}
          >
            <Text className="font-headline text-[24px] text-primary">
              {weeksDone ?? 0}
            </Text>
            <Text className="font-body-bold text-[11px] text-primary mt-0.5">Weeks Done</Text>
          </View>

          <View
            className="flex-1 rounded-2xl p-4 items-center"
            style={{ backgroundColor: '#F4E9DE' }}
          >
            <Text className="font-headline text-[24px] text-amber">
              {(weeksDone ?? 0) * 10}
            </Text>
            <Text className="font-body-bold text-[11px] text-amber mt-0.5">Study Pts</Text>
          </View>
        </View>

        {/* Details Card */}
        <View className="px-6 mt-6">
          <View
            className="rounded-2xl p-6"
            style={{
              backgroundColor: 'rgba(255,255,255,0.82)',
              borderWidth: 1,
              borderColor: 'rgba(231,221,213,0.5)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Text className="font-body-bold text-[12px] text-muted uppercase tracking-wider mb-3">
              Academic Registration
            </Text>
            {fields.map((f, idx) => (
              <View
                key={f.label}
                className={`py-3.5 ${idx < fields.length - 1 ? 'border-b' : ''}`}
                style={{ borderBottomColor: '#F0EAE3' }}
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
            className="rounded-2xl py-4 items-center flex-row justify-center active:opacity-80"
            style={{
              backgroundColor: '#F5EAEA',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.03,
              shadowRadius: 4,
              elevation: 1,
            }}
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