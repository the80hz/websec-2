// src/components/UserForm.jsx
import React from 'react';

export default function UserForm({ userName, setUserName, color, setColor, connectWS, connected }) {
  return (
    <div className="mb-4 flex gap-2">
      <input
        type="text"
        className="border px-2 py-1"
        placeholder="Ваше имя"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <input
        type="color"
        className="border"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <button
        onClick={connectWS}
        className="bg-blue-500 text-white px-3 py-1 rounded"
        disabled={connected}
      >
        {connected ? "Connected" : "Connect"}
      </button>
    </div>
  );
}
