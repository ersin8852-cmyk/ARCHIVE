import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAmlUeEg0Ln1eYtWZOeyKBGY5BHyiah8hQ",
  authDomain: "archive-984e6.firebaseapp.com",
  projectId: "archive-984e6",
  storageBucket: "archive-984e6.firebasestorage.app",
  messagingSenderId: "508847264735",
  appId: "1:508847264735:web:108a98e09d4d430412ea6a"
};

const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const auth = app.auth();
const db = app.firestore();

db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: Birden fazla sekme açık, yalnızca biri offline çalışabilir.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: Bu tarayıcı desteklemiyor.');
  }
});

export { app as firebaseApp, auth as firebaseAuth, db as firebaseDb };
