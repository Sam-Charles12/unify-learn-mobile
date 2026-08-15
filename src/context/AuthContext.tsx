import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/config/firebaseConfig';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: {
    name: string;
    matric: string;
    department: string;
    level: string;
  }) => {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      name: userData.name,
      matric: userData.matric,
      email,
      department: userData.department,
      level: userData.level,
      role: 'student',
      createdAt: new Date(),
    });
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut: signOutUser,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};