import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { FontAwesome5 } from '@expo/vector-icons';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RootStackParamList } from '@/navigation/types';
import { cn } from '@/lib/utils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GradeResult {
  score: number;
  letter: string;
  klass: string;
  color: string;
  bg: string;
}

const GRADE_BANDS: { letter: string; min: number; klass: string; color: string; bg: string }[] = [
  { letter: 'A', min: 70, klass: 'First Class', color: '#00895A', bg: '#CFF5E6' },
  { letter: 'B', min: 60, klass: 'Second Class Upper', color: '#005B96', bg: '#DCEEFF' },
  { letter: 'C', min: 50, klass: 'Second Class Lower', color: '#8B9658', bg: '#E5D45A' },
  { letter: 'D', min: 45, klass: 'Third Class', color: '#B45309', bg: '#E78B73' },
  { letter: 'E', min: 40, klass: 'Pass', color: '#8A817C', bg: '#F2F2F2' },
  { letter: 'F', min: 0, klass: 'Fail', color: '#B91C1C', bg: '#FDE8E8' },
];

const gradeFor = (score: number): GradeResult => {
  const band = GRADE_BANDS.find((b) => score >= b.min) ?? GRADE_BANDS[GRADE_BANDS.length - 1];
  return { score, letter: band.letter, klass: band.klass, color: band.color, bg: band.bg };
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

  const [calcLoading, setCalcLoading] = useState(false);

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
      } finally {
        setCalcLoading(false);
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
      Alert.alert('Invalid input', 'Enter scores between 0 and 100 for all three components.');
      return;
    }
    const score = caN * w.ca + testN * w.test + examN * w.exam;
    setResult(gradeFor(score));
  };

  const reverseCalculate = () => {
    const caN = parseFloat(revCA) || 0;
    const testN = parseFloat(revTest) || 0;
    if (caN < 0 || caN > 100 || testN < 0 || testN > 100) {
      Alert.alert('Invalid input', 'Enter scores between 0 and 100.');
      return;
    }
    const targetBand = GRADE_BANDS.find((b) => b.letter === target)!;
    const needed = (targetBand.min - caN * w.ca - testN * w.test) / w.exam;
    if (needed > 100) {
      setRevResult(`You cannot reach ${target} with these scores — even 100% in the exam would give ${Math.round((caN * w.ca + testN * w.test + 100 * w.exam) * 10) / 10}%.`);
    } else if (needed <= 0) {
      setRevResult(`You already have ${target} secured! Any exam score will do.`);
    } else {
      setRevResult(`You need ${Math.ceil(needed)}% in the exam for a ${target} (${targetBand.klass}).`);
    }
  };

  const input = (value: string, onChange: (v: string) => void, label: string) => (
    <View className="flex-1">
      <Text className="font-body-medium text-[13px] text-text-secondary mb-2">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0-100"
        placeholderTextColor="#8A817C"
        className="bg-soft rounded-pill px-4 py-3.5 font-body-semibold text-[15px] text-text-primary text-center"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="bg-accent rounded-b-[28px] px-6 pt-4 pb-8 shadow-soft">
          <View className="flex-row items-center justify-between mb-3">
            <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
            </Pressable>
            <Text className="font-body-bold text-white text-[15px]">Grade Planner</Text>
            <View className="w-9" />
          </View>
          <Text className="font-headline text-[22px] text-white leading-7">
            Plan your grades
          </Text>
          <Text className="font-body text-[13px] text-white/75 mt-1">
            Calculate your projected score or find out what exam score you need
          </Text>
        </View>

        <View className="mx-5 -mt-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
          <Text className="font-body-medium text-[13px] text-text-secondary mb-2">Course</Text>
          <View className="bg-soft rounded-pill overflow-hidden mb-5">
            <Picker selectedValue={courseId} onValueChange={setCourseId} style={{ backgroundColor: '#F2F2F2' }} dropdownIconColor="#8A817C">
              {courses.map((c) => (
                <Picker.Item key={c.id} label={`${c.code} — ${c.title}`} value={c.id} />
              ))}
            </Picker>
          </View>

          <Text className="font-headline text-[16px] text-text-primary mb-4">Projected score</Text>
          <View className="flex-row gap-3 mb-1">
            {input(ca, setCa, `CA (${Math.round(w.ca * 100)}%)`)}
            {input(test, setTest, `Test (${Math.round(w.test * 100)}%)`)}
            {input(exam, setExam, `Exam (${Math.round(w.exam * 100)}%)`)}
          </View>
          <Text className="font-body text-[11px] text-muted mb-4">
            Weights: CA {Math.round(w.ca * 100)}% · Test {Math.round(w.test * 100)}% · Exam {Math.round(w.exam * 100)}%
          </Text>

          <Pressable onPress={calculate} className="bg-accent rounded-pill py-3.5 items-center">
            <Text className="font-body-semibold text-[15px] text-white">Calculate</Text>
          </Pressable>

          {result && (
            <View style={{ backgroundColor: result.bg }} className="mt-4 rounded-[18px] p-4 flex-row items-center">
              <View style={{ backgroundColor: result.color }} className="w-12 h-12 rounded-[16px] items-center justify-center mr-3">
                <Text className="font-headline text-[20px] text-white">{result.letter}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-headline text-[18px] text-text-primary">
                  {Math.round(result.score * 10) / 10}%
                </Text>
                <Text style={{ color: result.color }} className="font-body-medium text-[13px]">
                  {result.klass}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="mx-5 mt-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
          <Text className="font-headline text-[16px] text-text-primary mb-1">
            What score do I need?
          </Text>
          <Text className="font-body text-[12px] text-muted mb-4">
            Enter your CA and Test scores, pick a target grade, and we'll tell you the exam score required.
          </Text>

          <View className="flex-row gap-3 mb-4">
            {input(revCA, setRevCA, 'CA %')}
            {input(revTest, setRevTest, 'Test %')}
          </View>

          <Text className="font-body-medium text-[13px] text-text-secondary mb-2">Target grade</Text>
          <View className="bg-soft rounded-pill overflow-hidden mb-4">
            <Picker selectedValue={target} onValueChange={setTarget} style={{ backgroundColor: '#F2F2F2' }} dropdownIconColor="#8A817C">
              {GRADE_BANDS.slice(0, 5).map((b) => (
                <Picker.Item key={b.letter} label={`${b.letter} — ${b.klass}`} value={b.letter} />
              ))}
            </Picker>
          </View>

          <Pressable onPress={reverseCalculate} className="bg-primary rounded-pill py-3.5 items-center">
            <Text className="font-body-semibold text-[15px] text-white">Calculate required score</Text>
          </Pressable>

          {revResult && (
            <View className="mt-4 bg-primary-light rounded-[18px] p-4">
              <Text className="font-body-medium text-[14px] text-primary-dark leading-6">{revResult}</Text>
            </View>
          )}
        </View>

        <View className="mx-5 mt-5 bg-card rounded-[24px] border border-border p-5 shadow-soft">
          <Text className="font-headline text-[16px] text-text-primary mb-3">LASU grade bands</Text>
          {GRADE_BANDS.map((band) => (
            <View key={band.letter} className="flex-row items-center py-2">
              <View style={{ backgroundColor: band.bg }} className="w-8 h-8 rounded-[10px] items-center justify-center mr-3">
                <Text style={{ color: band.color }} className="font-headline text-[14px]">{band.letter}</Text>
              </View>
              <Text className="flex-1 font-body-medium text-[13px] text-text-primary">{band.klass}</Text>
              <Text className="font-body-medium text-[12px] text-muted">
                {band.min}–{band.letter === 'A' ? '100' : GRADE_BANDS[GRADE_BANDS.indexOf(band) - 1].min - 1}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GradePlanner;