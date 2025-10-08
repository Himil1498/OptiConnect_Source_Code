import React, { useState, useEffect } from "react";

interface CoordinatesDisplayProps {
  map: google.maps.Map | null;
}

/**
 * Coordinates Display - Shows live coordinates on map hover
 * Positioned at bottom-right of map
 */
const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({ map }) => {
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!map) return;

    // Add mousemove listener to map
    const mouseMoveListener = map.addListener(
      "mousemove",
      (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          setCoordinates({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          });
        }
      }
    );

    // Add mouseout listener to clear coordinates when mouse leaves map
    const mouseOutListener = map.addListener("mouseout", () => {
      setCoordinates(null);
    });

    // Cleanup listeners on unmount
    return () => {
      google.maps.event.removeListener(mouseMoveListener);
      google.maps.event.removeListener(mouseOutListener);
    };
  }, [map]);

  // Format coordinates for display
  const formatCoordinate = (value: number, isLat: boolean): string => {
    const direction = isLat ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
    return `${Math.abs(value).toFixed(6)}° ${direction}`;
  };

  if (!coordinates) {
    return null; // Don't show anything when mouse is not on map
  }

  return (
    <div className="fixed bottom-2 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-2 z-10">
      <div className="flex items-center space-x-3 text-sm">
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            Lat:
          </span>
          <span className="text-gray-900 dark:text-white font-mono">
            {formatCoordinate(coordinates.lat, true)}
          </span>
        </div>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
        <div className="flex items-center space-x-1">
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            Lng:
          </span>
          <span className="text-gray-900 dark:text-white font-mono">
            {formatCoordinate(coordinates.lng, false)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoordinatesDisplay;
