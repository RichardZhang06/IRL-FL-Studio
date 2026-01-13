import { useEffect, useRef } from "react";
import type { Note } from "./PianoRoll";

export default function useNotesWebSocket(notes: Note[]) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:5173/ws/notes");

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onmessage = (event) => {
      try {
        const data: Note[] = JSON.parse(event.data);
        console.log("Received from backend:", data);
        // optionally update your notes state here if server broadcasts
      } catch (err) {
        console.error("Invalid data from WebSocket:", err);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  // Send notes whenever they change
  useEffect(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(notes));
    }
  }, [notes]);
}
