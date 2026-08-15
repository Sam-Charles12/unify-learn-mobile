import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import SignUP from '@/screens/auth/SignUp';
import Login from '@/screens/auth/Login';
import Dashboard from '@/screens/main/Dashboard';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
    <Stack.Screen name="SignUp" component={SignUP} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={Dashboard} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { user } = useAuth();
  return user ? <MainStack /> : <AuthStack />;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}