// firebase.js
// ⚠️ Firebase client config'i frontend'de zorunlu olarak görünür.
// Asıl güvenlik Firestore Security Rules ile sağlanır (firestore.rules dosyasına bakın).
// Eğer bir build sistemi (Vite vb.) kullanılırsa, bu değerler .env dosyasından okunmalıdır.

const firebaseConfig = {
  apiKey: (window.__ENV__ && window.__ENV__.FIREBASE_API_KEY) || "AIzaSyAmlUeEg0Ln1eYtWZOeyKBGY5BHyiah8hQ",
  authDomain: (window.__ENV__ && window.__ENV__.FIREBASE_AUTH_DOMAIN) || "archivebook.vercel.app",
  projectId: (window.__ENV__ && window.__ENV__.FIREBASE_PROJECT_ID) || "archive-984e6",
  storageBucket: (window.__ENV__ && window.__ENV__.FIREBASE_STORAGE_BUCKET) || "archive-984e6.firebasestorage.app",
  messagingSenderId: (window.__ENV__ && window.__ENV__.FIREBASE_MESSAGING_SENDER_ID) || "508847264735",
  appId: (window.__ENV__ && window.__ENV__.FIREBASE_APP_ID) || "1:508847264735:web:108a98e09d4d430412ea6a",
  measurementId: (window.__ENV__ && window.__ENV__.FIREBASE_MEASUREMENT_ID) || "G-NC766EDJGX"
};

// Initialize Firebase (using UMD window objects since we load via CDN in index.html)
const app = window.firebase.initializeApp(firebaseConfig);
const auth = window.firebase.auth();
const db = window.firebase.firestore();

// Enable Firestore offline persistence for better PWA experience
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: Birden fazla sekme açık, yalnızca biri offline çalışabilir.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: Bu tarayıcı desteklemiyor.');
  }
});

// Export them to window so other files can use them easily without module bundler
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
