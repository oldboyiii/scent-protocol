// frontend/src/utils/weather.ts

// Get current weather and time context for AI fragrance generation
export async function getCurrentVibe(): Promise<string> {
  try {
    // Step 1: Get user location via browser geolocation
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 600000 // 10 minutes cache
      });
    });

    const { latitude, longitude } = position.coords;

    // Step 2: Fetch weather data from OpenWeatherMap
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) throw new Error("Weather API key not configured");

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
    );

    if (!weatherResponse.ok) throw new Error("Weather API request failed");

    const weatherData = await weatherResponse.json();

    // Step 3: Extract relevant info
    const temperature = Math.round(weatherData.main.temp);
    const weatherCondition = weatherData.weather[0].description.toLowerCase();
    const cityName = weatherData.name;

    // Step 4: Determine time of day
    const hour = new Date().getHours();
    let timeOfDay = "";
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 22) timeOfDay = "evening";
    else timeOfDay = "night";

    // Step 5: Build vibe string for AI
    return `It's ${temperature}°C and ${weatherCondition} in ${cityName}, ${timeOfDay} time`;
  } catch (error) {
    console.error("Failed to get current vibe:", error);
    
    // Fallback: IP-based location (works without geolocation permission)
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
      throw new Error("Unable to determine your location. Please enter your vibe manually.");
    }
  }
}
