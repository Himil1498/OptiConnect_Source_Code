/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  HomeIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

interface SearchSuggestion {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  isGeocoded?: boolean;
  geocodeResult?: google.maps.GeocoderResult;
}

interface MapSearchBoxProps {
  map: google.maps.Map | null;
  onPlaceSelect?: (place: any) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
}

const MapSearchBox: React.FC<MapSearchBoxProps> = ({
  map,
  onPlaceSelect,
  searchValue,
  onSearchChange,
  className = "",
  onFocusChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState(searchValue || "");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setIsFocused(false);
        onFocusChange?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onFocusChange]);

  // Use Text Search API instead of deprecated AutocompleteService
  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      // Using Text Search (New) API
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Google Maps API key not found");
        fallbackToGeocoding(searchQuery);
        return;
      }

      const response = await fetch(
        `https://places.googleapis.com/v1/places:searchText`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "places.displayName,places.formattedAddress,places.location,places.id,places.types"
          },
          body: JSON.stringify({
            textQuery: `${searchQuery} India`,
            regionCode: "IN",
            maxResultCount: 10
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.places && data.places.length > 0) {
        const formattedSuggestions: SearchSuggestion[] = data.places.map(
          (place: any) => ({
            id: place.id,
            displayName: place.displayName?.text || "Unknown Place",
            formattedAddress: place.formattedAddress || "",
            location: place.location,
            types: place.types || []
          })
        );

        setSuggestions(formattedSuggestions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Places API Error:", error);
      // Fallback to Geocoding API for basic search
      fallbackToGeocoding(searchQuery);
    }

    setIsLoading(false);
  };

  // Fallback method using Geocoding API
  const fallbackToGeocoding = (searchQuery: string) => {
    if (!window.google?.maps?.Geocoder) return;

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      {
        address: `${searchQuery}, India`,
        componentRestrictions: { country: "IN" }
      },
      (
        results: google.maps.GeocoderResult[] | null,
        status: google.maps.GeocoderStatus
      ) => {
        if (status === "OK" && results && results.length > 0) {
          const formattedSuggestions: SearchSuggestion[] = results
            .slice(0, 10)
            .map((result: google.maps.GeocoderResult, index: number) => ({
              id: result.place_id || `geocode_${index}`,
              displayName:
                result.address_components[0]?.long_name ||
                result.formatted_address.split(",")[0],
              formattedAddress: result.formatted_address,
              location: {
                latitude: result.geometry.location.lat(),
                longitude: result.geometry.location.lng()
              },
              types: result.types || [],
              isGeocoded: true,
              geocodeResult: result
            }));

          setSuggestions(formattedSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
        setIsLoading(false);
      }
    );
  };

  // Sync with external search value
  useEffect(() => {
    if (searchValue !== undefined) {
      setQuery(searchValue);
    }
  }, [searchValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Call external onChange if provided
    if (onSearchChange) {
      onSearchChange(value);
    }

    // Debounce search requests
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Reduced debounce time for better responsiveness
    searchTimeout.current = setTimeout(() => {
      if (value.trim().length > 2) {
        searchPlaces(value);
      } else if (value.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 150);
  };

  const clearMarkers = () => {
    markers.forEach((marker) => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    setMarkers([]);
  };

  const handleSelectPlace = (suggestion: SearchSuggestion) => {
    if (!suggestion.location || !map) return;

    clearMarkers();

    const lat = suggestion.location.latitude;
    const lng = suggestion.location.longitude;
    const position = { lat, lng };

    // Center map on selected location
    map.panTo(position);
    map.setZoom(15);

    // Create marker
    const marker = new window.google.maps.Marker({
      position,
      map,
      title: suggestion.displayName,
      animation: window.google.maps.Animation.DROP,
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new window.google.maps.Size(40, 40)
      }
    });

    // Detailed InfoWindow
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
      <div style="padding:8px; max-width:280px; font-family:Arial,sans-serif;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <h4 style="margin:0; font-size:14px; color:#1976d2;">${
            suggestion.displayName
          }</h4>
          <button id="close-info" style="background:#f44336; color:white; border:none; border-radius:4px; cursor:pointer; padding:2px 6px; font-size:12px;">✖</button>
        </div>
        <p style="margin:2px 0; color:#555; font-size:12px;"><strong>Address:</strong> ${
          suggestion.formattedAddress
        }</p>
        <p style="margin:2px 0; color:#555; font-size:12px;"><strong>Coordinates:</strong> ${lat.toFixed(
          6
        )}, ${lng.toFixed(6)}</p>
        ${
          suggestion.types && suggestion.types.length > 0
            ? `<p style="margin:2px 0; color:#555; font-size:12px;"><strong>Types:</strong> ${suggestion.types
                .join(", ")
                .replace(/_/g, " ")}</p>`
            : ""
        }
        <p style="margin:2px 0; color:#555; font-size:12px;"><strong>Place ID:</strong> ${
          suggestion.id
        }</p>
        <p style="margin:2px 0; color:#555; font-size:12px;"><strong>Source:</strong> ${
          suggestion.isGeocoded ? "Geocoding API" : "Places API"
        }</p>
      </div>
    `,
      disableAutoPan: false,
      maxWidth: 280
    });

    // Hide default close button and attach custom red close button
    window.google.maps.event.addListener(infoWindow, "domready", () => {
      const iwClose = document.querySelector(".gm-ui-hover-effect");
      if (iwClose) (iwClose as HTMLElement).style.display = "none";

      const closeBtn = document.getElementById("close-info");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => infoWindow.close());
      }
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    // Auto-open the InfoWindow when marker is first created
    setTimeout(() => {
      infoWindow.open(map, marker);
    }, 500);

    setMarkers([marker]);

    if (onPlaceSelect) {
      onPlaceSelect({
        name: suggestion.displayName,
        address: suggestion.formattedAddress,
        location: { lat, lng },
        id: suggestion.id,
        types: suggestion.types
      });
    }

    setQuery(suggestion.displayName);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsExpanded(false);
  };

  const handleClearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    clearMarkers();
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  const getTypeIcon = (types: string[]) => {
    if (
      types.includes("administrative_area_level_1") ||
      types.includes("administrative_area_level_2")
    ) {
      return <GlobeAltIcon className="h-4 w-4 text-blue-500" />;
    }
    if (
      types.includes("establishment") ||
      types.includes("point_of_interest")
    ) {
      return <BuildingOfficeIcon className="h-4 w-4 text-green-500" />;
    }
    if (types.includes("locality") || types.includes("sublocality")) {
      return <HomeIcon className="h-4 w-4 text-orange-500" />;
    }
    return <MapPinIcon className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div ref={searchBoxRef} className="relative">
      {/* Search Button (Collapsed State) */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Search Places"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </button>
      )}

      {/* Search Panel (Expanded State) */}
      {isExpanded && (
        <div
          className={`absolute left-0 top-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 ${
            className || "w-80"
          }`}
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search places in India..."
                  value={query}
                  onChange={handleInputChange}
                  onFocus={() => {
                    setIsFocused(true);
                    onFocusChange?.(true);
                  }}
                  onBlur={(e) => {
                    // Keep focus state if clicking on suggestions
                    if (
                      !searchBoxRef.current?.contains(e.relatedTarget as Node)
                    ) {
                      setTimeout(() => {
                        setIsFocused(false);
                        onFocusChange?.(false);
                      }, 100);
                    }
                  }}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setQuery("");
                  setSuggestions([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {/* Predictions List */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectPlace(suggestion);
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0">
                      {getTypeIcon(suggestion.types)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {suggestion.displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {suggestion.formattedAddress}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {showSuggestions &&
            suggestions.length === 0 &&
            !isLoading &&
            query.length > 2 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No places found
              </div>
            )}

          {/* Empty State */}
          {query.length < 2 && suggestions.length === 0 && (
            <div className="px-1 py-3 text-center text-sm text-gray-500 dark:text-gray-400 font-bold">
              Type to search for places in India
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapSearchBox;
