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
    { icon: 'id-card', label: 'Matric number', value: profile?.matric || '—' },
    { icon: 'envelope', label: 'Email', value: user?.email || '—' },
    { icon: 'sitemap', label: 'Department', value: profile?.department?.toUpperCase() || '—' },
    { icon: 'layer-group', label: 'Level', value: profile?.level ? `L${profile.level}` : '—' },
    { icon: 'calendar-alt', label: 'Joined', value: profile?.createdAt ? new Date(profile.createdAt as any).toLocaleDateString() : '—' },
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
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="bg-primary rounded-b-[28px] px-6 pt-4 pb-12 shadow-soft">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
            </Pressable>
            <Text className="font-body-bold text-white text-[15px]">Profile</Text>
            <View className="w-9" />
          </View>

          <View className="items-center">
            <View className="w-20 h-20 rounded-pill bg-white/15 items-center justify-center mb-3">
              <Text className="font-headline text-[28px] text-white">
                {loading ? '…' : initials}
              </Text>
            </View>
            <Text className="font-headline text-[22px] text-white">
              {profile?.name || 'Student'}
            </Text>
            <Text className="font-body text-[13px] text-white/75 mt-1">
              {profile?.role ? `${profile.role[0].toUpperCase()}${profile.role.slice(1)}` : 'Student'}
            </Text>
          </View>
        </View>

        <View className="-mt-8 mx-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
          <Text className="font-headline text-[16px] text-text-primary mb-4">Progress summary</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <View className="w-11 h-11 rounded-[16px] bg-primary-light items-center justify-center mb-1.5">
                <FontAwesome5 name="book-open" size={14} color="#00895A" />
              </View>
              <Text className="font-headline text-[17px] text-text-primary">{courseCount ?? 0}</Text>
              <Text className="font-body-medium text-[11px] text-muted">Courses</Text>
            </View>
            <View className="items-center">
              <View className="w-11 h-11 rounded-[16px] bg-accent-light items-center justify-center mb-1.5">
                <FontAwesome5 name="check-circle" size={14} color="#005B96" />
              </View>
              <Text className="font-headline text-[17px] text-text-primary">{weeksDone ?? 0}</Text>
              <Text className="font-body-medium text-[11px] text-muted">Weeks done</Text>
            </View>
            <View className="items-center">
              <View className="w-11 h-11 rounded-[16px] bg-[#E5D45A]/50 items-center justify-center mb-1.5">
                <FontAwesome5 name="award" size={14} color="#8B9658" />
              </View>
              <Text className="font-headline text-[17px] text-text-primary">{(weeksDone ?? 0) * 10}</Text>
              <Text className="font-body-medium text-[11px] text-muted">Points</Text>
            </View>
          </View>
        </View>

        <View className="mx-5 mt-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
          <Text className="font-headline text-[16px] text-text-primary mb-2">Details</Text>
          {fields.map((f) => (
            <View key={f.label} className="flex-row items-center py-3 border-b border-divider/50 last:border-0">
              <View className="w-9 h-9 rounded-[12px] bg-background items-center justify-center mr-3">
                <FontAwesome5 name={f.icon} size={13} color="#555555" />
              </View>
              <View className="flex-1">
                <Text className="font-body-medium text-[11px] text-muted">{f.label}</Text>
                <Text className="font-body-semibold text-[14px] text-text-primary mt-0.5">{f.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mx-5 mt-5">
          <Pressable
            onPress={handleLogout}
            disabled={signingOut}
            className="bg-[#FDE8E8] border border-[#DC2626]/30 rounded-[20px] py-4 items-center flex-row justify-center"
          >
            {signingOut ? (
              <ActivityIndicator size="small" color="#B91C1C" />
            ) : (
              <>
                <FontAwesome5 name="sign-out-alt" size={14} color="#B91C1C" />
                <Text className="ml-2 font-body-semibold text-[15px] text-[#B91C1C]">Log out</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;