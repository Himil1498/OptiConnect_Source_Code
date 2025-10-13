import React, { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";
import { useAppSelector, useAppDispatch } from "../store";
import { addNotification } from "../store/slices/uiSlice";
import { setMapInstance } from "../store/slices/mapSlice";
import {
  getUserAssignedRegions,
  getRegionStyle,
  createRegionInfoContent
} from "../utils/regionMapping";
import MapToolbar from "../components/map/MapToolbar";
import CoordinatesDisplay from "../components/map/CoordinatesDisplay";
import PageContainer from "../components/common/PageContainer";
import MapSettings from "../components/map/MapSettings";
import { fetchAllData } from "../services/dataHubService";
import type { DataHubEntry } from "../types/gisTools.types";
import { createOverlaysFromData, setOverlaysVisibility, type LayerOverlay } from "../utils/layerVisualization";

const MapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const dataLayerRef = useRef<google.maps.Data | null>(null);
  const { isLoaded, loadError, createMap } = useGoogleMaps();
  const { mapInstance, isMapLoaded, activeGISTool } = useAppSelector(
    (state) => state.map
  );
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [assignedRegions, setAssignedRegions] = useState<string[]>([]);
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [entries, setEntries] = useState<DataHubEntry[]>([]);
  const [boundarySettings, setBoundarySettings] = useState({
    enabled: true,
    color: '#3B82F6', // Blue
    opacity: 0.5,
    dimWhenToolActive: true,
    dimmedOpacity: 0.2
  });
  const [layersState, setLayersState] = useState({
    Distance: {
      visible: false,
      count: 0,
      overlays: [] as LayerOverlay[]
    },
    Polygon: {
      visible: false,
      count: 0,
      overlays: [] as LayerOverlay[]
    },
    Circle: {
      visible: false,
      count: 0,
      overlays: [] as LayerOverlay[]
    },
    Elevation: {
      visible: false,
      count: 0,
      overlays: [] as LayerOverlay[]
    },
    Infrastructure: {
      visible: false,
      count: 0,
      overlays: [] as LayerOverlay[]
    },
    SectorRF: {
      visible: false,
      count: 0,
      overlays: [] as LayerOverlay[]
    }
  });
  // const [currentCoords, setCurrentCoords] = useState({
  //   lat: 20.5937,
  //   lng: 78.9629
  // });

  // Get user's assigned regions (including temporary access) - refresh every 10 seconds
  useEffect(() => {
    const fetchRegions = async () => {
      if (user) {
        const regions = await getUserAssignedRegions(user);
        console.log('🗺️ Updated map regions:', regions);
        setAssignedRegions(regions);
      }
    };

    fetchRegions();

    // Refresh every 10 seconds to check for expired temporary access
    const interval = setInterval(fetchRegions, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Cleanup: Clear map instance when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      if (mapInstance) {
        console.log("🧹 Cleaning up map instance (navigating away from map page)");
        // Clear Redux state to force recreation when returning
        dispatch(setMapInstance(null));
      }
    };
  }, [mapInstance, dispatch]);

  // Load boundary settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('mapBoundarySettings');
    if (savedSettings) {
      try {
        setBoundarySettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load boundary settings:', error);
      }
    }
  }, []);

  // Load data for layer counts
  useEffect(() => {
    loadLayerData();
  }, []);

  // Reload layer data when map becomes available
  useEffect(() => {
    if (mapInstance && entries.length > 0) {
      console.log('📍 Map loaded, creating overlays for saved data...');
      loadLayerData();
    }
  }, [mapInstance]);

  const loadLayerData = async () => {
    const data = await fetchAllData();
    setEntries(data);

    // Only create overlays if map is loaded
    if (!mapInstance) {
      console.warn('Map not loaded yet, will create overlays later');
      return;
    }

    // Create overlays for each layer type
    const distanceData = data.filter((e) => e.type === "Distance");
    const polygonData = data.filter((e) => e.type === "Polygon");
    const circleData = data.filter((e) => e.type === "Circle");
    const elevationData = data.filter((e) => e.type === "Elevation");
    const infraData = data.filter((e) => e.type === "Infrastructure");
    const sectorRFData = data.filter((e) => e.type === "SectorRF");

    const distanceOverlays = createOverlaysFromData(distanceData, mapInstance);
    const polygonOverlays = createOverlaysFromData(polygonData, mapInstance);
    const circleOverlays = createOverlaysFromData(circleData, mapInstance);
    const elevationOverlays = createOverlaysFromData(elevationData, mapInstance);
    const infraOverlays = createOverlaysFromData(infraData, mapInstance);
    const sectorRFOverlays = createOverlaysFromData(sectorRFData, mapInstance);

    console.log(`📊 Loaded layers:
      Distance: ${distanceOverlays.length} overlays
      Polygon: ${polygonOverlays.length} overlays
      Circle: ${circleOverlays.length} overlays
      Elevation: ${elevationOverlays.length} overlays
      Infrastructure: ${infraOverlays.length} overlays
      SectorRF: ${sectorRFOverlays.length} overlays`);

    // Update counts and overlays
    setLayersState((prev) => ({
      Distance: {
        ...prev.Distance,
        count: distanceData.length,
        overlays: distanceOverlays
      },
      Polygon: {
        ...prev.Polygon,
        count: polygonData.length,
        overlays: polygonOverlays
      },
      Circle: {
        ...prev.Circle,
        count: circleData.length,
        overlays: circleOverlays
      },
      Elevation: {
        ...prev.Elevation,
        count: elevationData.length,
        overlays: elevationOverlays
      },
      Infrastructure: {
        ...prev.Infrastructure,
        count: infraData.length,
        overlays: infraOverlays
      },
      SectorRF: {
        ...prev.SectorRF,
        count: sectorRFData.length,
        overlays: sectorRFOverlays
      }
    }));
  };

  const handleLayerToggle = (layerType: string) => {
    setLayersState((prev) => {
      const layer = prev[layerType as keyof typeof prev];
      const newVisibility = !layer.visible;

      console.log(`🔄 Toggling ${layerType} layer: ${newVisibility ? 'SHOW' : 'HIDE'} (${layer.overlays.length} overlays)`);

      // Show/hide overlays
      setOverlaysVisibility(layer.overlays, newVisibility, mapInstance);

      return {
        ...prev,
        [layerType]: {
          ...layer,
          visible: newVisibility
        }
      };
    });
  };

  // Create map instance with delay to ensure Google Maps is fully ready
  // CRITICAL FIX: Always recreate map when component mounts or when returning to page
  useEffect(() => {
    if (isLoaded && mapContainerRef.current && window.google) {
      // Check if map needs recreation
      const needsRecreation = !mapInstance;

      if (needsRecreation) {
        console.log("🔄 Map needs recreation (navigated back to page or first load)");
      } else {
        console.log("✅ Map instance already exists, skipping creation");
        return; // Don't create duplicate maps
      }

      // Small delay to ensure Google Maps API is fully initialized
      const timer = setTimeout(() => {
        try {
          const map = createMap(mapContainerRef.current!);
          if (map) {
            console.log("✅ Map created successfully:", map);

            dispatch(
              addNotification({
                type: "success",
                title: "Map Loaded",
                message: "Google Maps loaded - All tools ready in India",
                autoClose: true,
                duration: 3000
              })
            );
          }
        } catch (error) {
          console.error("❌ Error creating map:", error);
          dispatch(
            addNotification({
              type: "error",
              title: "Map Load Error",
              message: "Failed to load Google Maps. Please refresh the page.",
              autoClose: false
            })
          );
        }
      }, 100); // 100ms delay to ensure Google Maps is ready

      return () => clearTimeout(timer);
    }
  }, [isLoaded, mapContainerRef.current, mapInstance, createMap, dispatch]); // Check mapInstance to avoid duplicates

  // Load and style India GeoJSON with user's assigned regions highlighted
  useEffect(() => {
    if (mapInstance && assignedRegions.length > 0) {
      // Create a data layer if it doesn't exist
      if (!dataLayerRef.current) {
        dataLayerRef.current = new google.maps.Data({
          map: mapInstance
        });
      }

      const dataLayer = dataLayerRef.current;

      // Keep data layer always visible (no hiding)
      if (dataLayer.getMap() !== mapInstance) {
        dataLayer.setMap(mapInstance);
      }

      // Load India GeoJSON from public folder
      dataLayer.loadGeoJson("/india.json", {}, (features) => {
        console.log("Loaded features:", features.length);

        dispatch(
          addNotification({
            type: "info",
            title: "Regions Loaded",
            message: `Loaded ${features.length} regions - ${assignedRegions.length} assigned to you`,
            autoClose: true,
            duration: 3000
          })
        );
      });

      // Style features based on assigned regions
      dataLayer.setStyle((feature) => {
        if (!boundarySettings.enabled) {
          return { visible: false };
        }

        const stateNameRaw =
          feature.getProperty("NAME_1") ||
          feature.getProperty("ST_NM") ||
          feature.getProperty("st_nm") ||  // Lowercase variant
          feature.getProperty("name");
        const stateName = String(stateNameRaw || "");

        const isHighlighted = assignedRegions.some(
          (region) =>
            stateName.toLowerCase().includes(region.toLowerCase()) ||
            region.toLowerCase().includes(stateName.toLowerCase()) ||
            stateName.toLowerCase() === region.toLowerCase()
        );

        // Calculate current opacity based on tool state
        const currentOpacity = (activeGISTool && boundarySettings.dimWhenToolActive)
          ? boundarySettings.dimmedOpacity
          : boundarySettings.opacity;

        // Assigned region styling
        if (isHighlighted) {
          return {
            fillColor: boundarySettings.color,
            fillOpacity: currentOpacity * 0.6, // 60% of current opacity for fill
            strokeColor: boundarySettings.color,
            strokeWeight: 2,
            strokeOpacity: currentOpacity,
            visible: true,
            clickable: !activeGISTool
          };
        }

        // Non-assigned region styling (dimmed)
        if (showOnlyAssigned) {
          return { visible: false };
        }

        return {
          fillColor: '#9CA3AF', // Gray
          fillOpacity: currentOpacity * 0.2,
          strokeColor: '#D1D5DB',
          strokeWeight: 0.5,
          strokeOpacity: currentOpacity * 0.5,
          visible: true,
          clickable: !activeGISTool
        };
      });

      // Add click listener for region info - ONLY for assigned regions
      dataLayer.addListener("click", (event: google.maps.Data.MouseEvent) => {
        // Don't handle click if a GIS tool is active - let the tool handle it
        if (activeGISTool) {
          return;
        }

        const stateNameRaw =
          event.feature.getProperty("NAME_1") ||
          event.feature.getProperty("ST_NM") ||
          event.feature.getProperty("st_nm") ||  // Lowercase variant
          event.feature.getProperty("name");
        const stateName = String(stateNameRaw || "Unknown Region");

        const isAssigned = assignedRegions.some(
          (region) =>
            stateName.toLowerCase().includes(region.toLowerCase()) ||
            region.toLowerCase().includes(stateName.toLowerCase()) ||
            stateName.toLowerCase() === region.toLowerCase()
        );

        // Only show info window for assigned regions
        if (isAssigned) {
          const infoWindow = new google.maps.InfoWindow({
            content: createRegionInfoContent(stateName, isAssigned, user),
            position: event.latLng
          });

          infoWindow.open(mapInstance);
        }
      });

      // Add mouseover effect
      dataLayer.addListener(
        "mouseover",
        (event: google.maps.Data.MouseEvent) => {
          // Don't handle hover if a GIS tool is active
          if (activeGISTool) {
            return;
          }

          const stateNameRaw =
            event.feature.getProperty("NAME_1") ||
            event.feature.getProperty("ST_NM") ||
            event.feature.getProperty("st_nm") ||  // Lowercase variant
            event.feature.getProperty("name");
          const stateName = String(stateNameRaw || "");

          const isHighlighted = assignedRegions.some(
            (region) =>
              stateName.toLowerCase().includes(region.toLowerCase()) ||
              region.toLowerCase().includes(stateName.toLowerCase())
          );

          if (isHighlighted) {
            dataLayer.overrideStyle(event.feature, {
              fillOpacity: 0.7,
              strokeWeight: 3
            });
          }
        }
      );

      dataLayer.addListener(
        "mouseout",
        (event: google.maps.Data.MouseEvent) => {
          // Don't handle hover if a GIS tool is active
          if (activeGISTool) {
            return;
          }
          dataLayer.revertStyle(event.feature);
        }
      );

      // Cleanup function
      return () => {
        if (dataLayerRef.current) {
          dataLayerRef.current.setMap(null);
          dataLayerRef.current = null;
        }
      };
    }
  }, [
    mapInstance,
    assignedRegions,
    showOnlyAssigned,
    user,
    dispatch,
    activeGISTool,
    boundarySettings
  ]);

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-red-100 rounded-lg mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Map Loading Error
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {loadError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Loading Maps
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please wait while we load the Google Maps API...
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer className="overflow-hidden">
      {/* Map Container - Takes full remaining height */}
      <div className="relative w-full h-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Unified Map Toolbar - Horizontal Layout */}
        {isMapLoaded && mapInstance && (
          <MapToolbar
            map={mapInstance}
            layersState={layersState}
            onLayerToggle={handleLayerToggle}
            onOpenSettings={() => setShowSettingsModal(true)}
            onDataSaved={loadLayerData}
          />
        )}

        {/* Help Button - Bottom Left */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="absolute bottom-2 left-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
          title="Help & Legend"
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Coordinates Display - Bottom Right */}
        {/* <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 z-10">
          <div className="flex items-center space-x-1.5">
            <svg
              className="w-3 h-3 text-gray-500 dark:text-gray-400"
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
            <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
              {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
            </span>
          </div>
        </div> */}

        {/* Loading Overlay */}
        {!isMapLoaded && isLoaded && (
          <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Initializing map...
              </p>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Map Help & Legend
                </h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-500"
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

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Region Legend */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
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
                    Regions
                  </h3>
                  <div className="space-y-2 ml-7">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-4 bg-blue-500 opacity-50 border-2 border-blue-700 rounded"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Assigned Regions ({assignedRegions.length})
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Regions you have access to manage
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-4 bg-gray-300 opacity-20 border-2 border-gray-400 rounded"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Other Regions
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Regions outside your access
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Infrastructure Legend */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                      />
                    </svg>
                    Infrastructure Status
                  </h3>
                  <div className="space-y-2 ml-7">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Active
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Fully operational infrastructure
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Maintenance
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Under maintenance or repair
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Offline
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Not operational or disconnected
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Info */}
                {user && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Your Access
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>{user.name}</strong> ({user.role})
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      {assignedRegions.length} assigned region
                      {assignedRegions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Quick Tips */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Quick Tips
                  </h3>
                  <ul className="space-y-2 ml-7 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">
                        •
                      </span>
                      <span>Click on assigned regions to view details</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">
                        •
                      </span>
                      <span>
                        Use GIS Tools from the left panel for measurements and
                        infrastructure management
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">
                        •
                      </span>
                      <span>
                        Search for places using the global search in the top
                        center
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 dark:text-blue-400 mr-2">
                        •
                      </span>
                      <span>
                        All your measurements and data are saved in the Data Hub
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <CoordinatesDisplay map={mapInstance} />

      {/* Boundary Settings Modal */}
      <MapSettings
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={boundarySettings}
        onSettingsChange={(newSettings) => {
          setBoundarySettings(newSettings);
          localStorage.setItem('mapBoundarySettings', JSON.stringify(newSettings));
        }}
      />
    </PageContainer>
  );
};

export default MapPage;
