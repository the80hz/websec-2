# backend/main.py
import uvicorn
import random
import math
import asyncio
import time
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager  # добавлено

from config import API_PORT

# ==============================
# Инициализация FastAPI с lifespan обработчиком
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(game_loop())  # запускаем фоновую задачу
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)

# ==============================
# CORS middleware
# ==============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# Константы "физики" игры
# ==============================
FIELD_WIDTH = 800
FIELD_HEIGHT = 600
MAX_SPEED = 5.0        # максимально допустимая скорость
ACCELERATION = 0.2     # ускорение при нажатии клавиши
FRICTION = 0.99        # "сопротивление" для постепенного замедления, если не жмут кнопки
STAR_RADIUS = 15       # радиус, в котором засчитывается сбор звёздочки
TICK_RATE = 0.02       # время (в сек) между серверными тиками (обновлениями)

# ==============================
# Глобальное состояние
# ==============================
class Player:
    def __init__(self, player_id: str, name: str, color: str):
        self.id = player_id
        self.name = name
        self.color = color
        self.x = random.uniform(100, FIELD_WIDTH - 100)
        self.y = random.uniform(100, FIELD_HEIGHT - 100)
        self.vx = 0.0
        self.vy = 0.0
        self.up_pressed = False
        self.down_pressed = False
        self.left_pressed = False
        self.right_pressed = False

class GameState:
    def __init__(self):
        self.players = {}
        self.star_x = random.uniform(50, FIELD_WIDTH - 50)
        self.star_y = random.uniform(50, FIELD_HEIGHT - 50)
        self.lock = asyncio.Lock()

    async def add_player(self, player_id: str, name: str, color: str):
        async with self.lock:
            if player_id not in self.players:
                self.players[player_id] = Player(player_id, name, color)

    async def remove_player(self, player_id: str):
        async with self.lock:
            if player_id in self.players:
                del self.players[player_id]

    async def update_player_keys(self, player_id: str, data: dict):
        """
        Обновляем состояние нажатых клавиш. 
        На клиенте при нажатии/отжатии отправляется {type: 'keyState', up: bool, down: bool...}
        """
        async with self.lock:
            p = self.players.get(player_id)
            if not p:
                return
            p.up_pressed = data.get("up", False)
            p.down_pressed = data.get("down", False)
            p.left_pressed = data.get("left", False)
            p.right_pressed = data.get("right", False)

    async def physics_update(self):
        """Обновляем позиции игроков, обрабатываем сбор звёздочек, коллизии и т.д."""
        async with self.lock:
            for p in self.players.values():
                # Применяем ускорение
                if p.up_pressed:
                    p.vy -= ACCELERATION
                if p.down_pressed:
                    p.vy += ACCELERATION
                if p.left_pressed:
                    p.vx -= ACCELERATION
                if p.right_pressed:
                    p.vx += ACCELERATION

                # Ограничим скорость
                speed = math.sqrt(p.vx**2 + p.vy**2)
                if speed > MAX_SPEED:
                    scale = MAX_SPEED / speed
                    p.vx *= scale
                    p.vy *= scale

                # Применяем торможение (friction)
                p.vx *= FRICTION
                p.vy *= FRICTION

                # Обновляем позицию
                p.x += p.vx
                p.y += p.vy

                # Сталкиваемся со стенами: упруго отразимся
                if p.x < 0:
                    p.x = 0
                    p.vx = -p.vx
                if p.x > FIELD_WIDTH:
                    p.x = FIELD_WIDTH
                    p.vx = -p.vx
                if p.y < 0:
                    p.y = 0
                    p.vy = -p.vy
                if p.y > FIELD_HEIGHT:
                    p.y = FIELD_HEIGHT
                    p.vy = -p.vy

            # Проверяем сбор звёздочки
            for p in self.players.values():
                dist = math.hypot(p.x - self.star_x, p.y - self.star_y)
                if dist < STAR_RADIUS:
                    # Игрок p собрал звезду
                    self.star_x = random.uniform(50, FIELD_WIDTH - 50)
                    self.star_y = random.uniform(50, FIELD_HEIGHT - 50)
                    # Можно увеличить счётчик игрока, если хотите вести счёт
                    break

    def snapshot(self):
        """Снимок состояния, чтобы отправить на фронт"""
        return {
            "players": [
                {
                    "id": p.id,
                    "name": p.name,
                    "color": p.color,
                    "x": p.x,
                    "y": p.y
                }
                for p in self.players.values()
            ],
            "star": {
                "x": self.star_x,
                "y": self.star_y
            }
        }

game_state = GameState()

# Хранилище соединений
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@app.websocket("/ws")
async def game_endpoint(websocket: WebSocket):
    # Подключаемся
    await manager.connect(websocket)

    # При первом сообщении клиент может отправить, например, {"type": "join", "playerId": "...", "name": "...", "color": "..."}
    player_id = None

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "join":
                player_id = data["playerId"]
                name = data.get("name", "Anon")
                color = data.get("color", "#000")
                await game_state.add_player(player_id, name, color)

            elif msg_type == "keyState":
                # Обновляем состояние нажатых клавиш
                if player_id:
                    await game_state.update_player_keys(player_id, data)

    except WebSocketDisconnect:
        pass
    finally:
        if player_id:
            await game_state.remove_player(player_id)
        manager.disconnect(websocket)

# ==============================================
# Фоновая задача для рассылки "snapshot" state
# ==============================================
async def game_loop():
    """Запуск фонового игрового цикла"""
    while True:
        start_time = time.time()
        # Обновляем физику
        await game_state.physics_update()
        # Отправляем всем игрокам текущее состояние
        snapshot = game_state.snapshot()
        await manager.broadcast({"type": "state", "payload": snapshot})

        # Ждём до следующего тика
        elapsed = time.time() - start_time
        await asyncio.sleep(max(0, TICK_RATE - elapsed))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=API_PORT, reload=True)
