// frontend/src/utils/weather.ts

// 1. Function for AI Advisor (returns a text description for the prompt)
export async function getCurrentVibe(): Promise<string> {
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000 // 10 minutes cache
      });
    });

    const { latitude, longitude } = position.coords;
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error("Weather API key not configured");

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
    );

    if (!weatherResponse.ok) throw new Error("Weather API request failed");
    const weatherData = await weatherResponse.json();

    const temperature = Math.round(weatherData.main.temp);
    const weatherCondition = weatherData.weather[0].description.toLowerCase();
    const cityName = weatherData.name;

    const hour = new Date().getHours();
    let timeOfDay = "";
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 22) timeOfDay = "evening";
    else timeOfDay = "night";

    return `It's ${temperature}°C and ${weatherCondition} in ${cityName}, ${timeOfDay} time`;
  } catch (error) {
    console.error("Failed to get current vibe:", error);
    
    try {
      const ipResponse = await fetch("https://ipapi.co/json/");
      if (!ipResponse.ok) throw new Error("IP location failed");
      
      const ipData = await ipResponse.json();
      const hour = new Date().getHours();
      let timeOfDay = "";
      if (hour >= 5 && hour < 12) timeOfDay = "morning";
      else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 22) timeOfDay = "evening";
      else timeOfDay = "night";

      return `Currently ${timeOfDay} time in ${ipData.city || "your location"}`;
    } catch (fallbackError) {
      console.error("Fallback location failed:", fallbackError);
      const hour = new Date().getHours();
      let timeOfDay = "";
      if (hour >= 5 && hour < 12) timeOfDay = "morning";
      else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 22) timeOfDay = "evening";
      else timeOfDay = "night";
      return `${timeOfDay} time`;
    }
  }
}

// 2. Function for the sound engine (returns structured data for weatherAmbience.ts)
export async function getWeatherContext(): Promise<any> {
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000
      });
    });

    const { latitude, longitude } = position.coords;
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    if (!apiKey) return null;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    const hour = new Date().getHours();
    
    // Map OpenWeatherMap conditions to codes understood by the sound engine (WMO-like)
    let weathercode = 0;
    const main = data.weather[0].main.toLowerCase();
    if (main.includes("rain") || main.includes("drizzle")) weathercode = 61;
    else if (main.includes("snow")) weathercode = 71;
    else if (main.includes("mist") || main.includes("fog")) weathercode = 45;
    else if (main.includes("cloud")) weathercode = 3;
    
    return {
      temperature: Math.round(data.main.temp),
      weather: main,
      description: data.weather[0].description.toLowerCase(),
      is_day: hour >= 6 && hour < 20 ? 1 : 0,
      windspeed: data.wind?.speed || 0,
      weathercode: weathercode,
    };
  } catch {
    return null;
  }
}
