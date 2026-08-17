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
  { letter: 'B', min: 60, klass: 'Second Class Upper (60–69%)', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
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
      Alert.alert('Invalid Input', 'Enter scores between 0 and 100.');
      return;
    }
    const score = caN * w.ca + testN * w.test + examN * w.exam;
    setResult(gradeFor(score));
  };

  const reverseCalculate = () => {
    const caN = parseFloat(revCA) || 0;
    const testN = parseFloat(revTest) || 0;
    if (caN < 0 || caN > 100 || testN < 0 || testN > 100) {
      Alert.alert('Invalid Input', 'Enter scores between 0 and 100.');
      return;
    }
    const targetBand = GRADE_BANDS.find((b) => b.letter === target)!;
    const needed = (targetBand.min - caN * w.ca - testN * w.test) / w.exam;
    if (needed > 100) {
      setRevResult(`Target ${target} is unreachable with these continuous assessment scores.`);
    } else if (needed <= 0) {
      setRevResult(`Target ${target} secured! Any passing exam score will suffice.`);
    } else {
      setRevResult(`You need at least ${Math.ceil(needed)}% in the final exam for a ${target}.`);
    }
  };

  const renderScoreInput = (value: string, onChange: (v: string) => void, label: string) => (
    <View className="flex-1">
      <Text className="font-body-medium text-[12px] text-text-secondary mb-1.5">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0–100"
        placeholderTextColor="#A1A1AA"
        className="bg-surface rounded-xl px-3 py-3.5 font-body-bold text-[16px] text-text-primary text-center border border-border"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center shadow-soft active:bg-soft"
            >
              <FontAwesome5 name="chevron-left" size={14} color="#09090B" />
            </Pressable>
            <View className="bg-violet-light px-3 py-1 rounded-full border border-violet-border">
              <Text className="font-body-bold text-[11px] text-violet">
                Grade Calculator
              </Text>
            </View>
            <View className="w-10" />
          </View>
          <Text className="font-headline text-[26px] text-text-primary leading-8 tracking-tight">
            Assessment Forecaster
          </Text>
          <Text className="font-body text-[14px] text-text-secondary mt-1">
            Calculate your semester Continuous Assessment & target exam standing.
          </Text>
        </View>

        {/* Calculator Card */}
        <View className="px-6 mt-4">
          <View className="bg-surface rounded-2xl border border-border/80 p-6 shadow-soft">
            <Text className="font-body-bold text-[12px] text-muted uppercase tracking-wider mb-2">
              Select Enrolled Course
            </Text>
            <View className="bg-surface rounded-xl overflow-hidden border border-border mb-5">
              <Picker
                selectedValue={courseId}
                onValueChange={setCourseId}
                style={{ backgroundColor: '#FFFFFF', color: '#09090B' }}
                dropdownIconColor="#71717A"
              >
                {courses.map((c) => (
                  <Picker.Item key={c.id} label={`${c.code} — ${c.title}`} value={c.id} />
                ))}
              </Picker>
            </View>

            <View className="flex-row gap-3 mb-2">
              {renderScoreInput(ca, setCa, `CA (${Math.round(w.ca * 100)}%)`)}
              {renderScoreInput(test, setTest, `Test (${Math.round(w.test * 100)}%)`)}
              {renderScoreInput(exam, setExam, `Exam (${Math.round(w.exam * 100)}%)`)}
            </View>

            <Text className="font-body text-[12px] text-muted mb-5 mt-1">
              Weights: CA {Math.round(w.ca * 100)}% • Test {Math.round(w.test * 100)}% • Exam {Math.round(w.exam * 100)}%
            </Text>

            <Button variant="default" size="default" onPress={calculate}>
              Calculate Projected Score
            </Button>

            {result && (
              <View
                style={{ backgroundColor: result.bg, borderColor: result.border }}
                className="mt-5 rounded-2xl p-5 flex-row items-center border shadow-soft"
              >
                <View
                  style={{ backgroundColor: result.color }}
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4 shadow-soft"
                >
                  <Text className="font-headline text-[22px] text-white">{result.letter}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-headline text-[20px] text-text-primary">
                    {Math.round(result.score * 10) / 10}%
                  </Text>
                  <Text style={{ color: result.color }} className="font-body-bold text-[13px] mt-0.5">
                    {result.klass}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Reverse Target Calculator Card */}
        <View className="px-6 mt-6">
          <View className="bg-surface rounded-2xl border border-border/80 p-6 shadow-soft">
            <View className="flex-row items-center gap-2 mb-1">
              <View className="w-2 h-2 rounded-full bg-violet" />
              <Text className="font-headline text-[17px] text-text-primary tracking-tight">
                Target Exam Score Requirement
              </Text>
            </View>
            <Text className="font-body text-[13px] text-text-secondary mt-1 mb-5">
              Enter your current CA and Test scores to calculate your required exam mark.
            </Text>

            <View className="flex-row gap-3 mb-4">
              {renderScoreInput(revCA, setRevCA, 'CA Score (0–100)')}
              {renderScoreInput(revTest, setRevTest, 'Test Score (0–100)')}
            </View>

            <Text className="font-body-bold text-[12px] text-muted uppercase tracking-wider mb-2">
              Desired Grade Target
            </Text>
            <View className="bg-surface rounded-xl overflow-hidden border border-border mb-5">
              <Picker
                selectedValue={target}
                onValueChange={setTarget}
                style={{ backgroundColor: '#FFFFFF', color: '#09090B' }}
                dropdownIconColor="#71717A"
              >
                {GRADE_BANDS.slice(0, 4).map((b) => (
                  <Picker.Item key={b.letter} label={`Grade ${b.letter} (${b.klass})`} value={b.letter} />
                ))}
              </Picker>
            </View>

            <Button variant="outline" size="default" onPress={reverseCalculate}>
              Compute Required Exam Score
            </Button>

            {revResult && (
              <View className="mt-5 bg-violet-light border border-violet-border rounded-2xl p-4">
                <Text className="font-body-bold text-[13px] text-violet leading-5">{revResult}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Grading Bands Reference with Distinct Band Colors */}
        <View className="px-6 mt-6">
          <View className="bg-surface rounded-2xl border border-border/80 p-6 shadow-soft">
            <Text className="font-body-bold text-[12px] text-muted uppercase tracking-wider mb-4">
              LASU Grading Scale Standard
            </Text>
            {GRADE_BANDS.map((band, idx) => (
              <View
                key={band.letter}
                className={`flex-row items-center py-3 ${idx < GRADE_BANDS.length - 1 ? 'border-b border-divider' : ''}`}
              >
                <View
                  style={{ backgroundColor: band.bg, borderColor: band.border }}
                  className="w-8 h-8 rounded-lg items-center justify-center mr-3 border"
                >
                  <Text style={{ color: band.color }} className="font-headline text-[13px]">
                    {band.letter}
                  </Text>
                </View>
                <Text className="flex-1 font-body-semibold text-[13px] text-text-primary">
                  {band.klass}
                </Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default GradePlanner;