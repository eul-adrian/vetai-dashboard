import { useEffect, useState } from "react";
import { auth } from "./firebase";
import ChatAI from "./ChatAI";
import Login from "./Login";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.setItem("user", JSON.stringify(firebaseUser));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Se încarcă...</p>;

  return (
    <div>
      {user ? <ChatAI user={user} /> : <Login onLogin={setUser} />}
    </div>
  );
}

export default App;
