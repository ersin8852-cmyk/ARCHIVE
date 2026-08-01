import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAmlUeEg0Ln1eYtWZOeyKBGY5BHyiah8hQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "archive-984e6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "archive-984e6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "archive-984e6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "508847264735",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:508847264735:web:108a98e09d4d430412ea6a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NC766EDJGX"
};

const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
export const auth = app.auth();
export const db = app.firestore();

db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: Birden fazla sekme açık, yalnızca biri offline çalışabilir.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: Bu tarayıcı desteklemiyor.');
  }
});
