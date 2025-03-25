import { View, Text, TouchableOpacity, Image, Platform, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import EditProfileModal from '@/components/EditProfileModal';
import { ref } from 'firebase/storage';



export default function Profile() {
  const { userData, refreshUserData } = useAuth(); // Add refreshUserData from AuthContext
  const [isEditing, setIsEditing] = useState(false);


  const{signOut}=useAuth();







  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Başarıyla çıkış yapıldı.');
    } catch (error) {
      console.error('Çıkış yaparken hata:', error);
      Alert.alert('Hata', 'Çıkış yaparken bir hata oluştu.');
    }
  };


  const openAppSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar açılamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <View className="flex-1 bg-[#1e293b] px-4 pt-12">
      <View className="items-center">
        <View className="relative">
          {userData.profileImageUrl ? (
            <Image
              source={{ uri: userData.profileImageUrl }}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-slate-600 items-center justify-center">
              <Ionicons name="person" size={48} color="white" />
            </View>
          )}
        </View>

        <Text className="text-white text-xl mt-4">{userData.name}</Text>
        <Text className="text-gray-400">{userData.email}</Text>
        <TouchableOpacity 
          className='absolute right-0'
          onPress={() => setIsEditing(true)}
        >
          <MaterialCommunityIcons name="account-edit" size={36} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View className="mt-8">
        <TouchableOpacity
          onPress={() => openAppSettings()}
          className="flex-row items-center py-4 border-b border-gray-700"
        >
          <Ionicons name="settings-outline" size={24} color="white" />
          <Text className="text-white ml-4">Ayarlar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openAppSettings()}
          className="flex-row items-center py-4 border-b border-gray-700"
        >
          <Ionicons name="shield-outline" size={24} color="white" />
          <Text className="text-white ml-4">Gizlilik</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity
            className="flex-row items-center py-4"
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
            <Text className="text-red-500 ml-4">Çıkış Yap</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <EditProfileModal
        visible={isEditing}
        onClose={() => setIsEditing(false)}
        userData={userData}
        onUpdate={async () => {
          await refreshUserData(); // Refresh user data after update
        }}
      />
    </View>
  );
}