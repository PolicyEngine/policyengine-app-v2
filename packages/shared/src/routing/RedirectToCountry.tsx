import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Loader } from '@mantine/core';
import { geolocationService } from './geolocation';

/**
 * Component that redirects users to their country-specific route
 * based on IP geolocation
 */
export function RedirectToCountry() {
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  /**
   * Checks if cached country data is still valid (within 4 hours)
   */
  function getCachedCountry(): string | null {
    const cachedData = localStorage.getItem('detectedCountry');
    if (!cachedData) {
      return null;
    }

    try {
      const { country, timestamp } = JSON.parse(cachedData);
      const fourHoursInMs = 4 * 60 * 60 * 1000;

      // Check if cache is still valid
      if (Date.now() - timestamp < fourHoursInMs) {
        return country;
      }

      // Cache expired, clean it up
      localStorage.removeItem('detectedCountry');
    } catch {
      // Invalid cached data format
      localStorage.removeItem('detectedCountry');
    }

    return null;
  }

  /**
   * Saves detected country to cache with timestamp
   */
  function cacheCountry(country: string): void {
    localStorage.setItem(
      'detectedCountry',
      JSON.stringify({
        country,
        timestamp: Date.now(),
      })
    );
  }

  useEffect(() => {
    async function initializeCountryDetection() {
      // Check for cached country first
      const cached = getCachedCountry();
      if (cached) {
        setDetectedCountry(cached);
        setIsDetecting(false);
        return;
      }

      // Detect country using geolocation service (tries providers in order)
      try {
        const country = await geolocationService.detectCountry();
        setDetectedCountry(country);
        cacheCountry(country);
      } catch (error) {
        // Fall back to default country on error
        setDetectedCountry('us');
      } finally {
        setIsDetecting(false);
      }
    }

    initializeCountryDetection();
  }, []);

  if (isDetecting) {
    return (
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '16px',
        }}
      >
        <Loader size="lg" />
        <div>Loading PolicyEngine...</div>
      </Box>
    );
  }

  return <Navigate to={`/${detectedCountry || 'us'}`} replace />;
}
