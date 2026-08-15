import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error: any) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0a0a0a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, {user.email}</Text>

      <TouchableOpacity
        style={[styles.logoutButton, loading && { opacity: 0.6 }]}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#f5f4f0" />
        ) : (
          <Text style={styles.logoutText}>Log Out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f5f4f0',
  },
  title: {
    fontSize: 32,
    color: '#0a0a0a',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#7a7a7a',
    marginBottom: 32,
    fontFamily: 'DMSans_400Regular',
  },
  logoutButton: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoutText: {
    color: '#f5f4f0',
    fontFamily: 'DMSans',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Dashboard;