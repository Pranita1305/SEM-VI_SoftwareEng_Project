export default function ChatWindow({ messages }) {
  return (
    <div className="bg-gray-800 p-4 rounded-xl h-64 overflow-y-auto">
      {messages.map((msg, i) => (
        <div key={i} className="mb-2">
          {msg.user && (
            <p className="text-blue-400">
              You: {msg.user}
            </p>
          )}

          {msg.bot && (
            <p className="text-green-400">
              Bot: {msg.bot}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}