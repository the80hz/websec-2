import React from 'react';

export default function GameField({ gameState }) {
  return (
    <div
      className="relative bg-gradient-to-br from-green-200 to-green-100 border-2 border-gray-400 rounded-lg shadow-lg"
      style={{ width: "800px", height: "600px", overflow: "hidden" }}
    >
      {/* Звезда */}
      <div
        className="absolute w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-600"
        style={{
          left: gameState.star.x + "px",
          top: gameState.star.y + "px",
          transform: "translate(-50%, -50%)",
        }}
      ></div>

      {/* Игроки */}
      {gameState.players.map((player) => (
        <div
          key={player.id}
          className="absolute w-8 h-8 rounded-full border-2 flex items-center justify-center"
          style={{
            backgroundColor: player.color,
            left: player.x + "px",
            top: player.y + "px",
            transform: "translate(-50%, -50%)",
            borderColor: "#555",
          }}
        >
          <span className="text-xs text-white font-semibold">
            {player.name.substring(0, 2)}
          </span>
        </div>
      ))}
    </div>
  );
}
