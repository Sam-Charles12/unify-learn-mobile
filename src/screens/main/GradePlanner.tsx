import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RootStackParamList } from '@/navigation/types';
import { Button } from '@/components/ui/button';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GradeResult {
  score: number;
  letter: string;
  klass: string;
  color: string;
  bg: string;
  border: string;
}

const GRADE_BANDS = [
  { letter: 'A', min: 70, klass: 'First Class (70–100%)', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  { letter: 'B', min: 60, klass: 'Second Class Upper (60–69%)', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  { letter: 'C', min: 50, klass: 'Second Class Lower (50–59%)', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  { letter: 'D', min: 45, klass: 'Third Class (45–49%)', color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
  { letter: 'E', min: 40, klass: 'Pass (40–44%)', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  { letter: 'F', min: 0, klass: 'Fail (0–39%)', color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
];

const gradeFor = (score: number): GradeResult => {
  const band = GRADE_BANDS.find((b) => score >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
  return { score, letter: band.letter, klass: band.klass, color: band.color, bg: band.bg, border: band.border };
};

const GradePlanner: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { profile } = useUserProfile();

  const [courses, setCourses] = useState<{ id: string; code: string; title: string; weights?: { ca?: number; test?: number; exam?: number } }[]>([]);
  const [courseId, setCourseId] = useState('');
  const [ca, setCa] = useState('');
  const [test, setTest] = useState('');
  const [exam, setExam] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);

  const [target, setTarget] = useState('A');
  const [revCA, setRevCA] = useState('');
  const [revTest, setRevTest] = useState('');
  const [revResult, setRevResult] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      if (!profile?.department || !profile?.level) return;
      try {
        const q = query(
          collection(db, 'courses'),
          where('departments', 'array-contains', profile.department)
        );
        const snap = await getDocs(q);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as any))
          .filter((c) => !Array.isArray(c.levels) || c.levels.includes(profile.level ?? ''));
        setCourses(list);
        if (list.length > 0) setCourseId(list[0].id);
      } catch (e) {
        console.warn('Failed to load courses for planner:', e);
      }
    })();
  }, [profile?.department, profile?.level]);

  const course = courses.find((c) => c.id === courseId);
  const w = { ca: 0.2, test: 0.2, exam: 0.6, ...(course?.weights ?? {}) };

  const calculate = () => {
    const caN = parseFloat(ca);
    const testN = parseFloat(test);
    const examN = parseFloat(exam);
    if ([caN, testN, examN].some((n) => isNaN(n) || n < 0 || n > 100)) {
      Alert.alert('Invalid Input', 'Please enter valid scores between 0 and 100.');
      return;
    }
    const score = caN * w.ca + testN * w.test + examN * w.exam;
    setResult(gradeFor(score));
  };

  const reverseCalculate = () => {
    const caN = parseFloat(revCA) || 0;
    const testN = parseFloat(revTest) || 0;
    if (caN < 0 || caN > 100 || testN < 0 || testN > 100) {
      Alert.alert('Invalid Input', 'Enter valid scores between 0 and 100.');
      return;
    }
    const targetBand = GRADE_BANDS.find((b) => b.letter === target)!;
    const needed = (targetBand.min - caN * w.ca - testN * w.test) / w.exam;
    if (needed > 100) {
      setRevResult(`Target ${target} is unreachable with these continuous assessment scores (Maximum attainable: ${Math.round((caN * w.ca + testN * w.test + 100 * w.exam) * 10) / 10}%).`);
    } else if (needed <= 0) {
      setRevResult(`Target ${target} secured! You already have enough points to reach ${target}.`);
    } else {
      setRevResult(`You need minimum ${Math.ceil(needed)}% in the semester exam to secure an ${target}.`);
    }
  };

  const renderScoreInput = (value: string, onChange: (v: string) => void, label: string) => (
    <View className="flex-1">
      <Text className="font-body-semibold text-[12px] text-text-secondary mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0-100"
        placeholderTextColor="#94A3B8"
        className="bg-surface rounded-xl px-3 py-3 font-body-bold text-[15px] text-text-primary text-center border border-border"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-5 pt-3 pb-5 bg-surface border-b border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
            >
              <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
            </Pressable>
            <Text className="font-body-bold text-text-primary text-[16px]">Grade Planner</Text>
            <View className="w-10" />
          </View>
          <Text className="font-headline text-[24px] text-text-primary leading-8">
            Academic Score Forecast
          </Text>
          <Text className="font-body text-[13px] text-text-secondary mt-0.5">
            LASU Faculty of Engineering assessment model
          </Text>
        </View>

        {/* Bento Card 1: Projected Score Calculator */}
        <View className="mx-4 mt-4 bg-surface rounded-2xl border border-border p-5 shadow-card">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-lg bg-primary-light border border-primary-border items-center justify-center mr-2.5">
              <FontAwesome5 name="calculator" size={13} color="#059669" />
            </View>
            <Text className="font-headline text-[16px] text-text-primary">
              Calculate Course Grade
            </Text>
          </View>

          <Text className="font-body-semibold text-[12px] text-text-secondary mb-1.5">Select Course</Text>
          <View className="bg-surface rounded-xl overflow-hidden border border-border mb-4">
            <Picker
              selectedValue={courseId}
              onValueChange={setCourseId}
              style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
              dropdownIconColor="#64748B"
            >
              {courses.map((c) => (
                <Picker.Item key={c.id} label={`${c.code} — ${c.title}`} value={c.id} />
              ))}
            </Picker>
          </View>

          <View className="flex-row gap-2.5 mb-2">
            {renderScoreInput(ca, setCa, `CA (${Math.round(w.ca * 100)}%)`)}
            {renderScoreInput(test, setTest, `Test (${Math.round(w.test * 100)}%)`)}
            {renderScoreInput(exam, setExam, `Exam (${Math.round(w.exam * 100)}%)`)}
          </View>

          <Text className="font-body text-[11px] text-muted mb-4">
            Formula: (CA × {w.ca}) + (Test × {w.test}) + (Exam × {w.exam})
          </Text>

          <Button variant="default" size="default" onPress={calculate}>
            Calculate Score
          </Button>

          {result && (
            <View
              style={{ backgroundColor: result.bg, borderColor: result.border }}
              className="mt-4 rounded-2xl p-4 flex-row items-center border shadow-soft"
            >
              <View
                style={{ backgroundColor: result.color }}
                className="w-12 h-12 rounded-xl items-center justify-center mr-3.5 shadow-soft"
              >
                <Text className="font-headline text-[22px] text-white">{result.letter}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-headline text-[18px] text-text-primary">
                  {Math.round(result.score * 10) / 10}%
                </Text>
                <Text style={{ color: result.color }} className="font-body-bold text-[13px]">
                  {result.klass}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bento Card 2: Reverse Exam Target Calculator */}
        <View className="mx-4 mt-4 bg-surface rounded-2xl border border-border p-5 shadow-card">
          <View className="flex-row items-center mb-1">
            <View className="w-8 h-8 rounded-lg bg-accent-light border border-accent-border items-center justify-center mr-2.5">
              <FontAwesome5 name="bullseye" size={13} color="#4F46E5" />
            </View>
            <Text className="font-headline text-[16px] text-text-primary">
              What Exam Score Do I Need?
            </Text>
          </View>
          <Text className="font-body text-[12px] text-text-secondary mb-4 ml-10">
            Set your target grade and find out your minimum exam score.
          </Text>

          <View className="flex-row gap-2.5 mb-3">
            {renderScoreInput(revCA, setRevCA, 'CA Score (0–100)')}
            {renderScoreInput(revTest, setRevTest, 'Test Score (0–100)')}
          </View>

          <Text className="font-body-semibold text-[12px] text-text-secondary mb-1.5">Target Letter Grade</Text>
          <View className="bg-surface rounded-xl overflow-hidden border border-border mb-4">
            <Picker
              selectedValue={target}
              onValueChange={setTarget}
              style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
              dropdownIconColor="#64748B"
            >
              {GRADE_BANDS.slice(0, 4).map((b) => (
                <Picker.Item key={b.letter} label={`Grade ${b.letter} (${b.klass})`} value={b.letter} />
              ))}
            </Picker>
          </View>

          <Button variant="dark" size="default" onPress={reverseCalculate}>
            Compute Target Exam Score
          </Button>

          {revResult && (
            <View className="mt-4 bg-indigo-bg border border-indigo-border rounded-2xl p-4">
              <Text className="font-body-bold text-[13px] text-indigo-text leading-5">{revResult}</Text>
            </View>
          )}
        </View>

        {/* Bento Card 3: LASU Grade Scale Reference */}
        <View className="mx-4 mt-4 bg-surface rounded-2xl border border-border p-5 shadow-card">
          <Text className="font-headline text-[15px] text-text-primary mb-3">
            LASU Engineering Grading Scale
          </Text>
          {GRADE_BANDS.map((band, idx) => (
            <View
              key={band.letter}
              className={`flex-row items-center py-2.5 ${idx < GRADE_BANDS.length - 1 ? 'border-b border-divider' : ''}`}
            >
              <View
                style={{ backgroundColor: band.bg, borderColor: band.border }}
                className="w-8 h-8 rounded-lg items-center justify-center mr-3 border"
              >
                <Text style={{ color: band.color }} className="font-headline text-[14px]">
                  {band.letter}
                </Text>
              </View>
              <Text className="flex-1 font-body-semibold text-[13px] text-text-primary">
                {band.klass}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default GradePlanner;