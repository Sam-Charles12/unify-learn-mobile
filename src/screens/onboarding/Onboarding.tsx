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
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Slide {
  icon: string;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
  tag: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'graduation-cap',
    iconColor: '#059669',
    badgeBg: '#ECFDF5',
    badgeBorder: '#A7F3D0',
    tag: 'Curriculum-Aligned',
    title: 'Your Faculty Syllabus,\nWeek by Week',
    subtitle:
      'Engineered specifically for LASU Engineering students. No more scattered WhatsApp notes or outdated PDFs.',
  },
  {
    icon: 'brain',
    iconColor: '#4F46E5',
    badgeBg: '#EEF2FF',
    badgeBorder: '#C7D2FE',
    tag: 'Active Recall',
    title: 'Learn Faster with\nInteractive Checks',
    subtitle:
      'Test your comprehension right inside reading sessions with Mini Checks, Pulse Checks, and End-of-Week Quizzes.',
  },
  {
    icon: 'chart-line',
    iconColor: '#D97706',
    badgeBg: '#FFFBEB',
    badgeBorder: '#FDE68A',
    tag: 'Academic Transparency',
    title: 'Track Milestones &\nGrade Projections',
    subtitle:
      'Pass each week to unlock the next. Use the built-in Grade Planner to calculate continuous assessment scores.',
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
      Alert.alert('Incomplete Profile', 'Please enter your Matric number, Department, and Level to view your courses.');
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
            () => reject(new Error('Connection timeout. Please check your internet connection.')),
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
            () => reject(new Error('Connection timeout. Please check your internet connection.')),
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
      {/* Bento Card Tile */}
      <View
        style={{ backgroundColor: item.badgeBg, borderColor: item.badgeBorder }}
        className="w-24 h-24 rounded-3xl items-center justify-center mb-6 border shadow-card"
      >
        <FontAwesome5 name={item.icon} size={38} color={item.iconColor} />
      </View>
      <View
        style={{ backgroundColor: item.badgeBg, borderColor: item.badgeBorder }}
        className="px-3.5 py-1 rounded-full border mb-4"
      >
        <Text style={{ color: item.iconColor }} className="font-body-bold text-[12px] uppercase tracking-wider">
          {item.tag}
        </Text>
      </View>
      <Text className="font-headline text-[26px] leading-[34px] text-text-primary text-center mb-3">
        {item.title}
      </Text>
      <Text className="font-body text-[15px] leading-6 text-text-secondary text-center max-w-[320px]">
        {item.subtitle}
      </Text>
    </View>
  );

  const renderProfileStep = () => (
    <View style={{ width }} className="flex-1 px-6 pt-4">
      <View className="w-14 h-14 rounded-2xl bg-primary-light border border-primary-border items-center justify-center mb-4">
        <FontAwesome5 name="user-graduate" size={22} color="#059669" />
      </View>
      <Text className="font-headline text-[24px] leading-8 text-text-primary mb-1">
        Setup Your Academic Profile
      </Text>
      <Text className="font-body text-[14px] leading-5 text-text-secondary mb-6">
        This configures your timetable, lecturers, and department courses.
      </Text>

      <View className="mb-4">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Matric Number
        </Text>
        <View className="bg-surface rounded-xl px-4 border border-border">
          <TextInput
            className="py-3.5 font-body text-[15px] text-text-primary"
            placeholder="e.g. 21/52CB001"
            placeholderTextColor="#94A3B8"
            value={matric}
            onChangeText={setMatric}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Department
        </Text>
        <View className="bg-surface rounded-xl overflow-hidden border border-border">
          <Picker
            selectedValue={department}
            onValueChange={setDepartment}
            style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
            dropdownIconColor="#64748B"
          >
            <Picker.Item label="Select your department" value="" color="#94A3B8" />
            {DEPARTMENTS.map((dept) => (
              <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View className="mb-6">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Level
        </Text>
        <View className="bg-surface rounded-xl overflow-hidden border border-border">
          <Picker
            selectedValue={level}
            onValueChange={setLevel}
            style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
            dropdownIconColor="#64748B"
          >
            <Picker.Item label="Select current level" value="" color="#94A3B8" />
            {LEVELS.map((l) => (
              <Picker.Item key={l.value} label={l.label} value={l.value} />
            ))}
          </Picker>
        </View>
      </View>

      <Button
        variant="default"
        size="lg"
        className="mb-3"
        loading={saving}
        onPress={handleFinish}
      >
        Enter Dashboard
      </Button>

      <Pressable className="items-center py-2" onPress={handleSkip} disabled={saving}>
        <Text className="font-body-medium text-[13px] text-muted">Skip for now</Text>
      </Pressable>
    </View>
  );

  const renderItem = ({ index: i }: { index: number }) => {
    if (i === SLIDES.length) return renderProfileStep();
    return renderSlide({ item: SLIDES[i] });
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top Bar */}
      <View className="flex-row justify-between items-center px-6 pt-3 pb-2">
        <Pressable
          onPress={handleSkip}
          disabled={saving}
          className="py-2 pr-4"
        >
          <Text className="font-body-bold text-[13px] text-muted">Skip</Text>
        </Pressable>
        <View className="flex-row items-center gap-1.5">
          {[...Array(SLIDES.length + 1)].map((_, i) => (
            <View
              key={i}
              className={cn(
                'h-2 rounded-full',
                i === index ? 'w-6 bg-primary' : 'w-2 bg-border-strong'
              )}
            />
          ))}
        </View>
        <View className="w-12" />
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
        <View className="px-6 pb-8">
          <Button
            variant="default"
            size="lg"
            onPress={handleNext}
          >
            Continue
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Onboarding;