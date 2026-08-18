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
        placeholderTextColor="#8A817C"
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
    fontFamily: 'Manrope_500Medium',
    fontSize: 14,
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DDD5',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    color: '#1A1A1A',
    // Soft elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputError: {
    borderColor: '#E11D48',
  },
  errorText: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#E11D48',
    textAlign: 'right',
  },
});

export default Input;