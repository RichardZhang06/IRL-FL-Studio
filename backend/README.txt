setup:
pip install -r requirements_minimal.txt
python main_minimal.py

frontend usage:
const ws = new WebSocket('ws://localhost:8000/ws/notes');

// Send play command
ws.send(JSON.stringify({
    action: "play",
    bpm: 120,
    notes: [
        {id: 1, pitchName: "E", step: 0},
        {id: 2, pitchName: "G", step: 4},
        {id: 3, pitchName: "A", step: 8}
    ]
}));

// Send stop command
ws.send(JSON.stringify({
    action: "stop"
}));

What Teensy gets:
NOTE:E,0,120
NOTE:G,4,120
NOTE:A,8,120
PLAY

Teensy will convert notes to correct positions and play them. 