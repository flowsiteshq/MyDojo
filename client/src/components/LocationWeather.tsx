import { useState, useEffect } from "react";
import { Cloud, CloudRain, CloudSnow, CloudLightning, Sun, CloudDrizzle, Wind, Thermometer } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationWeatherProps {
  lat: number;
  lng: number;
  className?: string;
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
}

export function LocationWeather({ lat, lng, className }: LocationWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&temperature_unit=fahrenheit`
        );
        const data = await response.json();
        
        if (data.current_weather) {
          setWeather({
            temperature: Math.round(data.current_weather.temperature),
            weatherCode: data.current_weather.weathercode
          });
        }
      } catch (error) {
        console.error("Failed to fetch weather data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  const getWeatherIcon = (code: number) => {
    // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
    if (code === 0 || code === 1) return <Sun className="w-5 h-5 text-yellow-400" />;
    if (code === 2 || code === 3) return <Cloud className="w-5 h-5 text-gray-400" />;
    if (code >= 45 && code <= 48) return <Wind className="w-5 h-5 text-gray-400" />;
    if (code >= 51 && code <= 57) return <CloudDrizzle className="w-5 h-5 text-blue-300" />;
    if (code >= 61 && code <= 67) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (code >= 71 && code <= 77) return <CloudSnow className="w-5 h-5 text-white" />;
    if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-500" />;
    if (code >= 85 && code <= 86) return <CloudSnow className="w-5 h-5 text-white" />;
    if (code >= 95 && code <= 99) return <CloudLightning className="w-5 h-5 text-yellow-500" />;
    return <Sun className="w-5 h-5 text-yellow-400" />;
  };

  if (loading) return null;
  if (!weather) return null;

  return (
    <div className={cn("flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10", className)}>
      {getWeatherIcon(weather.weatherCode)}
      <span className="text-white font-medium text-sm flex items-center">
        {weather.temperature}°F
      </span>
    </div>
  );
}
