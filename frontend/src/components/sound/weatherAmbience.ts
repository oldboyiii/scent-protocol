"use client";

import { useEffect, useState } from "react";
import { useSyncExternalStore } from "react";
import { getWeatherContext } from "@/utils/weather";
import { NEUTRAL_AMBIENCE, ambienceFromWeather, setGlobalAmbience, subscribeToAmbience, getGlobalAmbience } from "./scentSound";

// Shared on/off switch for the weather layer.
const WEATHER_ENABLED_KEY = "scent_weather_enabled";

export function useWeatherEnabled() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(WEATHER_ENABLED_KEY) === "true";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(WEATHER_ENABLED_KEY, String(enabled));
    }
  }, [enabled]);

  return [enabled, setEnabled] as const;
}

export function useAmbience() {
  return useSyncExternalStore(subscribeToAmbience, getGlobalAmbience, () => NEUTRAL_AMBIENCE);
}

export function WeatherSync() {
  const [enabled] = useWeatherEnabled();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setGlobalAmbience(NEUTRAL_AMBIENCE);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchWeather = async () => {
      try {
        const data = await getWeatherContext();
        if (isMounted) {
          const ambience = ambienceFromWeather(data);
          setGlobalAmbience(ambience);
        }
      } catch (err) {
        console.warn("Weather sync failed, falling back to neutral:", err);
        if (isMounted) setGlobalAmbience(NEUTRAL_AMBIENCE);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [enabled]);

  return null; // This is a logic-only component
}
