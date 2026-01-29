import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Loader2, MapPin, Navigation } from 'lucide-react';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  locationName: string;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // WMO Weather interpretation codes (WW)
  const getWeatherIcon = (code: number, isDay: boolean) => {
    // 0: Clear sky
    if (code === 0) return <Sun className={isDay ? "text-orange-400" : "text-gray-300"} size={20} />;
    // 1, 2, 3: Mainly clear, partly cloudy, and overcast
    if (code <= 3) return <Cloud className="text-gray-400" size={20} />;
    // 45, 48: Fog
    if (code === 45 || code === 48) return <CloudFog className="text-gray-500" size={20} />;
    // 51-67, 80-82: Drizzle, Rain, Showers
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <CloudRain className="text-blue-400" size={20} />;
    // 71-77, 85-86: Snow
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <CloudSnow className="text-white" size={20} />;
    // 95-99: Thunderstorm
    if (code >= 95) return <CloudLightning className="text-yellow-400" size={20} />;
    
    return <Sun className="text-orange-400" size={20} />;
  };

  const getWeatherDescription = (code: number) => {
    if (code === 0) return '맑음';
    if (code <= 3) return '구름 조금';
    if (code === 45 || code === 48) return '안개';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '비';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '눈';
    if (code >= 95) return '뇌우';
    return '맑음';
  };

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, locationName: string = 'Local') => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`
        );
        const data = await response.json();
        
        if (data.current) {
          setWeather({
            temperature: data.current.temperature_2m,
            weatherCode: data.current.weather_code,
            isDay: data.current.is_day === 1,
            locationName
          });
        }
      } catch (err) {
        console.error("Weather fetch failed", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude, '현위치');
          },
          (err) => {
            console.warn("Geolocation denied or failed, using default (Seoul)", err);
            // Default to Seoul
            fetchWeather(37.5665, 126.9780, '서울');
          }
        );
      } else {
        fetchWeather(37.5665, 126.9780, '서울');
      }
    };

    getLocation();
    
    // Refresh weather every 10 minutes
    const interval = setInterval(getLocation, 600000);
    return () => clearInterval(interval);
  }, []);

  if (error) return null;

  return (
    <div className="flex items-center gap-3 bg-[#262730] border border-[#464B5C] px-3 py-1.5 rounded-lg shadow-sm">
      {loading ? (
        <Loader2 className="animate-spin text-gray-500" size={16} />
      ) : weather ? (
        <>
            <div className="flex items-center gap-1.5 border-r border-[#464B5C] pr-3 mr-1">
                <div className="bg-blue-500/10 p-1 rounded-full">
                    {getWeatherIcon(weather.weatherCode, weather.isDay)}
                </div>
                <div className="flex flex-col leading-none">
                    <span className="text-sm font-bold text-[#FAFAFA]">{weather.temperature.toFixed(1)}°C</span>
                    <span className="text-[10px] text-gray-400">{getWeatherDescription(weather.weatherCode)}</span>
                </div>
            </div>
            <div className="flex items-center text-xs text-gray-400 gap-1">
                 <Navigation size={10} className="text-blue-400" />
                 {weather.locationName}
            </div>
        </>
      ) : null}
    </div>
  );
};

export default WeatherWidget;
