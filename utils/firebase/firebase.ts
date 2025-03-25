//setup your .env file
// import { FirebaseApiKey,FirebaseAppId,FirebaseAuthDomain,FirebaseMeasurmentId,FirebaseMessagingSenderId,FirebaseProjectId,EXPO_FirebaseStorageBucket } from "@env";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import * as firebaseAuth from 'firebase/auth';
import {initializeAuth} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import AsyncStorage from "@react-native-async-storage/async-storage";

import {getStorage} from "firebase/storage"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FirebaseApiKey,
  authDomain: process.env.EXPO_PUBLIC_FirebaseAuthDomain,
  databaseURL: process.env.EXPO_PUBLIC_FirebaseDatabaseUrl,
  projectId: process.env.EXPO_PUBLIC_FirebaseProjectId,
  storageBucket: process.env.EXPO_PUBLIC_FirebaseStorageBucket,
  messagingSenderId: process.env.EXPO_PUBLIC_FirebaseMessagingSenderId,
  appId:process.env.EXPO_PUBLIC_FirebaseAppId,
  measurementId:process.env.EXPO_PUBLIC_FirebaseMeasurmentId
};

// Initialize Firebase


const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: reactNativePersistence(AsyncStorage)
});
const storage = getStorage(app); // Initialize storage



export { db, auth,storage }; // Export