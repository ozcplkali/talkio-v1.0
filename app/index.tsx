import { View, Text, SafeAreaViewBase, ActivityIndicator} from 'react-native'
import React from 'react'
import { Stack, Redirect} from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '../contexts/AuthContext';


export default function Home() {
  
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#1e293b] justify-center items-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)/chats" />;
  }

  return <Redirect href="/(auth)/login" />;
}