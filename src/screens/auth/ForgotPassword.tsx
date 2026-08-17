import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
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
        <View className="bg-primary rounded-b-[28px] px-6 pt-4 pb-10 shadow-soft">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => navigation.goBack()} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <FontAwesome5 name="chevron-left" size={14} color="#ffffff" />
            </Pressable>
            <Text className="font-body-bold text-white text-[15px]">Reset Password</Text>
            <View className="w-9" />
          </View>
          <View className="w-16 h-16 rounded-pill bg-white/15 items-center justify-center mb-4">
            <FontAwesome5 name="key" size={22} color="#ffffff" />
          </View>
          <Text className="font-headline text-[24px] text-white leading-8">
            Forgot your password?
          </Text>
          <Text className="font-body text-[13px] text-white/80 mt-2 leading-5">
            Enter the email you signed up with and we'll send you a reset link.
          </Text>
        </View>

        <View className="px-6 mt-8">
          <Text className="font-body-medium text-[13px] text-text-secondary mb-2">Email address</Text>
          <View className="flex-row items-center bg-soft rounded-pill px-5">
            <FontAwesome5 name="envelope" size={14} color="#8A817C" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#8A817C"
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 py-4 px-3 font-body-medium text-[15px] text-text-primary"
            />
          </View>

          <Pressable
            onPress={handleReset}
            disabled={loading}
            className="mt-6 bg-primary rounded-pill py-4 items-center shadow-soft"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-body-semibold text-[15px] text-white">Send reset link</Text>
            )}
          </Pressable>

          <View className="flex-row items-center justify-center mt-6">
            <Text className="font-body text-[13px] text-muted">Remembered it? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text className="font-body-semibold text-[13px] text-primary-dark">Back to login</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;