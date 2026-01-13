from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import serial
import serial.tools.list_ports

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

# Teensy serial connection
teensy = None


def find_teensy():
    """Auto-detect Teensy port"""
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "teensy" in port.description.lower() or "usb" in port.description.lower():
            return port.device
    return None


def connect_teensy():
    """Connect to Teensy via USB serial"""
    global teensy
    try:
        port = find_teensy()
        if port:
            teensy = serial.Serial(port, 115200, timeout=1)
            print(f"✅ Connected to Teensy on {port}")
            return True
        else:
            print("⚠️ Teensy not found")
            return False
    except Exception as e:
        print(f"❌ Failed to connect to Teensy: {e}")
        return False


@app.on_event("startup")
async def startup():
    """Try to connect to Teensy on startup"""
    connect_teensy()


@app.websocket("/ws/notes")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    
    # Send connection status
    await websocket.send_json({
        "type": "connection",
        "teensy_connected": teensy is not None
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle play action
            if data.get("action") == "play":
                notes = data.get("notes", [])
                bpm = data.get("bpm", 120)
                
                print(f"🎵 Playing {len(notes)} notes at {bpm} BPM")
                
                # Send to Teensy
                if teensy:
                    # Send each note to Teensy
                    # Format: "NOTE:<pitchName>,<step>,<bpm>\n"
                    for note in notes:
                        cmd = f"NOTE:{note['pitchName']},{note['step']},{bpm}\n"
                        teensy.write(cmd.encode())
                    
                    # Tell Teensy to start playing
                    teensy.write(b"PLAY\n")
                    
                    await websocket.send_json({
                        "type": "playback",
                        "status": "playing"
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Teensy not connected"
                    })
            
            # Handle stop action
            elif data.get("action") == "stop":
                print("⏹️ Stopping")
                if teensy:
                    teensy.write(b"STOP\n")
                await websocket.send_json({
                    "type": "playback",
                    "status": "stopped"
                })
            
            # Original behavior - broadcast to other clients
            else:
                print("Received notes:", data)
                for client in clients:
                    if client != websocket:
                        await client.send_json(data)
    
    except Exception as e:
        print("WebSocket disconnected", e)
    finally:
        clients.remove(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)