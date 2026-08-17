import React from 'react';
import { View, Text } from 'react-native';
import { useLecturers } from '@/hooks/useLecturers';

interface LecturerAvatarStackProps {
  lecturerIds: string[];
  size?: number;
  max?: number;
}

const LecturerAvatarStack: React.FC<LecturerAvatarStackProps> = ({ lecturerIds, size = 28, max = 3 }) => {
  const { lecturers } = useLecturers(lecturerIds);
  const visible = lecturers.slice(0, max);
  const overflow = Math.max(0, lecturers.length - max);

  if (lecturers.length === 0) return null;

  return (
    <View className="flex-row" style={{ marginRight: 0 }}>
      {visible.map((l, i) => (
        <View
          key={l.id}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: i === 0 ? 0 : -size / 3.5,
          }}
          className="bg-primary border-2 border-card items-center justify-center"
        >
          <Text style={{ fontSize: size * 0.36 }} className="font-body-bold text-white">
            {l.name?.split(' ').slice(0, 2).map((s) => s[0]).join('') ?? '?'}
          </Text>
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            marginLeft: -size / 3.5,
          }}
          className="bg-surface border-2 border-card items-center justify-center"
        >
          <Text style={{ fontSize: size * 0.32 }} className="font-body-bold text-muted">
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
};

export default LecturerAvatarStack;