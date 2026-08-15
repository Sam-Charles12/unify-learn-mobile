import * as Font from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export const useAppFonts = () => {
  const [fontsLoaded, fontError] = Font.useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  return { fontsLoaded, fontError };
};

export const FontLoader = ({ children }: { children: ReactNode }) => {
  const { fontsLoaded, fontError } = useAppFonts();

  useEffect(() => {
    if (fontError) {
      console.warn('Font loading error:', fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F4F1',
  },
});