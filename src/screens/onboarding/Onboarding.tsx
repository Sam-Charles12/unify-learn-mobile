import React, { useRef, useState, useMemo } from 'react';
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
  ScrollView,
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
import { getSuggestedCourses, seedUserSelectedCourses, SeedCourse } from '@/lib/seedCourses';

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
  
  // Profile state
  const [matric, setMatric] = useState('');
  const [department, setDepartment] = useState('mech');
  const [level, setLevel] = useState('300');
  const [saving, setSaving] = useState(false);
  
  // Course selection state
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [courseStep, setCourseStep] = useState(false);

  // Available courses for selected department and level
  const availableCourses = useMemo(() => {
    return getSuggestedCourses(department, level);
  }, [department, level]);

  // Pre-select all available courses when availableCourses changes
  React.useEffect(() => {
    if (availableCourses.length > 0) {
      setSelectedCourseIds(availableCourses.map((c) => c.id));
    } else {
      setSelectedCourseIds([]);
    }
  }, [availableCourses]);

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCourseIds.length === availableCourses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(availableCourses.map((c) => c.id));
    }
  };

  const totalSelectedUnits = useMemo(() => {
    return availableCourses
      .filter((c) => selectedCourseIds.includes(c.id))
      .reduce((sum, c) => sum + (c.credits || 2), 0);
  }, [availableCourses, selectedCourseIds]);

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

  const handleProceedToCourses = () => {
    if (!matric.trim() || !department || !level) {
      Alert.alert('Incomplete Details', 'Please enter your Matric number, Department, and Level.');
      return;
    }
    setCourseStep(true);
  };

  const MIN_CREDITS = 15;
  const MAX_CREDITS = 26;

  const handleFinish = async () => {
    if (!user) return;

    if (selectedCourseIds.length === 0) {
      Alert.alert('No Courses Selected', 'Please select courses for your semester.');
      return;
    }

    if (totalSelectedUnits < MIN_CREDITS) {
      Alert.alert(
        'Below Minimum Credit Load',
        `The minimum required workload is ${MIN_CREDITS} credit units per semester. You currently have ${totalSelectedUnits} units selected. Please select additional courses.`
      );
      return;
    }

    if (totalSelectedUnits > MAX_CREDITS) {
      Alert.alert(
        'Maximum Credit Load Exceeded',
        `The maximum allowed limit is ${MAX_CREDITS} credit units per semester. You currently have ${totalSelectedUnits} units selected. Please deselect some courses.`
      );
      return;
    }

    setSaving(true);
    try {
      // 1. Save user profile with enrolled courses
      await setDoc(
        doc(db, 'users', user.uid),
        {
          matric: matric.trim(),
          department,
          level,
          enrolledCourses: selectedCourseIds,
          onboarded: true,
        },
        { merge: true }
      );

      // 2. Ensure selected courses and weeks are seeded into Firestore
      await seedUserSelectedCourses(selectedCourseIds);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong while setting up your portal.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { onboarded: true }, { merge: true });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={{ width }} className="flex-1 px-8 justify-center items-center">
      <View
        className="w-20 h-20 rounded-3xl items-center justify-center mb-8"
        style={{
          backgroundColor: '#E8F0EC',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <FontAwesome5 name={item.icon} size={28} color="#059669" />
      </View>
      <View className="bg-pastel-sage px-3.5 py-1.5 rounded-full mb-3">
        <Text className="font-body-bold text-[11px] text-primary-dark uppercase tracking-wider">
          {item.tag}
        </Text>
      </View>
      <Text className="font-headline text-[28px] leading-[36px] text-text-primary text-center mb-4 tracking-tight">
        {item.title}
      </Text>
      <Text className="font-body text-[15px] leading-6 text-text-secondary text-center max-w-[320px]">
        {item.subtitle}
      </Text>
    </View>
  );

  const renderCourseSelection = () => {
    const isUnderMin = totalSelectedUnits < MIN_CREDITS;
    const isOverMax = totalSelectedUnits > MAX_CREDITS;
    const isValid = !isUnderMin && !isOverMax;
    const progressPct = Math.min(100, Math.round((totalSelectedUnits / MAX_CREDITS) * 100));

    return (
      <View style={{ width }} className="flex-1 px-6 pt-2 pb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable
            onPress={() => setCourseStep(false)}
            className="w-10 h-10 rounded-full items-center justify-center active:opacity-80"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#E7DDD5' }}
          >
            <FontAwesome5 name="chevron-left" size={13} color="#1A1A1A" />
          </Pressable>
          <View
            className="px-3.5 py-1.5 rounded-full"
            style={{
              backgroundColor: isOverMax ? '#FFF1F2' : isUnderMin ? '#FFFBEB' : '#E8F0EC',
              borderWidth: 1,
              borderColor: isOverMax ? '#FECDD3' : isUnderMin ? '#FDE68A' : '#A7F3D0',
            }}
          >
            <Text
              className="font-body-bold text-[11px]"
              style={{ color: isOverMax ? '#E11D48' : isUnderMin ? '#D97706' : '#047857' }}
            >
              {totalSelectedUnits} / {MAX_CREDITS} Max Units
            </Text>
          </View>
        </View>

        <Text className="font-headline text-[24px] leading-8 text-text-primary mb-1 tracking-tight">
          Select Your Courses
        </Text>
        <Text className="font-body text-[13px] leading-5 text-text-secondary mb-3">
          Curriculum requires between {MIN_CREDITS} and {MAX_CREDITS} credit units per semester.
        </Text>

        {/* Credit Unit Load Progress Bar & Status */}
        <View className="rounded-2xl p-3.5 mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 1, borderColor: '#E7DDD5' }}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-body-bold text-[12px] text-text-primary">
              Semester Credit Load
            </Text>
            <Text
              className="font-body-bold text-[12px]"
              style={{ color: isOverMax ? '#E11D48' : isUnderMin ? '#D97706' : '#059669' }}
            >
              {isOverMax
                ? `Limit Exceeded (+${totalSelectedUnits - MAX_CREDITS} units)`
                : isUnderMin
                ? `Need ${MIN_CREDITS - totalSelectedUnits} more units`
                : 'Optimal Credit Load'}
            </Text>
          </View>
          <View className="h-2.5 rounded-full bg-soft overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                backgroundColor: isOverMax ? '#E11D48' : isUnderMin ? '#D97706' : '#059669',
              }}
            />
          </View>
        </View>

        {/* Select All Toggle Bar */}
        <View className="flex-row items-center justify-between pb-2 mb-2" style={{ borderBottomWidth: 1, borderBottomColor: '#F0EAE3' }}>
          <Text className="font-body-semibold text-[13px] text-text-primary">
            Available Modules ({availableCourses.length})
          </Text>
          <Pressable onPress={toggleSelectAll} className="py-1 px-2.5 rounded-lg bg-soft">
            <Text className="font-body-bold text-[11px] text-primary">
              {selectedCourseIds.length === availableCourses.length ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
        </View>

        {/* Course List Scroll */}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-3" contentContainerStyle={{ gap: 10 }}>
          {availableCourses.length === 0 ? (
            <View className="p-6 items-center rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
              <Text className="font-headline text-[15px] text-text-primary mb-1">No courses found</Text>
              <Text className="font-body text-[12px] text-muted text-center">
                No matching courses for {department.toUpperCase()} - {level} Level.
              </Text>
            </View>
          ) : (
            availableCourses.map((c) => {
              const isSelected = selectedCourseIds.includes(c.id);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => toggleCourse(c.id)}
                  className="rounded-2xl p-4 flex-row items-center justify-between active:opacity-90"
                  style={{
                    backgroundColor: isSelected ? '#E8F0EC' : 'rgba(255,255,255,0.75)',
                    borderWidth: 1,
                    borderColor: isSelected ? '#A7F3D0' : '#E7DDD5',
                  }}
                >
                  <View className="flex-1 pr-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <View
                        className="px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : '#F2EDE8',
                        }}
                      >
                        <Text
                          className="font-body-bold text-[11px]"
                          style={{ color: isSelected ? '#047857' : '#1A1A1A' }}
                        >
                          {c.code}
                        </Text>
                      </View>
                      <Text className="font-body text-[11px] text-muted">
                        {c.credits || 2} Units
                      </Text>
                    </View>
                    <Text
                      className="font-headline text-[14px] text-text-primary leading-5"
                      numberOfLines={2}
                    >
                      {c.title}
                    </Text>
                  </View>

                  {/* Checkbox */}
                  <View
                    className="w-6 h-6 rounded-lg items-center justify-center"
                    style={{
                      backgroundColor: isSelected ? '#059669' : '#FFFFFF',
                      borderWidth: 1,
                      borderColor: isSelected ? '#059669' : '#D1C4B8',
                    }}
                  >
                    {isSelected && <FontAwesome5 name="check" size={11} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>

        <Button
          variant="default"
          size="lg"
          loading={saving}
          onPress={handleFinish}
        >
          {isValid
            ? `Complete Setup (${totalSelectedUnits} Units)`
            : isUnderMin
            ? `Need at least ${MIN_CREDITS} Units (${totalSelectedUnits} now)`
            : `Exceeds ${MAX_CREDITS} Units (${totalSelectedUnits} now)`}
        </Button>
      </View>
    );
  };

  const renderProfileStep = () => {
    if (courseStep) {
      return renderCourseSelection();
    }

    return (
      <View style={{ width }} className="flex-1 px-7 pt-2">
        <Text className="font-headline text-[26px] leading-8 text-text-primary mb-2 tracking-tight">
          Academic Profile Setup
        </Text>
        <Text className="font-body text-[14px] leading-5 text-text-secondary mb-6">
          This configures your syllabus modules, timetable, and department announcements.
        </Text>

        <View className="mb-4">
          <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
            Matriculation Number
          </Text>
          <View className="rounded-2xl px-4" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DDD5' }}>
            <TextInput
              className="py-3.5 font-body text-[15px] text-text-primary"
              placeholder="e.g. 21/52CB001"
              placeholderTextColor="#8A817C"
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
          <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DDD5' }}>
            <Picker
              selectedValue={department}
              onValueChange={setDepartment}
              style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
              dropdownIconColor="#8A817C"
            >
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
          <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DDD5' }}>
            <Picker
              selectedValue={level}
              onValueChange={setLevel}
              style={{ backgroundColor: '#FFFFFF', color: '#1A1A1A' }}
              dropdownIconColor="#8A817C"
            >
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
          onPress={handleProceedToCourses}
        >
          Select Semester Courses ({availableCourses.length})
        </Button>

        <Pressable className="items-center py-2" onPress={handleSkip} disabled={saving}>
          <Text className="font-body-medium text-[13px] text-muted">Skip for now</Text>
        </Pressable>
      </View>
    );
  };

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