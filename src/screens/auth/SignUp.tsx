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
      title="Create Account"
      subtitle="Join your faculty semester cohort and unlock syllabus modules."
      activeTab="signup"
    >
      <View className="flex-row gap-3 mb-5">
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

      <View className="mb-5">
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

      <View className="mb-5">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Password
        </Text>
        <View className="flex-row items-center rounded-2xl" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DDD5' }}>
          <TextInput
            className="flex-1 pl-4 pr-2 py-4 font-body text-[15px] text-text-primary"
            placeholder="Minimum 6 characters"
            placeholderTextColor="#8A817C"
            value={formData.password}
            onChangeText={(val) => handleInputChange('password', val)}
            secureTextEntry={!showPassword}
          />
          <Pressable className="px-4 py-4" onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome5
              name={showPassword ? 'eye-slash' : 'eye'}
              size={15}
              color="#8A817C"
            />
          </Pressable>
        </View>
      </View>

      <View className="mb-8">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Confirm Password
        </Text>
        <View className="flex-row items-center rounded-2xl" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DDD5' }}>
          <TextInput
            className="flex-1 pl-4 pr-2 py-4 font-body text-[15px] text-text-primary"
            placeholder="Repeat password"
            placeholderTextColor="#A1A1AA"
            value={formData.confirmPassword}
            onChangeText={(val) => handleInputChange('confirmPassword', val)}
            secureTextEntry={!showConfirm}
          />
          <Pressable className="px-4 py-4" onPress={() => setShowConfirm(!showConfirm)}>
            <FontAwesome5
              name={showConfirm ? 'eye-slash' : 'eye'}
              size={15}
              color="#8A817C"
            />
          </Pressable>
        </View>
      </View>

      <Button
        variant="default"
        size="lg"
        className="mb-8"
        loading={loading}
        onPress={handleSignUp}
      >
        Create Student Account
      </Button>

      {/* Clean Divider */}
      <View className="flex-row items-center mb-8">
        <View className="flex-1 h-[1px]" style={{ backgroundColor: '#E7DDD5' }} />
        <Text className="font-body text-[12px] text-muted mx-4 uppercase tracking-wider">
          Or sign up with
        </Text>
        <View className="flex-1 h-[1px]" style={{ backgroundColor: '#E7DDD5' }} />
      </View>

      <View className="flex-row gap-3">
        <Pressable className="flex-1 flex-row items-center justify-center rounded-2xl py-4 gap-2.5 active:opacity-80" style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: '#E7DDD5' }}>
          <FontAwesome5 name="google" size={15} color="#1A1A1A" />
          <Text className="font-body-semibold text-[14px] text-text-primary">
            Google
          </Text>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center rounded-2xl py-4 gap-2.5 active:opacity-80" style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: '#E7DDD5' }}>
          <FontAwesome5 name="facebook-f" size={15} color="#1A1A1A" />
          <Text className="font-body-semibold text-[14px] text-text-primary">
            Facebook
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
};

export default SignUp;