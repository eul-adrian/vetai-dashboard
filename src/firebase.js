import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQEdW-UaHBEQhcyC1hcYT-rEmwz0e2qZw",
  authDomain: "vetai2.firebaseapp.com",
  projectId: "vetai2",
  storageBucket: "vetai2.firebasestorage.app",
  messagingSenderId: "462158500266",
  appId: "1:462158500266:web:52a21ba1e94013972c1bd3",
  measurementId: "G-VXQK4C8WCB"
};

// 🔧 Inițializează Firebase
const app = initializeApp(firebaseConfig);

// 📦 Inițializează Firestore și Auth
const db = getFirestore(app);
const auth = getAuth(app);

// 🔑 Provider pentru autentificare cu Google
const provider = new GoogleAuthProvider();

// ✅ Exportă tot ce ai nevoie în aplicație
export { db, auth, provider as googleProvider };
