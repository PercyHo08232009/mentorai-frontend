import React, { useState } from "react";

export default function AuthModal({ mode, onClose, onAuth }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = () => {
    if (!email || !password || (isSignup && !username)) return;

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if (isSignup) {
      if (users.find(u => u.email === email)) {
        alert("User already exists");
        return;
      }

      const newUser = { email, username, password };
      localStorage.setItem("users", JSON.stringify([...users, newUser]));
      localStorage.setItem("currentUser", JSON.stringify(newUser));
      onAuth(newUser);
    } else {
      const user = users.find(
        u => u.email === email && u.password === password
      );
      if (!user) {
        alert("Invalid credentials");
        return;
      }
      localStorage.setItem("currentUser", JSON.stringify(user));
      onAuth(user);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#020617] w-[400px] rounded-xl p-6 border border-blue-900">
        <h2 className="text-2xl font-semibold text-blue-300 mb-4">
          {isSignup ? "Create Account" : "Sign In"}
        </h2>

        <div className="space-y-3">
          {isSignup && (
            <input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded bg-blue-950 text-white outline-none"
            />
          )}

          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded bg-blue-950 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 rounded bg-blue-950 text-white outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-blue-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 px-5 py-2 rounded hover:bg-blue-500"
          >
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
