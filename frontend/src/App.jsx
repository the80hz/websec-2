// frontend/src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

export default function App() {
  const [playerId] = useState(() => uuidv4());
  const [userName, setUserName] = useState("");
  const [color, setColor] = useState("#" + Math.floor(Math.random()*16777215).toString(16));

  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);

  const [gameState, setGameState] = useState({
    players: [],
    star: { x: 0, y: 0 },
  });

  // Локально храним текущие нажатые клавиши, чтобы не спамить
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    // Навешиваем обработчики нажатия
    const handleKeyDown = (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          if (!keysRef.current.up) {
            keysRef.current.up = true;
            sendKeyState();
          }
          break;
        case "ArrowDown":
        case "KeyS":
          if (!keysRef.current.down) {
            keysRef.current.down = true;
            sendKeyState();
          }
          break;
        case "ArrowLeft":
        case "KeyA":
          if (!keysRef.current.left) {
            keysRef.current.left = true;
            sendKeyState();
          }
          break;
        case "ArrowRight":
        case "KeyD":
          if (!keysRef.current.right) {
            keysRef.current.right = true;
            sendKeyState();
          }
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case "ArrowUp":
        case "KeyW":
          if (keysRef.current.up) {
            keysRef.current.up = false;
            sendKeyState();
          }
          break;
        case "ArrowDown":
        case "KeyS":
          if (keysRef.current.down) {
            keysRef.current.down = false;
            sendKeyState();
          }
          break;
        case "ArrowLeft":
        case "KeyA":
          if (keysRef.current.left) {
            keysRef.current.left = false;
            sendKeyState();
          }
          break;
        case "ArrowRight":
        case "KeyD":
          if (keysRef.current.right) {
            keysRef.current.right = false;
            sendKeyState();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Функция для отправки актуального keyState на сервер
  const sendKeyState = () => {
    if (ws) {
      ws.send(
        JSON.stringify({
          type: "keyState",
          up: keysRef.current.up,
          down: keysRef.current.down,
          left: keysRef.current.left,
          right: keysRef.current.right,
        })
      );
    }
  };

  // Подключение к веб-сокету
  const connectWS = () => {
    const socket = new WebSocket("ws://localhost:5000/ws");
    socket.onopen = () => {
      setConnected(true);
      // Отправляем join
      socket.send(
        JSON.stringify({
          type: "join",
          playerId,
          name: userName || "Anon",
          color: color,
        })
      );
    };
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "state") {
        setGameState(msg.payload);
      }
    };
    socket.onclose = () => {
      setConnected(false);
    };

    setWs(socket);
  };

  return (
    <div className="flex flex-col items-center p-4">
      {/* Простая «форма» для ввода имени и выбора цвета */}
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

      {/* Игровое поле 800x600 */}
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

      {/* Дополнительная информация/подсказка */}
      <div className="mt-4 text-gray-600">
        <p>Управление: Стрелки или WASD. Собирайте звёздочки!</p>
        <p>Игроков может быть до 10 одновременно.</p>
      </div>

      {/* Выведем текущий список игроков */}
      <div className="mt-4 w-full max-w-md">
        <h2 className="font-bold text-lg mb-2">Список игроков:</h2>
        <ul className="list-disc ml-6">
          {gameState.players.map((p) => (
            <li key={p.id} style={{ color: p.color }}>
              {p.name} [{Math.round(p.x)}, {Math.round(p.y)}]
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
