from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change this to your frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# store connected clients
clients = []

@app.websocket("/ws/notes")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # data will be your notes array
            print("Received notes:", data)

            # optionally broadcast to other clients
            for client in clients:
                if client != websocket:
                    await client.send_json(data)
    except Exception as e:
        print("WebSocket disconnected", e)
    finally:
        clients.remove(websocket)
