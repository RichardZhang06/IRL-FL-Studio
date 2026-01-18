// useNotesWebSocket.tsx
import { useEffect, useRef } from "react";
import type { Note } from "./PianoRoll";
import { STEP_WIDTH, GUITAR_NOTE_MAP, NOTE_GROUPS } from "../constants";

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

  // Convert note to guitar string data
  const convertNoteToGuitarData = (note: Note) => {
    const guitarPos = GUITAR_NOTE_MAP[note.pitchName]?.[0];
    
    if (!guitarPos) {
      return {
        ...note,
        stringNumber: null,
        fretNumber: null,
        noteGroup: findNoteGroupIndex(note.pitchName),
      };
    }
    
    return {
      ...note,
      stringNumber: guitarPos.string,
      fretNumber: guitarPos.state,
      noteGroup: findNoteGroupIndex(note.pitchName),
    };
  };

  // Find which note group (string) a note belongs to
  const findNoteGroupIndex = (pitchName: string): number | null => {
    const groupIndex = NOTE_GROUPS.findIndex(group => group.includes(pitchName));
    return groupIndex !== -1 ? groupIndex : null;
  };

  // Send play command
  const play = (notes: Note[], bpm: number, playheadX: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      // Convert playhead position to step
      const currentStep = playheadX / STEP_WIDTH;
      
      // Filter out notes that are behind the playhead
      const filteredNotes = notes.filter((note) => note.step >= currentStep);
      
      // Convert notes to include guitar string data
      const notesWithGuitarData = filteredNotes.map(convertNoteToGuitarData);
      
      ws.current.send(
        JSON.stringify({
          action: "play",
          bpm,
          notes: notesWithGuitarData,
          playheadStep: currentStep,
        })
      );
      
      console.log(`Sent ${filteredNotes.length} notes with guitar data (filtered ${notes.length - filteredNotes.length} behind playhead)`);
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