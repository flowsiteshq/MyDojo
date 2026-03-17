/**
 * weatherService.ts
 *
 * Fetches real-time weather data from Open-Meteo (free, no API key required)
 * for the dojo's location (Tomball, TX) and converts it into a human-readable
 * greeting hook for Kai.
 *
 * Results are cached for 15 minutes to avoid hammering the API on every chat open.
 */

// ─── Dojo Location ────────────────────────────────────────────────────────────
// Tomball HQ, TX — coordinates for Open-Meteo
const DOJO_LATITUDE = 30.0977;
const DOJO_LONGITUDE = -95.6161;
const DOJO_TIMEZONE = "America/Chicago";

// ─── WMO Weather Code Descriptions ───────────────────────────────────────────
// https://open-meteo.com/en/docs#weathervariables
function describeWeatherCode(code: number): { description: string; emoji: string; isGoodForTraining: boolean } {
  if (code === 0) return { description: "clear skies", emoji: "☀️", isGoodForTraining: true };
  if (code === 1) return { description: "mainly clear", emoji: "🌤️", isGoodForTraining: true };
  if (code === 2) return { description: "partly cloudy", emoji: "⛅", isGoodForTraining: true };
  if (code === 3) return { description: "overcast", emoji: "☁️", isGoodForTraining: true };
  if (code >= 45 && code <= 48) return { description: "foggy", emoji: "🌫️", isGoodForTraining: false };
  if (code >= 51 && code <= 55) return { description: "light drizzle", emoji: "🌦️", isGoodForTraining: false };
  if (code >= 56 && code <= 57) return { description: "freezing drizzle", emoji: "🌧️", isGoodForTraining: false };
  if (code >= 61 && code <= 63) return { description: "light rain", emoji: "🌧️", isGoodForTraining: false };
  if (code === 65) return { description: "heavy rain", emoji: "⛈️", isGoodForTraining: false };
  if (code >= 66 && code <= 67) return { description: "freezing rain", emoji: "🌨️", isGoodForTraining: false };
  if (code >= 71 && code <= 77) return { description: "snow", emoji: "❄️", isGoodForTraining: false };
  if (code >= 80 && code <= 82) return { description: "rain showers", emoji: "🌦️", isGoodForTraining: false };
  if (code >= 85 && code <= 86) return { description: "snow showers", emoji: "🌨️", isGoodForTraining: false };
  if (code >= 95 && code <= 99) return { description: "thunderstorms", emoji: "⛈️", isGoodForTraining: false };
  return { description: "mixed conditions", emoji: "🌡️", isGoodForTraining: true };
}

// ─── Cache ────────────────────────────────────────────────────────────────────
interface WeatherData {
  tempF: number;
  feelsLikeF: number;
  weatherCode: number;
  windMph: number;
  precipitation: number;
  cloudCover: number;
  fetchedAt: number; // ms timestamp
}

let weatherCache: WeatherData | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Reset the in-memory cache. Only for use in tests. */
export function resetWeatherCache(): void {
  weatherCache = null;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
export async function fetchCurrentWeather(): Promise<WeatherData | null> {
  // Return cached data if still fresh
  if (weatherCache && Date.now() - weatherCache.fetchedAt < CACHE_TTL_MS) {
    return weatherCache;
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${DOJO_LATITUDE}&longitude=${DOJO_LONGITUDE}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,cloud_cover` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch` +
      `&timezone=${encodeURIComponent(DOJO_TIMEZONE)}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

    const json = await res.json() as {
      current: {
        temperature_2m: number;
        apparent_temperature: number;
        weather_code: number;
        wind_speed_10m: number;
        precipitation: number;
        cloud_cover: number;
      };
    };

    weatherCache = {
      tempF: Math.round(json.current.temperature_2m),
      feelsLikeF: Math.round(json.current.apparent_temperature),
      weatherCode: json.current.weather_code,
      windMph: Math.round(json.current.wind_speed_10m),
      precipitation: json.current.precipitation,
      cloudCover: json.current.cloud_cover,
      fetchedAt: Date.now(),
    };

    return weatherCache;
  } catch (err) {
    console.warn("[WeatherService] Failed to fetch weather:", err);
    return null; // Fall back gracefully to time-based greeting
  }
}

// ─── Greeting Hook Builder ────────────────────────────────────────────────────
/**
 * Returns a natural, human-like weather/time-aware greeting line for Kai.
 * Falls back to a time-based greeting if weather fetch fails.
 */
export async function getWeatherGreetingHook(): Promise<string> {
  const weather = await fetchCurrentWeather();
  const hour = new Date().getHours();

  // Time-of-day salutation
  let salutation: string;
  if (hour >= 5 && hour < 12) salutation = "Good morning";
  else if (hour >= 12 && hour < 17) salutation = "Good afternoon";
  else if (hour >= 17 && hour < 21) salutation = "Good evening";
  else salutation = "Hey there";

  if (!weather) {
    // Fallback: no weather data
    return `${salutation}! Glad you stopped by — let's find the perfect program for you.`;
  }

  const { tempF, feelsLikeF, weatherCode, windMph } = weather;
  const { description, emoji, isGoodForTraining } = describeWeatherCode(weatherCode);

  // Build a specific, natural-sounding hook
  if (isGoodForTraining) {
    if (tempF >= 85) {
      // Hot Texas day
      return `${salutation}! ${emoji} It's ${tempF}°F and ${description} out there — hot Texas day, perfect excuse to train indoors in the AC!`;
    } else if (tempF >= 65 && tempF <= 84) {
      // Nice day
      return `${salutation}! ${emoji} It's a beautiful ${tempF}°F day with ${description} — perfect weather to start something new.`;
    } else if (tempF >= 45 && tempF < 65) {
      // Cool day
      return `${salutation}! ${emoji} It's a crisp ${tempF}°F outside with ${description} — great day to get the body moving and warm up on the mat!`;
    } else {
      // Cold
      return `${salutation}! ${emoji} It's ${tempF}°F out there — nothing warms you up faster than a martial arts class!`;
    }
  } else {
    // Bad weather — indoor training pitch
    if (weatherCode >= 95) {
      return `${salutation}! ⛈️ Looks like there's a storm rolling through Tomball — perfect day to be inside training!`;
    } else if (weatherCode >= 61 && weatherCode <= 67) {
      return `${salutation}! 🌧️ It's ${tempF}°F and rainy out there — perfect reason to come train inside and make the most of the day!`;
    } else {
      return `${salutation}! ${emoji} ${tempF}°F with ${description} outside — great day to train indoors and focus on your goals!`;
    }
  }
}
