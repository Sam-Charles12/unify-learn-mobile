import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { cn } from '@/lib/utils';
import { QuizQuestion } from './PulseCheck';
import { logEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

interface EoqQuizProps {
  weekNumber: number;
  questions: QuizQuestion[];
  onPass: (weekNumber: number) => Promise<void>;
}

const PASS_THRESHOLD = 0.6;

const EoqQuiz: React.FC<EoqQuizProps> = ({ weekNumber, questions, onPass }) => {
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const shuffled = useMemo(() => {
    if (round === 0) return questions;
    const withRound = questions.map((q) => ({ ...q, options: [...q.options] }));
    return withRound.map((q) => {
      const order = q.options
        .map((_, i) => i)
        .sort(() => Math.random() - 0.5);
      const correctIndex = order.indexOf(q.correctIndex);
      return { ...q, options: order.map((i) => q.options[i]), correctIndex };
    });
  }, [round, questions]);

  const allAnswered = answers.every((a) => a !== null);
  const score = shuffled.filter((q, i) => answers[i] === q.correctIndex).length;
  const passedThisRound = score / shuffled.length >= PASS_THRESHOLD;

  const handleSubmit = async () => {
    setSubmitted(true);
    setPassed(passedThisRound);
    logEvent(ANALYTICS_EVENTS.eoqSubmitted, {
      weekNumber,
      score,
      total: shuffled.length,
      round: round + 1,
    });
    if (passedThisRound) {
      logEvent(ANALYTICS_EVENTS.eoqPassed, {
        weekNumber,
        score,
        total: shuffled.length,
      });
      setSaving(true);
      try {
        await onPass(weekNumber);
      } catch (e) {
        console.warn('Failed to save progress:', e);
      } finally {
        setSaving(false);
      }
    } else {
      logEvent(ANALYTICS_EVENTS.eoqFailed, {
        weekNumber,
        score,
        total: shuffled.length,
      });
    }
  };

  const handleRetry = () => {
    setRound((r) => r + 1);
    setAnswers(shuffled.map(() => null));
    setSubmitted(false);
    setPassed(null);
  };

  return (
    <View className="bg-card rounded-[24px] border border-border p-5 shadow-soft mt-6">
      <View className="flex-row items-center mb-1">
        <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
          <FontAwesome5 name="trophy" size={15} color="#ffffff" />
        </View>
        <View className="flex-1">
          <Text className="font-headline text-[17px] text-text-primary">End of Week Quiz</Text>
          <Text className="font-body text-[12px] text-muted">
            Pass with {Math.round(PASS_THRESHOLD * 100)}% or more to unlock Week {weekNumber + 1}
          </Text>
        </View>
      </View>

      {submitted && passed !== null && (
        <View
          className={cn(
            'mt-4 rounded-[16px] p-4',
            passed ? 'bg-primary-light' : 'bg-[#FDE8E8]'
          )}
        >
          <View className="flex-row items-center">
            <FontAwesome5
              name={passed ? 'check-circle' : 'times-circle'}
              size={22}
              color={passed ? '#00895A' : '#B91C1C'}
            />
            <View className="ml-3 flex-1">
              <Text
                className={cn(
                  'font-headline text-[16px]',
                  passed ? 'text-primary-dark' : 'text-[#B91C1C]'
                )}
              >
                {passed
                  ? `Week ${weekNumber} Complete!`
                  : `You scored ${score}/${shuffled.length}`}
              </Text>
              <Text
                className={cn(
                  'font-body-medium text-[13px] mt-0.5 leading-5',
                  passed ? 'text-primary-dark' : 'text-[#B91C1C]'
                )}
              >
                {passed
                  ? saving
                    ? 'Saving your progress...'
                    : `Week ${weekNumber + 1} is now unlocked. Great work!`
                  : `You need ${Math.round(PASS_THRESHOLD * 100)}% to pass. Review the notes and try again.`}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center">
            <Text className="font-body-medium text-[13px] text-muted mr-3">Score</Text>
            <View className="flex-1 h-2 rounded-pill bg-background overflow-hidden">
              <View
                className={cn('h-full rounded-pill', passed ? 'bg-primary' : 'bg-[#DC2626]')}
                style={{ width: `${(score / shuffled.length) * 100}%` }}
              />
            </View>
            <Text className="font-body-bold text-[13px] text-text-primary ml-3">
              {Math.round((score / shuffled.length) * 100)}%
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={{ maxHeight: 420 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 4 }}
      >
        {shuffled.map((q, qi) => {
          const isCorrect = submitted && answers[qi] === q.correctIndex;
          const isWrong = submitted && answers[qi] !== null && answers[qi] !== q.correctIndex;
          return (
            <View key={qi} className="mt-5">
              <Text className="font-body-semibold text-[14px] text-text-primary mb-3 leading-5">
                {qi + 1}. {q.question}
              </Text>
              {q.options.map((option, oi) => {
                const isSel = answers[qi] === oi;
                const showCorrect = submitted && oi === q.correctIndex;
                const showWrong = submitted && isSel && oi !== q.correctIndex;
                return (
                  <Pressable
                    key={oi}
                    disabled={submitted}
                    onPress={() =>
                      setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                    }
                    className={cn(
                      'flex-row items-center rounded-[14px] border px-4 py-3 mb-2',
                      showCorrect
                        ? 'bg-primary-light border-primary'
                        : showWrong
                          ? 'bg-[#FDE8E8] border-[#DC2626]'
                          : isSel
                            ? 'bg-primary/10 border-primary'
                            : 'bg-surface border-border'
                    )}
                  >
                    <View
                      className={cn(
                        'w-6 h-6 rounded-full items-center justify-center mr-3',
                        showCorrect
                          ? 'bg-primary'
                          : showWrong
                            ? 'bg-[#DC2626]'
                            : isSel
                              ? 'bg-primary'
                              : 'bg-background border border-divider'
                      )}
                    >
                      {(showCorrect || showWrong || isSel) && (
                        <FontAwesome5
                          name={showCorrect ? 'check' : showWrong ? 'times' : ''}
                          size={10}
                          color="#ffffff"
                        />
                      )}
                    </View>
                    <Text
                      className={cn(
                        'flex-1 font-body-medium text-[13px]',
                        showCorrect ? 'text-primary-dark' : showWrong ? 'text-[#B91C1C]' : 'text-text-primary'
                      )}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {!submitted && (
        <Pressable
          onPress={handleSubmit}
          disabled={!allAnswered}
          className={cn(
            'mt-4 rounded-[16px] py-4 items-center',
            allAnswered ? 'bg-primary' : 'bg-border'
          )}
        >
          <Text className="font-body-semibold text-[15px] text-white">
            Submit quiz ({shuffled.length} questions)
          </Text>
        </Pressable>
      )}

      {submitted && !passed && (
        <Pressable
          onPress={handleRetry}
          className="mt-3 rounded-[16px] py-3.5 items-center bg-primary-light border border-primary"
        >
          <Text className="font-body-semibold text-[14px] text-primary-dark">Try Again</Text>
        </Pressable>
      )}

      {saving && (
        <View className="mt-3 flex-row items-center justify-center">
          <ActivityIndicator size="small" color="#00A86B" />
        </View>
      )}
    </View>
  );
};

export default EoqQuiz;