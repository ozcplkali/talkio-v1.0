import { Redirect, useRootNavigationState, useSegments, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const router = useRouter();

  useEffect(() => {
    if (!navigationState?.key || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isAuthenticated && inAuthGroup) {
      // console.log('Authenticated, redirecting to chats');
      router.replace('/(app)/(tabs)/chats');
    }

    if (!isAuthenticated && !inAuthGroup) {
      // console.log('Not authenticated, redirecting to login');
      router.replace('/(auth)/login');
    }
    
  }, [isAuthenticated, segments, navigationState?.key, isLoading, router]);

  return null;
}