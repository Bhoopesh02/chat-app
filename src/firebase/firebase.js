import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Replace the following with your app's Firebase project configuration
// You can find these values in your Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBdPcZCISCP-wJB9rOAKawDnu_PEdDZ6dU",
  authDomain: "my-chat-app-bcb90.firebaseapp.com",
  projectId: "my-chat-app-bcb90",
  storageBucket: "my-chat-app-bcb90.firebasestorage.app",
  messagingSenderId: "511090289793",
  appId: "1:511090289793:web:53ddcc6aead72f43de7180",
  measurementId: "G-6ECNYXBCQC",
  databaseURL: "https://my-chat-app-bcb90-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Realtime Database and get a reference to the service
export const db = getDatabase(app);

export default app;
