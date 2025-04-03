// src/components/GameField.jsx
import React from 'react';

export default function GameField({ gameState }) {
  return (
    <div
      className="relative bg-green-100 border border-gray-500"
      style={{
        width: "800px",
        height: "600px",
        overflow: "hidden",
      }}
    >
      {/* Отображаем звезду */}
      <div
        className="absolute w-4 h-4 rounded-full bg-yellow-300 border border-yellow-500"
        style={{
          left: gameState.star.x + "px",
          top: gameState.star.y + "px",
          transform: "translate(-50%, -50%)",
        }}
      ></div>

      {/* Отображаем всех игроков */}
      {gameState.players.map((player) => (
        <div
          key={player.id}
          className="absolute w-6 h-6 rounded-full border-2"
          style={{
            backgroundColor: player.color,
            left: player.x + "px",
            top: player.y + "px",
            transform: "translate(-50%, -50%)",
            borderColor: "#555",
          }}
        >
          <div className="text-xs text-white text-center leading-6 font-bold">
            {player.name.substring(0, 2)}
          </div>
        </div>
      ))}
    </div>
  );
}
