import React, { useState, useEffect } from "react";

interface MapControlsPanelProps {
  map: google.maps.Map | null;
  onOpenSettings?: () => void;
}

/**
 * Custom Map Controls Panel
 * Provides zoom, location, India bounds, fullscreen, and map type controls
 */
const MapControlsPanel: React.FC<MapControlsPanelProps> = ({ map, onOpenSettings }) => {
  const [isMapTypeOpen, setIsMapTypeOpen] = useState(false);
  const [currentMapType, setCurrentMapType] = useState<string>("roadmap");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapTypeRef = React.useRef<HTMLDivElement>(null);

  // Close map type dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mapTypeRef.current && !mapTypeRef.current.contains(event.target as Node)) {
        setIsMapTypeOpen(false);
      }
    };

    if (isMapTypeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMapTypeOpen]);

  // Map type options
  const mapTypes = [
    { id: "roadmap", name: "Roadmap", icon: "🗺️" },
    { id: "satellite", name: "Satellite", icon: "🛰️" },
    { id: "hybrid", name: "Hybrid", icon: "🌍" },
    { id: "terrain", name: "Terrain", icon: "⛰️" }
  ];

  /**
   * Zoom In
   */
  const handleZoomIn = () => {
    if (!map) return;
    const currentZoom = map.getZoom() || 5;
    map.setZoom(currentZoom + 1);
  };

  /**
   * Zoom Out
   */
  const handleZoomOut = () => {
    if (!map) return;
    const currentZoom = map.getZoom() || 5;
    map.setZoom(currentZoom - 1);
  };

  /**
   * Get User's Live Location
   * Uses Google Maps Geolocation API as primary method, browser geolocation as fallback
   */
  const handleMyLocation = async () => {
    if (!map) return;

    const apiKey =
      process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
      "AIzaSyAT5j5Zy8q4XSHLi1arcpkce8CNvbljbUQ";

    // Try Google Maps Geolocation API first
    try {
      const response = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        }
      );

      if (response.ok) {
        const data = await response.json();
        const pos = {
          lat: data.location.lat,
          lng: data.location.lng
        };

        map.setCenter(pos);
        map.setZoom(15);

        // Add marker at user's location
        new google.maps.Marker({
          position: pos,
          map: map,
          title: "Your Location (Google Geolocation)",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2
          }
        });

        return; // Success, exit
      }
    } catch (error) {
      console.warn(
        "Google Maps Geolocation API failed, trying browser geolocation:",
        error
      );
    }

    // Fallback to browser geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          map.setCenter(pos);
          map.setZoom(15);

          // Add marker at user's location
          new google.maps.Marker({
            position: pos,
            map: map,
            title: "Your Location (Browser Geolocation)",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2
            }
          });
        },
        () => {
          alert(
            "Error: Both Google Maps and browser geolocation services failed. Please check your location permissions and internet connection."
          );
        }
      );
    } else {
      alert("Error: Your browser doesn't support geolocation.");
    }
  };

  /**
   * Resize map to show entire India
   */
  const handleResizeToIndia = () => {
    if (!map) return;

    // // India bounds
    // const indiaBounds = new google.maps.LatLngBounds(
    //   // new google.maps.LatLng(6.4627, 68.1097), // Southwest
    //   new google.maps.LatLng(5.4627, 50.1097), //Southwest
    //   // new google.maps.LatLng(35.5138, 97.3953) // Northeast
    //   new google.maps.LatLng(30.5138, 90.3953) // Northeast
    // );

    const indiaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(7.0, 68.5),
      new google.maps.LatLng(35.0, 97.0)
    );

    map.fitBounds(indiaBounds);
  };

  /**
   * Toggle Fullscreen
   */
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  /**
   * Change Map Type
   */
  const handleMapTypeChange = (typeId: string) => {
    if (!map) return;
    map.setMapTypeId(typeId as google.maps.MapTypeId);
    setCurrentMapType(typeId);
    setIsMapTypeOpen(false);
  };

  /**
   * Refresh Map - Force re-render and tile reload
   */
  const handleRefreshMap = () => {
    if (!map) return;

    // Store current state
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const currentMapType = map.getMapTypeId();

    if (currentCenter && currentZoom) {
      // Trigger resize event
      google.maps.event.trigger(map, 'resize');

      // Force reload by slightly changing zoom
      const tempZoom = currentZoom + 0.001;
      map.setZoom(tempZoom);

      // Reset to original state after a brief delay
      setTimeout(() => {
        map.setZoom(currentZoom);
        map.setCenter(currentCenter);
        if (currentMapType) {
          map.setMapTypeId(currentMapType);
        }
      }, 50);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div className="flex items-center space-x-2">
      {/* Zoom Controls - Horizontal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-gray-200 dark:border-gray-700"
          title="Zoom In"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Zoom Out"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>
      </div>

      {/* My Location */}
      <button
        onClick={handleMyLocation}
        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="My Location"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Resize to India */}
      <button
        onClick={handleResizeToIndia}
        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Fit to India"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      </button>

      {/* Fullscreen */}
      <button
        onClick={handleFullscreen}
        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        )}
      </button>

      {/* Refresh Map */}
      <button
        onClick={handleRefreshMap}
        className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Refresh Map"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* Boundary Settings */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Boundary Settings"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}

      {/* Map Type Selector (Collapsible) */}
      <div className="relative" ref={mapTypeRef}>
        <button
          onClick={() => setIsMapTypeOpen(!isMapTypeOpen)}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Map Type"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
        </button>

        {/* Map Type Dropdown - Drops Down Instead of Right */}
        {isMapTypeOpen && (
          <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 min-w-[140px]">
            {mapTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleMapTypeChange(type.id)}
                className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 transition-colors ${
                  currentMapType === type.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapControlsPanel;
