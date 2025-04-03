import React from 'react';

export default function PlayerList({ players }) {
  return (
    <div className="mt-6 w-full max-w-md bg-white rounded-lg shadow-md p-4">
      <h2 className="font-bold text-lg mb-4 text-gray-800">Список игроков</h2>
      <ul className="divide-y divide-gray-200">
        {players.map((p) => (
          <li key={p.id} className="py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }}></div>
              <span className="text-gray-700 font-medium">{p.name}</span>
            </div>
            <span className="text-sm text-gray-500">Очки: {p.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
