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
      Alert.alert('Saved', 'Your profile has been updated.');
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
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View className="bg-accent rounded-b-[28px] px-6 pt-4 pb-12 shadow-soft">
            <View className="flex-row items-center justify-between mb-4">
              <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
                <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
              </Pressable>
              <Text className="font-body-bold text-white text-[15px]">My Profile</Text>
              <View className="w-9" />
            </View>
            <View className="items-center">
              <View className="w-20 h-20 rounded-pill bg-white/15 items-center justify-center mb-3">
                <Text className="font-headline text-[28px] text-white">{initials}</Text>
              </View>
              <Text className="font-headline text-[22px] text-white">
                {profile?.name ?? user?.displayName ?? 'Lecturer'}
              </Text>
              <Text className="font-body text-[13px] text-white/75 mt-1">
                {user?.email}
              </Text>
            </View>
          </View>

          <View className="mx-5 -mt-6 bg-card rounded-[24px] border border-border p-5 shadow-soft">
            {loading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#005B96" />
              </View>
            ) : (
              <>
                <Text className="font-body-medium text-[13px] text-text-secondary mb-2">Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Senior Lecturer"
                  placeholderTextColor="#8A817C"
                  className="bg-soft rounded-pill px-4 py-3.5 font-body-medium text-[15px] text-text-primary mb-4"
                />

                <Text className="font-body-medium text-[13px] text-text-secondary mb-2">Office hours</Text>
                <TextInput
                  value={officeHours}
                  onChangeText={setOfficeHours}
                  placeholder="e.g. Mon & Wed, 10:00 – 12:00"
                  placeholderTextColor="#8A817C"
                  className="bg-soft rounded-pill px-4 py-3.5 font-body-medium text-[15px] text-text-primary mb-4"
                />

                <Text className="font-body-medium text-[13px] text-text-secondary mb-2">Biography</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell students about yourself…"
                  placeholderTextColor="#8A817C"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  className="bg-soft rounded-[16px] px-4 py-3.5 font-body-medium text-[15px] text-text-primary min-h-[110px] mb-4"
                />

                <View className="flex-row items-center justify-between py-3 border-b border-divider/50 mb-4">
                  <View className="flex-1">
                    <Text className="font-body-semibold text-[14px] text-text-primary">
                      Allow student contact
                    </Text>
                    <Text className="font-body text-[12px] text-muted mt-0.5">
                      Students see a "Contact lecturer" button
                    </Text>
                  </View>
                  <Switch
                    value={contactEnabled}
                    onValueChange={setContactEnabled}
                    trackColor={{ false: '#E7DDD5', true: '#00A86B' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  className="bg-accent rounded-pill py-4 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="font-body-semibold text-[15px] text-white">Save changes</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

          <Pressable
            onPress={handleLogout}
            disabled={signingOut}
            className="mx-5 mt-5 bg-[#FDE8E8] border border-[#DC2626]/30 rounded-[20px] py-4 items-center flex-row justify-center"
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LecturerProfileEdit;