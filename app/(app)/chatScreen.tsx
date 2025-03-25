import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChatComponent from '@/components/chatComponent';

export default function ChatScreen() {
    const params = useLocalSearchParams();
  
    const chatId = typeof params.chatId === 'string' ? params.chatId : '';
    const receiverId = typeof params.receiverId === 'string' ? params.receiverId : '';
  
    if (!chatId || !receiverId) {
      return null;
    }

  return (
    <View style={{ flex: 1 }}>
      <ChatComponent 
        chatId={chatId} 
        receiverId={receiverId}
      />
    </View>
  );
}