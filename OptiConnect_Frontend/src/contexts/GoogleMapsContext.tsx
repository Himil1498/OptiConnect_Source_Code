import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react";
import { useAppSelector, useAppDispatch } from "../store";
import { setMapInstance, setViewport } from "../store/slices/mapSlice";
import { addNotification } from "../store/slices/uiSlice";
import { loadIndiaBoundary } from "../utils/indiaBoundaryCheck";

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: string | null;
  mapInstance: any | null;
  createMap: (container: HTMLElement) => any;
  geocoder: any | null;
  directionsService: any | null;
  placesService: any | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(
  undefined
);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

// Configuration for Google Maps
const MAPS_CONFIG = {
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
  version: "weekly",
  libraries: ["places", "drawing", "geometry", "visualization"],
  region: "IN", // India region
  language: "en"
};

// Default map options for Indian telecom companies
const getDefaultMapOptions = () => ({
  center: { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom: 5,
  mapTypeId: "roadmap",

  // NO restriction - allow tools to work freely in India
  // Tools need unrestricted map to function properly
  restriction: undefined,

  // UI Controls - Disable all default controls
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  rotateControl: false,
  panControl: false,

  // Styling for better UX
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ],

  // Performance optimizations
  gestureHandling: "greedy",
  keyboardShortcuts: false,
  clickableIcons: false
});

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({
  children
}) => {
  const dispatch = useAppDispatch();
  const { mapInstance } = useAppSelector((state) => state.map);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [placesService, setPlacesService] = useState<any>(null);

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        // Simple script-based loading approach
        if (!window.google) {
          const script = document.createElement("script");
          const apiKey =
            MAPS_CONFIG.apiKey || "AIzaSyAT5j5Zy8q4XSHLi1arcpkce8CNvbljbUQ";
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${MAPS_CONFIG.libraries.join(
            ","
          )}&region=${MAPS_CONFIG.region}&language=${MAPS_CONFIG.language}`;
          script.async = true;
          script.defer = true;

          script.onload = async () => {
            setIsLoaded(true);
            setLoadError(null);

            // Initialize services
            if (window.google) {
              setGeocoder(new window.google.maps.Geocoder());
              setDirectionsService(new window.google.maps.DirectionsService());

              // Load India boundary for GIS tool restrictions
              try {
                await loadIndiaBoundary();
                console.log("India boundary loaded successfully");
              } catch (error) {
                console.error("Failed to load India boundary:", error);
              }
            }

            dispatch(
              addNotification({
                type: "success",
                title: "Maps API Loaded",
                message: "Google Maps API has been successfully loaded",
                autoClose: true,
                duration: 3000
              })
            );
          };

          script.onerror = () => {
            const errorMsg =
              "Failed to load Google Maps API. Please check your API key and internet connection.";
            setLoadError(errorMsg);
            setIsLoaded(false);

            dispatch(
              addNotification({
                type: "error",
                title: "Maps Loading Error",
                message: errorMsg,
                autoClose: false
              })
            );
          };

          document.head.appendChild(script);
        } else {
          // Google Maps is already loaded
          setIsLoaded(true);
          setLoadError(null);

          if (window.google) {
            setGeocoder(new window.google.maps.Geocoder());
            setDirectionsService(new window.google.maps.DirectionsService());

            // Load India boundary for GIS tool restrictions
            try {
              await loadIndiaBoundary();
              console.log("India boundary loaded successfully");
            } catch (error) {
              console.error("Failed to load India boundary:", error);
            }
          }
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Unknown error occurred while loading Google Maps";
        setLoadError(errorMsg);
        setIsLoaded(false);

        dispatch(
          addNotification({
            type: "error",
            title: "Maps Initialization Error",
            message: errorMsg,
            autoClose: false
          })
        );
      }
    };

    initializeGoogleMaps();
  }, [dispatch]);

  const createMap = (container: HTMLElement) => {
    if (!isLoaded || !window.google) {
      console.warn("Google Maps API not loaded yet");
      return null;
    }

    try {
      const mapOptions = getDefaultMapOptions();
      const map = new window.google.maps.Map(container, mapOptions);

      // Set up event listeners for map interactions
      map.addListener("center_changed", () => {
        const center = map.getCenter();
        if (center) {
          dispatch(
            setViewport({
              center: { lat: center.lat(), lng: center.lng() },
              zoom: map.getZoom() || 5
            })
          );
        }
      });

      map.addListener("zoom_changed", () => {
        const center = map.getCenter();
        if (center) {
          dispatch(
            setViewport({
              center: { lat: center.lat(), lng: center.lng() },
              zoom: map.getZoom() || 5
            })
          );
        }
      });

      // Initialize PlacesService for this map
      if (window.google.maps.places) {
        setPlacesService(new window.google.maps.places.PlacesService(map));
      }

      // Store map instance in Redux
      dispatch(setMapInstance(map));

      console.log("Map created successfully:", map);
      return map;
    } catch (error) {
      console.error("Error creating map:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Failed to create map instance";

      dispatch(
        addNotification({
          type: "error",
          title: "Map Creation Error",
          message: errorMsg,
          autoClose: false
        })
      );

      return null;
    }
  };

  const contextValue: GoogleMapsContextType = {
    isLoaded,
    loadError,
    mapInstance,
    createMap,
    geocoder,
    directionsService,
    placesService
  };

  return (
    <GoogleMapsContext.Provider value={contextValue}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};

// Extend window interface for TypeScript
declare global {
  interface Window {
    google: any;
  }
}
