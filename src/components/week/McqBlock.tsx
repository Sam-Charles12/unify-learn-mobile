import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { cn } from '@/lib/utils';

interface McqBlockProps {
  question: string;
  options: string[];
  correctIndex: number;
  showFeedback?: boolean;
  onAnswered?: (correct: boolean) => void;
}

const McqBlock: React.FC<McqBlockProps> = ({ question, options, correctIndex, showFeedback = true, onAnswered }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    onAnswered?.(index === correctIndex);
  };

  return (
    <View className="bg-card rounded-[20px] border border-border p-5 shadow-soft">
      <Text className="font-body-semibold text-[15px] text-text-primary mb-4 leading-6">
        {question}
      </Text>
      {options.map((option, index) => {
        const isCorrect = answered && index === correctIndex;
        const isWrong = answered && selected === index && index !== correctIndex;
        return (
          <Pressable
            key={index}
            onPress={() => handleSelect(index)}
            className={cn(
              'flex-row items-center rounded-[16px] border px-4 py-3.5 mb-2.5',
              answered && isCorrect
                ? 'bg-primary-light border-primary'
                : answered && isWrong
                  ? 'bg-[#FDE8E8] border-[#DC2626]'
                  : 'bg-surface border-border'
            )}
          >
            <View
              className={cn(
                'w-7 h-7 rounded-full items-center justify-center mr-3',
                answered && isCorrect
                  ? 'bg-primary'
                  : answered && isWrong
                    ? 'bg-[#DC2626]'
                    : 'bg-background border border-divider'
              )}
            >
              {answered && (isCorrect || isWrong) && (
                <FontAwesome5 name={isCorrect ? 'check' : 'times'} size={11} color="#ffffff" />
              )}
            </View>
            <Text
              className={cn(
                'flex-1 font-body-medium text-[14px] leading-5',
                answered && isCorrect ? 'text-primary-dark' : answered && isWrong ? 'text-[#B91C1C]' : 'text-text-primary'
              )}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
      {showFeedback && answered && (
        <View className="mt-1">
          {selected === correctIndex ? (
            <Text className="font-body-medium text-[13px] text-primary-dark">Correct. Nice work!</Text>
          ) : (
            <Text className="font-body-medium text-[13px] text-[#B91C1C]">
              Not quite. The correct answer is {String.fromCharCode(65 + correctIndex)}.
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default McqBlock;