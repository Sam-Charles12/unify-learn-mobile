import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  secureTextEntry,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          secureTextEntry && { paddingRight: 50 },
        ]}
        secureTextEntry={secureTextEntry}
        placeholderTextColor="#9a9a9a"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#0a0a0a',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dededa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: '#0a0a0a',
    elevation: 1,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'right',
  },
});

export default Input;