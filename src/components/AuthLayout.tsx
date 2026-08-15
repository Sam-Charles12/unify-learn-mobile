import React, { ReactNode } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  activeTab: 'login' | 'signup';
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, activeTab, children }) => {
  const navigation = useNavigation();

  const goTo = (screen: 'Login' | 'SignUp') => {
    if (activeTab !== (screen === 'Login' ? 'login' : 'signup')) {
      navigation.navigate(screen as never);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView className="flex-1 bg-primary">
        <View className="px-6 pt-2 pb-8">
          <Pressable
            className="w-9 h-9 rounded-full bg-white/20 items-center justify-center mb-6"
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="chevron-left" size={16} color="#ffffff" />
          </Pressable>

          <Text className="font-body-bold text-[22px] leading-[30px] text-white mb-1.5">
            {title}
          </Text>
          <Text className="font-body text-[14px] leading-5 text-white/80">
            {subtitle}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 bg-background rounded-t-[28px] px-7 pt-7 pb-12">
            <View className="flex-row bg-soft rounded-pill p-1 mb-7">
              <Pressable
                className={cn(
                  'flex-1 py-2.5 items-center rounded-pill',
                  activeTab === 'login' && 'bg-surface shadow-soft'
                )}
                onPress={() => goTo('Login')}
              >
                <Text
                  className={cn(
                    'font-body-medium text-[15px] text-muted',
                    activeTab === 'login' && 'font-body-bold text-text-primary'
                  )}
                >
                  Log In
                </Text>
              </Pressable>
              <Pressable
                className={cn(
                  'flex-1 py-2.5 items-center rounded-pill',
                  activeTab === 'signup' && 'bg-surface shadow-soft'
                )}
                onPress={() => goTo('SignUp')}
              >
                <Text
                  className={cn(
                    'font-body-medium text-[15px] text-muted',
                    activeTab === 'signup' && 'font-body-bold text-text-primary'
                  )}
                >
                  Sign Up
                </Text>
              </Pressable>
            </View>

            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default AuthLayout;