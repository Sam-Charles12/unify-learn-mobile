import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { DEPARTMENTS, LEVELS } from '@/types';
import { Picker } from '@react-native-picker/picker';
import { cn } from '@/lib/utils';

interface Slide {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'graduation-cap',
    iconColor: '#00A86B',
    title: 'Welcome to Unify Learn',
    subtitle:
      'Curriculum-aligned weekly content built for LASU Engineering students. No more scattered notes.',
  },
  {
    icon: 'check-circle',
    iconColor: '#005B96',
    title: 'Learn by doing',
    subtitle:
      'Read, interact and test yourself with mini checks, pulse checks and end-of-week quizzes.',
  },
  {
    icon: 'chart-line',
    iconColor: '#E5D45A',
    title: 'Stay on track',
    subtitle:
      'Pass each week to unlock the next. Your progress is tracked every step of the way.',
  },
];

const Onboarding: React.FC = () => {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const [matric, setMatric] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [saving, setSaving] = useState(false);

  const isLastSlide = index === SLIDES.length;

  const scrollTo = (i: number) => {
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const handleNext = () => {
    if (index < SLIDES.length) {
      scrollTo(index + 1);
    }
  };

  const handleFinish = async () => {
    if (!user) return;

    if (!matric.trim() || !department || !level) {
      Alert.alert('Missing Fields', 'Please fill in all fields to finish setup');
      return;
    }

    setSaving(true);
    try {
      await Promise.race([
        setDoc(
          doc(db, 'users', user.uid),
          {
            matric: matric.trim(),
            department,
            level,
            onboarded: true,
          },
          { merge: true }
        ),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timed out. Check your internet connection and try again.')),
            15000
          )
        ),
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await Promise.race([
        setDoc(doc(db, 'users', user.uid), { onboarded: true }, { merge: true }),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timed out. Check your internet connection and try again.')),
            15000
          )
        ),
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={{ width }} className="flex-1 px-8 justify-center items-center">
      <View className="w-28 h-28 rounded-pill bg-primary-light items-center justify-center mb-10">
        <FontAwesome5 name={item.icon} size={44} color={item.iconColor} />
      </View>
      <Text className="font-headline text-[26px] leading-9 text-text-primary text-center mb-3">
        {item.title}
      </Text>
      <Text className="font-body text-[16px] leading-6 text-text-secondary text-center">
        {item.subtitle}
      </Text>
    </View>
  );

  const renderProfileStep = () => (
    <View style={{ width }} className="flex-1 px-7 pt-8">
      <View className="w-16 h-16 rounded-pill bg-primary-light items-center justify-center mb-6">
        <FontAwesome5 name="user-plus" size={24} color="#00A86B" />
      </View>
      <Text className="font-headline text-[24px] leading-8 text-text-primary mb-2">
        Tell us about you
      </Text>
      <Text className="font-body text-[15px] leading-5 text-text-secondary mb-8">
        We use this to show you the right courses for your department and level.
      </Text>

      <View className="mb-5">
        <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
          Matric Number
        </Text>
        <View className="bg-soft rounded-pill px-5">
          <TextInput
            className="py-4 font-body text-[16px] text-text-primary"
            placeholder="e.g. 21/52CB001"
            placeholderTextColor="#8A817C"
            value={matric}
            onChangeText={setMatric}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View className="mb-5">
        <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
          Department
        </Text>
        <View className="bg-soft rounded-pill overflow-hidden">
          <Picker
            selectedValue={department}
            onValueChange={setDepartment}
            style={{ backgroundColor: '#F2F2F2' }}
            dropdownIconColor="#8A817C"
          >
            <Picker.Item label="Select department" value="" />
            {DEPARTMENTS.map((dept) => (
              <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View className="mb-8">
        <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
          Level
        </Text>
        <View className="bg-soft rounded-pill overflow-hidden">
          <Picker
            selectedValue={level}
            onValueChange={setLevel}
            style={{ backgroundColor: '#F2F2F2' }}
            dropdownIconColor="#8A817C"
          >
            <Picker.Item label="Select level" value="" />
            {LEVELS.map((l) => (
              <Picker.Item key={l.value} label={l.label} value={l.value} />
            ))}
          </Picker>
        </View>
      </View>

      <Pressable
        className="bg-primary rounded-pill py-4 items-center mb-4"
        onPress={handleFinish}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-body-bold text-[16px] text-white">Finish Setup</Text>
        )}
      </Pressable>
      <Pressable className="items-center py-2" onPress={handleSkip} disabled={saving}>
        <Text className="font-body-medium text-[14px] text-muted">Skip for now</Text>
      </Pressable>
    </View>
  );

  const renderItem = ({ index: i }: { index: number }) => {
    if (i === SLIDES.length) return renderProfileStep();
    return renderSlide({ item: SLIDES[i] });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row justify-between items-center px-7 pt-3 pb-2">
        <Pressable
          onPress={handleSkip}
          disabled={saving}
          className="py-2 pr-4"
        >
          <Text className="font-body-medium text-[14px] text-muted">Skip</Text>
        </Pressable>
        <View className="flex-row gap-2">
          {[...Array(SLIDES.length + 1)].map((_, i) => (
            <View
              key={i}
              className={cn(
                'h-2 rounded-pill',
                i === index ? 'w-6 bg-primary' : 'w-2 bg-border'
              )}
            />
          ))}
        </View>
        <View className="w-16" />
      </View>

      <FlatList
        ref={listRef}
        data={[0, 1, 2, 3]}
        renderItem={renderItem}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      {!isLastSlide && (
        <View className="px-7 pb-8">
          <Pressable
            className="bg-primary rounded-pill py-4 items-center"
            onPress={handleNext}
          >
            <Text className="font-body-bold text-[16px] text-white">Next</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Onboarding;