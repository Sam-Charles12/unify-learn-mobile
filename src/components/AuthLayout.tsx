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
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <Pressable
              className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center shadow-soft active:bg-soft"
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="chevron-left" size={14} color="#09090B" />
            </Pressable>
            <View className="flex-row items-center bg-primary-light px-3 py-1.5 rounded-full border border-primary-border">
              <FontAwesome5 name="graduation-cap" size={12} color="#0F5132" />
              <Text className="ml-2 font-body-bold text-[11px] text-primary-dark">
                LASU Engineering
              </Text>
            </View>
          </View>

          <Text className="font-headline text-[28px] leading-[36px] text-text-primary tracking-tight mb-2">
            {title}
          </Text>
          <Text className="font-body text-[15px] leading-6 text-text-secondary">
            {subtitle}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-4 pb-12">
            {/* Segmented Tab Pill */}
            <View className="flex-row bg-soft rounded-2xl p-1 mb-8">
              <Pressable
                className={cn(
                  'flex-1 py-3 items-center rounded-xl',
                  activeTab === 'login' && 'bg-surface shadow-soft'
                )}
                onPress={() => goTo('Login')}
              >
                <Text
                  className={cn(
                    'font-body-medium text-[14px] text-muted',
                    activeTab === 'login' && 'font-body-bold text-text-primary'
                  )}
                >
                  Log In
                </Text>
              </Pressable>
              <Pressable
                className={cn(
                  'flex-1 py-3 items-center rounded-xl',
                  activeTab === 'signup' && 'bg-surface shadow-soft'
                )}
                onPress={() => goTo('SignUp')}
              >
                <Text
                  className={cn(
                    'font-body-medium text-[14px] text-muted',
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