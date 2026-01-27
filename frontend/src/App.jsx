import { useState } from 'react' 
import './App.css' 

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center 
    bg-gray-800">
      <div className="bg-gray-400 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-[320px] text-center">
        
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
          Button😋
        </h1>

        <p className="text-lg text-gray-600 mb-6">
          Count = {" "}
          <span className="font-bold text-black text-xl">
            {count}
          </span>
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setCount(count + 1)}
            className="px-5 py-2 rounded-xl bg-gray-600 text-white font-semibold
                       hover:bg-gray-900 active:scale-95 transition-all"
          >
            Increment
          </button>

          <button
            onClick={() => setCount(0)}
            className="px-5 py-2 rounded-xl bg-gray-200 text-gray-800 font-semibold
                       hover:bg-gray-300 active:scale-95 transition-all"
          >
            Reset
          </button>
        </div>

      </div>
    </div>
  );
}

export default App
