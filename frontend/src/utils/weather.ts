// frontend/src/utils/weather.ts
//
// Current weather and time of day, used for the AI Advisor "vibe" and for the weather layer
// of the scent sound. Weather comes from Open-Meteo, which needs no API key, so nothing secret
// ships in the browser bundle (the old NEXT_PUBLIC_OPENWEATHER_API_KEY is no longer used and can be removed).
//
// Privacy: location is requested only when a person asks for it. Coordinates are rounded to
// about 11 km before they leave the browser, and nothing is stored except the weather result,
// kept in sessionStorage for 10 minutes. If location is unavailable, the result falls back
// to time of day only and no network request is made.

export type WeatherCondition = "clear" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "thunder";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface WeatherContext {
  /** "location" means real weather. "time" means only the clock was used. */
  source: "location" | "time";
  condition: WeatherCondition;
  tempC: number | null;
  windKph: number;
  isNight: boolean;
  timeOfDay: TimeOfDay;
  /** Place name when known, for example "Karlsruhe". */
  city: string | null;
  country: string | null;
  /** "gps" = the browser's location, "ip" = approximate location from the IP address, "none" = no location. */
  locationSource: "gps" | "ip" | "none";
  /** Local time at that place, "19:42". */
  localTime: string;
  /** Why the precise location was not used, when that matters. */
  note: string | null;
}

const CACHE_KEY = "scent-weather-v2";
const CACHE_MS = 10 * 60 * 1000;

function timeOfDayFor(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

function clock(date: Date = new Date()): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function timeOnly(note: string | null = null): WeatherContext {
  const hour = new Date().getHours();
  return {
    source: "time",
    condition: "clear",
    tempC: null,
    windKph: 0,
    isNight: hour >= 20 || hour < 6,
    timeOfDay: timeOfDayFor(hour),
    city: null,
    country: null,
    locationSource: "none",
    localTime: clock(),
    note,
  };
}

// WMO weather interpretation codes used by Open-Meteo.
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

interface Place {
  lat: number;
  lon: number;
  city: string | null;
  country: string | null;
  via: "gps" | "ip";
  note: string | null;
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Turns coordinates (already rounded to about 11 km) into a city name. Failing is fine: the city is optional. */
async function cityFor(lat: string, lon: string): Promise<{ city: string | null; country: string | null }> {
  try {
    const d = await getJson<{ city?: string; locality?: string; countryName?: string }>(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    return { city: d.city || d.locality || null, country: d.countryName || null };
  } catch {
    return { city: null, country: null };
  }
}

/** Approximate location from the IP address. Only used after the person asked for their current vibe. */
async function ipPlace(): Promise<{ lat: number; lon: number; city: string | null; country: string | null }> {
  try {
    const d = await getJson<{ success?: boolean; latitude: number; longitude: number; city?: string; country?: string }>(
      "https://ipwho.is/?fields=success,latitude,longitude,city,country",
    );
    if (d.success === false) throw new Error("ipwho.is refused");
    return { lat: d.latitude, lon: d.longitude, city: d.city || null, country: d.country || null };
  } catch {
    const d = await getJson<{ latitude: number; longitude: number; city?: string; country_name?: string }>("https://ipapi.co/json/");
    return { lat: d.latitude, lon: d.longitude, city: d.city || null, country: d.country_name || null };
  }
}

/** The browser's location first. If that is blocked or times out and the person asked for it, the IP address is the fallback. */
async function resolvePlace(allowIp: boolean): Promise<Place> {
  let note: string;
  try {
    const { latitude, longitude } = (await getPosition()).coords;
    const lat = latitude.toFixed(1);
    const lon = longitude.toFixed(1);
    return { lat: Number(lat), lon: Number(lon), ...(await cityFor(lat, lon)), via: "gps", note: null };
  } catch (e) {
    note = (e as { code?: number }).code === 1 ? "Location access is blocked for this site in your browser." : "Your browser could not work out your location.";
  }
  if (!allowIp) throw new Error(note);
  const ip = await ipPlace();
  return {
    lat: Number(ip.lat.toFixed(1)),
    lon: Number(ip.lon.toFixed(1)),
    city: ip.city,
    country: ip.country,
    via: "ip",
    note: `${note} The approximate location from your IP address was used instead.`,
  };
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

/**
 * Current weather where the person is. Never throws: when location or the weather service
 * is unavailable it returns a time-of-day-only context (source "time").
 * Pass { prompt: false } to avoid showing the browser's location prompt.
 */
export async function getWeatherContext(options: { prompt?: boolean } = {}): Promise<WeatherContext> {
  const cached = readCache();
  if (cached) return publish(cached);

  const asked = options.prompt !== false; // false = restoring a saved choice: no prompt, no IP lookup
  let note: string | null = null;
  try {
    if (!asked && !(await locationAlreadyGranted())) return publish(timeOnly());

    const place = await resolvePlace(asked);
    note = place.note;

    const data = await getJson<{
      current: { time: string; temperature_2m: number; weather_code: number; wind_speed_10m: number; is_day: number };
    }>(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
        `&current=temperature_2m,weather_code,wind_speed_10m,is_day&wind_speed_unit=kmh&timezone=auto`,
    );
    const c = data.current;
    // Open-Meteo returns the local time at that place, for example "2026-11-10T19:42".
    const localTime = c.time?.slice(11, 16) || clock();
    const ctx: WeatherContext = {
      source: "location",
      condition: conditionFromCode(c.weather_code),
      tempC: Math.round(c.temperature_2m),
      windKph: Math.round(c.wind_speed_10m),
      isNight: c.is_day === 0,
      timeOfDay: timeOfDayFor(Number(localTime.slice(0, 2))),
      city: place.city,
      country: place.country,
      locationSource: place.via,
      localTime,
      note: place.note,
    };
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), ctx }));
    } catch {
      // Private mode or full storage: skip the cache.
    }
    return publish(ctx);
  } catch (e) {
    return publish(timeOnly(note ?? (e instanceof Error ? e.message : null)));
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

/** Where the person is, for example "Karlsruhe, Germany". Empty when unknown. */
export function describePlace(w: WeatherContext): string {
  return [w.city, w.country].filter(Boolean).join(", ");
}

/** A short sentence the AI Advisor shows and uses as the "vibe": weather, place and local time together. */
export function describeWeather(w: WeatherContext): string {
  const place = describePlace(w);
  const where = place ? ` in ${place}` : "";
  const when = `${w.localTime}, ${w.timeOfDay} time`;
  if (w.source === "time" || w.tempC === null) return `It's ${when}${where}`;
  const wind = w.windKph >= 30 ? " with strong wind" : "";
  return `It's ${w.tempC}°C and ${PHRASES[w.condition]}${wind}${where}, ${when}`;
}

/** Kept for the AI Advisor. Falls back to time of day when location is unavailable. */
export async function getCurrentVibe(): Promise<string> {
  return describeWeather(await getWeatherContext());
}
