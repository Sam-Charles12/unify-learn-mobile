import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { Lecturer } from '@/hooks/useLecturers';
import { RootStackParamList } from '@/navigation/types';
import { Button } from '@/components/ui/button';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type LecturerRouteProp = RouteProp<RootStackParamList, 'Lecturer'>;

const LecturerProfile: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<LecturerRouteProp>();
  const { lecturerId } = route.params;

  const [lecturer, setLecturer] = useState<Lecturer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'lecturers', lecturerId));
        if (snap.exists()) {
          setLecturer({ id: snap.id, ...snap.data() } as Lecturer);
        }
      } catch (e) {
        console.warn('Failed to load lecturer:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [lecturerId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#059669" />
        <Text className="font-body text-[13px] text-muted mt-2">Loading faculty profile...</Text>
      </SafeAreaView>
    );
  }

  if (!lecturer) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-8" edges={['top']}>
        <Text className="font-headline text-[18px] text-text-primary mb-2">Lecturer Not Found</Text>
        <Button variant="default" size="sm" onPress={() => navigation.goBack()}>
          Return Back
        </Button>
      </SafeAreaView>
    );
  }

  const initials = lecturer.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

  const details = [
    { icon: 'briefcase', label: 'Academic Title', value: lecturer.title },
    { icon: 'university', label: 'Faculty', value: lecturer.faculty },
    { icon: 'sitemap', label: 'Department', value: lecturer.department?.toUpperCase() },
  ].filter((d) => d.value);

  const handleEmail = () => {
    if (!lecturer.email) return;
    Linking.openURL(`mailto:${lecturer.email}`).catch(() =>
      Alert.alert('Error', 'Could not open email client on device.')
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-5 pt-3 pb-5 bg-surface border-b border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
            >
              <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
            </Pressable>
            <Text className="font-body-bold text-text-primary text-[16px]">Faculty Profile</Text>
            <View className="w-10" />
          </View>

          <View className="items-center py-2">
            {lecturer.photoURL ? (
              <Image
                source={{ uri: lecturer.photoURL }}
                className="w-20 h-20 rounded-2xl border border-border shadow-card mb-3"
              />
            ) : (
              <View className="w-20 h-20 rounded-2xl bg-accent-light border border-accent-border items-center justify-center shadow-card mb-3">
                <Text className="font-headline text-[26px] text-accent">{initials}</Text>
              </View>
            )}
            <Text className="font-headline text-[22px] text-text-primary text-center">
              {lecturer.name}
            </Text>
            <Text className="font-body-medium text-[13px] text-text-secondary mt-0.5">
              {lecturer.title}
            </Text>
          </View>
        </View>

        {/* Office Hours Bento Card */}
        {lecturer.officeHours ? (
          <View className="mx-4 mt-4 bg-primary-light border border-primary-border rounded-2xl p-4 flex-row items-center shadow-soft">
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-3.5">
              <FontAwesome5 name="clock" size={16} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="font-body-bold text-[11px] text-primary-dark uppercase tracking-wider">
                Official Office Hours
              </Text>
              <Text className="font-body-semibold text-[14px] text-primary-dark mt-0.5">
                {lecturer.officeHours}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Faculty Details */}
        {details.length > 0 && (
          <View className="mx-4 mt-4 bg-surface rounded-2xl border border-border p-4 shadow-card">
            <Text className="font-headline text-[15px] text-text-primary mb-2">Faculty Information</Text>
            {details.map((d, idx) => (
              <View
                key={d.label}
                className={`flex-row items-center py-2.5 ${idx < details.length - 1 ? 'border-b border-divider' : ''}`}
              >
                <View className="w-9 h-9 rounded-xl bg-background border border-border items-center justify-center mr-3">
                  <FontAwesome5 name={d.icon} size={13} color="#475569" />
                </View>
                <View className="flex-1">
                  <Text className="font-body-medium text-[11px] text-muted">{d.label}</Text>
                  <Text className="font-body-bold text-[14px] text-text-primary mt-0.5">{d.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Biography */}
        {lecturer.bio ? (
          <View className="mx-4 mt-4 bg-surface rounded-2xl border border-border p-4 shadow-card">
            <Text className="font-headline text-[15px] text-text-primary mb-2">Academic Biography</Text>
            <Text className="font-body text-[14px] text-text-secondary leading-6">{lecturer.bio}</Text>
          </View>
        ) : null}

        {/* Contact Lecturer */}
        {lecturer.contactEnabled && lecturer.email ? (
          <View className="mx-4 mt-4">
            <Button
              variant="default"
              size="lg"
              onPress={handleEmail}
            >
              Contact via University Email
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LecturerProfile;