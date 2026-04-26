import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDoc, doc } from 'firebase/firestore';

// To the User: Replace these with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

let db = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase is not configured yet. It will fail if you try to save.", error);
}

export const saveQuizToFirebase = async (quizData) => {
  if (!db) throw new Error("Firebase is not initialized. Please add config in src/firebase.js");
  try {
    const docRef = await addDoc(collection(db, "quizzes"), {
      data: quizData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const getQuizFromFirebase = async (quizId) => {
  if (!db) throw new Error("Firebase is not initialized.");
  const docRef = doc(db, "quizzes", quizId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().data;
  } else {
    throw new Error("No such quiz found!");
  }
};
