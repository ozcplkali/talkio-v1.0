import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="chatComponent" 
        options={{ 
          headerShown: false,
          presentation: 'modal' // isteğe bağlı, geçiş animasyonu için
        }} 
      />
    </Stack>
  );
}