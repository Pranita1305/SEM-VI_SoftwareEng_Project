import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // replace with API later
    if (username && password) {
      localStorage.setItem("token", "dummy-jwt-token");
      alert("Logged in!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-gray-800 p-6 rounded-xl w-80">
        <h2 className="text-xl mb-4">Login 🔐</h2>

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-3 p-2 rounded text-black"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 rounded text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 py-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  );
}