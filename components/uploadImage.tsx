import { storage } from "../utils/firebase/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Platform } from "react-native";

// Resmi Firebase Storage'a yükleyen fonksiyon
export const uploadImageToStorage = async (
  imageUri: string,
  userId: string
): Promise<string> => {
  // console.log("Yükleme başladı, resim URI:", imageUri);
  
  try {
    // Eğer bu zaten bir https URL ise, doğrudan döndür
    if (imageUri.startsWith('https://')) {
      // console.log("Bu zaten bir web URL'si, doğrudan döndürülüyor");
      return imageUri;
    }
    
    // Yerel dosyayı fetch et
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Resim alınamadı: ${response.status}`);
    }
    
    const blob = await response.blob();
    // console.log("Resim blob'a dönüştürüldü, boyut:", blob.size);
    
    // Storage referansını oluştur (benzersiz isim için timestamp ekle)
    const filename = `${userId}_${Date.now()}.jpg`;
    const imageRef = ref(storage, `profilePictures/${filename}`);
    
    // Blob'u yükle
    // console.log("Firebase Storage'a yükleniyor...");
    await uploadBytes(imageRef, blob);
    // console.log("Yükleme tamamlandı!");
    
    // URL'yi al
    const downloadURL = await getDownloadURL(imageRef);
    // console.log("Alınan indirme URL'si:", downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error("Resim yükleme hatası (detaylı):", error);
    throw new Error("Resim yüklenemedi: " + (error instanceof Error ? error.message : String(error)));
  }
};
