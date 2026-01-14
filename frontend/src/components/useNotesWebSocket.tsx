import { useEffect, useRef } from "react";
import type { Note } from "./PianoRoll";

export default function useNotesWebSocket() {
  const ws = useRef<WebSocket | null>(null);

  // Connect to backend WebSocket
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/ws/notes");

    ws.current.onopen = () => {
      console.log("WebSocket connected to backend");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS message from backend:", data);
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected from backend");
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  // Send play command
  const play = (notes: Note[], bpm: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: "play",
          bpm,
          notes,
        })
      );
    } else {
      console.warn("WebSocket not connected yet");
    }
  };

  // Send stop command
  const stop = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: "stop" }));
    } else {
      console.warn("WebSocket not connected yet");
    }
  };

  return { play, stop };
}
