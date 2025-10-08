import React, { useState, useRef, useEffect } from "react";

interface MapSearchButtonProps {
  map: google.maps.Map | null;
}

/**
 * Collapsible Search Button for Place Search
 * Allows users to search for places and navigate to them
 */
const MapSearchButton: React.FC<MapSearchButtonProps> = ({ map }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteService =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const searchMarker = useRef<google.maps.Marker | null>(null);

  // Initialize services
  useEffect(() => {
    if (
      map &&
      window.google &&
      window.google.maps &&
      window.google.maps.places
    ) {
      if (!autocompleteService.current) {
        autocompleteService.current =
          new google.maps.places.AutocompleteService();
      }
      if (!placesService.current) {
        placesService.current = new google.maps.places.PlacesService(map);
      }
    }
  }, [map]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isExpanded]);

  /**
   * Handle search input change with autocomplete
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (value.length < 2) {
      setPredictions([]);
      return;
    }

    if (!autocompleteService.current) {
      console.error("Autocomplete service not initialized");
      return;
    }

    setIsSearching(true);

    // Get autocomplete predictions restricted to India
    autocompleteService.current.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: "in" } // Restrict to India
      },
      (results, status) => {
        setIsSearching(false);
        console.log("Autocomplete status:", status, "Results:", results);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  /**
   * Handle place selection
   */
  const handlePlaceSelect = (placeId: string) => {
    if (!placesService.current || !map) return;

    placesService.current.getDetails(
      {
        placeId: placeId,
        fields: ["name", "geometry", "formatted_address"]
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry &&
          place.geometry.location
        ) {
          // Center map on the selected place
          map.setCenter(place.geometry.location);
          map.setZoom(15);

          // Remove previous marker
          if (searchMarker.current) {
            searchMarker.current.setMap(null);
          }

          // Add marker at the location
          searchMarker.current = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            title: place.name,
            animation: google.maps.Animation.DROP
          });

          // Show info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 4px 0; font-weight: 600;">${place.name}</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">${place.formatted_address}</p>
              </div>
            `
          });
          infoWindow.open(map, searchMarker.current);

          // Clear search
          setSearchQuery("");
          setPredictions([]);
          setIsExpanded(false);
        }
      }
    );
  };

  /**
   * Clear search
   */
  const handleClear = () => {
    setSearchQuery("");
    setPredictions([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      {/* Search Button (Collapsed State) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Search Places"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      )}

      {/* Search Panel (Expanded State) */}
      {isExpanded && (
        <div className="absolute left-12 top-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20 w-80">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search places in India..."
                  className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={handleClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setSearchQuery("");
                  setPredictions([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Close"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Predictions List */}
          {predictions.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {predictions.map((prediction, index) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handlePlaceSelect(prediction.place_id)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start space-x-2">
                    <svg
                      className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0"
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {prediction.structured_formatting.main_text}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {prediction.structured_formatting.secondary_text}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {/* No Results */}
          {searchQuery.length >= 2 &&
            !isSearching &&
            predictions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No places found
              </div>
            )}

          {/* Empty State */}
          {searchQuery.length < 2 && predictions.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Type to search for places in India
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapSearchButton;
