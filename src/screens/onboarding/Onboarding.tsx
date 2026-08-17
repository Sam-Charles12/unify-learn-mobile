import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Alert,
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
  tag: string;
  title: string;
  subtitle: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'graduation-cap',
    tag: 'Academic Syllabus',
    title: 'LASU Engineering,\nWeek by Week',
    subtitle:
      'Structured curriculum modules curated for your department. Built to eliminate scattered notes.',
  },
  {
    icon: 'brain',
    tag: 'Active Recall',
    title: 'Interactive\nKnowledge Checks',
    subtitle:
      'Verify understanding with interactive questions and pass gates before proceeding to the next week.',
  },
  {
    icon: 'chart-pie',
    tag: 'Academic Transparency',
    title: 'Track Milestones &\nGrade Standing',
    subtitle:
      'Plan Continuous Assessment scores and forecast exam targets with the built-in Grade Planner.',
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
      Alert.alert('Incomplete Details', 'Please complete your Matric number, Department, and Level.');
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
            () => reject(new Error('Connection timed out. Please try again.')),
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
            () => reject(new Error('Connection timed out. Please try again.')),
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
      <View className="w-20 h-20 rounded-full bg-soft border border-border items-center justify-center mb-8 shadow-soft">
        <FontAwesome5 name={item.icon} size={28} color="#09090B" />
      </View>
      <Text className="font-body-bold text-[12px] text-primary uppercase tracking-wider mb-3">
        {item.tag}
      </Text>
      <Text className="font-headline text-[28px] leading-[36px] text-text-primary text-center mb-4 tracking-tight">
        {item.title}
      </Text>
      <Text className="font-body text-[15px] leading-6 text-text-secondary text-center max-w-[320px]">
        {item.subtitle}
      </Text>
    </View>
  );

  const renderProfileStep = () => (
    <View style={{ width }} className="flex-1 px-7 pt-4">
      <Text className="font-headline text-[26px] leading-8 text-text-primary mb-2 tracking-tight">
        Academic Profile Setup
      </Text>
      <Text className="font-body text-[14px] leading-5 text-text-secondary mb-8">
        This configures your timetable, course modules, and faculty announcements.
      </Text>

      <View className="mb-5">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Matriculation Number
        </Text>
        <View className="bg-surface rounded-2xl px-4 border border-border">
          <TextInput
            className="py-4 font-body text-[15px] text-text-primary"
            placeholder="e.g. 21/52CB001"
            placeholderTextColor="#A1A1AA"
            value={matric}
            onChangeText={setMatric}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View className="mb-5">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Department
        </Text>
        <View className="bg-surface rounded-2xl overflow-hidden border border-border">
          <Picker
            selectedValue={department}
            onValueChange={setDepartment}
            style={{ backgroundColor: '#FFFFFF', color: '#09090B' }}
            dropdownIconColor="#71717A"
          >
            <Picker.Item label="Select your department" value="" color="#A1A1AA" />
            {DEPARTMENTS.map((dept) => (
              <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View className="mb-8">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Level
        </Text>
        <View className="bg-surface rounded-2xl overflow-hidden border border-border">
          <Picker
            selectedValue={level}
            onValueChange={setLevel}
            style={{ backgroundColor: '#FFFFFF', color: '#09090B' }}
            dropdownIconColor="#71717A"
          >
            <Picker.Item label="Select current level" value="" color="#A1A1AA" />
            {LEVELS.map((l) => (
              <Picker.Item key={l.value} label={l.label} value={l.value} />
            ))}
          </Picker>
        </View>
      </View>

      <Button
        variant="default"
        size="lg"
        className="mb-4"
        loading={saving}
        onPress={handleFinish}
      >
        Complete Registration
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
      <View className="flex-row justify-between items-center px-7 pt-4 pb-2">
        <Pressable
          onPress={handleSkip}
          disabled={saving}
          className="py-2 pr-4"
        >
          <Text className="font-body-semibold text-[13px] text-muted">Skip</Text>
        </Pressable>
        <View className="flex-row items-center gap-2">
          {[...Array(SLIDES.length + 1)].map((_, i) => (
            <View
              key={i}
              className={cn(
                'h-1.5 rounded-full',
                i === index ? 'w-6 bg-ink' : 'w-1.5 bg-border'
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
        <View className="px-7 pb-10">
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