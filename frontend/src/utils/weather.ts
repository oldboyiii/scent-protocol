// frontend/src/utils/weather.ts
//
// Current weather and time of day, used for the AI Advisor "vibe" and for the weather layer
// of the scent sound. Weather comes from Open-Meteo, which needs no API key.
//
// Privacy: location is requested only when a person asks for it. Coordinates are rounded to
// about 11 km before they leave the browser, and nothing is stored except the weather result,
// kept in sessionStorage for 10 minutes. If location is unavailable, the result falls back
// to time of day only and no network request is made.

export type WeatherCondition = "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "thunder";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface WeatherContext {
  source: "location" | "time";
  condition: WeatherCondition;
  tempC: number | null;
  windKph: number;
  isNight: boolean;
  timeOfDay: TimeOfDay;
}

const CACHE_KEY = "scent-weather-v1";
const CACHE_MS = 10 * 60 * 1000;

function timeOfDayFor(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function timeOnly(): WeatherContext {
  const hour = new Date().getHours();
  return {
    source: "time",
    condition: "clear",
    tempC: null,
    windKph: 0,
    isNight: hour >= 20 || hour < 6,
    timeOfDay: timeOfDayFor(hour),
  };
}

function conditionFromCode(code: number): WeatherCondition {
  if (code === 45 || code === 48) return "fog";
  if (code >= 95) return "thunder";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if (code === 3) return "cloudy";
  return "clear";
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 6000,
      maximumAge: CACHE_MS,
    });
  });
}

async function locationAlreadyGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    return status?.state === "granted";
  } catch {
    return false;
  }
}

function readCache(): WeatherContext | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, ctx } = JSON.parse(raw) as { at: number; ctx: WeatherContext };
    return Date.now() - at < CACHE_MS ? ctx : null;
  } catch {
    return null;
  }
}

let last: WeatherContext | null = null;
const listeners = new Set<(w: WeatherContext) => void>();

function publish(w: WeatherContext): WeatherContext {
  last = w;
  listeners.forEach((cb) => cb(w));
  return w;
}

export function getLastWeather(): WeatherContext | null {
  return last;
}

export function subscribeWeather(cb: (w: WeatherContext) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function getWeatherContext(options: { prompt?: boolean } = {}): Promise<WeatherContext> {
  const cached = readCache();
  if (cached) return publish(cached);

  try {
    if (options.prompt === false && !(await locationAlreadyGranted())) return publish(timeOnly());

    const { latitude, longitude } = (await getPosition()).coords;
    const lat = latitude.toFixed(1);
    const lon = longitude.toFixed(1);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weather_code,wind_speed_10m,is_day&wind_speed_unit=kmh&timezone=auto`,
      { signal: controller.signal },
    ).finally(() => clearTimeout(timer));
    
    if (!res.ok) throw new Error("Weather request failed");

    const data = (await res.json()) as {
      current: { temperature_2m: number; weather_code: number; wind_speed_10m: number; is_day: number };
    };
    const c = data.current;
    const ctx: WeatherContext = {
      source: "location",
      condition: conditionFromCode(c.weather_code),
      tempC: Math.round(c.temperature_2m),
      windKph: Math.round(c.wind_speed_10m),
      isNight: c.is_day === 0,
      timeOfDay: timeOfDayFor(new Date().getHours()),
    };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), ctx }));
    } catch {
      // Private mode or full storage: skip the cache.
    }
    return publish(ctx);
  } catch {
    return publish(timeOnly());
  }
}

const PHRASES: Record<WeatherCondition, string> = {
  clear: "clear",
  cloudy: "cloudy",
  fog: "foggy",
  drizzle: "drizzling",
  rain: "rainy",
  snow: "snowy",
  thunder: "stormy",
};

export function describeWeather(w: WeatherContext): string {
  if (w.source === "time" || w.tempC === null) return `It's ${w.timeOfDay} time`;
  const wind = w.windKph >= 30 ? " with strong wind" : "";
  return `It's ${w.tempC}°C and ${PHRASES[w.condition]}${wind}, ${w.timeOfDay} time`;
}

export async function getCurrentVibe(): Promise<string> {
  return describeWeather(await getWeatherContext());
}
