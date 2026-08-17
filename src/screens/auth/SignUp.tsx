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
      Alert.alert('Missing Fields', 'Please fill in all fields to create your account.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
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
      Alert.alert('Registration Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Student Account"
      subtitle="Access weekly curriculum materials, quizzes, and lecturer updates."
      activeTab="signup"
    >
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
            First Name
          </Text>
          <Input
            placeholder="e.g. Samuel"
            value={formData.firstName}
            onChangeText={(val) => handleInputChange('firstName', val)}
          />
        </View>
        <View className="flex-1">
          <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
            Last Name
          </Text>
          <Input
            placeholder="e.g. Adeleke"
            value={formData.lastName}
            onChangeText={(val) => handleInputChange('lastName', val)}
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Email Address
        </Text>
        <Input
          placeholder="e.g. student@lasu.edu.ng"
          value={formData.email}
          onChangeText={(val) => handleInputChange('email', val)}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View className="mb-4">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Password
        </Text>
        <View className="flex-row items-center bg-surface rounded-xl border border-border">
          <TextInput
            className="flex-1 pl-4 pr-2 py-3.5 font-body text-[15px] text-text-primary"
            placeholder="Minimum 6 characters"
            placeholderTextColor="#94A3B8"
            value={formData.password}
            onChangeText={(val) => handleInputChange('password', val)}
            secureTextEntry={!showPassword}
          />
          <Pressable className="px-4 py-3.5" onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome5
              name={showPassword ? 'eye-slash' : 'eye'}
              size={15}
              color="#64748B"
            />
          </Pressable>
        </View>
      </View>

      <View className="mb-6">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Confirm Password
        </Text>
        <View className="flex-row items-center bg-surface rounded-xl border border-border">
          <TextInput
            className="flex-1 pl-4 pr-2 py-3.5 font-body text-[15px] text-text-primary"
            placeholder="Repeat password"
            placeholderTextColor="#94A3B8"
            value={formData.confirmPassword}
            onChangeText={(val) => handleInputChange('confirmPassword', val)}
            secureTextEntry={!showConfirm}
          />
          <Pressable className="px-4 py-3.5" onPress={() => setShowConfirm(!showConfirm)}>
            <FontAwesome5
              name={showConfirm ? 'eye-slash' : 'eye'}
              size={15}
              color="#64748B"
            />
          </Pressable>
        </View>
      </View>

      <Button
        variant="default"
        size="lg"
        className="mb-6"
        loading={loading}
        onPress={handleSignUp}
      >
        Create Account
      </Button>

      {/* Clean Divider */}
      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-[1px] bg-border" />
        <Text className="font-body text-[12px] text-muted mx-3 uppercase tracking-wider">
          Or sign up with
        </Text>
        <View className="flex-1 h-[1px] bg-border" />
      </View>

      <View className="flex-row gap-3">
        <Pressable className="flex-1 flex-row items-center justify-center bg-surface rounded-xl py-3.5 gap-2 border border-border shadow-soft active:bg-soft">
          <FontAwesome5 name="google" size={15} color="#EA4335" />
          <Text className="font-body-bold text-[14px] text-text-primary">
            Google
          </Text>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center bg-surface rounded-xl py-3.5 gap-2 border border-border shadow-soft active:bg-soft">
          <FontAwesome5 name="facebook-f" size={15} color="#1877F2" />
          <Text className="font-body-bold text-[14px] text-text-primary">
            Facebook
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
};

export default SignUp;