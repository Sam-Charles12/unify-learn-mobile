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
      Alert.alert('Missing Fields', 'Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Continue your curriculum-aligned learning and track your course progress."
      activeTab="login"
    >
      <View className="mb-4">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Email Address
        </Text>
        <Input
          placeholder="e.g. student@lasu.edu.ng"
          value={email}
          onChangeText={setEmail}
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
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
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

      <View className="flex-row justify-between items-center mb-6">
        <Pressable
          className="flex-row items-center"
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View
            className={cn(
              'w-5 h-5 rounded-md border items-center justify-center mr-2',
              rememberMe
                ? 'bg-primary border-primary'
                : 'border-border-strong bg-surface'
            )}
          >
            {rememberMe && (
              <FontAwesome5 name="check" size={10} color="#ffffff" />
            )}
          </View>
          <Text className="font-body text-[13px] text-text-secondary">
            Remember Me
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text className="font-body-bold text-[13px] text-primary-dark">
            Forgot Password?
          </Text>
        </Pressable>
      </View>

      <Button
        variant="default"
        size="lg"
        className="mb-6"
        loading={loading}
        onPress={handleLogin}
      >
        Sign In
      </Button>

      {/* Clean Divider */}
      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-[1px] bg-border" />
        <Text className="font-body text-[12px] text-muted mx-3 uppercase tracking-wider">
          Or continue with
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

export default Login;