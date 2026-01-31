/**
 * Weather Alerts Hook
 * Manages fetching and caching Environment Canada weather alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchWeatherAlerts, type WeatherAlert } from '../services/alertsApi';

interface UseWeatherAlertsResult {
    alerts: WeatherAlert[];
    activeAlerts: WeatherAlert[];
    upcomingAlerts: WeatherAlert[];
    mostSevereAlert: WeatherAlert | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
    lastUpdated: Date | null;
}

// Cache alerts for 5 minutes (Environment Canada updates roughly every 5-10 mins)
const CACHE_DURATION = 5 * 60 * 1000;
let cachedAlerts: WeatherAlert[] | null = null;
let cacheTimestamp: number | null = null;

export function useWeatherAlerts(): UseWeatherAlertsResult {
    const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchAlerts = useCallback(async (forceRefresh = false) => {
        // Check cache first
        if (!forceRefresh && cachedAlerts && cacheTimestamp) {
            const cacheAge = Date.now() - cacheTimestamp;
            if (cacheAge < CACHE_DURATION) {
                setAlerts(cachedAlerts);
                setLastUpdated(new Date(cacheTimestamp));
                setIsLoading(false);
                return;
            }
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchWeatherAlerts();

            // Update cache
            cachedAlerts = data;
            cacheTimestamp = Date.now();

            setAlerts(data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch weather alerts:', err);
            setError('Failed to fetch weather alerts');

            // Use cached data if available
            if (cachedAlerts) {
                setAlerts(cachedAlerts);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();

        // Refresh every 5 minutes
        const interval = setInterval(() => {
            fetchAlerts(true);
        }, CACHE_DURATION);

        return () => clearInterval(interval);
    }, [fetchAlerts]);

    // Filter active and upcoming alerts
    const activeAlerts = alerts.filter(a => a.isActive);
    const upcomingAlerts = alerts.filter(a => a.isUpcoming);

    // Get most severe active alert
    const mostSevereAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

    return {
        alerts,
        activeAlerts,
        upcomingAlerts,
        mostSevereAlert,
        isLoading,
        error,
        refetch: () => fetchAlerts(true),
        lastUpdated
    };
}
