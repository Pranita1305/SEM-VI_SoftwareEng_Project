import { useState } from "react";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input) return;

    setMessages([...messages, { user: input }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { bot: "Zone 3 has highest demand 🚀" },
      ]);
    }, 500);

    setInput("");
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl mb-4">Chatbot 🤖</h1>

      <div className="bg-gray-800 p-4 rounded-xl h-64 overflow-y-auto">
        {messages.map((msg, i) => (
          <p key={i}>
            {msg.user ? "You: " + msg.user : "Bot: " + msg.bot}
          </p>
        ))}
      </div>

      <div className="flex mt-4 gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 rounded text-black"
          placeholder="Ask something..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}