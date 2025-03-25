import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Peoplecard from '@/components/explore/peoplecard';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, limit, setDoc, serverTimestamp, doc, updateDoc, arrayUnion,getDoc } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import { router } from 'expo-router';



export default function Explore() {
  const { user, userData } = useAuth();
  
  // Tip tanımlama
  interface UsersData {
    uid: string;
    username: string;
    profileImageUrl: string | null;
  }
  
  const [users, setUsers] = useState<UsersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [existingChats,setExistingChats]=useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);



  const fetchExistingChats = async () => {
    if (!user) return [];
    
    try {
      const userChatsDoc = await getDoc(doc(db, "userchats", user.uid));
      if (userChatsDoc.exists() && userChatsDoc.data()?.chats) {
        const chatsData = userChatsDoc.data().chats;
        if(Array.isArray(chatsData)){
          const chatPartnerIds = chatsData.map((chat: any) => chat.receiverId);
          setExistingChats(chatPartnerIds);
          return chatPartnerIds;
        }else if(typeof chatsData === 'object'){
          const chatPartnerIds=Object.values(chatsData).map((chat: any) => chat.receiverId);
          setExistingChats(chatPartnerIds);
          return chatPartnerIds;
        }

      }
      return [];
    } catch (error) {
      console.error("Mevcut sohbetler getirilirken hata:", error);
      return [];
    }
  };





  const getRandomPeople = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const chatPartnerIds=await fetchExistingChats();
      const usersRef = collection(db, 'users');
      
      const q = query(
        usersRef,
        where('userId', '!=', user.uid),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const usersList: UsersData[] = [];
      
      querySnapshot.forEach((doc) => {

        try {
          
          const userData = doc.data()

        

          if(userData && userData.userId && !chatPartnerIds.includes(userData.userId)){
            usersList.push({
              uid:userData.userId,
              username:userData.name,
              profileImageUrl:userData.profileImageUrl||null
            });
            
          }
        } catch (error) {
          console.error("Kullanıcı verisi işlenirken hata oldu:"+error)
        }

      });


      const shuffledUsers = usersList.sort(() => 0.5 - Math.random());
      setUsers(shuffledUsers);
    } catch (error) {
      console.error("Kullanıcılar getirilirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    if (!searchQuery.trim()) {
      getRandomPeople();
      return;
    }
    
    try {
      setLoading(true);

      const chatPartnerIds=await fetchExistingChats();
      const usersRef = collection(db, 'users');
      
      const q = query(
        usersRef,
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const usersList: UsersData[] = [];
      const searchLower = searchQuery.toLowerCase();
      
      querySnapshot.forEach((doc) => {
        try {
          
          const userData = doc.data();
        
          if (userData.userId !== user?.uid && 
              userData.name && 
              userData.name.toLowerCase().includes(searchLower)&&
            !chatPartnerIds.includes(userData.userId)) {
            usersList.push({
              uid: userData.userId,
              username: userData.name,
              profileImageUrl: userData.profileImageUrl || null
            });
            
          }
        } catch (error) {
          console.error("kullanıcı verisi hatası:"+error)
        }

      });
      
      setUsers(usersList);
      
      if (usersList.length === 0 && searchQuery.trim() !== '') {
      }
    } catch (error) {
      console.error("Kullanıcı araması sırasında hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExistingChats().then(()=>{
        getRandomPeople();
      })
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSearchSubmit = () => {
    searchUsers();
  };

  // Interface tanımlamaları
  interface ChatItem {
    chatId: string;
    receiverId: string;
    lastMessage: string;
    updatedAt: number;
  }
  
  interface UserChatsData {
    chats: ChatItem[] | { [key: string]: ChatItem };
  }
  
  // handleRouteChat fonksiyonunu güncelle
  const handleRouteChat = async (targetUserUid: string) => {
    if (!user) return;
  
    try {
      setLoading(true);
      const userChatsDoc = await getDoc(doc(db, "userchats", user.uid));
  
      if (userChatsDoc.exists() && userChatsDoc.data()?.chats) {
        const chatsData = userChatsDoc.data().chats as UserChatsData['chats'];
  
        // Obje yapısını kontrol et
        if (typeof chatsData === 'object' && !Array.isArray(chatsData)) {
          // Obje yapısı için
          const existingChat = Object.values(chatsData).find(
            (chat: ChatItem) => chat.receiverId === targetUserUid
          );
          if (existingChat) {
            router.push({
              pathname: "/(app)/chatScreen",
              params: { chatId: existingChat.chatId, receiverId: targetUserUid }
            });
            return;
          }
        } else if (Array.isArray(chatsData)) {
          // Array yapısı için
          const existingChat = chatsData.find(
            (chat: ChatItem) => chat.receiverId === targetUserUid
          );
          if (existingChat) {
            router.push({
              pathname: "/(app)/chatScreen",
              params: { chatId: existingChat.chatId, receiverId: targetUserUid }
            });
            return;
          }
        }
      }
      await handleAdd(targetUserUid);
  
    } catch (error) {
      console.error("chat açılırken bir hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleAdd = async (targetUserUid: string) => {
    if (!user) return;

    const chatRef = collection(db, "chats");
    const userChatRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Hedef kullanıcının belgesini güncelle
      await updateDoc(doc(userChatRef, targetUserUid), {
        chats: arrayUnion({
          chatId: newChatRef.id, // uid değil id kullanılmalı
          lastMessage: "",
          receiverId: user.uid,
          updatedAt: Date.now()
        })
      });

      // Mevcut kullanıcının belgesini güncelle
      await updateDoc(doc(userChatRef, user.uid), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: targetUserUid,
          updatedAt: Date.now(),
        })
      });


      router.push({
        pathname: "/(app)/chatScreen",
        params: { chatId: newChatRef.id, receiverId: targetUserUid }
      })



    } catch (err) {
      console.error(err);
    }
  };
  

  const onRefresh = async () => {
    if (!user) return;
    
    setRefreshing(true);
    try {
      await fetchExistingChats();
      await getRandomPeople();
    } catch (error) {
      console.error("Yenileme sırasında hata:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1 bg-[#1e293b]">
      <View className="px-4 pt-12 pb-4 flex-row justify-center items-center">
        <View className="w-full h-10 items-center bg-[#334155] rounded-lg ml-2 mr-1 px-4 ">
          <TextInput 
            placeholder="Kullanıcı ara..."
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-2 text-white text-left w-full"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity className='mr-2' onPress={searchUsers}>
          <Ionicons name="search" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
            title="Yenileniyor..."
            titleColor="#3b82f6"
          />
        }
      >
        <Text className="text-white text-lg mb-4">Yeni Kişilerle Tanış</Text>
        
        {!user ? (
          <Text className="text-gray-400 text-center py-4">Kullanıcıları görmek için giriş yapmalısınız</Text>
        ) : loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : users.length > 0 ? (
          users.map((userItem, index) => (
            <Peoplecard 
              key={index} 
              username={userItem.username}
              profilePic={userItem.profileImageUrl} 
              uid={userItem.uid}
              onAddChat={() => handleRouteChat(userItem.uid)}
            />
          ))
        ) : (
          <Text className="text-gray-400 text-center py-4">Kullanıcı bulunamadı</Text>
        )}
      </ScrollView>
    </View>
  );
}