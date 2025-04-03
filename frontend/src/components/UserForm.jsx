import React from 'react';

export default function UserForm({ userName, setUserName, color, setColor, connectWS, connected }) {
  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-md flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <label className="text-gray-700 font-medium">Имя:</label>
        <input
          type="text"
          className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ваше имя"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <label className="text-gray-700 font-medium">Цвет:</label>
        <input
          type="color"
          className="border rounded p-1"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <button
        onClick={connectWS}
        className={`px-4 py-2 rounded text-white font-bold shadow-md transition-colors duration-300 ${connected ? 'bg-green-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
        disabled={connected}
      >
        {connected ? "Подключено" : "Подключиться"}
      </button>
    </div>
  );
}
