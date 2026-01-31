/**
 * Weather Data Hook
 * Fetches and manages weather data for Halifax
 */

import { useState, useEffect, useCallback } from 'react';
import type { WeatherData } from '../types/weather';
import { fetchWeatherData } from '../services/weatherApi';

interface UseWeatherDataReturn {
    weatherData: WeatherData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

// Cache weather data for 5 minutes (weather doesn't change that fast)
const CACHE_DURATION = 5 * 60 * 1000;
let cachedData: WeatherData | null = null;
let cacheTimestamp = 0;

export function useWeatherData(): UseWeatherDataReturn {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(cachedData);
    const [isLoading, setIsLoading] = useState(!cachedData);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (force = false) => {
        // Check cache first (unless forcing refresh)
        const now = Date.now();
        if (!force && cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
            setWeatherData(cachedData);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchWeatherData();

            if (data) {
                cachedData = data;
                cacheTimestamp = now;
                setWeatherData(data);
            } else {
                setError('Unable to fetch weather data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // Refresh weather every 10 minutes
        const interval = setInterval(() => fetchData(), 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const refetch = useCallback(() => {
        fetchData(true);
    }, [fetchData]);

    return { weatherData, isLoading, error, refetch };
}
