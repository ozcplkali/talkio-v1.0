import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Keyboard, Alert, StyleSheet } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons, AntDesign, Entypo } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/firebase/firebase';
import { doc,setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, Timestamp, serverTimestamp } from 'firebase/firestore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { selectImage } from '@/components/selectImage';
import { Animated } from 'react-native';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { getChatbotResponse } from '@/api/chatbotResponse';


interface Message {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  content: string;
  isSeen: boolean;
  time: number;
  imageUri?: string | null;
  status?: 'sending' | 'sent' | 'error';
}

interface ChatComponentProps {
  chatId: string;
  receiverId: string;
}

interface receiverProps {
  userId: string;
  blocked: string[];
  email: string;
  name: string;
  profileImageUrl?: string | null;
}

export default function ChatComponent({ chatId, receiverId }: ChatComponentProps) {
  const router = useRouter();
  const { userData } = useAuth();
  const [receiverData, setReceiverData] = useState<receiverProps | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [showBlockButton, setShowBlockButton] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);




  useEffect(() => {
    const fetchReceiverData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", receiverId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const typedData: receiverProps = {
            userId: data.userId || "",
            blocked: data.blocked || [],
            email: data.email || "",
            name: data.name || "",
            profileImageUrl: data.profileImageUrl || null
          };

          setReceiverData(typedData);
        }
      } catch (error) {
        console.error("Kullanıcı bilgileri alınamadı:", error);
      }
    };

    fetchReceiverData();
  }, [receiverId]);

  useEffect(() => {
    if (!chatId) return;

    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, "chats", chatId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const chatData = docSnapshot.data();
        if (chatData.messages) {
          setMessages(chatData.messages);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    const markMessagesAsSeen = async () => {
      if (!chatId || !userData?.userId || messages.length === 0) return;

      // Sadece karşıdan gelen okunmamış mesajları filtrele
      const unreadMessages = messages.filter(
        msg => msg.toId === userData?.userId && 
               msg.fromId === receiverId && 
               !msg.isSeen
      );

      if (unreadMessages.length === 0) return;

      try {
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const updatedMessages = chatData.messages.map((msg: Message) => {
            // Sadece karşıdan gelen okunmamış mesajları işaretle
            if (msg.toId === userData?.userId && 
                msg.fromId === receiverId && 
                !msg.isSeen) {
              return { ...msg, isSeen: true };
            }
            return msg;
          });

          await updateDoc(chatRef, {
            messages: updatedMessages
          });
        }
      } catch (error) {
        console.error("Okundu bilgisi güncellenirken hata:", error);
      }
    };

    markMessagesAsSeen();
  }, [chatId, messages, userData?.userId, receiverId]);



  const uploadImage = async (uri: string): Promise<string> => {
    // console.log("Görsel yükleme başlatıldı. URI:", uri);
    
    try {
      // console.log("Görsel fetch ediliyor...");
      const response = await fetch(uri);
      const blob = await response.blob();
      // console.log("Blob oluşturuldu, boyut:", blob.size);
      
      const storage = getStorage();
      const filename = `chat_images/${chatId}/${Date.now()}.jpg`;
      // console.log("Hedef dosya yolu:", filename);
      
      const storageRef = ref(storage, filename);
      
      // console.log("Upload başlatılıyor...");
      await uploadBytes(storageRef, blob);
      // console.log("Görsel storage'a yüklendi");
      
      const downloadURL = await getDownloadURL(storageRef);
      // console.log("Download URL alındı:", downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error("Görsel yükleme hatası - Detaylar:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: error instanceof Error ? error.message : 'Unknown error',
        stack:error instanceof Error ? error.message : 'Unknown error'
      });
      if (error instanceof Error) {
        throw new Error(`Görsel yüklenemedi: ${error.message}`);
      } else {
        throw new Error("Görsel yüklenemedi: Bilinmeyen hata");
      }
    }
  };
  
  
  
  
  
  
  
  
  
  const handleSelectImage = async () => {
    try {
      const imageUri = await selectImage();
      if (imageUri) {
        // Yükleniyor göstergesi eklenebilir
        setSelectedImage(imageUri);
      }
    } catch (error) {
      console.error("Görsel seçilirken veya yüklenirken hata:", error);
      Alert.alert("Hata", "Görsel gönderilemedi.");
    }
  };







  const sendMessage = async () => {
    // console.log("Mesaj gönderme işlemi başlatıldı...");
    
    if (!newMessage.trim() && !selectedImage) {
      // console.log("Hata: Boş mesaj veya görsel yok");
      return;
    }
  
    // Mesaj objesini try bloğunun dışında tanımla
    const messageToSend = {
      fromId: userData?.userId || '',
      fromName: userData?.name || '',
      toId: receiverId,
      toName: receiverData?.name || "Bilinmeyen Kullanıcı",
      content: newMessage.trim() || (selectedImage ? '📷' : ''),
      isSeen: false,
      time: Date.now(),
      imageUri: selectedImage || null, // undefined yerine null kullan
      status: 'sending' as const
    };
  
    try {
      // console.log("Oluşturulan mesaj objesi:", messageToSend);
  
      setMessages(prev => [...prev, messageToSend]);
      // console.log("Mesaj UI'a eklendi");
  
      setNewMessage('');
      setSelectedImage(null);
  
      let downloadURL = null;
      if (selectedImage) {
        // console.log("Görsel yükleme başlatıldı...");
        try {
          downloadURL = await uploadImage(selectedImage);
          // console.log("Görsel başarıyla yüklendi:", downloadURL);
        } catch (uploadError) {
          console.error("Görsel yükleme hatası:", uploadError);
          throw new Error("Görsel yüklenemedi");
        }
      }
  
      const finalMessage = {
        ...messageToSend,
        imageUri: downloadURL || null, // undefined yerine null kullan
        status: 'sent' as const
      };
  
      // console.log("Firebase'e gönderilecek final mesaj:", finalMessage);
  
      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);
  

      const userchatRef = doc(db, "userchats", userData?.userId);
      const userDocSnap=await getDoc(userchatRef);

      if (!userDocSnap.exists()) {
        console.error("userChat dökümanı bulunamadı!");
      }

      const userChatsData = userDocSnap.data();
      const chatsArray = userChatsData?.chats || [];



      const updateChats=chatsArray.map((chat: any) => {
        if (chat.chatId ===chatId ) {
          return{
            ...chat,
            lastMessage: newMessage,
            updatedAt: Date.now()
          }
        }
        return chat;
      });
      await updateDoc(userchatRef, {
        chats: updateChats
      });







      // receiverChat güncelleme kısmını koşullu hale getirelim
      // Sadece normal kullanıcılar için userchats güncelleme işlemi yapılsın
      if (receiverId !== "chatbot") {
        const receiverChatRef = doc(db, "userchats", receiverId);
        const receiverDocSnap = await getDoc(receiverChatRef);
      
        // Eğer alıcının chat dokümanı yoksa oluştur
        if (!receiverDocSnap.exists()) {
          await setDoc(receiverChatRef, {
            chats: [{
              chatId: chatId,
              lastMessage: newMessage,
              updatedAt: Date.now()
            }]
          });
        } else {
          const receiverChatsData = receiverDocSnap.data();
          const receiverArray = receiverChatsData?.chats || [];
      
          const receiverChats = receiverArray.map((chat: any) => {
            if (chat.chatId === chatId) {
              return {
                ...chat,
                lastMessage: newMessage,
                updatedAt: Date.now()
              }
            }
            return chat;
          });
          
          await updateDoc(receiverChatRef, {
            chats: receiverChats
          });
        }
      }
      




      if (!chatDoc.exists()) {
        // console.log("Chat dokümanı oluşturuluyor...");
        await setDoc(chatRef, {
          messages: [finalMessage],
          updatedAt: serverTimestamp(),
        });
      } else {
        // console.log("Mevcut chat dokümanı güncelleniyor...");
        // messages array'ini önce alıp sonra güncelle
        const currentMessages = chatDoc.data().messages || [];
        await updateDoc(chatRef, {
          messages: [...currentMessages, finalMessage],
          updatedAt: serverTimestamp(),
        });
      }
  
      // console.log("Mesaj Firebase'e başarıyla kaydedildi");
  
      // UI'daki mesaj durumunu güncelle
      setMessages(prev => 
        prev.map(msg => 
          msg.time === messageToSend.time ? finalMessage : msg
        )
      );
      // console.log("Mesaj durumu UI'da güncellendi");
  
      // Chatbot kontrolü
      if (receiverId === "chatbot") {
        // console.log("Chatbot yanıtı bekleniyor...");
        try {
          const botResponse = await getChatbotResponse(newMessage);
          // console.log("Chatbot yanıtı alındı:", botResponse);
          const chatbotMessage = {
            fromId: "chatbot",
            fromName: "Chatbot",
            toId: userData?.userId,
            toName: userData?.name,
            content: botResponse,
            isSeen: true,
            time: Date.now(),
            imageUri: null,
            status: 'sent' as const
          };
    
          setMessages(prev => [...prev, chatbotMessage]);

        } catch (botError) {
          console.error("Chatbot yanıt hatası:", botError);
        }


      }

      // Chatbot kontrolü kısmını güncelleyelim
      if (receiverId === "chatbot") {
        try {
          const botResponse = await getChatbotResponse(newMessage);
          const chatbotMessage = {
            fromId: "chatbot",
            fromName: "Chatbot",
            toId: userData?.userId,
            toName: userData?.name || "",
            content: botResponse,
            isSeen: true,
            time: Date.now(),
            imageUri: null,
            status: 'sent' as const
          };
      
          // Chatbot mesajını Firebase'e kaydet
          const chatRef = doc(db, "chats", chatId);
          const chatDoc = await getDoc(chatRef);
          
          if (chatDoc.exists()) {
            const currentMessages = chatDoc.data().messages || [];
            await updateDoc(chatRef, {
              messages: [...currentMessages, chatbotMessage],
              updatedAt: serverTimestamp(),
            });
          }
      
          // UI'ı güncelle
          setMessages(prev => [...prev, chatbotMessage]);
      
        } catch (botError) {
          console.error("Chatbot yanıt hatası:", botError);
        }
      }
  
    } catch (error) {
      console.error("Mesaj gönderme hatası - Tam hata:", error);
      
      setMessages(prev => 
        prev.map(msg => 
          msg.time === messageToSend?.time 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );
      
      Alert.alert(
        "Hata", 
        `Mesaj gönderilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      );
    }
  };
  


  const handleBlockUser = () => {

    Alert.alert("Başarılı", "Kullanıcı engellendi.", [{ text: "Tamam" }]);
    setShowBlockButton(false);
  };

  const toggleBlockButton = () => {
    setShowBlockButton(!showBlockButton);
    Animated.timing(fadeAnim, {
      toValue: showBlockButton ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };





  
  if (loading) {
    return (
      <View className="flex-1 bg-slate-800 justify-center items-center">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-700">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1 bg-slate-800"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* Kişi Bilgisi Bölümü */}
          <View className="flex w-full h-[8%] flex-row bg-slate-700 items-center justify-between">
            <View className="flex flex-row items-center">
              <TouchableOpacity
                className="flex ml-3 mr-3"
                onPress={() => router.push("/(app)/(tabs)/chats")}
              >
                <AntDesign name="left" size={24} color="white" />
              </TouchableOpacity>

              {receiverId === "chatbot" ? (
                <Image
                  source={require("../assets/images/icon.png")}
                  className="w-9 h-9 rounded-full"
                />
              ) : receiverData?.profileImageUrl ? (
                <Image
                  source={{ uri: receiverData.profileImageUrl }}
                  className="w-9 h-9 rounded-full"
                />
              ) : (
                <Ionicons name="person-circle" size={36} color="white" />
              )}
              <View className="flex ml-3">
                <Text className="text-white text-2xl">
                  {receiverData?.name || "İsimsiz Kullanıcı"}
                </Text>
              </View>
            </View>

            <TouchableOpacity className="mr-3" onPress={toggleBlockButton}>
              <Entypo name="dots-three-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Engelleme Butonu */}
          {showBlockButton && (
            <Animated.View
              style={[
                { opacity: fadeAnim },
                { position: "absolute", top: 60, right: 20, zIndex: 1000 },
              ]}
            >
              <View className="bg-slate-600/70 p-2 rounded-lg w-38 h-16 justify-center">
                <TouchableOpacity
                  className="bg-slate-500/80 p-3 justify-self-center  rounded-lg h-10 w-36"
                  onPress={handleBlockUser}
                >
                  <Text className="text-white text-sm text-center">
                    Kullanıcıyı Engelle
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Mesaj Listesi */}
          <View className="flex-1 relative">
            <Image 
              source={require('../assets/images/talkioText.png')}
              className="absolute w-full h-24   opacity-20 self-center top-[20%] z-0"
            />
            <ScrollView 
              ref={scrollViewRef}
              className="flex-1 w-full px-2 z-10"
            >
              {messages.map((message, index) => (
                <View
                  key={index}
                  className={`my-2 max-w-[75%] rounded-xl p-3 ${
                    message.fromId === userData?.userId
                      ? "bg-blue-500 self-end"
                      : "bg-slate-600 self-start"
                  }`}
                >
                  {message.imageUri && (
                    <Image
                      source={{ uri: message.imageUri }}
                      style={{ width: 200, height: 200, borderRadius: 10 }}
                    />
                  )}
                  <Text className="text-white">{message.content}</Text>
                  <View className="flex-row justify-end items-center mt-1">
                    <Text className="text-xs text-gray-200">
                      {new Date(message.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {message.fromId === userData?.userId && (
                      <>
                        {message.status === "sending" && (
                          <View className="ml-1">
                            <ActivityIndicator size="small" color="white" />
                          </View>
                        )}
                        {message.status === "error" && (
                          <TouchableOpacity
                            className="ml-1"
                            onPress={() => {
                              /* implement retry logic here */
                            }}
                          >
                            <Ionicons name="alert-circle" size={16} color="red" />
                          </TouchableOpacity>
                        )}
                        {(!message.status || message.status === "sent") && (
                          <Ionicons
                            name={message.isSeen ? "checkmark-done" : "checkmark"}
                            size={16}
                            color="white"
                            className="ml-1"
                          />
                        )}
                      </>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Mesaj Yazma Bölümü */}
          <View className="w-full px-2 py-3 bg-slate-700">
            {selectedImage && (
              <View className="mb-2 relative">
                <Image
                  source={{ uri: selectedImage }}
                  className="w-32 h-32 rounded-lg"
                />
                <TouchableOpacity
                  className="absolute right-2 top-2 bg-black/50 rounded-full p-1"
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row items-center">
              <TextInput
                className="flex-1 bg-slate-600 text-white rounded-full px-4 py-2"
                placeholder="Mesaj yaz..."
                placeholderTextColor="#a0aec0"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />

              <TouchableOpacity
                className="w-10 h-10 rounded-full items-center justify-center"
                onPress={handleSelectImage}
              >
                <FontAwesome name="image" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center ml-2"
                onPress={sendMessage}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}