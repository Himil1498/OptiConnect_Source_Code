import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import type { ElevationProfile } from "../../types/gisTools.types";
import {
  isPointInsideIndia,
  showOutsideIndiaWarning
} from "../../utils/indiaBoundaryCheck";
import { isPointInAssignedRegion } from "../../utils/regionMapping";
import NotificationDialog from "../common/NotificationDialog";
import { trackToolUsage } from "../../services/analyticsService";
import { useAppSelector } from "../../store";
import PageContainer from "../common/PageContainer";
import { elevationProfileService } from "../../services/gisToolsService";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ElevationProfileToolProps {
  map: google.maps.Map | null;
  onSave?: (profile: ElevationProfile) => void;
  onClose?: () => void;
}

/**
 * Elevation Profile Tool - Phase 4.4
 * Two-point elevation profiling with interactive graph
 */
const ElevationProfileTool: React.FC<ElevationProfileToolProps> = ({
  map,
  onSave,
  onClose
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [startTime] = useState<number>(Date.now());
  const [points, setPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [elevationData, setElevationData] = useState<any[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [highPoint, setHighPoint] = useState<any>(null);
  const [lowPoint, setLowPoint] = useState<any>(null);
  const [elevationGain, setElevationGain] = useState<number>(0);
  const [elevationLoss, setElevationLoss] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [showFullGraph, setShowFullGraph] = useState<boolean>(false);
  const [highPointMarker, setHighPointMarker] =
    useState<google.maps.Marker | null>(null);
  const [lowPointMarker, setLowPointMarker] =
    useState<google.maps.Marker | null>(null);
  const elevatorRef = useRef<google.maps.ElevationService | null>(null);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: ""
  });
  const [saving, setSaving] = useState<boolean>(false);

  // Initialize Elevation Service
  useEffect(() => {
    if (map && !elevatorRef.current) {
      elevatorRef.current = new google.maps.ElevationService();
    }
  }, [map]);

  // Initialize click listener
  useEffect(() => {
    if (!map || points.length >= 2) return;

    const clickListener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng && points.length < 2) {
          addPoint(e.latLng.lat(), e.latLng.lng());
        }
      }
    );

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, points]);

  // Update polyline and fetch elevation when points change
  useEffect(() => {
    if (!map || points.length < 2) return;

    // Remove old polyline
    if (polyline) {
      polyline.setMap(null);
    }

    // Create new polyline
    const newPolyline = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: map
    });

    setPolyline(newPolyline);

    // Calculate total distance
    const distance = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(points[0].lat, points[0].lng),
      new google.maps.LatLng(points[1].lat, points[1].lng)
    );
    setTotalDistance(distance);

    // Fetch elevation data
    fetchElevationProfile();
  }, [points, map]);

  /**
   * Add a new point
   */
  const addPoint = async (lat: number, lng: number) => {
    if (points.length >= 2) return;

    // Check if point is inside India
    if (!isPointInsideIndia(lat, lng)) {
      showOutsideIndiaWarning();
      return;
    }

    // Check if point is in assigned region (Region-based access control)
    const regionCheck = await isPointInAssignedRegion(lat, lng, user);
    if (!regionCheck.allowed) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Region Access Denied",
        message:
          regionCheck.message ||
          "You don't have access to this region. Contact your administrator."
      });
      return;
    }

    const newPoint = { lat, lng };
    setPoints((prev) => [...prev, newPoint]);

    // Create marker
    if (map) {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        label: {
          text: points.length === 0 ? "A" : "B",
          color: "white",
          fontWeight: "bold"
        },
        title: `Point ${points.length === 0 ? "A" : "B"}`
      });

      setMarkers((prev) => [...prev, marker]);
    }
  };

  /**
   * Fetch elevation profile
   */
  const fetchElevationProfile = async () => {
    if (!elevatorRef.current || points.length < 2) return;

    setLoading(true);

    try {
      // Create path with multiple samples (100 points)
      const samples = 100;
      const pathRequest: google.maps.PathElevationRequest = {
        path: points,
        samples: samples
      };

      elevatorRef.current.getElevationAlongPath(
        pathRequest,
        (results, status) => {
          if (status === "OK" && results) {
            processElevationData(results);
          } else {
            console.error("Elevation request failed:", status);
            setNotification({
              isOpen: true,
              type: "error",
              title: "Elevation Fetch Failed",
              message:
                "Failed to fetch elevation data. Please check your API key and quota."
            });
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error("Error fetching elevation:", error);
      setLoading(false);
    }
  };

  /**
   * Process elevation data
   */
  const processElevationData = (results: google.maps.ElevationResult[]) => {
    // Calculate distance for each point
    const processedData = results.map((result, index) => {
      const distanceFromStart = (totalDistance / results.length) * index;
      return {
        elevation: result.elevation,
        resolution: result.resolution || 0,
        location: {
          lat: result.location?.lat() || 0,
          lng: result.location?.lng() || 0
        },
        distance: distanceFromStart
      };
    });

    setElevationData(processedData);

    // Find high and low points
    let high = processedData[0];
    let low = processedData[0];
    processedData.forEach((point) => {
      if (point.elevation > high.elevation) high = point;
      if (point.elevation < low.elevation) low = point;
    });

    setHighPoint(high);
    setLowPoint(low);

    // Add markers for high and low points on map
    if (map) {
      // Remove old markers
      if (highPointMarker) highPointMarker.setMap(null);
      if (lowPointMarker) lowPointMarker.setMap(null);

      // High point marker (Green)
      const highMarker = new google.maps.Marker({
        position: { lat: high.location.lat, lng: high.location.lng },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        },
        title: `High Point: ${high.elevation.toFixed(2)}m`,
        zIndex: 999
      });

      // Add info window for high point
      const highInfoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px;">
          <strong style="color: #10b981;">⬆ HIGH POINT</strong><br/>
          <strong>${high.elevation.toFixed(2)} m</strong><br/>
          ${formatDistance(high.distance)} from start
        </div>`
      });
      highMarker.addListener("click", () => {
        highInfoWindow.open(map, highMarker);
      });

      // Low point marker (Blue)
      const lowMarker = new google.maps.Marker({
        position: { lat: low.location.lat, lng: low.location.lng },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        },
        title: `Low Point: ${low.elevation.toFixed(2)}m`,
        zIndex: 999
      });

      // Add info window for low point
      const lowInfoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px;">
          <strong style="color: #3b82f6;">⬇ LOW POINT</strong><br/>
          <strong>${low.elevation.toFixed(2)} m</strong><br/>
          ${formatDistance(low.distance)} from start
        </div>`
      });
      lowMarker.addListener("click", () => {
        lowInfoWindow.open(map, lowMarker);
      });

      setHighPointMarker(highMarker);
      setLowPointMarker(lowMarker);
    }

    // Calculate elevation gain and loss
    let gain = 0;
    let loss = 0;
    for (let i = 1; i < processedData.length; i++) {
      const diff = processedData[i].elevation - processedData[i - 1].elevation;
      if (diff > 0) gain += diff;
      else loss += Math.abs(diff);
    }

    setElevationGain(gain);
    setElevationLoss(loss);
  };

  /**
   * Clear all
   */
  const clearAll = () => {
    // Remove markers
    markers.forEach((marker) => marker.setMap(null));

    // Remove polyline
    if (polyline) {
      polyline.setMap(null);
    }

    // Remove high/low point markers
    if (highPointMarker) highPointMarker.setMap(null);
    if (lowPointMarker) lowPointMarker.setMap(null);

    setPoints([]);
    setMarkers([]);
    setPolyline(null);
    setElevationData([]);
    setTotalDistance(0);
    setHighPoint(null);
    setLowPoint(null);
    setHighPointMarker(null);
    setLowPointMarker(null);
    setElevationGain(0);
    setElevationLoss(0);
  };

  /**
   * Save elevation profile
   */
  const handleSave = async () => {
    if (points.length < 2 || elevationData.length === 0) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Profile Required",
        message: "Please create an elevation profile first"
      });
      return;
    }

    if (!name.trim()) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Name Required",
        message: "Please enter a name for this elevation profile"
      });
      return;
    }

    const profile: ElevationProfile = {
      id: `elev_${Date.now()}`,
      name: name.trim(),
      points,
      elevationData,
      highPoint,
      lowPoint,
      totalDistance,
      elevationGain,
      elevationLoss,
      graph: {
        type: "line",
        data: chartData,
        options: chartOptions
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      description: description.trim() || undefined
    };

    if (onSave) {
      onSave(profile);
    }

    // Save to database
    setSaving(true);
    try {
      const savedProfile = await elevationProfileService.create({
        profile_name: name.trim(),
        start_point: points[0],
        end_point: points[1],
        elevation_data: elevationData,
        total_distance: totalDistance,
        max_elevation: highPoint ? highPoint.elevation : 0,
        min_elevation: lowPoint ? lowPoint.elevation : 0,
        notes: description.trim()
      });

      if (savedProfile) {
        // Track tool usage for analytics
        const duration = Math.round((Date.now() - startTime) / 1000);
        trackToolUsage({
          toolName: "elevation-profile",
          userId: user?.id || "guest",
          userName: user?.name || "Guest User",
          duration
        });

        setNotification({
          isOpen: true,
          type: "success",
          title: "Success!",
          message: "Elevation profile saved to database!"
        });
        clearAll();
        setShowSaveDialog(false);
        setName("");
        setDescription("");
      }
    } catch (error) {
      console.error('Error saving elevation profile:', error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to save elevation profile. Please try again."
      });
      return; // Don't clear if save failed
    } finally {
      setSaving(false);
    }
  };

  /**
   * Format distance
   */
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(0)} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
  };

  /**
   * Format elevation
   */
  const formatElevation = (meters: number): string => {
    return `${meters.toFixed(1)} m`;
  };

  // Chart data with high/low point markers
  const chartData = {
    labels: elevationData.map((_, index) => {
      const distance = (totalDistance / elevationData.length) * index;
      return formatDistance(distance);
    }),
    datasets: [
      {
        label: "Elevation (m)",
        data: elevationData.map((d) => d.elevation),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: elevationData.map((d) => {
          // Highlight high and low points
          if (
            highPoint &&
            d.elevation === highPoint.elevation &&
            d.distance === highPoint.distance
          )
            return 8;
          if (
            lowPoint &&
            d.elevation === lowPoint.elevation &&
            d.distance === lowPoint.distance
          )
            return 8;
          return 0;
        }),
        pointBackgroundColor: elevationData.map((d) => {
          // Color code high and low points
          if (
            highPoint &&
            d.elevation === highPoint.elevation &&
            d.distance === highPoint.distance
          )
            return "#10b981"; // Green for high
          if (
            lowPoint &&
            d.elevation === lowPoint.elevation &&
            d.distance === lowPoint.distance
          )
            return "#3b82f6"; // Blue for low
          return "rgb(59, 130, 246)";
        }),
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointHoverRadius: 5
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            return `Elevation: ${context.parsed.y.toFixed(1)} m`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Distance"
        },
        ticks: {
          maxTicksLimit: 10
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Elevation (m)"
        }
      }
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false
    }
  };

  return (
    <>
      <div className="fixed top-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-md z-40 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            Elevation Profile
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
          )}
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {points.length === 0
              ? "Click on the map to place the start point (A)"
              : points.length === 1
              ? "Click on the map to place the end point (B)"
              : "Elevation profile created. View the graph below."}
          </p>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Fetching elevation data...
            </p>
          </div>
        )}

        {/* Statistics */}
        {points.length === 2 && elevationData.length > 0 && (
          <div className="mb-4 space-y-2">
            {/* Distance */}
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Distance
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatDistance(totalDistance)}
              </span>
            </div>

            {/* High Point */}
            {highPoint && (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Highest Point
                </span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatElevation(highPoint.elevation)}
                </span>
              </div>
            )}

            {/* Low Point */}
            {lowPoint && (
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-md flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Lowest Point
                </span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {formatElevation(lowPoint.elevation)}
                </span>
              </div>
            )}

            {/* Elevation Gain */}
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Elevation Gain
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                ↑ {formatElevation(elevationGain)}
              </span>
            </div>

            {/* Elevation Loss */}
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-md flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Elevation Loss
              </span>
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                ↓ {formatElevation(elevationLoss)}
              </span>
            </div>
          </div>
        )}

        {/* Mini Graph */}
        {elevationData.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Elevation Profile
              </h4>
              <button
                onClick={() => setShowFullGraph(true)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs font-medium"
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
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                <span>View Full Size</span>
              </button>
            </div>
            <div className="h-40 bg-gray-50 dark:bg-gray-900 rounded-md p-2">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={clearAll}
            disabled={points.length === 0}
            className="flex-1 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={points.length < 2 || elevationData.length === 0 || saving}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Full Graph Modal */}
      {showFullGraph && (
        <div className="fixed inset-0 top-16 bg-black bg-opacity-90 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 w-full h-full p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Elevation Profile - Fullscreen View
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total Distance: {formatDistance(totalDistance)} • High:{" "}
                  {highPoint ? formatElevation(highPoint.elevation) : "N/A"} •
                  Low: {lowPoint ? formatElevation(lowPoint.elevation) : "N/A"}
                </p>
              </div>
              <button
                onClick={() => setShowFullGraph(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
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
                <span>Close</span>
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Elevation Profile
            </h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter profile name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white text-gray-900 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Dialog */}
      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={true}
        autoCloseDelay={3000}
      />
    </>
  );
};

export default ElevationProfileTool;
