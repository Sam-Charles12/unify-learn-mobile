import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { cn } from '@/lib/utils';

interface RevealBlockProps {
  statement: string;
  explanation: string;
}

const RevealBlock: React.FC<RevealBlockProps> = ({ statement, explanation }) => {
  const [revealed, setRevealed] = useState(false);

  return (
    <View className="bg-card rounded-[20px] border border-border p-5 shadow-soft">
      <View className="flex-row items-center mb-3">
        <View className="w-8 h-8 rounded-full bg-[#E5D45A]/40 items-center justify-center mr-2.5">
          <FontAwesome5 name="lightbulb" size={13} color="#8B9658" />
        </View>
        <Text className="font-body-medium text-[11px] text-muted uppercase tracking-wide">
          Think first
        </Text>
      </View>
      <Text className="font-body-medium text-[15px] text-text-primary mb-4 leading-6">
        {statement}
      </Text>

      {!revealed ? (
        <Pressable
          onPress={() => setRevealed(true)}
          className="flex-row items-center justify-center bg-primary-light rounded-[16px] px-4 py-3.5"
        >
          <FontAwesome5 name="eye" size={13} color="#00895A" />
          <Text className="ml-2 font-body-semibold text-[13px] text-primary-dark">
            Reveal explanation
          </Text>
        </Pressable>
      ) : (
        <View className="bg-surface border border-primary/30 rounded-[16px] p-4">
          <Text className="font-body-medium text-[14px] text-text-primary leading-6">
            {explanation}
          </Text>
        </View>
      )}
    </View>
  );
};

export default RevealBlock;