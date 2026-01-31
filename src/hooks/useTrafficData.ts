/**
 * React hook for fetching and managing traffic data
 */

import { useState, useEffect, useCallback } from 'react';
import type { TrafficData } from '../types/traffic';
import { fetchTrafficData } from '../services/trafficApi';

interface UseTrafficDataResult {
    trafficData: TrafficData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    lastUpdated: Date | null;
}

const REFRESH_INTERVAL = 60000; // Refresh every 60 seconds

export function useTrafficData(): UseTrafficDataResult {
    const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await fetchTrafficData();

            if (data) {
                setTrafficData(data);
                setLastUpdated(new Date());
            } else {
                setError('Failed to fetch traffic data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh
    useEffect(() => {
        const interval = setInterval(fetchData, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchData]);

    return {
        trafficData,
        isLoading,
        error,
        refetch: fetchData,
        lastUpdated,
    };
}

export default useTrafficData;
