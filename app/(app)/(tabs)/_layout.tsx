import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: {
        backgroundColor: '#0f172a', 
        borderTopWidth: 0,
      },
      tabBarInactiveTintColor: '#94a3b8', 
      tabBarActiveTintColor: '#3b82f6', 
      
      headerStyle: {
        backgroundColor: '#0f172a', 
      },
      headerTintColor: 'white',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerShadowVisible: false, 
    }}>
      <Tabs.Screen
        name="index"
        options={{
          // ... options
        }}
      />
            <Tabs.Screen
        name="chats"
        options={{
          title: 'Sohbetler',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={24} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}