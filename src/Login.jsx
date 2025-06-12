import { useState } from "react";
import { auth, googleProvider } from "./firebase.js"; // <-- corect importat
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));
    } catch (error) {
      console.error("Eroare Google login:", error);
    }
  };

  const handleEmailLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      onLogin(result.user);
      localStorage.setItem("user", JSON.stringify(result.user));
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          onLogin(result.user);
          localStorage.setItem("user", JSON.stringify(result.user));
        } catch (err) {
          console.error("Eroare creare cont:", err);
        }
      } else {
        console.error("Eroare autentificare:", error);
      }
    }
  };

  return (
    <div>
      <h2>Autentificare</h2>
      <button onClick={handleGoogleLogin}>Autentifică-te cu Google</button>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Parolă"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleEmailLogin}>Autentificare / Înregistrare</button>
      </div>
    </div>
  );
}

export default Login;
