import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { useProtectedRoute } from '../components/ProtectedRoute';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="chatComponent" /> 
    </Stack>
  );
}