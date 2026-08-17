import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { cn } from '@/lib/utils';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface PulseCheckProps {
  title: string;
  questions: QuizQuestion[];
}

const PulseCheck: React.FC<PulseCheckProps> = ({ title, questions }) => {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every((a) => a !== null);
  const score = questions.filter((q, i) => answers[i] === q.correctIndex).length;

  const handleSubmit = () => setSubmitted(true);

  return (
    <View className="bg-card rounded-[24px] border border-border p-5 shadow-soft mt-6">
      <View className="flex-row items-center mb-1">
        <View className="w-10 h-10 rounded-full bg-[#BFD9D2] items-center justify-center mr-3">
          <FontAwesome5 name="heartbeat" size={15} color="#00895A" />
        </View>
        <View className="flex-1">
          <Text className="font-headline text-[17px] text-text-primary">{title || 'Pulse Check'}</Text>
          <Text className="font-body text-[12px] text-muted">
            {submitted ? `You scored ${score}/${questions.length}` : 'Answer to see how you are doing'}
          </Text>
        </View>
      </View>

      {questions.map((q, qi) => {
        const isCorrect = submitted && answers[qi] === q.correctIndex;
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

      {!submitted && (
        <Pressable
          onPress={handleSubmit}
          disabled={!allAnswered}
          className={cn(
            'mt-4 rounded-[16px] py-3.5 items-center',
            allAnswered ? 'bg-primary' : 'bg-border'
          )}
        >
          <Text className="font-body-semibold text-[14px] text-white">Submit answers</Text>
        </Pressable>
      )}

      {submitted && (
        <View
          className={cn(
            'mt-4 rounded-[16px] p-4 flex-row items-center',
            score >= Math.ceil(questions.length * 0.6) ? 'bg-primary-light' : 'bg-[#FDE8E8]'
          )}
        >
          <FontAwesome5
            name={score >= Math.ceil(questions.length * 0.6) ? 'thumbs-up' : 'book-open'}
            size={15}
            color={score >= Math.ceil(questions.length * 0.6) ? '#00895A' : '#B91C1C'}
          />
          <Text
            className={cn(
              'ml-3 flex-1 font-body-medium text-[13px]',
              score >= Math.ceil(questions.length * 0.6) ? 'text-primary-dark' : 'text-[#B91C1C]'
            )}
          >
            {score >= Math.ceil(questions.length * 0.6)
              ? `Good progress! You scored ${score}/${questions.length}. Keep going.`
              : `You scored ${score}/${questions.length}. Review the notes above and try again.`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default PulseCheck;