/**
 * Weather helper for Tomball, TX using the free Open-Meteo API (no key required).
 * Returns a weather assessment for a given date/time slot.
 */

// Tomball, TX coordinates
const TOMBALL_LAT = 30.097;
const TOMBALL_LON = -95.616;

export type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "snow" | "unknown";

export interface WeatherInfo {
  condition: WeatherCondition;
  tempF: number;
  description: string;
  /** Kai's message to include in the slot confirmation */
  kaiComment: string;
  /** Whether weather is severe enough to suggest rescheduling */
  isSevere: boolean;
}

/**
 * WMO Weather Interpretation Codes → condition mapping
 * https://open-meteo.com/en/docs#weathervariables
 */
function wmoToCondition(code: number): WeatherCondition {
  if (code === 0 || code === 1) return "clear";
  if (code === 2 || code === 3) return "cloudy";
  if ([45, 48].includes(code)) return "cloudy"; // fog
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "unknown";
}

function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

/**
 * Get weather info for a specific date and hour in Tomball, TX.
 * @param date - JavaScript Date object for the appointment
 */
export async function getWeatherForSlot(date: Date): Promise<WeatherInfo> {
  try {
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split("T")[0];
    const hour = date.getHours();

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(TOMBALL_LAT));
    url.searchParams.set("longitude", String(TOMBALL_LON));
    url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability,wind_speed_10m");
    url.searchParams.set("temperature_unit", "celsius");
    url.searchParams.set("wind_speed_unit", "mph");
    url.searchParams.set("timezone", "America/Chicago");
    url.searchParams.set("start_date", dateStr);
    url.searchParams.set("end_date", dateStr);
    url.searchParams.set("forecast_days", "1");

    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);

    const data = await response.json() as {
      hourly: {
        time: string[];
        temperature_2m: number[];
        weather_code: number[];
        precipitation_probability: number[];
        wind_speed_10m: number[];
      };
    };

    const idx = Math.min(Math.max(hour, 0), 23);
    const tempC = data.hourly.temperature_2m[idx];
    const wmoCode = data.hourly.weather_code[idx];
    const precipProb = data.hourly.precipitation_probability[idx];
    const windMph = data.hourly.wind_speed_10m[idx];

    const tempF = celsiusToFahrenheit(tempC);
    const condition = wmoToCondition(wmoCode);
    const isSevere = condition === "storm" || (condition === "rain" && precipProb > 70) || windMph > 40;

    let description = "";
    let kaiComment = "";

    switch (condition) {
      case "clear":
        description = `Clear skies, ${tempF}°F`;
        kaiComment = `☀️ Great news — it looks like **beautiful weather** in Tomball on your appointment day (${tempF}°F, clear skies). It'll be a perfect day to train!`;
        break;
      case "cloudy":
        description = `Cloudy, ${tempF}°F`;
        kaiComment = `🌤️ The weather looks **mild and overcast** on your appointment day (${tempF}°F). Should be comfortable for getting to the dojo!`;
        break;
      case "rain":
        if (isSevere) {
          description = `Heavy rain likely (${precipProb}% chance), ${tempF}°F`;
          kaiComment = `🌧️ Heads up — there's a **${precipProb}% chance of heavy rain** on your appointment day (${tempF}°F). Please **drive safely** and allow extra travel time. We'll be ready for you when you arrive!`;
        } else {
          description = `Light rain possible (${precipProb}% chance), ${tempF}°F`;
          kaiComment = `🌦️ There may be some **light rain** on your appointment day (${precipProb}% chance, ${tempF}°F). Just bring an umbrella and you'll be all set!`;
        }
        break;
      case "storm":
        description = `Thunderstorms expected, ${tempF}°F`;
        kaiComment = `⛈️ **Severe weather alert** — thunderstorms are forecast for your appointment day in Tomball (${tempF}°F). Your safety comes first! If conditions are dangerous, please call us at **(877) 4-MYDOJO** and we'll happily reschedule you for a better day. 🙏`;
        break;
      case "snow":
        description = `Snow possible, ${tempF}°F`;
        kaiComment = `❄️ Unusual for Tomball, but **wintry weather** is possible on your appointment day (${tempF}°F). Please drive carefully and feel free to call us at **(877) 4-MYDOJO** if you need to reschedule!`;
        break;
      default:
        description = `${tempF}°F`;
        kaiComment = `🌡️ The forecast for your appointment day shows ${tempF}°F. We look forward to seeing you at the dojo!`;
    }

    return { condition, tempF, description, kaiComment, isSevere };
  } catch (err) {
    console.warn("[Weather] Failed to fetch weather:", err);
    // Graceful fallback — don't break the chatbot if weather API is down
    return {
      condition: "unknown",
      tempF: 0,
      description: "Weather unavailable",
      kaiComment: "",
      isSevere: false,
    };
  }
}
