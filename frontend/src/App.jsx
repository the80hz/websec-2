import React, { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import UserForm from "./components/UserForm";
import GameField from "./components/GameField";
import PlayerList from "./components/PlayerList";

export default function App() {
  const [playerId] = useState(() => uuidv4());
  const [userName, setUserName] = useState("");
  const [color, setColor] = useState("#" + Math.floor(Math.random() * 16777215).toString(16));
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState({
    players: [],
    star: { x: 0, y: 0 },
  });

  // Локально храним текущее состояние нажатых клавиш
  const keysRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  useEffect(() => {
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
  }, [ws]);

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

  const connectWS = () => {
    const socket = new WebSocket("ws://localhost:8000/ws");
    socket.onopen = () => {
      setConnected(true);
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-6">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Гонки за звёздочками</h1>
        <p className="text-gray-600">Управляйте машинкой и собирайте звёзды!</p>
      </header>
      <UserForm
        userName={userName}
        setUserName={setUserName}
        color={color}
        setColor={setColor}
        connectWS={connectWS}
        connected={connected}
      />
      <GameField gameState={gameState} />
      <div className="mt-4 text-gray-600 text-center">
        <p>Управление: Стрелки или WASD.</p>
        <p>До 10 игроков одновременно.</p>
      </div>
      <PlayerList players={gameState.players} />
    </div>
  );
}
