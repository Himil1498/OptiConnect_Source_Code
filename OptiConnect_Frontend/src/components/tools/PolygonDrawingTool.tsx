import React, { useState, useEffect } from "react";
import type { PolygonData } from "../../types/gisTools.types";
import { isPointInsideIndia, showOutsideIndiaWarning } from "../../utils/indiaBoundaryCheck";
import { isPointInAssignedRegion } from "../../utils/regionMapping";
import NotificationDialog from "../common/NotificationDialog";
import { trackToolUsage } from "../../services/analyticsService";
import { useAppSelector } from "../../store";

interface PolygonDrawingToolProps {
  map: google.maps.Map | null;
  onSave?: (polygon: PolygonData) => void;
  onClose?: () => void;
}

/**
 * Polygon Drawing Tool - Phase 4.2
 * Multi-vertex polygon with area and perimeter calculation
 */
const PolygonDrawingTool: React.FC<PolygonDrawingToolProps> = ({
  map,
  onSave,
  onClose
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [startTime] = useState<number>(Date.now());
  const [vertices, setVertices] = useState<Array<{ lat: number; lng: number }>>(
    []
  );
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
  const [area, setArea] = useState<number>(0);
  const [perimeter, setPerimeter] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [color, setColor] = useState<string>("#FF0000");
  const [fillOpacity, setFillOpacity] = useState<number>(0.35);
  const [description, setDescription] = useState<string>("");
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(true);
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

  // Initialize click listener
  useEffect(() => {
    if (!map || !isDrawing) return;

    const clickListener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          addVertex(e.latLng.lat(), e.latLng.lng());
        }
      }
    );

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, vertices, isDrawing]);

  // Update polygon when vertices change
  useEffect(() => {
    if (!map || vertices.length < 3) {
      if (polygon) {
        polygon.setMap(null);
        setPolygon(null);
      }
      return;
    }

    // Remove old polygon
    if (polygon) {
      polygon.setMap(null);
    }

    // Create new polygon
    const newPolygon = new google.maps.Polygon({
      paths: vertices,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: fillOpacity,
      map: map,
      editable: isDrawing,
      draggable: false
    });

    // Add listeners for editable polygon
    if (isDrawing) {
      google.maps.event.addListener(newPolygon.getPath(), "set_at", () => {
        updateVerticesFromPolygon(newPolygon);
      });
      google.maps.event.addListener(newPolygon.getPath(), "insert_at", () => {
        updateVerticesFromPolygon(newPolygon);
      });
    }

    setPolygon(newPolygon);

    // Calculate area and perimeter
    calculateGeometry();
  }, [vertices, map, color, fillOpacity, isDrawing]);

  /**
   * Add a new vertex
   */
  const addVertex = async (lat: number, lng: number) => {
    // Check if vertex is inside India
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

    const newVertex = { lat, lng };
    setVertices((prev) => [...prev, newVertex]);

    // Create marker
    if (map) {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        label: {
          text: String(vertices.length + 1),
          color: "white",
          fontWeight: "bold"
        },
        title: `Vertex ${vertices.length + 1}`,
        draggable: isDrawing
      });

      // Update vertex on drag
      if (isDrawing) {
        marker.addListener("dragend", () => {
          const newPos = marker.getPosition();
          if (newPos) {
            updateVertex(vertices.length, newPos.lat(), newPos.lng());
          }
        });
      }

      setMarkers((prev) => [...prev, marker]);
    }
  };

  /**
   * Update existing vertex
   */
  const updateVertex = (index: number, lat: number, lng: number) => {
    setVertices((prev) => {
      const updated = [...prev];
      updated[index] = { lat, lng };
      return updated;
    });
  };

  /**
   * Update vertices from polygon path changes
   */
  const updateVerticesFromPolygon = (poly: google.maps.Polygon) => {
    const path = poly.getPath();
    const newVertices: Array<{ lat: number; lng: number }> = [];
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      newVertices.push({ lat: point.lat(), lng: point.lng() });
    }
    setVertices(newVertices);
  };

  /**
   * Remove last vertex (undo)
   */
  const undoLastVertex = () => {
    if (vertices.length === 0) return;

    // Remove last marker
    const lastMarker = markers[markers.length - 1];
    if (lastMarker) {
      lastMarker.setMap(null);
    }

    setVertices((prev) => prev.slice(0, -1));
    setMarkers((prev) => prev.slice(0, -1));
  };

  /**
   * Calculate area and perimeter
   */
  const calculateGeometry = () => {
    if (vertices.length < 3) {
      setArea(0);
      setPerimeter(0);
      return;
    }

    // Calculate area using Google Maps geometry library
    const path = vertices.map((v) => new google.maps.LatLng(v.lat, v.lng));
    const calculatedArea = google.maps.geometry.spherical.computeArea(path);
    setArea(calculatedArea);

    // Calculate perimeter
    let calculatedPerimeter = 0;
    for (let i = 0; i < vertices.length; i++) {
      const start = new google.maps.LatLng(vertices[i].lat, vertices[i].lng);
      const end = new google.maps.LatLng(
        vertices[(i + 1) % vertices.length].lat,
        vertices[(i + 1) % vertices.length].lng
      );
      calculatedPerimeter +=
        google.maps.geometry.spherical.computeDistanceBetween(start, end);
    }
    setPerimeter(calculatedPerimeter);
  };

  /**
   * Complete polygon drawing
   */
  const completeDrawing = () => {
    if (vertices.length < 3) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Insufficient Vertices',
        message: 'Please add at least 3 vertices to create a polygon'
      });
      return;
    }
    setIsDrawing(false);

    // Make markers non-draggable
    markers.forEach((marker) => marker.setDraggable(false));

    // Make polygon non-editable
    if (polygon) {
      polygon.setEditable(false);
    }
  };

  /**
   * Clear all vertices
   */
  const clearAll = () => {
    // Remove markers
    markers.forEach((marker) => marker.setMap(null));

    // Remove polygon
    if (polygon) {
      polygon.setMap(null);
    }

    setVertices([]);
    setMarkers([]);
    setPolygon(null);
    setArea(0);
    setPerimeter(0);
    setIsDrawing(true);
  };

  /**
   * Save polygon
   */
  const handleSave = () => {
    if (vertices.length < 3) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Insufficient Vertices',
        message: 'Please add at least 3 vertices to create a polygon'
      });
      return;
    }

    if (!name.trim()) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Name Required',
        message: 'Please enter a name for this polygon'
      });
      return;
    }

    const polygonData: PolygonData = {
      id: `poly_${Date.now()}`,
      name: name.trim(),
      vertices,
      area,
      perimeter,
      color,
      fillOpacity,
      strokeWeight: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: description.trim() || undefined
    };

    if (onSave) {
      onSave(polygonData);
    }

    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem("gis_polygons") || "[]");
    saved.push(polygonData);
    localStorage.setItem("gis_polygons", JSON.stringify(saved));

    // Track tool usage for analytics
    const duration = Math.round((Date.now() - startTime) / 1000);
    trackToolUsage({
      toolName: 'polygon-drawing',
      userId: user?.id || 'guest',
      userName: user?.name || 'Guest User',
      duration
    });

    setNotification({
      isOpen: true,
      type: 'success',
      title: 'Success!',
      message: 'Polygon saved successfully!'
    });
    clearAll();
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
   * Format perimeter for display
   */
  const formatPerimeter = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(2)} m`;
    } else {
      return `${(meters / 1000).toFixed(2)} km`;
    }
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
              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
            />
          </svg>
          Polygon Drawing
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
          {isDrawing
            ? "Click on the map to add vertices. Add at least 3 vertices to create a polygon."
            : "Drawing complete. You can now save this polygon."}
        </p>
      </div>

      {/* Geometry Display */}
      {vertices.length >= 3 && (
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
              Perimeter
            </div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {formatPerimeter(perimeter)}
            </div>
          </div>
        </div>
      )}

      {/* Vertices List */}
      {vertices.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vertices ({vertices.length})
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {vertices.map((vertex, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Point {index + 1}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {vertex.lat.toFixed(6)}, {vertex.lng.toFixed(6)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Polygon Color
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

      {/* Opacity Slider */}
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

      {/* Action Buttons - 3 Column Grid */}
      <div className="grid grid-cols-3 gap-2">
        {isDrawing ? (
          <>
            <button
              onClick={undoLastVertex}
              disabled={vertices.length === 0}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Undo
            </button>
            <button
              onClick={completeDrawing}
              disabled={vertices.length < 3}
              className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              Clear All
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsDrawing(true)}
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Edit
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
            >
              Clear All
            </button>
          </>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Polygon
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
                  placeholder="Enter polygon name"
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

export default PolygonDrawingTool;
