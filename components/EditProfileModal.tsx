import { useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/utils/firebase/firebase';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userData: {
    userId: string;
    name: string;
    profileImageUrl: string | null;
  };
  onUpdate: () => void;
}

export default function EditProfileModal({ visible, onClose, userData, onUpdate }: EditProfileModalProps) {

  const [newName, setNewName] = useState(userData?.name || '');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setUploading(true);
      const userRef = doc(db, 'users', userData.userId);
      let updateData: any = { name: newName };

      if (selectedImage) {
        const imageRef = ref(storage, `profilePictures/${userData.userId}`);
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        const downloadURL = await getDownloadURL(imageRef);
        updateData.profileImageUrl = downloadURL;
      }

      await updateDoc(userRef, updateData);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="w-[90%] bg-slate-800 p-4 rounded-lg">
          <View className="items-center mb-4">
            <TouchableOpacity onPress={pickImage}>
              {(selectedImage || userData.profileImageUrl) ? (
                <Image
                  source={{ uri: (selectedImage || userData.profileImageUrl ) as string}}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-slate-600 items-center justify-center">
                  <Ionicons name="person" size={48} color="white" />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          <TextInput
            className="bg-slate-700 px-4 py-2 rounded-lg text-white mb-4"
            value={newName}
            onChangeText={setNewName}
            placeholder="İsminiz"
            placeholderTextColor="#9ca3af"
          />

          <View className="flex-row justify-end space-x-2">
            <TouchableOpacity 
              onPress={onClose}
              className="px-4 py-2"
            >
              <Text className="text-gray-400">İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleUpdateProfile}
              disabled={uploading}
              className="bg-blue-500 px-4 py-2 rounded-lg"
            >
              {uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white">Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}