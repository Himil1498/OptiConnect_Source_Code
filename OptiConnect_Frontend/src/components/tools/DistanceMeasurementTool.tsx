import React, { useState, useEffect } from "react";
import type { DistanceMeasurement } from "../../types/gisTools.types";
import {
  isPointInsideIndia,
  showOutsideIndiaWarning
} from "../../utils/indiaBoundaryCheck";
import { isPointInAssignedRegion } from "../../utils/regionMapping";
import NotificationDialog from "../common/NotificationDialog";
import { trackToolUsage } from "../../services/analyticsService";
import { useAppSelector } from "../../store";
import { distanceMeasurementService } from "../../services/gisToolsService";

interface DistanceMeasurementToolProps {
  map: google.maps.Map | null;
  onSave?: (measurement: DistanceMeasurement) => void;
  onClose?: () => void;
}

/**
 * Distance Measurement Tool - Phase 4.1
 * Multi-point distance measurement with labels and street view
 */
const DistanceMeasurementTool: React.FC<DistanceMeasurementToolProps> = ({
  map,
  onSave,
  onClose
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [startTime] = useState<number>(Date.now());
  const [points, setPoints] = useState<
    Array<{ lat: number; lng: number; label: string }>
  >([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [distanceLabels, setDistanceLabels] = useState<google.maps.Marker[]>(
    []
  );
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [segments, setSegments] = useState<
    Array<{ distance: number; from: string; to: string }>
  >([]);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [streetViewEnabled, setStreetViewEnabled] = useState<boolean>(false);
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
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

  // Initialize click listener
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          addPoint(e.latLng.lat(), e.latLng.lng());
        }
      }
    );

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, points]);

  // Update polyline when points change
  useEffect(() => {
    if (!map) return;

    // Remove old polyline
    if (polyline) {
      polyline.setMap(null);
    }

    // Remove old distance labels
    distanceLabels.forEach((label) => label.setMap(null));
    setDistanceLabels([]);

    // Only create polyline if we have 2 or more points
    if (points.length >= 2) {
      // Create new polyline with maximum visibility for street view
      const newPolyline = new google.maps.Polyline({
        path: points.map((p) => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 6, // Thicker for better visibility
        map: map,
        zIndex: 999999, // Extremely high z-index to show in street view
        clickable: true, // Make it interactive
        visible: true // Explicitly set visible
      });

      setPolyline(newPolyline);

      // Calculate distances and add labels
      calculateDistancesWithLabels();
    } else {
      // If less than 2 points, clear polyline
      setPolyline(null);
      setTotalDistance(0);
      setSegments([]);
    }
  }, [points, map]);

  // Ensure overlays persist when entering/exiting street view
  useEffect(() => {
    if (!map) return;

    const panorama = map.getStreetView();

    const visibilityListener = panorama.addListener("visible_changed", () => {
      const isVisible = panorama.getVisible();

      if (isVisible) {
        // Force re-render overlays in street view
        setTimeout(() => {
          // Re-create polyline with maximum visibility for street view
          if (polyline) {
            const path = polyline.getPath();
            const pathArray = [];
            for (let i = 0; i < path.getLength(); i++) {
              const point = path.getAt(i);
              pathArray.push({ lat: point.lat(), lng: point.lng() });
            }

            polyline.setMap(null);
            const newPolyline = new google.maps.Polyline({
              path: pathArray,
              geodesic: true,
              strokeColor: "#FF0000",
              strokeOpacity: 1.0,
              strokeWeight: 8, // Extra thick for street view
              map: map,
              zIndex: 999999,
              clickable: true,
              visible: true
            });
            setPolyline(newPolyline);
          }

          // Re-apply markers with extreme z-index
          markers.forEach((marker) => {
            marker.setOptions({
              zIndex: 1000000,
              optimized: false,
              visible: true
            });
          });

          // Re-apply distance label markers
          distanceLabels.forEach((label) => {
            label.setOptions({
              zIndex: 1000001,
              optimized: false,
              visible: true
            });
          });
        }, 100);
      }
    });

    return () => {
      google.maps.event.removeListener(visibilityListener);
    };
  }, [map, polyline, markers, distanceLabels]);

  /**
   * Add a new point
   */
  const addPoint = async (lat: number, lng: number) => {
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
        message: regionCheck.message || "You don't have access to this region. Contact your administrator."
      });
      return;
    }

    const pointIndex = points.length; // Capture current index
    const label = String.fromCharCode(65 + pointIndex); // A, B, C, etc.

    const newPoint = { lat, lng, label };
    setPoints((prev) => [...prev, newPoint]);

    // Create marker
    if (map) {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        label: {
          text: label,
          color: "white",
          fontWeight: "bold"
        },
        title: `Point ${label}`,
        draggable: true,
        zIndex: 1000000, // Extremely high z-index for street view visibility
        optimized: false // Disable optimization for street view visibility
      });

      // Update point on drag - use captured index
      marker.addListener("dragend", () => {
        const newPos = marker.getPosition();
        if (newPos) {
          updatePoint(pointIndex, newPos.lat(), newPos.lng());
        }
      });

      setMarkers((prev) => [...prev, marker]);
    }
  };

  /**
   * Update existing point
   */
  const updatePoint = (index: number, lat: number, lng: number) => {
    setPoints((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], lat, lng };
      return updated;
    });
  };

  /**
   * Remove last point (undo)
   */
  const undoLastPoint = () => {
    if (points.length === 0) return;

    // Remove last marker
    const lastMarker = markers[markers.length - 1];
    if (lastMarker) {
      lastMarker.setMap(null);
    }

    // Remove last point and marker
    setPoints((prev) => prev.slice(0, -1));
    setMarkers((prev) => prev.slice(0, -1));

    // The polyline and distance labels will be automatically updated by the useEffect
    // that watches the points array (line 75)
  };

  /**
   * Calculate distances between all points and add real-time labels on map
   */
  const calculateDistancesWithLabels = () => {
    if (points.length < 2) {
      setTotalDistance(0);
      setSegments([]);
      return;
    }

    let total = 0;
    const newSegments: Array<{ distance: number; from: string; to: string }> =
      [];
    const newLabels: google.maps.Marker[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const from = new google.maps.LatLng(points[i].lat, points[i].lng);
      const to = new google.maps.LatLng(points[i + 1].lat, points[i + 1].lng);

      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        from,
        to
      );

      newSegments.push({
        distance,
        from: points[i].label,
        to: points[i + 1].label
      });

      // Calculate midpoint for label placement
      const midLat = (points[i].lat + points[i + 1].lat) / 2;
      const midLng = (points[i].lng + points[i + 1].lng) / 2;

      // Create distance label marker with improved visibility
      const labelMarker = new google.maps.Marker({
        position: { lat: midLat, lng: midLng },
        map: map,
        // icon: {
        //   path: google.maps.SymbolPath.CIRCLE,
        //   scale: 12, // Small visible circle for better text background
        //   fillColor: "#667eea",
        //   fillOpacity: 0.9,
        //   strokeColor: "#ffffff",
        //   strokeWeight: 2
        // },
        label: {
          text: formatDistance(distance),
          color: "red",
          fontSize: "14px",
          fontWeight: "bold",
          fontFamily: "Arial, sans-serif"
        },
        zIndex: 1000001,
        clickable: false,
        optimized: false
      });

      newLabels.push(labelMarker);

      total += distance;
    }

    setTotalDistance(total);
    setSegments(newSegments);
    setDistanceLabels(newLabels);
  };

  /**
   * Clear all points
   */
  const clearAll = () => {
    // Remove markers
    markers.forEach((marker) => marker.setMap(null));

    // Remove polyline
    if (polyline) {
      polyline.setMap(null);
    }

    // Remove distance labels
    distanceLabels.forEach((label) => label.setMap(null));

    setPoints([]);
    setMarkers([]);
    setPolyline(null);
    setDistanceLabels([]);
    setTotalDistance(0);
    setSegments([]);
  };

  /**
   * Save measurement
   */
  const handleSave = async () => {
    if (points.length < 2) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Insufficient Points",
        message: "Please add at least 2 points to measure distance"
      });
      return;
    }

    if (!name.trim()) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Name Required",
        message: "Please enter a name for this measurement"
      });
      return;
    }

    const measurement: DistanceMeasurement = {
      id: `dist_${Date.now()}`,
      name: name.trim(),
      points,
      totalDistance,
      segments,
      createdAt: new Date(),
      updatedAt: new Date(),
      streetViewEnabled,
      color: "#FF0000",
      description: description.trim() || undefined
    };

    if (onSave) {
      onSave(measurement);
    }

    // Save to database
    setSaving(true);
    try {
      const savedMeasurement = await distanceMeasurementService.create({
        measurement_name: name.trim(),
        points: points,
        total_distance: totalDistance,
        unit: 'meters',
        notes: description.trim()
      });

      if (savedMeasurement) {
        // Track tool usage for analytics
        const duration = Math.round((Date.now() - startTime) / 1000); // Convert to seconds
        trackToolUsage({
          toolName: 'distance-measurement',
          userId: user?.id || 'guest',
          userName: user?.name || 'Guest User',
          duration
        });

        setNotification({
          isOpen: true,
          type: "success",
          title: "Success!",
          message: "Distance measurement saved to database!"
        });
        clearAll();
        setShowSaveDialog(false);
        setName("");
        setDescription("");
      }
    } catch (error) {
      console.error('Error saving measurement:', error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to save measurement. Please try again."
      });
      return; // Don't clear if save failed
    } finally {
      setSaving(false);
    }
  };

  /**
   * Format distance for display
   */
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(2)} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
  };

  /**
   * Open Street View at point
   */
  const openStreetView = (lat: number, lng: number) => {
    if (!map || !streetViewEnabled) return;

    const panorama = map.getStreetView();
    panorama.setPosition({ lat, lng });
    panorama.setVisible(true);
  };

  return (
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Distance Measurement
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
          Click on the map to add measurement points. Points will be labeled A,
          B, C, etc.
        </p>
      </div>

      {/* Total Distance Display */}
      {points.length >= 2 && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total Distance
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatDistance(totalDistance)}
          </div>
        </div>
      )}

      {/* Segments Table */}
      {segments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Segments
          </h4>
          <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    From
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    To
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Distance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {segments.map((segment, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                      {segment.from}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                      {segment.to}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white">
                      {formatDistance(segment.distance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Points List */}
      {points.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Points ({points.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {points.map((point, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Point {point.label}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </span>
                {streetViewEnabled && (
                  <button
                    onClick={() => openStreetView(point.lat, point.lng)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    title="Open Street View"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Street View Toggle */}
      <div className="mb-4">
        <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={streetViewEnabled}
            onChange={(e) => setStreetViewEnabled(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span>Enable Street View</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={undoLastPoint}
          disabled={points.length === 0}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Undo
        </button>
        <button
          onClick={clearAll}
          disabled={points.length === 0}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={points.length < 2 || saving}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Distance Measurement
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
                  placeholder="Enter measurement name"
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
    </div>
  );
};

export default DistanceMeasurementTool;
