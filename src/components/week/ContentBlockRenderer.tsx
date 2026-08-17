import React from 'react';
import { View, Text, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import McqBlock from './McqBlock';
import FitbBlock from './FitbBlock';
import RevealBlock from './RevealBlock';
import PulseCheck, { QuizQuestion } from './PulseCheck';
import EoqQuiz from './EoqQuiz';

export interface Block {
  type: string;
  data: Record<string, any>;
}

interface ContentBlockRendererProps {
  block: Block;
  onPass?: (weekNumber: number) => Promise<void>;
  weekNumber?: number;
}

const ContentBlockRenderer: React.FC<ContentBlockRendererProps> = ({ block, onPass, weekNumber }) => {
  const d = block.data ?? {};

  switch (block.type) {
    case 'heading':
      return (
        <Text className="font-headline text-[22px] text-text-primary mt-8 mb-3 leading-8">
          {d.text ?? ''}
        </Text>
      );

    case 'paragraph':
      return (
        <Text className="font-body text-[15px] text-text-primary leading-7 mb-4">
          {d.text ?? ''}
        </Text>
      );

    case 'definition':
      return (
        <View className="bg-primary-light/60 rounded-[18px] border-l-4 border-primary px-5 py-4 mb-4">
          <View className="flex-row items-center mb-1.5">
            <FontAwesome5 name="bookmark" size={12} color="#00895A" />
            <Text className="ml-2 font-headline text-[15px] text-primary-dark">
              {d.term ?? ''}
            </Text>
          </View>
          <Text className="font-body text-[14px] text-text-primary leading-6">
            {d.definition ?? ''}
          </Text>
        </View>
      );

    case 'example':
      return (
        <View className="bg-card rounded-[18px] border border-border p-5 mb-4 shadow-soft">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 rounded-full bg-[#DCEEFF] items-center justify-center mr-2.5">
              <FontAwesome5 name="pencil-alt" size={12} color="#005B96" />
            </View>
            <Text className="font-headline text-[15px] text-accent">
              {d.title ?? 'Worked Example'}
            </Text>
          </View>
          {d.problem ? (
            <Text className="font-body-medium text-[14px] text-text-primary leading-6 mb-3">
              {d.problem}
            </Text>
          ) : null}
          {d.solution ? (
            <View className="bg-background rounded-[14px] px-4 py-3 border border-divider">
              <Text className="font-body-medium text-[12px] text-muted uppercase tracking-wide mb-1">
                Solution
              </Text>
              <Text className="font-body text-[14px] text-text-primary leading-6">
                {d.solution}
              </Text>
            </View>
          ) : null}
        </View>
      );

    case 'image':
      return (
        <View className="mb-4">
          {d.url ? (
            <Image
              source={{ uri: d.url }}
              className="w-full h-48 rounded-[18px]"
              resizeMode="cover"
            />
          ) : null}
          {d.caption ? (
            <Text className="font-body-medium text-[12px] text-muted text-center mt-2">
              {d.caption}
            </Text>
          ) : null}
        </View>
      );

    case 'math':
      return (
        <View className="bg-surface border border-border rounded-[16px] px-5 py-4 mb-4">
          <Text className="font-body-medium text-[12px] text-muted uppercase tracking-wide text-center mb-1">
            Math
          </Text>
          <Text className="font-body-medium text-[16px] text-text-primary text-center leading-7">
            {d.latex ?? ''}
          </Text>
        </View>
      );

    case 'mcq':
      return (
        <View className="mb-4">
          <McqBlock
            question={d.question ?? ''}
            options={Array.isArray(d.options) ? d.options : []}
            correctIndex={typeof d.correctIndex === 'number' ? d.correctIndex : 0}
          />
        </View>
      );

    case 'fitb':
      return (
        <View className="mb-4">
          <FitbBlock prompt={d.prompt ?? ''} answer={d.answer ?? ''} />
        </View>
      );

    case 'reveal':
      return (
        <View className="mb-4">
          <RevealBlock statement={d.statement ?? ''} explanation={d.explanation ?? ''} />
        </View>
      );

    case 'pulse_check':
      return (
        <PulseCheck
          title={d.title ?? 'Pulse Check'}
          questions={Array.isArray(d.questions) ? (d.questions as QuizQuestion[]) : []}
        />
      );

    case 'eoq':
      return onPass && weekNumber ? (
        <EoqQuiz
          weekNumber={weekNumber}
          questions={Array.isArray(d.questions) ? (d.questions as QuizQuestion[]) : []}
          onPass={onPass}
        />
      ) : null;

    default:
      return null;
  }
};

export default ContentBlockRenderer;