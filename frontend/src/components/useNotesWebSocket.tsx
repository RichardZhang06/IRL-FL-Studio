// useNotesWebSocket.tsx
import { useEffect, useRef } from "react";
import type { Note } from "./PianoRoll";

export default function useNotesWebSocket(
  notes: Note[],
  playing: boolean,
  bpm: number
) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/ws/notes");

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: "state",
          notes,
          playing,
          bpm,
        })
      );
    }
  }, [notes, playing, bpm]);
}
