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
        <ActivityIndicator size="large" color="#00A86B" />
      </SafeAreaView>
    );
  }

  if (!lecturer) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-10" edges={['top']}>
        <Text className="font-headline text-[18px] text-text-primary">Lecturer not found</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-4 bg-primary rounded-pill px-6 py-3">
          <Text className="font-body-semibold text-[14px] text-white">Go back</Text>
        </Pressable>
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
    { icon: 'briefcase', label: 'Title', value: lecturer.title },
    { icon: 'building', label: 'Faculty', value: lecturer.faculty },
    { icon: 'sitemap', label: 'Department', value: lecturer.department?.toUpperCase() },
  ].filter((d) => d.value);

  const handleEmail = () => {
    if (!lecturer.email) return;
    Linking.openURL(`mailto:${lecturer.email}`).catch(() =>
      Alert.alert('Error', 'Could not open email app.')
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="bg-accent rounded-b-[28px] px-6 pt-4 pb-14 shadow-soft">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
            </Pressable>
            <Text className="font-body-bold text-white text-[15px]">Lecturer</Text>
            <View className="w-9" />
          </View>
        </View>

        <View className="-mt-12 mx-5 items-center">
          {lecturer.photoURL ? (
            <Image source={{ uri: lecturer.photoURL }} className="w-24 h-24 rounded-pill border-4 border-white shadow-soft" />
          ) : (
            <View className="w-24 h-24 rounded-pill bg-primary border-4 border-white items-center justify-center shadow-soft">
              <Text className="font-headline text-[32px] text-white">{initials}</Text>
            </View>
          )}
          <Text className="font-headline text-[22px] text-text-primary mt-3">{lecturer.name}</Text>
          <Text className="font-body-medium text-[14px] text-muted mt-1">{lecturer.title}</Text>
        </View>

        {lecturer.officeHours ? (
          <View className="mx-5 mt-6 bg-primary-light rounded-[20px] border border-primary/30 p-4 flex-row items-center">
            <View className="w-10 h-10 rounded-[14px] bg-primary items-center justify-center mr-3">
              <FontAwesome5 name="clock" size={15} color="#ffffff" />
            </View>
            <View className="flex-1">
              <Text className="font-body-medium text-[11px] text-primary-dark uppercase tracking-wide">
                Office hours
              </Text>
              <Text className="font-body-semibold text-[14px] text-primary-dark mt-0.5">
                {lecturer.officeHours}
              </Text>
            </View>
          </View>
        ) : null}

        {details.length > 0 && (
          <View className="mx-5 mt-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
            <Text className="font-headline text-[16px] text-text-primary mb-2">About</Text>
            {details.map((d) => (
              <View key={d.label} className="flex-row items-center py-2.5 border-b border-divider/50 last:border-0">
                <View className="w-9 h-9 rounded-[12px] bg-background items-center justify-center mr-3">
                  <FontAwesome5 name={d.icon} size={13} color="#555555" />
                </View>
                <View className="flex-1">
                  <Text className="font-body-medium text-[11px] text-muted">{d.label}</Text>
                  <Text className="font-body-semibold text-[14px] text-text-primary mt-0.5">{d.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {lecturer.bio ? (
          <View className="mx-5 mt-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
            <Text className="font-headline text-[16px] text-text-primary mb-2">Biography</Text>
            <Text className="font-body text-[14px] text-text-secondary leading-6">{lecturer.bio}</Text>
          </View>
        ) : null}

        {lecturer.contactEnabled && lecturer.email ? (
          <Pressable
            onPress={handleEmail}
            className="mx-5 mt-5 bg-primary rounded-[20px] py-4 items-center flex-row justify-center shadow-soft"
          >
            <FontAwesome5 name="envelope" size={15} color="#ffffff" />
            <Text className="ml-2 font-body-semibold text-[15px] text-white">Contact lecturer</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default LecturerProfile;