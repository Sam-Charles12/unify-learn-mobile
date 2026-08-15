import { auth } from '@/config/firebaseConfig';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';

export const useAuthGuard = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};

export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => {
  const { user, loading } = useAuthGuard();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a0a0a" />
      </View>
    );
  }

  if (!user) {
    return fallback || null;
  }

  return <>{children}</>;
};