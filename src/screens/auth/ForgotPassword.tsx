import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { AuthStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const ForgotPassword: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert('Check your inbox', 'A password reset link has been sent to your email.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : error?.message ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="px-6 pt-3 pb-6 border-b border-border bg-surface">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => navigation.goBack()}
              className="w-10 h-10 rounded-xl bg-background border border-border items-center justify-center shadow-soft"
            >
              <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
            </Pressable>
            <Text className="font-body-bold text-text-primary text-[15px]">Reset Password</Text>
            <View className="w-10" />
          </View>
          
          <View className="w-14 h-14 rounded-2xl bg-primary-light border border-primary-border items-center justify-center mb-3">
            <FontAwesome5 name="key" size={20} color="#059669" />
          </View>
          <Text className="font-headline text-[24px] text-text-primary leading-8">
            Forgot your password?
          </Text>
          <Text className="font-body text-[14px] text-text-secondary mt-1 leading-5">
            Enter your student email address and we'll send you an instant reset link.
          </Text>
        </View>

        <View className="px-6 mt-6">
          <Text className="font-body-semibold text-[13px] text-text-primary mb-2">Student Email</Text>
          <View className="flex-row items-center bg-surface rounded-xl px-4 border border-border">
            <FontAwesome5 name="envelope" size={14} color="#94A3B8" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. student@lasu.edu.ng"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 py-3.5 px-3 font-body text-[15px] text-text-primary"
            />
          </View>

          <Button
            variant="default"
            size="lg"
            className="mt-6"
            loading={loading}
            onPress={handleReset}
          >
            Send Reset Link
          </Button>

          <View className="flex-row items-center justify-center mt-6">
            <Text className="font-body text-[13px] text-muted">Remembered it? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text className="font-body-bold text-[13px] text-primary-dark">Back to login</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;