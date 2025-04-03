// src/components/PlayerList.jsx
import React from 'react';

export default function PlayerList({ players }) {
  return (
    <div className="mt-4 w-full max-w-md">
      <h2 className="font-bold text-lg mb-2">Список игроков:</h2>
      <ul className="list-disc ml-6">
        {players.map((p) => (
          <li key={p.id} style={{ color: p.color }}>
            {p.name} (Очки: {p.score}) [{Math.round(p.x)}, {Math.round(p.y)}]
          </li>
        ))}
      </ul>
    </div>
  );
}
