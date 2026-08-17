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
        <View className="px-6 pt-3 pb-6">
          <View className="flex-row items-center justify-between mb-5">
            <Pressable
              className="w-10 h-10 rounded-xl bg-surface border border-border items-center justify-center shadow-soft"
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="chevron-left" size={14} color="#0F172A" />
            </Pressable>
            <View className="flex-row items-center bg-primary-light px-3 py-1.5 rounded-full border border-primary-border">
              <FontAwesome5 name="graduation-cap" size={13} color="#059669" />
              <Text className="ml-2 font-body-bold text-[12px] text-primary-dark">
                LASU Engineering
              </Text>
            </View>
          </View>

          <Text className="font-headline text-[26px] leading-[34px] text-text-primary mb-2">
            {title}
          </Text>
          <Text className="font-body text-[14px] leading-5 text-text-secondary">
            {subtitle}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-2 pb-12">
            {/* Segmented Control Pill */}
            <View className="flex-row bg-soft rounded-xl p-1 mb-6 border border-border/50">
              <Pressable
                className={cn(
                  'flex-1 py-2.5 items-center rounded-lg',
                  activeTab === 'login' && 'bg-surface shadow-soft border border-border/40'
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
                  'flex-1 py-2.5 items-center rounded-lg',
                  activeTab === 'signup' && 'bg-surface shadow-soft border border-border/40'
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