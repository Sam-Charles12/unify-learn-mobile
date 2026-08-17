import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LecturerNavigatorParamList } from '@/navigation/types';
import { Button } from '@/components/ui/button';

type NavigationProp = NativeStackNavigationProp<LecturerNavigatorParamList>;

const LecturerProfileEdit: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();

  const [title, setTitle] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [bio, setBio] = useState('');
  const [contactEnabled, setContactEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'lecturers', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title ?? '');
          setOfficeHours(data.officeHours ?? '');
          setBio(data.bio ?? '');
          setContactEnabled(data.contactEnabled ?? true);
        }
      } catch (e) {
        console.warn('Failed to load lecturer profile:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'lecturers', user.uid),
        { title: title.trim(), officeHours: officeHours.trim(), bio: bio.trim(), contactEnabled },
        { merge: true }
      );
      Alert.alert('Profile Saved', 'Your faculty credentials and office hours have been updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

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

  const initials = (profile?.name ?? user?.displayName ?? 'L')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-5 pt-3 pb-5 bg-surface border-b border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
            >
              <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
            </Pressable>
            <Text className="font-body-bold text-text-primary text-[16px]">Faculty Settings</Text>
            <View className="w-10" />
          </View>

          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-2xl bg-accent-light border border-accent-border items-center justify-center mr-4 shadow-card">
              <Text className="font-headline text-[22px] text-accent">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-headline text-[20px] text-text-primary leading-7">
                {profile?.name ?? user?.displayName ?? 'Faculty Member'}
              </Text>
              <Text className="font-body text-[13px] text-text-secondary mt-0.5">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="bg-surface rounded-2xl border border-border p-5 shadow-card">
            {loading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#059669" />
              </View>
            ) : (
              <>
                <Text className="font-body-semibold text-[13px] text-text-primary mb-1.5">Academic Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Associate Professor / Senior Lecturer"
                  placeholderTextColor="#94A3B8"
                  className="bg-surface rounded-xl px-4 py-3 font-body text-[15px] text-text-primary border border-border mb-4"
                />

                <Text className="font-body-semibold text-[13px] text-text-primary mb-1.5">Office Hours</Text>
                <TextInput
                  value={officeHours}
                  onChangeText={setOfficeHours}
                  placeholder="e.g. Tuesdays & Thursdays, 11:00 AM – 1:00 PM"
                  placeholderTextColor="#94A3B8"
                  className="bg-surface rounded-xl px-4 py-3 font-body text-[15px] text-text-primary border border-border mb-4"
                />

                <Text className="font-body-semibold text-[13px] text-text-primary mb-1.5">Faculty Biography</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Share your research interests and academic background..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="bg-surface rounded-xl px-4 py-3 font-body text-[15px] text-text-primary border border-border min-h-[100px] mb-4"
                />

                <View className="flex-row items-center justify-between py-3 border-t border-divider mb-5">
                  <View className="flex-1 pr-3">
                    <Text className="font-body-bold text-[14px] text-text-primary">
                      Student Direct Email Access
                    </Text>
                    <Text className="font-body text-[12px] text-muted mt-0.5">
                      Displays a verified contact button on your public course profile
                    </Text>
                  </View>
                  <Switch
                    value={contactEnabled}
                    onValueChange={setContactEnabled}
                    trackColor={{ false: '#E2E8F0', true: '#A7F3D0' }}
                    thumbColor={contactEnabled ? '#059669' : '#FFFFFF'}
                  />
                </View>

                <Button
                  variant="default"
                  size="lg"
                  loading={saving}
                  onPress={handleSave}
                >
                  Save Faculty Profile
                </Button>
              </>
            )}
          </View>

          <View className="mt-4">
            <Pressable
              onPress={handleLogout}
              disabled={signingOut}
              className="bg-rose-bg border border-rose-border rounded-2xl py-3.5 items-center flex-row justify-center active:bg-rose-100"
            >
              {signingOut ? (
                <ActivityIndicator size="small" color="#E11D48" />
              ) : (
                <>
                  <FontAwesome5 name="sign-out-alt" size={14} color="#E11D48" />
                  <Text className="ml-2 font-body-bold text-[14px] text-rose-text">
                    Sign Out of Faculty Account
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LecturerProfileEdit;