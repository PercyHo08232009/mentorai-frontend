// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-3EhUbWwz1EQmKTDGtdRfWLsDGDJaVto",
  authDomain: "aichatbotlogin-87dc8.firebaseapp.com",
  projectId: "aichatbotlogin-87dc8",
  storageBucket: "aichatbotlogin-87dc8.firebasestorage.app",
  messagingSenderId: "1047738985910",
  appId: "1:1047738985910:web:523920653fe6ff97d5e517",
  measurementId: "G-FPMQ9Z2E5H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Google Auth provider
const provider = new GoogleAuthProvider();

// Helper functions
const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = {
      uid: result.user.uid,
      email: result.user.email,
      username: result.user.displayName,
      photoURL: result.user.photoURL
    };
    return user;
  } catch (err) {
    console.error("Google login error:", err);
    throw err;
  }
};

const logout = async () => {
  await signOut(auth);
};

export { auth, provider, loginWithGoogle, logout };