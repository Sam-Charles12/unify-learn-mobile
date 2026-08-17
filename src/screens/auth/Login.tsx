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
      Alert.alert('Missing Details', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue your weekly syllabus and access lecturer updates."
      activeTab="login"
    >
      <View className="mb-5">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          University Email
        </Text>
        <Input
          placeholder="e.g. student@lasu.edu.ng"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View className="mb-5">
        <Text className="font-body-semibold text-[13px] text-text-primary mb-2">
          Password
        </Text>
        <View className="flex-row items-center bg-surface rounded-2xl border border-border">
          <TextInput
            className="flex-1 pl-4 pr-2 py-4 font-body text-[15px] text-text-primary"
            placeholder="Enter your password"
            placeholderTextColor="#A1A1AA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <Pressable className="px-4 py-4" onPress={() => setShowPassword(!showPassword)}>
            <FontAwesome5
              name={showPassword ? 'eye-slash' : 'eye'}
              size={15}
              color="#71717A"
            />
          </Pressable>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-8">
        <Pressable
          className="flex-row items-center"
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View
            className={cn(
              'w-5 h-5 rounded-md border items-center justify-center mr-2.5',
              rememberMe
                ? 'bg-ink border-ink'
                : 'border-border bg-surface'
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
          <Text className="font-body-semibold text-[13px] text-text-primary">
            Forgot Password?
          </Text>
        </Pressable>
      </View>

      <Button
        variant="default"
        size="lg"
        className="mb-8"
        loading={loading}
        onPress={handleLogin}
      >
        Sign In to Account
      </Button>

      {/* Clean Divider */}
      <View className="flex-row items-center mb-8">
        <View className="flex-1 h-[1px] bg-border" />
        <Text className="font-body text-[12px] text-muted mx-4 uppercase tracking-wider">
          Or continue with
        </Text>
        <View className="flex-1 h-[1px] bg-border" />
      </View>

      <View className="flex-row gap-3">
        <Pressable className="flex-1 flex-row items-center justify-center bg-surface rounded-2xl py-4 gap-2.5 border border-border shadow-soft active:bg-soft">
          <FontAwesome5 name="google" size={15} color="#09090B" />
          <Text className="font-body-semibold text-[14px] text-text-primary">
            Google
          </Text>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center bg-surface rounded-2xl py-4 gap-2.5 border border-border shadow-soft active:bg-soft">
          <FontAwesome5 name="facebook-f" size={15} color="#09090B" />
          <Text className="font-body-semibold text-[14px] text-text-primary">
            Facebook
          </Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
};

export default Login;