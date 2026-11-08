"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playScent, stopScent } from "./scentSound";
import type { ScentSoundEngine, ScentSoundInput } from "./scentSound";

export type ScentSoundState = "idle" | "starting" | "playing";

/**
 * Controls one perfume's soundscape. Call toggle() from a click handler:
 * browsers only start audio after a user gesture.
 */
export function useScentSound(input: ScentSoundInput) {
  const [state, setState] = useState<ScentSoundState>("idle");
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<ScentSoundEngine | null>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setState("idle");
  }, []);

  const toggle = useCallback(async () => {
    if (state === "playing") {
      stop();
      return;
    }
    if (state === "starting") return;
    setError(null);
    setState("starting");
    try {
      const engine = await playScent(inputRef.current);
      if (!engine.isRunning) {
        setState("idle");
        return;
      }
      engine.onStop = () => {
        if (engineRef.current === engine) engineRef.current = null;
        setState("idle");
      };
      engineRef.current = engine;
      setState("playing");
    } catch {
      setState("idle");
      setError("Sound could not start on this device.");
    }
  }, [state, stop]);

  const setVolume = useCallback((v: number) => engineRef.current?.setVolume(v), []);
  const getLevel = useCallback(() => engineRef.current?.getLevel() ?? 0, []);

  // Stop when the card unmounts or the tab goes to the background.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      if (engineRef.current) stopScent();
    };
  }, [stop]);

  return { state, error, toggle, stop, setVolume, getLevel };
}
