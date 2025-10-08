import React, { useState, useEffect } from "react";
import type { SectorRFData } from "../../types/gisTools.types";
import { isPointInsideIndia, showOutsideIndiaWarning } from "../../utils/indiaBoundaryCheck";
import { isPointInAssignedRegion } from "../../utils/regionMapping";
import NotificationDialog from "../common/NotificationDialog";
import { trackToolUsage } from "../../services/analyticsService";
import { useAppSelector } from "../../store";

interface SectorRFToolProps {
  map: google.maps.Map | null;
  onSave?: (sector: SectorRFData) => void;
  onClose?: () => void;
}

/**
 * Sector RF Tool - Telecom RF Coverage Visualization
 * Draws directional sector coverage with customizable azimuth and beamwidth
 */
const SectorRFTool: React.FC<SectorRFToolProps> = ({
  map,
  onSave,
  onClose
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [startTime] = useState<number>(Date.now());

  // Center point (tower location)
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [centerMarker, setCenterMarker] = useState<google.maps.Marker | null>(null);

  // Sector parameters
  const [radius, setRadius] = useState<number>(1000); // Coverage distance in meters
  const [azimuth, setAzimuth] = useState<number>(0); // Direction in degrees (0 = North)
  const [beamwidth, setBeamwidth] = useState<number>(60); // Angular width in degrees

  // Sector shape
  const [sectorPolygon, setSectorPolygon] = useState<google.maps.Polygon | null>(null);
  const [directionLine, setDirectionLine] = useState<google.maps.Polyline | null>(null);

  // Calculated values
  const [area, setArea] = useState<number>(0);
  const [arcLength, setArcLength] = useState<number>(0);

  // Form fields
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>("#FF5722");
  const [fillOpacity, setFillOpacity] = useState<number>(0.4);

  // RF Technical details (optional)
  const [towerName, setTowerName] = useState<string>("");
  const [sectorName, setSectorName] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [technology, setTechnology] = useState<'2G' | '3G' | '4G' | '5G' | 'Wi-Fi' | 'Other'>('4G');
  const [antennaHeight, setAntennaHeight] = useState<string>("");
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Planned' | 'Testing'>('Active');

  // UI state
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);
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

  // Update sector when parameters change
  useEffect(() => {
    if (!map || !center) return;

    // Remove old sector
    if (sectorPolygon) {
      sectorPolygon.setMap(null);
    }
    if (directionLine) {
      directionLine.setMap(null);
    }

    // Create sector polygon
    const sectorPath = createSectorPath(center, radius, azimuth, beamwidth);
    const newSector = new google.maps.Polygon({
      paths: sectorPath,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: fillOpacity,
      map: map,
      editable: false
    });

    // Create direction indicator line
    const directionEndPoint = calculatePointAtBearing(center, radius, azimuth);
    const newDirectionLine = new google.maps.Polyline({
      path: [center, directionEndPoint],
      strokeColor: color,
      strokeOpacity: 1,
      strokeWeight: 3,
      map: map,
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 4,
          strokeColor: color,
          fillColor: color,
          fillOpacity: 1
        },
        offset: '100%'
      }]
    });

    setSectorPolygon(newSector);
    setDirectionLine(newDirectionLine);

    // Calculate area and arc length
    calculateGeometry(radius, beamwidth);
  }, [center, radius, azimuth, beamwidth, map, color, fillOpacity]);

  /**
   * Place center marker (tower location)
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

    // Create center marker (tower icon)
    if (map) {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#FF5722",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2
        },
        label: {
          text: "📡",
          fontSize: "16px"
        },
        title: "Tower Location",
        draggable: true
      });

      // Update center on drag
      marker.addListener("dragend", async () => {
        const newPos = marker.getPosition();
        if (newPos) {
          const newLat = newPos.lat();
          const newLng = newPos.lng();

          // Check if new position is inside India
          if (!isPointInsideIndia(newLat, newLng)) {
            showOutsideIndiaWarning();
            marker.setPosition(center);
            return;
          }

          // Check region access
          const regionCheck = await isPointInAssignedRegion(newLat, newLng, user);
          if (!regionCheck.allowed) {
            setNotification({
              isOpen: true,
              type: "error",
              title: "Region Access Denied",
              message: regionCheck.message || "Cannot move tower to this region."
            });
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
   * Create sector path points
   */
  const createSectorPath = (
    centerPoint: { lat: number; lng: number },
    radiusMeters: number,
    azimuthDegrees: number,
    beamwidthDegrees: number
  ): google.maps.LatLngLiteral[] => {
    const points: google.maps.LatLngLiteral[] = [];

    // Start from center
    points.push(centerPoint);

    // Calculate start and end angles
    const startAngle = azimuthDegrees - beamwidthDegrees / 2;
    const endAngle = azimuthDegrees + beamwidthDegrees / 2;

    // Create arc points (30 segments for smooth curve)
    const segments = 30;
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments);
      const point = calculatePointAtBearing(centerPoint, radiusMeters, angle);
      points.push(point);
    }

    // Close the path back to center
    points.push(centerPoint);

    return points;
  };

  /**
   * Calculate point at distance and bearing from center
   */
  const calculatePointAtBearing = (
    center: { lat: number; lng: number },
    distanceMeters: number,
    bearingDegrees: number
  ): google.maps.LatLngLiteral => {
    const earthRadius = 6371000; // meters
    const bearing = (bearingDegrees * Math.PI) / 180; // Convert to radians
    const lat1 = (center.lat * Math.PI) / 180;
    const lng1 = (center.lng * Math.PI) / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distanceMeters / earthRadius) +
      Math.cos(lat1) * Math.sin(distanceMeters / earthRadius) * Math.cos(bearing)
    );

    const lng2 = lng1 + Math.atan2(
      Math.sin(bearing) * Math.sin(distanceMeters / earthRadius) * Math.cos(lat1),
      Math.cos(distanceMeters / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      lat: (lat2 * 180) / Math.PI,
      lng: (lng2 * 180) / Math.PI
    };
  };

  /**
   * Calculate area and arc length
   */
  const calculateGeometry = (radiusMeters: number, beamwidthDegrees: number) => {
    // Area of sector = (θ/360) × π × r²
    const beamwidthRadians = (beamwidthDegrees * Math.PI) / 180;
    const calculatedArea = (beamwidthRadians / (2 * Math.PI)) * Math.PI * radiusMeters * radiusMeters;
    setArea(calculatedArea);

    // Arc length = (θ/360) × 2 × π × r
    const calculatedArcLength = (beamwidthRadians / (2 * Math.PI)) * 2 * Math.PI * radiusMeters;
    setArcLength(calculatedArcLength);
  };

  /**
   * Clear sector
   */
  const clearSector = () => {
    if (sectorPolygon) {
      sectorPolygon.setMap(null);
      setSectorPolygon(null);
    }
    if (directionLine) {
      directionLine.setMap(null);
      setDirectionLine(null);
    }
    if (centerMarker) {
      centerMarker.setMap(null);
      setCenterMarker(null);
    }

    setCenter(null);
    setRadius(1000);
    setAzimuth(0);
    setBeamwidth(60);
    setArea(0);
    setArcLength(0);
    setIsPlacingCenter(true);
  };

  /**
   * Save sector
   */
  const handleSave = () => {
    if (!center) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Location Required',
        message: 'Please place the tower location on the map'
      });
      return;
    }

    if (!name.trim()) {
      setNotification({
        isOpen: true,
        type: 'warning',
        title: 'Name Required',
        message: 'Please enter a name for this sector'
      });
      return;
    }

    const sectorData: SectorRFData = {
      id: `sector_${Date.now()}`,
      name: name.trim(),
      center,
      radius,
      azimuth,
      beamwidth,
      area,
      arcLength,
      color,
      fillOpacity,
      strokeWeight: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user?.id,
      description: description.trim() || undefined,
      status,
      // Optional RF fields
      towerName: towerName.trim() || undefined,
      sectorName: sectorName.trim() || undefined,
      frequency: frequency ? parseFloat(frequency) : undefined,
      technology: technology || undefined,
      antennaHeight: antennaHeight ? parseFloat(antennaHeight) : undefined
    };

    if (onSave) {
      onSave(sectorData);
    }

    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem("gis_sector_rf") || "[]");
    saved.push(sectorData);
    localStorage.setItem("gis_sector_rf", JSON.stringify(saved));

    // Track tool usage for analytics
    const duration = Math.round((Date.now() - startTime) / 1000);
    trackToolUsage({
      toolName: 'sector-rf',
      userId: user?.id || 'guest',
      userName: user?.name || 'Guest User',
      duration
    });

    setNotification({
      isOpen: true,
      type: 'success',
      title: 'Success!',
      message: 'Sector saved successfully!'
    });

    clearSector();
    setShowSaveDialog(false);
    setName("");
    setDescription("");
    setTowerName("");
    setSectorName("");
    setFrequency("");
    setAntennaHeight("");
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
   * Preset configurations
   */
  const presetRadii = [
    { label: "500m", value: 500 },
    { label: "1km", value: 1000 },
    { label: "2km", value: 2000 },
    { label: "5km", value: 5000 },
    { label: "10km", value: 10000 }
  ];

  const presetBeamwidths = [
    { label: "30°", value: 30 },
    { label: "60°", value: 60 },
    { label: "90°", value: 90 },
    { label: "120°", value: 120 },
    { label: "180°", value: 180 }
  ];

  return (
    <div className="fixed top-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-md z-40 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">📡</span>
          Sector RF Coverage
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      {isPlacingCenter && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            📍 Click on the map to place the tower location
          </p>
        </div>
      )}

      {/* Main Parameters */}
      {center && (
        <div className="space-y-4">
          {/* Coverage Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Coverage Radius: {formatDistance(radius)}
            </label>
            <input
              type="range"
              min="100"
              max="20000"
              step="100"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {presetRadii.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setRadius(preset.value)}
                  className={`px-2 py-1 text-xs rounded ${
                    radius === preset.value
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Azimuth (Direction) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Azimuth (Direction): {azimuth}° {getCardinalDirection(azimuth)}
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={azimuth}
              onChange={(e) => setAzimuth(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>N (0°)</span>
              <span>E (90°)</span>
              <span>S (180°)</span>
              <span>W (270°)</span>
            </div>
          </div>

          {/* Beamwidth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Beamwidth: {beamwidth}°
            </label>
            <input
              type="range"
              min="10"
              max="360"
              step="5"
              value={beamwidth}
              onChange={(e) => setBeamwidth(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              {presetBeamwidths.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setBeamwidth(preset.value)}
                  className={`px-2 py-1 text-xs rounded ${
                    beamwidth === preset.value
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coverage Stats */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Coverage Area</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Area:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {formatArea(area)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Arc:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {formatDistance(arcLength)}
                </span>
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                placeholder="#FF5722"
              />
            </div>
          </div>

          {/* Opacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fill Opacity: {(fillOpacity * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={fillOpacity}
              onChange={(e) => setFillOpacity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium flex items-center justify-between"
          >
            <span>RF Technical Details (Optional)</span>
            <svg
              className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tower Name
                </label>
                <input
                  type="text"
                  value={towerName}
                  onChange={(e) => setTowerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="e.g., Tower-MH-001"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sector Name
                </label>
                <input
                  type="text"
                  value={sectorName}
                  onChange={(e) => setSectorName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="e.g., Alpha, Sector-A"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Frequency (MHz)
                  </label>
                  <input
                    type="number"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="e.g., 2100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Technology
                  </label>
                  <select
                    value={technology}
                    onChange={(e) => setTechnology(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="2G">2G</option>
                    <option value="3G">3G</option>
                    <option value="4G">4G</option>
                    <option value="5G">5G</option>
                    <option value="Wi-Fi">Wi-Fi</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Antenna Height (m)
                  </label>
                  <input
                    type="number"
                    value={antennaHeight}
                    onChange={(e) => setAntennaHeight(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="e.g., 30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Planned">Planned</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              Save Sector
            </button>
            <button
              onClick={clearSector}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Save Sector Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., North Sector Coverage"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
};

/**
 * Get cardinal direction from azimuth
 */
function getCardinalDirection(azimuth: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}

export default SectorRFTool;
