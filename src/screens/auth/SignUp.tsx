import React, { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesome5 } from '@expo/vector-icons';

const SignUp: React.FC = () => {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, {
        name: `${firstName} ${lastName}`.trim(),
        matric: '',
        department: '',
        level: '',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account and start learning"
      subtitle="Access curriculum-aligned weekly content for your LASU Engineering courses."
      activeTab="signup"
    >
      <View className="flex-row gap-3 mb-5">
        <View className="flex-1">
          <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
            First Name
          </Text>
          <Input
            placeholder="First name"
            value={formData.firstName}
            onChangeText={(val) => handleInputChange('firstName', val)}
          />
        </View>
        <View className="flex-1">
          <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
            Last Name
          </Text>
          <Input
            placeholder="Last name"
            value={formData.lastName}
            onChangeText={(val) => handleInputChange('lastName', val)}
          />
        </View>
      </View>

      <View className="mb-5">
        <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
          Email
        </Text>
        <Input
          placeholder="Enter your email"
          value={formData.email}
          onChangeText={(val) => handleInputChange('email', val)}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View className="mb-5">
        <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
          Password
        </Text>
        <View className="flex-row items-center bg-soft rounded-pill">
          <TextInput
            className="flex-1 pl-5 pr-2 py-4 font-body text-[16px] text-text-primary"
            placeholder="Enter your password"
            placeholderTextColor="#8A817C"
            value={formData.password}
            onChangeText={(val) => handleInputChange('password', val)}
            secureTextEntry={!showPassword}
          />
          <Pressable className="px-5 py-4" onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome5
              name={showPassword ? 'eye-slash' : 'eye'}
              size={16}
              color="#8A817C"
            />
          </Pressable>
        </View>
      </View>

      <View className="mb-5">
        <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
          Confirm Password
        </Text>
        <View className="flex-row items-center bg-soft rounded-pill">
          <TextInput
            className="flex-1 pl-5 pr-2 py-4 font-body text-[16px] text-text-primary"
            placeholder="Confirm your password"
            placeholderTextColor="#8A817C"
            value={formData.confirmPassword}
            onChangeText={(val) => handleInputChange('confirmPassword', val)}
            secureTextEntry={!showConfirm}
          />
          <Pressable className="px-5 py-4" onPress={() => setShowConfirm(!showConfirm)}>
            <FontAwesome5
              name={showConfirm ? 'eye-slash' : 'eye'}
              size={16}
              color="#8A817C"
            />
          </Pressable>
        </View>
      </View>

      <Button
        size="lg"
        className="mt-2 mb-8"
        loading={loading}
        onPress={handleSignUp}
      >
        Register
      </Button>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-divider" />
        <Text className="font-body text-[13px] text-muted mx-3">
          Or sign up with
        </Text>
        <View className="flex-1 h-px bg-divider" />
      </View>

      <View className="flex-row gap-3">
        <Pressable className="flex-1 flex-row items-center justify-center bg-soft rounded-pill py-4 gap-2">
          <FontAwesome5 name="google" size={16} color="#4285F4" />
          <Text className="font-body-semibold text-[14px] text-text-primary">
            Google
          </Text>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center bg-soft rounded-pill py-4 gap-2">
          <FontAwesome5 name="facebook-f" size={16} color="#1877F2" />
          <Text className="font-body-semibold text-[14px] text-text-primary">
            Facebook
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
};

export default SignUp;