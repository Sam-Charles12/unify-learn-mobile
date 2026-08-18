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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-3 pb-5">
          <View className="flex-row items-center justify-between mb-5">
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
            <Text className="font-body-bold text-text-primary text-[16px]">Faculty Profile</Text>
            <View className="w-11" />
          </View>

          <View className="items-center py-2">
            {lecturer.photoURL ? (
              <View
                className="w-20 h-20 rounded-3xl mb-3"
                style={{
                  borderWidth: 1,
                  borderColor: '#E7DDD5',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Image
                  source={{ uri: lecturer.photoURL }}
                  className="w-full h-full rounded-3xl"
                />
              </View>
            ) : (
              <View
                className="w-20 h-20 rounded-3xl items-center justify-center mb-3"
                style={{
                  backgroundColor: '#ECEAF4',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Text className="font-headline text-[26px]" style={{ color: '#7C3AED' }}>{initials}</Text>
              </View>
            )}
            <Text className="font-headline text-[24px] text-text-primary text-center tracking-tight">
              {lecturer.name}
            </Text>
            <Text className="font-body-medium text-[13px] text-text-secondary mt-1">
              {lecturer.title}
            </Text>
          </View>
        </View>

        {/* Office Hours */}
        {lecturer.officeHours ? (
          <View className="mx-5 mb-4">
            <View
              className="rounded-2xl p-4 flex-row items-center"
              style={{
                backgroundColor: '#E8F0EC',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="w-11 h-11 rounded-xl bg-primary items-center justify-center mr-3.5">
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
          </View>
        ) : null}

        {/* Faculty Details */}
        {details.length > 0 && (
          <View className="mx-5 mb-4">
            <View
              className="rounded-2xl p-5"
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
              <Text className="font-headline text-[15px] text-text-primary mb-3">Faculty Information</Text>
              {details.map((d, idx) => (
                <View
                  key={d.label}
                  className={`flex-row items-center py-3 ${idx < details.length - 1 ? 'border-b' : ''}`}
                  style={{ borderBottomColor: '#F0EAE3' }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: '#F2EDE8' }}
                  >
                    <FontAwesome5 name={d.icon} size={13} color="#6B6560" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-body-medium text-[11px] text-muted">{d.label}</Text>
                    <Text className="font-body-bold text-[14px] text-text-primary mt-0.5">{d.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Biography */}
        {lecturer.bio ? (
          <View className="mx-5 mb-4">
            <View
              className="rounded-2xl p-5"
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
              <Text className="font-headline text-[15px] text-text-primary mb-2">Academic Biography</Text>
              <Text className="font-body text-[14px] text-text-secondary leading-6">{lecturer.bio}</Text>
            </View>
          </View>
        ) : null}

        {/* Contact */}
        {lecturer.contactEnabled && lecturer.email ? (
          <View className="mx-5 mb-4">
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