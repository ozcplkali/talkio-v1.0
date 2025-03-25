import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { auth,db } from '../utils/firebase/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore,doc,setDoc,getDoc } from 'firebase/firestore';
import { uploadImageToStorage } from '@/components/uploadImage';
import { Alert } from 'react-native';

type AuthContextType = {
  user: User | null;
  userData:any;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string,name:string,image?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData,setUserData]=useState<any>(null);
  



  useEffect(() => {
    async function initializeGlobalChatbot() {
      const db = getFirestore();
      const chatbotDocRef = doc(db, 'users', 'chatbot');
      const docSnap = await getDoc(chatbotDocRef);
      if (!docSnap.exists()) {
        await setDoc(chatbotDocRef, {
          name: "Chatbot",
          email: "chatbot@system.com",
          userId: "chatbot",
          profileImageUrl: null,
          blocked: []
        });
        // console.log("Global chatbot oluşturuldu.");
      }
    }
    initializeGlobalChatbot();
  }, []);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthenticated(!!user);
      setIsLoading(false);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Kullanıcı verileri alınamadı:", error);
        }
      } 
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
    } catch (error: any) {
      throw new Error(error.message);
    }
  };


  const signUp = async (email: string, password: string, name: string, image?: string) => {
    try {
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      let profileImageUrl = null;
      
      if (image) {
        
        try {
          profileImageUrl = await uploadImageToStorage(image, user.uid);
        } catch (uploadError) {
          console.error("Profil fotoğrafı yüklenemedi:", uploadError);
        }
      }
      




      const chatbotEntry = {
        chatId: `chatbot_${user.uid}`, 
        lastMessage: "Chatbot ile konuşmaya başla!",
        receiverId: "chatbot", // global chatbot'un id'si
        updatedAt: Date.now(),
      };      
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: email,
          userId: user.uid,
          blocked: [],
          profileImageUrl: profileImageUrl  
        }),
        
        setDoc(doc(db, 'userchats', user.uid), {
          chats:[chatbotEntry]
        })
      ]);
  
      setUserData({
        name: name,
        email: email,
        userId: user.uid,
        blocked: [],
        profileImageUrl: profileImageUrl
      });
     
    } catch (error: any) {
      console.error("Kayıt hatası:", error);
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.multiRemove(['isUserLoggedIn', 'loggedUserId']);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      
      user,
      userData, 
      isLoading, 
      signIn, 
      signUp, 
      signOut, 
      isAuthenticated,
      refreshUserData 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);