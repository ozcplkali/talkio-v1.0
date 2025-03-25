import { View, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, TextInput, Alert,Image} from 'react-native';
import { Link } from 'expo-router';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import { selectImage } from '@/components/selectImage';

// auth imports
import {auth} from "../../utils/firebase/firebase";
import { getFirestore,doc,setDoc } from 'firebase/firestore';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification} from "firebase/auth"
import AsyncStorage from '@react-native-async-storage/async-storage';
import {db} from "../../utils/firebase/firebase";

import { useAuth } from '@/contexts/AuthContext';


export default function SignUp() {
    const [name,setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const {signUp}=useAuth();


    const [image, setImage] = useState<string | null>(null);

    const handleSelectImage = async () => {
      const imageUri = await selectImage();
      if (imageUri) {
        setImage(imageUri);
      }
    };
    


    const handleRegister= async () => {
      try{
        await signUp(email, password, name, image || undefined);


      }
      catch(error){
        console.error("Kayıt olma hatası:")
      }

    };

  
    return (
      <SafeAreaView className="flex-1 bg-[#1e293b]">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 items-center justify-center px-4"
        >

          <Text className="text-3xl font-bold text-white mb-6">Hoşgeldin</Text>
          
          <TouchableOpacity className="my-5" onPress={handleSelectImage}>
            {image ? (
              <Image
                source={{ uri: image }}
                style={{ width: 128, height: 128, borderRadius: 64 }} // Yuvarlak hale getiriyoruz
              />
            ) : (
              <Ionicons name="person-circle-outline" size={128} color="#94a3b8" />
            )}
          </TouchableOpacity>

          <TextInput
            className="w-full bg-[#334155] text-[#f1f5f9] p-4 rounded-lg mb-4"
            placeholder="İsim"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
          />


          <TextInput
            className="w-full bg-[#334155] text-[#f1f5f9] p-4 rounded-lg mb-4"
            placeholder="E-mail"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            className="w-full bg-[#334155] text-[#f1f5f9] p-4 rounded-lg mb-4"
            placeholder="Parola"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            className="w-full bg-[#334155] text-[#f1f5f9] p-4 rounded-lg mb-6"
            placeholder="Parola Tekrar"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity 
            className="w-full bg-[#2563eb] p-4 rounded-lg items-center"
            onPress={handleRegister}
          >
            <Text className="text-white text-base font-semibold">Kayıt ol</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="mt-4">
            <Text className="text-[#9ca3af] text-sm">
            <Text className='text-[#9ca3af] text-sm'>Zaten hesabın var mı? <Link href="/(auth)/login" className="text-[#2563eb]">Giriş Yap</Link></Text>
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
}