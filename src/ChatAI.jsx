import { useEffect, useRef, useState } from "react";
import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  Timestamp,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import './ChatAI.css';

// Spinner de încărcare
const Spinner = () => (
  <div className="spinner">
    <div className="loader" />
  </div>
);

// Format dată (ex: "Astăzi", "Ieri", "24 mai 2025")
const formatDateHeader = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (d1, d2) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  if (sameDay(date, today)) return "Astăzi";
  if (sameDay(date, yesterday)) return "Ieri";

  return date.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

function ChatAI({ user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.body.className = theme;
    inputRef.current?.focus();
  }, [theme]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      where("userId", "==", user.uid),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          role: data.sender === "user" ? "user" : "assistant",
          content: data.text,
          createdAt: data.createdAt?.toDate?.() || null,
        });
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveMessageToFirestore = async (sender, text) => {
    try {
      await addDoc(collection(db, "messages"), {
        sender,
        text,
        createdAt: Timestamp.now(),
        userId: user.uid,
      });
    } catch (error) {
      console.error("Eroare la salvarea mesajului:", error);
    }
  };

  const clearChat = async () => {
    const q = query(collection(db, "messages"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const deletions = querySnapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "messages", docSnap.id))
    );
    await Promise.all(deletions);
    setMessages([]);
  };

  const groupMessagesByDate = (msgs) => {
    const grouped = {};
    msgs.forEach((msg) => {
      const dateKey = msg.createdAt
        ? formatDateHeader(msg.createdAt)
        : "Necunoscut";
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(msg);
    });
    return grouped;
  };

const handleSend = async () => {
  if (!input.trim()) return;

  const userMessage = { role: "user", content: input };
  setMessages((prev) => [...prev, userMessage]);
  saveMessageToFirestore("user", input);
  setInput("");
  setLoading(true);

  const loadingMsg = { role: "assistant", content: "loading..." };
  setMessages((prev) => [...prev, loadingMsg]);

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: input,
          parameters: {
            max_new_tokens: 150,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      let errorMsg = `Eroare de rețea (${response.status})`;
      if (response.status === 401) errorMsg = "⚠️ Token invalid sau expirat.";
      else if (response.status === 429) errorMsg = "⚠️ Prea multe cereri. Așteaptă puțin.";
      else if (response.status === 503) errorMsg = "⚠️ Model indisponibil momentan.";
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const aiText =
      typeof data === "string"
        ? data
        : data?.[0]?.generated_text || "Modelul nu a returnat niciun răspuns.";

    const aiMessage = { role: "assistant", content: aiText };
    setMessages((prev) => {
      const newMsgs = [...prev];
      newMsgs[newMsgs.length - 1] = aiMessage;
      return newMsgs;
    });
    saveMessageToFirestore("assistant", aiText);
  } catch (error) {
    const errorMsg = `💥 ${error.message || "Eroare neașteptată."}`;
    setMessages((prev) => {
      const newMsgs = [...prev];
      newMsgs[newMsgs.length - 1] = { role: "assistant", content: errorMsg };
      return newMsgs;
    });
    saveMessageToFirestore("assistant", errorMsg);
  } finally {
    setLoading(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }
};

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className={`chat-container ${theme}`}>
      <div className="theme-toggle">
        <button onClick={toggleTheme}>
          {theme === 'dark' ? '🌞 Light Mode' : '🌙 Dark Mode'}
        </button>
        <button
  onClick={async () => {
    await signOut(auth);
    localStorage.removeItem("user");
    window.location.reload(); // 👉 forțează App să reîncarce fără user
  }}
>
  🔓 Logout
</button>

        <button onClick={clearChat}>🗑️ Șterge chat</button>
      </div>

      <div className="messages">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="date-header">{date}</div>
            {msgs.map((msg, idx) => (
              <div key={idx} className={`message-wrapper ${msg.role}`}>
                <div className="avatar">
                  {msg.role === 'user' ? '🧑' : '🤖'}
                </div>
                <div className={`message ${msg.role}`}>
                  {msg.content === "loading..." ? <Spinner /> : msg.content}
                  {msg.createdAt && (
                    <div className="timestamp">
                      {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrie un mesaj..."
        />
        <button onClick={handleSend} disabled={loading}>Trimite</button>
      </div>
    </div>
  );
}

export default ChatAI;
