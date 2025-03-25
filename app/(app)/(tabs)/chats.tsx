import { View, Text, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/utils/firebase/firebase';
import { router } from 'expo-router';  // useRouter yerine router'ı import ediyoruz
import AntDesign from '@expo/vector-icons/AntDesign';

interface ChatItem {
  chatId: string;
  lastMessage: string;
  receiverId: string;
  updatedAt: number;
  receiverName?: string;
  receiverProfileImage?: string;
  isPinned?: boolean;
  isSeen?: boolean;  // Add this line
  hasUnseenMessage?: boolean;
}

interface UserChatsDocument {
  chats: ChatItem[] | { [key: string]: ChatItem };
}

export default function Chats() {
  const { userData } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const checkUnseenMessages = async (chatId: string) => {
    try {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (chatDoc.exists()) {
        const messages = chatDoc.data().messages || [];
        const lastMessage = messages[messages.length - 1];
        
        return lastMessage && 
               lastMessage.toId === userData?.userId && 
               lastMessage.isSeen === false;
      }
      return false;
    } catch (error) {
      console.error("Mesaj kontrolü hatası:", error);
      return false;
    }
  };

  useEffect(() => {
    if (!userData?.userId) return;

    const unsubscribe = onSnapshot(
      doc(db, "userchats", userData.userId),
      async (snapshot) => {
        try {
          const userChatsData = snapshot.data() as UserChatsDocument;
          
          if (!userChatsData?.chats) {
            setChats([]);
            return;
          }

          // Veri yapısını kontrol et ve array'e dönüştür
          const chatsArray = Array.isArray(userChatsData.chats)
            ? userChatsData.chats
            : Object.entries(userChatsData.chats).map(([_, chat]) => chat);

          const chatsWithUserInfo = await Promise.all(
            chatsArray.map(async (chat) => {
              const userDoc = await getDoc(doc(db, "users", chat.receiverId));
              const hasUnseenMessage = await checkUnseenMessages(chat.chatId);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...chat,
                  receiverName: userData.name,
                  receiverProfileImage: userData.profileImageUrl,
                  hasUnseenMessage
                };
              }
              return { ...chat, hasUnseenMessage };
            })
          );
          
          const sortedChats = sortChats(chatsWithUserInfo);
          setChats(sortedChats);
        } catch (error) {
          console.error("Chat verisi işlenirken hata:", error);
          console.error("Hata detayı:", JSON.stringify(error));
        }
      }
    );

    return () => unsubscribe();
  }, [userData?.userId]);

  const sortChats = (chatsArray: ChatItem[]) => {
    return chatsArray.sort((a, b) => {
      // Chatbot her zaman en üstte
      if (a.receiverId === "chatbot") return -1;
      if (b.receiverId === "chatbot") return 1;
      
      // Sabitlenmiş sohbetler ikinci öncelikli
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Diğer sohbetler tarih sırasına göre
      return b.updatedAt - a.updatedAt;
    });
  };

  const togglePinChat = async (chatId: string, isPinned: boolean) => {
    try {
      const userChatsRef = doc(db, "userchats", userData.userId);
      const userChatsDoc = await getDoc(userChatsRef);
      
      if (!userChatsDoc.exists()) return;
      
      const userChatsData = userChatsDoc.data() as UserChatsDocument;
  
      if (typeof userChatsData.chats === 'object' && !Array.isArray(userChatsData.chats)) {
        // Obje yapısı için
        await updateDoc(userChatsRef, {
          [`chats.${chatId}.isPinned`]: !isPinned
        });
      } else {
        // Array yapısı için
        const updatedChats = chats.map(chat => 
          chat.chatId === chatId ? {...chat, isPinned: !isPinned} : chat
        );
        await updateDoc(userChatsRef, { chats: updatedChats });
      }
    } catch (error) {
      console.error("Sohbet sabitleme hatası:", error);
    }
  };

  const handleLongPress = (chat: ChatItem) => {
    if (chat.receiverId === "chatbot") return;
    setSelectedChat(chat);
    setShowMenu(true);
  };
  
  const handlePinChat = () => {
    if (selectedChat) {
      togglePinChat(selectedChat.chatId, selectedChat.isPinned || false);
    }
    setShowMenu(false);
  };

  const handleChatPress=(chatId:string,receiverId:string)=>{
    router.push({
      pathname:"/(app)/chatScreen",
      params:{chatId,receiverId}
    })
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: "center" }}
        className="pt-2 bg-[#1e293b]"
      >
        {chats && chats.length > 0 ? (
          chats.map((chat) => (
            <TouchableOpacity
              key={chat.chatId}
              onPress={() => handleChatPress(chat.chatId, chat.receiverId)}
              onLongPress={() => handleLongPress(chat)}
              delayLongPress={500}
              className={`flex relative ${
                chat.hasUnseenMessage ? 'bg-[#4693ff]' : 'bg-[#334155]'
              } w-[95%] h-20 my-2 rounded-md`}
            >
              <View className="flex relative w-full h-20 rounded-md flex-row items-center justify-between">
                <View className="flex w-1/6 ml-2">
                  {chat.receiverId === "chatbot" ? (
                    <Image
                      source={require("../../../assets/images/icon.png")}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : chat.receiverProfileImage ? (
                    <Image
                      source={{ uri: chat.receiverProfileImage }}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <Ionicons name="person-circle" size={64} color="black" />
                  )}
                </View>
                <View className="flex w-5/6 h-16 px-2 justify-around">
                  <View className="flex flex-row justify-between">
                    <View>
                      <Text className="font-extrabold mb-1 text-white">
                        {chat.receiverName || "İsimsiz Kullanıcı"}
                      </Text>
                      <Text className="text-sm font-light text-white">
                        {chat.lastMessage.length > 30
                          ? `${chat.lastMessage.slice(0, 30)}...`
                          : chat.lastMessage}
                      </Text>
                    </View>
                    <Text className="text-xs mr-2 text-slate-300">
                      {new Date(chat.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
                <View className="absolute bottom-2 right-2 flex-row items-center">
                  {(chat.isPinned || chat.receiverId === "chatbot") && (
                    <AntDesign name="pushpin" size={14} color="#60A5FA" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-white">Henüz sohbet bulunmuyor</Text>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showMenu}
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowMenu(false)}
        >
          <View className="absolute bottom-0 w-full bg-slate-700 rounded-t-xl">
            <TouchableOpacity
              onPress={handlePinChat}
              className="p-4 flex-row items-center border-b border-slate-600"
            >
              <AntDesign
                name="pushpin"
                size={20}
                color="#60A5FA"
                style={{ marginRight: 10 }}
              />
              <Text className="text-white text-lg">
                {selectedChat?.isPinned ? "Sabiti Kaldır" : "Sohbeti Sabitle"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowMenu(false)}
              className="p-4"
            >
              <Text className="text-white text-lg text-center">İptal</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}