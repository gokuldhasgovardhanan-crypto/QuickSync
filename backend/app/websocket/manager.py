import json
import logging
from typing import List, Dict, Any
from fastapi import WebSocket
from datetime import datetime, timezone

logger = logging.getLogger("quicksync.websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")
        # Send initial status
        await self.send_personal_message({
            "event": "connection_established",
            "status": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "active_clients": len(self.active_connections)
        }, websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.warning(f"Error sending message to client: {e}")

    async def broadcast(self, event_name: str, payload: Any):
        if not self.active_connections:
            return
            
        message = {
            "event": event_name,
            "data": payload,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        serialized = json.dumps(message)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(serialized)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                dead_connections.append(connection)
                
        for dead in dead_connections:
            if dead in self.active_connections:
                self.active_connections.remove(dead)

ws_manager = ConnectionManager()
