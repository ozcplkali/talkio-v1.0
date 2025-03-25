import { View, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';  // En üste bu import'u ekleyin

// auth imports
import {auth} from "../../utils/firebase/firebase";
import { getFirestore,doc,setDoc } from 'firebase/firestore';
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,sendEmailVerification} from "firebase/auth"
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/contexts/AuthContext';
import { requestMediaLibraryPermission } from '@/utils/permissions';




export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const {signIn}=useAuth();
  

  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const granted = await requestMediaLibraryPermission();
      setHasPermission(granted);
    })();
  }, []);


    const handleLogin = async () => {
      try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          // console.log("Logged In: ", user.uid);
          await AsyncStorage.setItem('loggedUserId', user.uid as string); // Kullanıcı giriş yaptığında AsyncStorage'e kaydet (giriş yaptı mı diye kontrol etmek için)
          handleLoginSuccess(); // Giriş başarılıysa handleLoginSuccess fonksiyonunu çağır

        } catch (error) {
          console.error("Login error: ", error);
      }
      

    }
    
    const handleLoginSuccess = async () => { // Giriş başarılıysa yapılacak işlemler
      try {
        await signIn(email,password);
        
      } catch (error) {
          console.error("AsyncStorage error: ", error);
      }
  };



    return (
      <SafeAreaView className="flex-1 bg-[#1e293b]">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 items-center justify-center px-4"
        >

          <Text className="text-2xl font-bold text-white mb-6">Hoşgeldin</Text>
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
  
          <TouchableOpacity 
            className="w-full bg-[#2563eb] p-4 rounded-lg items-center"
            onPress={handleLogin}
          >
            <Text className="text-white text-base font-semibold">Giriş Yap</Text>
          </TouchableOpacity>

          <Text className='text-[#9ca3af] mt-3 text-sm'>Bir hesabın yok mu? <Link href="/(auth)/signup" className="text-[#2563eb]">Kayıt Ol</Link></Text>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
}