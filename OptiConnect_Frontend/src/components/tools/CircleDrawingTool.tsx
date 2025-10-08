import React, { useState, useEffect } from "react";
import type { CircleData } from "../../types/gisTools.types";
import { isPointInsideIndia, showOutsideIndiaWarning } from "../../utils/indiaBoundaryCheck";
import { isPointInAssignedRegion } from "../../utils/regionMapping";
import NotificationDialog from "../common/NotificationDialog";
import { trackToolUsage } from "../../services/analyticsService";
import { useAppSelector } from "../../store";

interface CircleDrawingToolProps {
  map: google.maps.Map | null;
  onSave?: (circle: CircleData) => void;
  onClose?: () => void;
}

/**
 * Circle/Radius Drawing Tool - Phase 4.3
 * Interactive circle drawing with radius and area calculation
 */
const CircleDrawingTool: React.FC<CircleDrawingToolProps> = ({
  map,
  onSave,
  onClose
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [startTime] = useState<number>(Date.now());
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [centerMarker, setCenterMarker] = useState<google.maps.Marker | null>(
    null
  );
  const [circle, setCircle] = useState<google.maps.Circle | null>(null);
  const [radius, setRadius] = useState<number>(1000); // default 1km
  const [area, setArea] = useState<number>(0);
  const [perimeter, setPerimeter] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [color, setColor] = useState<string>("#FF0000");
  const [fillOpacity, setFillOpacity] = useState<number>(0.35);
  const [description, setDescription] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [drawingMode, setDrawingMode] = useState<"click" | "drag">("click");
  const [isPlacingCenter, setIsPlacingCenter] = useState<boolean>(true);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  // Initialize click listener for center placement
  useEffect(() => {
    if (!map || !isPlacingCenter) return;

    const clickListener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          placeCenter(e.latLng.lat(), e.latLng.lng());
        }
      }
    );

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, isPlacingCenter]);

  // Update circle when center or radius changes
  useEffect(() => {
    if (!map || !center) return;

    // Remove old circle
    if (circle) {
      circle.setMap(null);
    }

    // Create new circle
    const newCircle = new google.maps.Circle({
      center: center,
      radius: radius,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: fillOpacity,
      map: map,
      editable: true,
      draggable: true
    });

    // Update radius when circle is resized
    newCircle.addListener("radius_changed", () => {
      const newRadius = newCircle.getRadius();
      setRadius(newRadius);
    });

    // Update center when circle is dragged - use dragend for final position
    newCircle.addListener("dragend", () => {
      const newCenter = newCircle.getCenter();
      if (newCenter) {
        const newLat = newCenter.lat();
        const newLng = newCenter.lng();

        // Check if new position is inside India
        if (!isPointInsideIndia(newLat, newLng)) {
          showOutsideIndiaWarning();
          // Reset to original position
          newCircle.setCenter(center);
          return;
        }

        setCenter({ lat: newLat, lng: newLng });
        if (centerMarker) {
          centerMarker.setPosition(newCenter);
        }
      }
    });

    setCircle(newCircle);

    // Calculate area and perimeter
    calculateGeometry(radius);
  }, [center, map, color, fillOpacity]);

  // Update radius from input
  useEffect(() => {
    if (circle) {
      circle.setRadius(radius);
      calculateGeometry(radius);
    }
  }, [radius]);

  /**
   * Place center marker
   */
  const placeCenter = async (lat: number, lng: number) => {
    // Check if center is inside India
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

    setCenter({ lat, lng });
    setIsPlacingCenter(false);

    // Create center marker
    if (map) {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        label: {
          text: "⊕",
          color: "white",
          fontWeight: "bold",
          fontSize: "20px"
        },
        title: "Circle Center",
        draggable: true
      });

      // Update center on drag
      marker.addListener("dragend", () => {
        const newPos = marker.getPosition();
        if (newPos) {
          const newLat = newPos.lat();
          const newLng = newPos.lng();

          // Check if new position is inside India
          if (!isPointInsideIndia(newLat, newLng)) {
            showOutsideIndiaWarning();
            // Reset to original position
            marker.setPosition(center);
            return;
          }

          setCenter({ lat: newLat, lng: newLng });
        }
      });

      setCenterMarker(marker);
    }
  };

  /**
   * Calculate area and perimeter
   */
  const calculateGeometry = (r: number) => {
    // Area = π * r²
    const calculatedArea = Math.PI * r * r;
    setArea(calculatedArea);

    // Perimeter = 2 * π * r
    const calculatedPerimeter = 2 * Math.PI * r;
    setPerimeter(calculatedPerimeter);
  };

  /**
   * Clear circle
   */
  const clearCircle = () => {
    // Remove circle
    if (circle) {
      circle.setMap(null);
      setCircle(null);
    }

    // Remove center marker
    if (centerMarker) {
      centerMarker.setMap(null);
      setCenterMarker(null);
    }

    setCenter(null);
    setRadius(1000);
    setArea(0);
    setPerimeter(0);
    setIsPlacingCenter(true);
  };

  /**
   * Save circle
   */
  const handleSave = () => {
    if (!center) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Center Required',
        message: 'Please place the circle center on the map'
      });
      return;
    }

    if (!name.trim()) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Name Required',
        message: 'Please enter a name for this circle'
      });
      return;
    }

    const circleData: CircleData = {
      id: `circle_${Date.now()}`,
      name: name.trim(),
      center,
      radius,
      perimeter,
      area,
      color,
      fillOpacity,
      strokeWeight: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: description.trim() || undefined
    };

    if (onSave) {
      onSave(circleData);
    }

    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem("gis_circles") || "[]");
    saved.push(circleData);
    localStorage.setItem("gis_circles", JSON.stringify(saved));

    // Track tool usage for analytics
    const duration = Math.round((Date.now() - startTime) / 1000);
    trackToolUsage({
      toolName: 'circle-drawing',
      userId: user?.id || 'guest',
      userName: user?.name || 'Guest User',
      duration
    });

    setNotification({
      isOpen: true,
      type: 'success',
      title: 'Success!',
      message: 'Circle saved successfully!'
    });
    clearCircle();
    setShowSaveDialog(false);
    setName("");
    setDescription("");
  };

  /**
   * Format area for display
   */
  const formatArea = (sqMeters: number): string => {
    if (sqMeters < 10000) {
      return `${sqMeters.toFixed(2)} m²`;
    } else if (sqMeters < 1000000) {
      return `${(sqMeters / 10000).toFixed(2)} hectares`;
    } else {
      return `${(sqMeters / 1000000).toFixed(2)} km²`;
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
   * Preset radius options
   */
  const presetRadii = [
    { label: "500m", value: 500 },
    { label: "1km", value: 1000 },
    { label: "2km", value: 2000 },
    { label: "5km", value: 5000 },
    { label: "10km", value: 10000 }
  ];

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
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
          Circle/Radius Tool
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
          {isPlacingCenter
            ? "Click on the map to place the circle center."
            : "Drag the circle or center marker to reposition. Drag the circle edge to resize."}
        </p>
      </div>

      {/* Center Coordinates */}
      {center && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Center
          </div>
          <div className="text-sm font-mono text-gray-900 dark:text-white">
            {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
          </div>
        </div>
      )}

      {/* Radius Control */}
      {center && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Radius: {formatDistance(radius)}
          </label>
          <input
            type="range"
            min="100"
            max="50000"
            step="100"
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value))}
            className="w-full mb-2"
          />
          <div className="flex gap-2 flex-wrap">
            {presetRadii.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setRadius(preset.value)}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  Math.abs(radius - preset.value) < 50
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Geometry Display */}
      {center && (
        <div className="mb-4 space-y-2">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Area
            </div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatArea(area)}
            </div>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Perimeter (Circumference)
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {formatDistance(perimeter)}
            </div>
          </div>
        </div>
      )}

      {/* Color Picker */}
      {center && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Circle Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Opacity Slider */}
      {center && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fill Opacity: {(fillOpacity * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={fillOpacity}
            onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={clearCircle}
          disabled={!center}
          className="flex-1 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={!center}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Circle
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter circle name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
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
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
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

export default CircleDrawingTool;
