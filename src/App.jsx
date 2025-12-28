import React, { useState, useEffect, useRef } from "react";
import { loginWithGoogle, logout as firebaseLogout } from "./firebase/firebase";

function App() {
  /* =======================
     AUTH STATE
  ======================= */
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("currentUser"))
  );

  const [notification, setNotification] = useState(null);

  const handleLogin = async () => {
    try {
      const userData = await loginWithGoogle();
      localStorage.setItem("currentUser", JSON.stringify(userData));
      setUser(userData);

      setNotification(`🎉 Welcome, ${userData.username || userData.email}!`);
      setTimeout(() => setNotification(null), 3000);

      // Load user-specific chat data
      const savedChats = localStorage.getItem(`chats_${userData.email}`);
      const savedChatId = localStorage.getItem(`currentChatId_${userData.email}`);
      const savedInput = localStorage.getItem(`currentInput_${userData.email}`);

      if (savedChats) setChats(JSON.parse(savedChats));
      if (savedChatId) setCurrentChatId(JSON.parse(savedChatId));
      if (savedInput) setInput(savedInput);

    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const handleLogout = async () => {
    if (user) {
      // Save current user's chat data before logging out
      localStorage.setItem(`chats_${user.email}`, JSON.stringify(chats));
      localStorage.setItem(`currentChatId_${user.email}`, JSON.stringify(currentChatId));
      localStorage.setItem(`currentInput_${user.email}`, input);
    }

    await firebaseLogout();
    localStorage.removeItem("currentUser");
    setUser(null);

    // Reset local state to default for no user
    setChats([{ id: 1, name: "New Chat", messages: [] }]);
    setCurrentChatId(1);
    setInput("");
  };

  /* =======================
     CHAT STATE
  ======================= */
  const [chats, setChats] = useState([
    { id: 1, name: "New Chat", messages: [] }
  ]);
  const [currentChatId, setCurrentChatId] = useState(1);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const [editingChatId, setEditingChatId] = useState(null);
  const [chatNameInput, setChatNameInput] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId]);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  /* =======================
     STREAMING RESPONSE
  ======================= */
  const streamAssistantMessage = (chatId, fullText) => {
    let index = 0;

    const interval = setInterval(() => {
      index++;

      setChats(prev =>
        prev.map(chat => {
          if (chat.id === chatId) {
            const messages = [...chat.messages];
            const last = messages[messages.length - 1];

            if (last?.role === "assistant") {
              last.content = fullText.slice(0, index);
            } else {
              messages.push({
                role: "assistant",
                content: fullText.slice(0, index)
              });
            }
            return { ...chat, messages };
          }
          return chat;
        })
      );

      if (index >= fullText.length) clearInterval(interval);
    }, 18);
  };

  /* =======================
     CHAT ACTIONS
  ======================= */
  const deleteChat = (chatId) => {
    setChats(prev => {
      const filtered = prev.filter(chat => chat.id !== chatId);
      if (chatId === currentChatId && filtered.length) {
        setCurrentChatId(filtered[0].id);
      }
      return filtered.length
        ? filtered
        : [{ id: 1, name: "New Chat", messages: [] }];
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, { role: "user", content: input }]
            }
          : chat
      )
    );

    setThinking(true);
    const userInput = input;
    setInput("");

    try {
      const response = await fetch(
        "https://percyho-mentorai-backend.hf.space/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            session_id: String(currentChatId),
            message: userInput
          })
        }
      );

      const data = await response.json();
      let botReply = data.response || "⚠️ AI did not respond";
      botReply = botReply.split(".").join(".\n");

      streamAssistantMessage(currentChatId, botReply);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setThinking(false), 300);
    }
  };

  const createNewChat = () => {
    const newId = chats.length + 1;
    setChats([...chats, { id: newId, name: `Chat ${newId}`, messages: [] }]);
    setCurrentChatId(newId);
  };

  const startEditingChat = (chat) => {
    setEditingChatId(chat.id);
    setChatNameInput(chat.name);
  };

  const saveChatName = (chatId) => {
    if (!chatNameInput.trim()) return;
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, name: chatNameInput } : chat
      )
    );
    setEditingChatId(null);
  };

  /* =======================
     PERSISTENCE WHILE SIGNED IN
  ======================= */
  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(`chats_${user.email}`, JSON.stringify(chats));
      } catch (err) {
        console.error("Failed to save chats:", err);
      }
    }
  }, [chats, user]);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(`currentChatId_${user.email}`, JSON.stringify(currentChatId));
      } catch (err) {
        console.error("Failed to save currentChatId:", err);
      }
    }
  }, [currentChatId, user]);

  useEffect(() => {
    if (user) {
      try {
        localStorage.setItem(`currentInput_${user.email}`, input);
      } catch (err) {
        console.error("Failed to save input:", err);
      }
    }
  }, [input, user]);

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="flex h-screen bg-[#020617] text-white relative">

      {/* SIDEBAR */}
      <div className="w-64 border-r border-blue-900 p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-blue-300">🐙 OctoChat</h2>

        <div className="flex flex-col gap-2 overflow-y-auto">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer ${
                chat.id === currentChatId
                  ? "bg-blue-900 text-blue-200"
                  : "hover:bg-blue-950"
              }`}
            >
              {editingChatId === chat.id ? (
                <input
                  autoFocus
                  value={chatNameInput}
                  onChange={e => setChatNameInput(e.target.value)}
                  onBlur={() => saveChatName(chat.id)}
                  onKeyDown={e => e.key === "Enter" && saveChatName(chat.id)}
                  className="bg-blue-950 text-sm rounded px-2 py-1 w-full outline-none"
                />
              ) : (
                <>
                  <span className="truncate">{chat.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        startEditingChat(chat);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={createNewChat}
          className="mt-auto bg-blue-600 py-2 rounded hover:bg-blue-500"
        >
          + New Chat
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex justify-center p-6 relative">
        <div className="w-[1200px] h-full flex flex-col border border-blue-900 rounded-xl shadow-xl pt-16 relative">

          {/* TOP AUTH BAR */}
          <div className="w-full absolute top-0 left-0 flex justify-end items-center bg-[#0B1120] border-b border-blue-800 px-8 h-16 shadow-md z-20">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-blue-300 font-medium">
                  👤 {user.username || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-500 px-4 py-1 rounded-md"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-gradient-to-r from-blue-700 to-purple-700 px-6 py-2 rounded-full font-bold"
              >
                Sign in with Google
              </button>
            )}
          </div>

          {/* NOTIFICATION */}
          {notification && (
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-700 px-6 py-3 rounded-full shadow-lg animate-floatUp z-30">
              {notification}
            </div>
          )}

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-16 py-10 space-y-8">
            {currentChat.messages.length === 0 && !thinking && (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="text-7xl">🐙</div>
                <h1 className="text-3xl text-blue-200">Welcome to OctoChat</h1>
                <p className="text-blue-300">
                  AI-powered learning assistant built by Phu Quy Ho.
                </p>
              </div>
            )}

            {currentChat.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div className="flex gap-3 max-w-[800px]">
                  {msg.role === "assistant" && <span>🐙</span>}
                  <div
                    className={`px-5 py-4 rounded-xl whitespace-pre-wrap ${
                      msg.role === "assistant"
                        ? "bg-blue-950 border border-blue-800"
                        : "bg-blue-600"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-3 items-center text-blue-300">
                <span className="animate-pulse">🐙</span> Thinking...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT */}
          <div className="p-5 border-t border-blue-900 flex gap-4">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask OctoChat a learning question..."
              className="flex-1 px-4 py-3 rounded-lg bg-blue-950 outline-none"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 px-8 rounded-lg hover:bg-blue-500"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translate(-50%, 0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translate(-50%, -150px); opacity: 0; }
        }
        .animate-floatUp {
          animation: floatUp 3s ease forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
