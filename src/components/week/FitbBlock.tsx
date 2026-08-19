import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { cn } from '@/lib/utils';
import { logEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

interface FitbBlockProps {
  prompt: string;
  answer: string;
}

const FitbBlock: React.FC<FitbBlockProps> = ({ prompt, answer }) => {
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(false);

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const isCorrect = checked && normalize(value) === normalize(answer);

  return (
    <View className="bg-card rounded-[20px] border border-border p-5 shadow-soft">
      <View className="flex-row items-center mb-3">
        <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center mr-2.5">
          <FontAwesome5 name="keyboard" size={12} color="#00895A" />
        </View>
        <Text className="font-body-medium text-[11px] text-muted uppercase tracking-wide">
          Fill in the blank
        </Text>
      </View>
      <Text className="font-body-medium text-[15px] text-text-primary mb-4 leading-6">{prompt}</Text>

      <View className="flex-row items-center gap-2">
        <TextInput
          value={value}
          onChangeText={(t) => {
            setValue(t);
            setChecked(false);
          }}
          placeholder="Type your answer"
          placeholderTextColor="#8A817C"
          className="flex-1 bg-surface border border-border rounded-[16px] px-4 py-3 font-body-medium text-[14px] text-text-primary"
        />
        <Pressable
          onPress={() => {
            setChecked(true);
            logEvent(ANALYTICS_EVENTS.miniCheckAnswer, {
              type: 'fitb',
              correct: normalize(value) === normalize(answer),
            });
          }}
          className={cn(
            'rounded-[16px] px-5 py-3.5',
            checked ? (isCorrect ? 'bg-primary' : 'bg-[#DC2626]') : 'bg-primary'
          )}
        >
          <FontAwesome5 name="check" size={14} color="#ffffff" />
        </Pressable>
      </View>

      {checked && (
        <View className="mt-3 flex-row items-center">
          <FontAwesome5
            name={isCorrect ? 'check-circle' : 'times-circle'}
            size={14}
            color={isCorrect ? '#00895A' : '#B91C1C'}
          />
          <Text
            className={cn(
              'ml-2 font-body-medium text-[13px]',
              isCorrect ? 'text-primary-dark' : 'text-[#B91C1C]'
            )}
          >
            {isCorrect ? 'Correct! Good job.' : `The correct answer is "${answer}".`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default FitbBlock;