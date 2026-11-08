"use client";

import { useSyncExternalStore } from "react";
import { describeWeather, getWeatherContext } from "@/utils/weather";
import { NEUTRAL_AMBIENCE, ambienceFromWeather, setGlobalAmbience } from "./scentSound";

// Shared on/off switch for the weather layer. Every ScentPlayer reads the same state,
// so turning it on once affects every scent, including the one playing right now.

type Status = "off" | "loading" | "on";

interface WeatherSoundState {
  status: Status;
  /** "location" is real weather. "time" means only the time of day is used. */
  source: "location" | "time" | null;
  label: string | null;
}

const FLAG = "scent-weather-sound";
const REFRESH_MS = 15 * 60 * 1000;
const INITIAL: WeatherSoundState = { status: "off", source: null, label: null };

let state: WeatherSoundState = INITIAL;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let restored = false;
const listeners = new Set<() => void>();

function set(next: WeatherSoundState): void {
  state = next;
  listeners.forEach((l) => l());
}

async function apply(prompt: boolean): Promise<void> {
  const w = await getWeatherContext({ prompt });
  setGlobalAmbience(ambienceFromWeather(w));
  set({ status: "on", source: w.source, label: describeWeather(w) });
}

export async function enableWeatherSound(): Promise<void> {
  if (state.status === "loading") return;
  set({ ...state, status: "loading" });
  await apply(true);
  try {
    localStorage.setItem(FLAG, "1");
  } catch {
    // Storage may be blocked; the switch still works for this visit.
  }
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => void apply(false), REFRESH_MS);
}

export function disableWeatherSound(): void {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = null;
  setGlobalAmbience(NEUTRAL_AMBIENCE);
  set(INITIAL);
  try {
    localStorage.removeItem(FLAG);
  } catch {
    // Ignore.
  }
}

/** Re-enable after a reload without showing the location prompt again. */
function restoreOnce(): void {
  if (restored || typeof window === "undefined") return;
  restored = true;
  let wasOn = false;
  try {
    wasOn = localStorage.getItem(FLAG) === "1";
  } catch {
    // Ignore.
  }
  if (!wasOn) return;
  set({ ...state, status: "loading" });
  void apply(false).then(() => {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => void apply(false), REFRESH_MS);
  });
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  restoreOnce();
  return () => listeners.delete(cb);
}

export function useWeatherSound(): WeatherSoundState & {
  enable: () => Promise<void>;
  disable: () => void;
  toggle: () => Promise<void>;
} {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => INITIAL);
  return {
    ...snapshot,
    enable: enableWeatherSound,
    disable: disableWeatherSound,
    toggle: async () => (state.status === "on" ? disableWeatherSound() : enableWeatherSound()),
  };
}

