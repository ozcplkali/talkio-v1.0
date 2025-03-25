import { getFirestore, doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

async function getChatbotResponse(message: string): Promise<string> {
  const token:string|undefined=process.env.EXPO_PUBLIC_GEMINI_API;

  if(!token){
    console.error("Token bulunamadı");
    return "Token bulunamadı";
  }


  const url=`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${token}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: message
          }]
        }]
      })
    });

    const data = await response.json();
    
    // Yanıt kontrolü
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    console.error("Beklenmeyen API yanıtı:", data);
    return "Üzgünüm, şu anda cevap veremiyorum.";

  } catch (error) {
    console.error("Gemini APı Çağrısında bir hata:", error);
    return "Bir hata oluştu.";
    
  }





}

async function sendUserMessageToChatbot(userId: string, userName: string, userMessage: string): Promise<void> {
  const db = getFirestore();
  const chatId = `chatbot_${userId}`;
  const chatRef = doc(db, 'chats', chatId);

  // Dokümanı oluştur veya varsa merge et
  await setDoc(chatRef, {
    createdAt: serverTimestamp(),
    messages: []
  }, { merge: true });

  const userMsg = {
    fromId: userId,
    fromName: userName,
    toId: "chatbot",
    toName: "TalkioBot",
    content: userMessage,
    isSeen: false,
    time: serverTimestamp(),
  };

  // Kullanıcının mesajını ekle
  await updateDoc(chatRef, {
    messages: arrayUnion(userMsg)
  });

  // Chatbot yanıtını al
  const botResponse = await getChatbotResponse(userMessage);

  const botMsg = {
    fromId: "chatbot",
    fromName: "Chatbot",
    toId: userId,
    toName: userName,
    content: botResponse,
    isSeen: false,
    time: serverTimestamp(),
  };

  // Chatbot'un mesajını ekle
  await updateDoc(chatRef, {
    messages: arrayUnion(botMsg)
  });
}

export { getChatbotResponse, sendUserMessageToChatbot };
