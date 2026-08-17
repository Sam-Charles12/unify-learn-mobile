import React, { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FontAwesome5 } from '@expo/vector-icons';
import { cn } from '@/lib/utils';
import { AuthStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back to Unify Learn"
      subtitle="Log in to continue your weekly lessons and track your progress."
      activeTab="login"
    >
      <View className="mb-5">
        <Text className="font-body-medium text-[13px] text-text-secondary mb-2">
          Email
        </Text>
        <Input
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
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
            value={password}
            onChangeText={setPassword}
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

      <View className="flex-row justify-between items-center mb-6">
        <Pressable
          className="flex-row items-center"
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View
            className={cn(
              'w-5 h-5 rounded-md border-[1.5px] border-primary bg-surface items-center justify-center mr-2',
              rememberMe && 'bg-primary border-primary'
            )}
          >
            {rememberMe && (
              <FontAwesome5 name="check" size={10} color="#ffffff" />
            )}
          </View>
          <Text className="font-body text-[14px] text-text-secondary">
            Remember Me
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text className="font-body-bold text-[14px] text-text-primary">
            Forgot Password?
          </Text>
        </Pressable>
      </View>

      <Button
        size="lg"
        className="mt-2 mb-8"
        loading={loading}
        onPress={handleLogin}
      >
        Login
      </Button>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-divider" />
        <Text className="font-body text-[13px] text-muted mx-3">
          Or login with
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

export default Login;