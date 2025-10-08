import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import type {
  DataHubEntry,
  DataHubStats,
  DataHubFilters,
  DataHubEntryType,
  ExportFormat
} from "../../types/gisTools.types";
import NotificationDialog from "../common/NotificationDialog";
import {
  fetchAllData,
  deleteEntries,
  checkBackendStatus
} from "../../services/dataHubService";

interface DataHubProps {
  map: google.maps.Map | null;
  onClose?: () => void;
}

/**
 * Data Hub - Phase 5
 * Centralized data repository for all GIS tools
 */
const DataHub: React.FC<DataHubProps> = ({ map, onClose }) => {
  const [entries, setEntries] = useState<DataHubEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<DataHubFilters>({});
  const [stats, setStats] = useState<DataHubStats>({
    totalEntries: 0,
    totalSize: 0,
    byType: {
      Distance: 0,
      Polygon: 0,
      Circle: 0,
      Elevation: 0,
      Infrastructure: 0,
      SectorRF: 0
    },
    bySource: {
      Manual: 0,
      Import: 0
    }
  });
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
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
  const [viewEntry, setViewEntry] = useState<DataHubEntry | null>(null);
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Load data from localStorage on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Update stats when entries change
  useEffect(() => {
    calculateStats();
  }, [entries]);

  /**
   * Load all data from localStorage/backend
   */
  const loadAllData = async () => {
    try {
      console.log("🔄 Loading data...");
      const allEntries = await fetchAllData();
      console.log("✅ Total entries loaded:", allEntries.length);
      console.log("📊 Entries:", allEntries);
      setEntries(allEntries);
    } catch (error) {
      console.error("Error loading data:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Load Error",
        message: "Failed to load data from storage"
      });
    }
  };

  /**
   * Calculate statistics
   */
  const calculateStats = () => {
    const newStats: DataHubStats = {
      totalEntries: entries.length,
      totalSize: 0,
      byType: {
        Distance: 0,
        Polygon: 0,
        Circle: 0,
        Elevation: 0,
        Infrastructure: 0,
        SectorRF: 0
      },
      bySource: {
        Manual: 0,
        Import: 0
      }
    };

    entries.forEach((entry) => {
      newStats.totalSize += entry.fileSize;
      newStats.byType[entry.type]++;
      newStats.bySource[entry.source]++;
    });

    setStats(newStats);
  };

  /**
   * Apply filters
   */
  const applyFilters = (data: DataHubEntry[]): DataHubEntry[] => {
    return data.filter((entry) => {
      if (filters.type && entry.type !== filters.type) return false;
      if (filters.source && entry.source !== filters.source) return false;
      if (
        filters.searchTerm &&
        !entry.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
        return false;
      if (filters.dateFrom && entry.savedAt < filters.dateFrom) return false;
      if (filters.dateTo && entry.savedAt > filters.dateTo) return false;
      return true;
    });
  };

  /**
   * Toggle selection
   */
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  /**
   * Select/Deselect all
   */
  const toggleSelectAll = () => {
    const visibleEntries = applyFilters(entries);
    if (selectedIds.size === visibleEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleEntries.map((e) => e.id)));
    }
  };

  /**
   * Delete selected entries
   */
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "No Selection",
        message: "Please select items to delete"
      });
      return;
    }

    try {
      const idsToDelete = Array.from(selectedIds);
      await deleteEntries(idsToDelete);
      await loadAllData();
      setSelectedIds(new Set());
      setNotification({
        isOpen: true,
        type: "success",
        title: "Deleted",
        message: `${idsToDelete.length} item(s) deleted successfully`
      });
    } catch (error) {
      console.error("Delete error:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete selected items"
      });
    }
  };

  /**
   * Show delete confirmation
   */
  const confirmDeleteEntry = (id: string) => {
    setDeleteConfirmId(id);
    setShowDeleteConfirm(true);
  };

  /**
   * Handle individual delete
   */
  const handleDeleteEntry = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteEntries([deleteConfirmId]);
      await loadAllData();
      setShowDeleteConfirm(false);
      setDeleteConfirmId(null);
      setNotification({
        isOpen: true,
        type: "success",
        title: "Deleted",
        message: "Entry deleted successfully"
      });
    } catch (error) {
      console.error("Delete error:", error);
      setShowDeleteConfirm(false);
      setDeleteConfirmId(null);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete entry"
      });
    }
  };

  /**
   * View entry on map
   */
  const viewOnMap = (entry: DataHubEntry) => {
    if (!map) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Map Not Available",
        message: "Map instance is not available"
      });
      return;
    }

    try {
      switch (entry.type) {
        case "Infrastructure": {
          const coordinates = (entry.data as any).coordinates;
          if (coordinates) {
            // Create a marker for infrastructure
            const marker = new google.maps.Marker({
              position: coordinates,
              map: map,
              title: entry.name,
              animation: google.maps.Animation.DROP,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#EF4444",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2
              }
            });

            // Create detailed info window matching Layer Manager
            const infraData = entry.data as any;
            const infoContent = `
              <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">🏢 ${
                    entry.name
                  }</h3>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div style="background: #FEE2E2; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #991B1B; text-transform: uppercase;">Type</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${
                      infraData.type || "N/A"
                    }</p>
                  </div>
                  <div style="background: #FEE2E2; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #991B1B; text-transform: uppercase;">Unique ID</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${
                      infraData.uniqueId || "N/A"
                    }</p>
                  </div>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #EF4444;">
                  <p style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937;"><strong>🆔 Network ID:</strong> ${
                    infraData.networkId || "N/A"
                  }</p>
                  <p style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937;"><strong>📍 Coordinates:</strong> <span style="font-family: monospace; background: #E5E7EB; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${coordinates.lat.toFixed(
                    6
                  )}, ${coordinates.lng.toFixed(6)}</span></p>
                  <p style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937;"><strong>🏠 Address:</strong> ${
                    infraData.address || "N/A"
                  }</p>
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>👤 Contact:</strong> ${
                    infraData.contactPerson || "N/A"
                  }</p>
                </div>
                ${
                  infraData.description
                    ? `
                <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${infraData.description}</p>
                </div>
                `
                    : ""
                }
                <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(
                    entry.createdAt
                  ).toLocaleString()}</p>
                </div>
              </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent
            });

            infoWindow.open(map, marker);
            marker.addListener("click", () => {
              infoWindow.open(map, marker);
            });

            // Pan to location and zoom
            map.panTo(coordinates);
            map.setZoom(15);

            setNotification({
              isOpen: true,
              type: "success",
              title: "Viewing on Map",
              message: `${entry.name} displayed at ${coordinates.lat.toFixed(
                6
              )}, ${coordinates.lng.toFixed(6)}`
            });
          }
          break;
        }

        case "Circle": {
          const center = (entry.data as any).center;
          const radius = (entry.data as any).radius;
          if (center && radius) {
            // Create a circle overlay
            const circle = new google.maps.Circle({
              map: map,
              center: center,
              radius: radius,
              fillColor: "#8B5CF6",
              fillOpacity: 0.35,
              strokeColor: "#8B5CF6",
              strokeOpacity: 0.8,
              strokeWeight: 2
            });

            // Create center marker with info
            const marker = new google.maps.Marker({
              position: center,
              map: map,
              title: entry.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: "#8B5CF6",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2
              }
            });

            const circleData = entry.data as any;
            const area = Math.PI * radius * radius;
            const circumference = 2 * Math.PI * radius;
            const infoContent = `
              <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">⭕ ${
                    entry.name
                  }</h3>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div style="background: #EDE9FE; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #5B21B6; text-transform: uppercase;">Radius (km)</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${(
                      radius / 1000
                    ).toFixed(2)}</p>
                  </div>
                  <div style="background: #EDE9FE; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #5B21B6; text-transform: uppercase;">Radius (m)</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${radius.toFixed(
                      0
                    )}</p>
                  </div>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #8B5CF6;">
                  <p style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937;"><strong>📏 Area:</strong> ${(
                    area / 1000000
                  ).toFixed(2)} km²</p>
                  <p style="margin: 0 0 6px 0; font-size: 13px; color: #1F2937;"><strong>⭕ Circumference:</strong> ${(
                    circumference / 1000
                  ).toFixed(2)} km</p>
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📍 Center:</strong> <span style="font-family: monospace; background: #E5E7EB; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${center.lat.toFixed(
                    6
                  )}, ${center.lng.toFixed(6)}</span></p>
                </div>
                ${
                  circleData.description
                    ? `
                <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${circleData.description}</p>
                </div>
                `
                    : ""
                }
                <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(
                    entry.createdAt
                  ).toLocaleString()}</p>
                </div>
              </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent
            });

            infoWindow.open(map, marker);
            marker.addListener("click", () => {
              infoWindow.open(map, marker);
            });

            // Pan to center and fit bounds
            const bounds = new google.maps.LatLngBounds();
            const earthRadius = 6371000; // meters
            const latOffset = (radius / earthRadius) * (180 / Math.PI);
            const lngOffset =
              ((radius / earthRadius) * (180 / Math.PI)) /
              Math.cos((center.lat * Math.PI) / 180);
            bounds.extend({
              lat: center.lat + latOffset,
              lng: center.lng + lngOffset
            });
            bounds.extend({
              lat: center.lat - latOffset,
              lng: center.lng - lngOffset
            });
            map.fitBounds(bounds);

            setNotification({
              isOpen: true,
              type: "success",
              title: "Viewing on Map",
              message: `${entry.name} - Circle with ${(radius / 1000).toFixed(
                2
              )} km radius`
            });
          }
          break;
        }

        case "Distance": {
          const points = (entry.data as any).points;
          if (points && points.length > 0) {
            // Create a polyline
            const polyline = new google.maps.Polyline({
              map: map,
              path: points,
              strokeColor: "#3B82F6",
              strokeOpacity: 1.0,
              strokeWeight: 3
            });

            // Add point markers at each point
            points.forEach(
              (point: google.maps.LatLngLiteral, index: number) => {
                const pointMarker = new google.maps.Marker({
                  position: point,
                  map: map,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#3B82F6",
                    fillOpacity: 0.8,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 1.5
                  },
                  label: {
                    text: `${index + 1}`,
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "bold"
                  }
                });
              }
            );

            // Calculate total distance
            const distanceData = entry.data as any;
            const totalDistance = distanceData.totalDistance || 0;

            // Create info window at midpoint
            const midIndex = Math.floor(points.length / 2);
            const midPoint = points[midIndex];

            const infoContent = `
              <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">📏 ${
                    entry.name
                  }</h3>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div style="background: #DBEAFE; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #1E40AF; text-transform: uppercase;">Total Distance</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${totalDistance.toFixed(
                      2
                    )} km</p>
                  </div>
                  <div style="background: #DBEAFE; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #1E40AF; text-transform: uppercase;">Points</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${
                      points.length
                    }</p>
                  </div>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #3B82F6;">
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>🔗 Segments:</strong> ${
                    points.length - 1
                  }</p>
                </div>
                ${
                  distanceData.description
                    ? `
                <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${distanceData.description}</p>
                </div>
                `
                    : ""
                }
                <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(
                    entry.createdAt
                  ).toLocaleString()}</p>
                </div>
              </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent,
              position: midPoint
            });

            infoWindow.open(map);

            // Fit bounds to show all points
            const bounds = new google.maps.LatLngBounds();
            points.forEach((point: google.maps.LatLngLiteral) =>
              bounds.extend(point)
            );
            map.fitBounds(bounds);

            setNotification({
              isOpen: true,
              type: "success",
              title: "Viewing on Map",
              message: `${entry.name} - ${totalDistance.toFixed(2)} km with ${
                points.length
              } points`
            });
          }
          break;
        }

        case "Polygon": {
          // Fix: Use 'vertices' instead of 'path'
          const vertices =
            (entry.data as any).vertices || (entry.data as any).path;
          if (vertices && vertices.length > 0) {
            const polygonData = entry.data as any;

            // Create a polygon
            const polygon = new google.maps.Polygon({
              map: map,
              paths: vertices,
              fillColor: polygonData.color || "#10B981",
              fillOpacity: polygonData.fillOpacity || 0.35,
              strokeColor: polygonData.color || "#10B981",
              strokeOpacity: 0.8,
              strokeWeight: polygonData.strokeWeight || 2
            });

            // Add vertex markers
            vertices.forEach(
              (vertex: google.maps.LatLngLiteral, index: number) => {
                const vertexMarker = new google.maps.Marker({
                  position: vertex,
                  map: map,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: polygonData.color || "#10B981",
                    fillOpacity: 0.9,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 1.5
                  },
                  label: {
                    text: `${index + 1}`,
                    color: "#FFFFFF",
                    fontSize: "9px",
                    fontWeight: "bold"
                  }
                });
              }
            );

            // Calculate center for info window
            let latSum = 0;
            let lngSum = 0;
            vertices.forEach((point: google.maps.LatLngLiteral) => {
              latSum += point.lat;
              lngSum += point.lng;
            });
            const center = {
              lat: latSum / vertices.length,
              lng: lngSum / vertices.length
            };

            const area = polygonData.area || 0;
            const perimeter = polygonData.perimeter || 0;
            const infoContent = `
              <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">⬟ ${
                    entry.name
                  }</h3>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                  <div style="background: #D1FAE5; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #065F46; text-transform: uppercase;">Area</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${
                      area < 10000
                        ? `${area.toFixed(2)} m²`
                        : area < 1000000
                        ? `${(area / 10000).toFixed(2)} ha`
                        : `${(area / 1000000).toFixed(2)} km²`
                    }</p>
                  </div>
                  <div style="background: #D1FAE5; padding: 8px; border-radius: 6px;">
                    <p style="margin: 0; font-size: 10px; font-weight: 600; color: #065F46; text-transform: uppercase;">Vertices</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #1F2937;">${
                      vertices.length
                    }</p>
                  </div>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #10B981;">
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📏 Perimeter:</strong> ${(
                    perimeter / 1000
                  ).toFixed(2)} km</p>
                </div>
                ${
                  polygonData.description
                    ? `
                <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${polygonData.description}</p>
                </div>
                `
                    : ""
                }
                <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(
                    entry.createdAt
                  ).toLocaleString()}</p>
                </div>
              </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent,
              position: center
            });

            infoWindow.open(map);

            // Fit bounds to show polygon
            const bounds = new google.maps.LatLngBounds();
            vertices.forEach((point: google.maps.LatLngLiteral) =>
              bounds.extend(point)
            );
            map.fitBounds(bounds);

            setNotification({
              isOpen: true,
              type: "success",
              title: "Viewing on Map",
              message: `${entry.name} - Polygon with ${vertices.length} vertices`
            });
          }
          break;
        }

        case "Elevation": {
          const points = (entry.data as any).points;
          if (points && points.length > 0) {
            // Create a polyline for elevation profile
            const polyline = new google.maps.Polyline({
              map: map,
              path: points,
              strokeColor: "#F59E0B",
              strokeOpacity: 1.0,
              strokeWeight: 3
            });

            // Add point markers at each point
            points.forEach(
              (point: google.maps.LatLngLiteral, index: number) => {
                const pointMarker = new google.maps.Marker({
                  position: point,
                  map: map,
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#F59E0B",
                    fillOpacity: 0.8,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 1.5
                  },
                  label: {
                    text: `${index + 1}`,
                    color: "#FFFFFF",
                    fontSize: "10px",
                    fontWeight: "bold"
                  }
                });
              }
            );

            const elevationData = entry.data as any;
            const midIndex = Math.floor(points.length / 2);
            const midPoint = points[midIndex];

            // Create elevation chart with real API data
            const chartWidth = 300;
            const chartHeight = 100;
            const realElevationData = elevationData.elevationData || [];

            let chartPoints = "";
            let minElev = Infinity;
            let maxElev = -Infinity;

            if (realElevationData.length > 0) {
              // Find min/max elevations for scaling
              realElevationData.forEach((point: any) => {
                const elev = point.elevation || 0;
                minElev = Math.min(minElev, elev);
                maxElev = Math.max(maxElev, elev);
              });

              const elevRange = maxElev - minElev || 1;

              // Map elevation data to SVG coordinates
              chartPoints = realElevationData
                .map((point: any, i: number) => {
                  const x = (i / (realElevationData.length - 1)) * chartWidth;
                  const normalizedElev =
                    (point.elevation - minElev) / elevRange;
                  const y =
                    chartHeight - (normalizedElev * (chartHeight - 20) + 10);
                  return `${x},${y}`;
                })
                .join(" ");
            } else {
              // Fallback to mock data if no real elevation data
              chartPoints = points
                .map((p: any, i: number) => {
                  const x = (i / (points.length - 1)) * chartWidth;
                  const y = chartHeight - (Math.sin(i * 0.5) * 30 + 50);
                  return `${x},${y}`;
                })
                .join(" ");
            }

            const infoContent = `
              <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: white; text-align: center;">📈 ${
                    entry.name
                  }</h3>
                </div>
                <div style="background: #FFFBEB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #92400E; text-align: center;">📊 Elevation Graph</p>
                  <svg width="${chartWidth}" height="${chartHeight}" style="background: white; border-radius: 4px; border: 1px solid #FDE68A;">
                    <polyline points="${chartPoints}" fill="none" stroke="#F59E0B" stroke-width="2"/>
                    <polyline points="0,${chartHeight} ${chartPoints} ${chartWidth},${chartHeight}" fill="#FEF3C7" fill-opacity="0.3" stroke="none"/>
                    <line x1="0" y1="${chartHeight}" x2="${chartWidth}" y2="${chartHeight}" stroke="#D1D5DB" stroke-width="1"/>
                  </svg>
                  <p style="margin: 4px 0 0 0; font-size: 10px; color: #9CA3AF; text-align: center;">Distance →</p>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                    <span style="color: #6B7280; font-weight: 500;">🔢 Points:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      points.length
                    }</span>

                    <span style="color: #6B7280; font-weight: 500;">📏 Distance:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      elevationData.totalDistance
                        ? (elevationData.totalDistance / 1000).toFixed(2) +
                          " km"
                        : "N/A"
                    }</span>

                    ${
                      realElevationData.length > 0
                        ? `
                    <span style="color: #6B7280; font-weight: 500;">⬆️ High Point:</span>
                    <span style="color: #1F2937; font-weight: 600;">${maxElev.toFixed(
                      1
                    )} m</span>

                    <span style="color: #6B7280; font-weight: 500;">⬇️ Low Point:</span>
                    <span style="color: #1F2937; font-weight: 600;">${minElev.toFixed(
                      1
                    )} m</span>

                    <span style="color: #6B7280; font-weight: 500;">📈 Elevation Gain:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      elevationData.elevationGain
                        ? elevationData.elevationGain.toFixed(1) + " m"
                        : "N/A"
                    }</span>
                    `
                        : ""
                    }
                  </div>
                </div>
                ${
                  elevationData.description
                    ? `
                <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
                  <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${elevationData.description}</p>
                </div>
                `
                    : ""
                }
                <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(
                    entry.createdAt
                  ).toLocaleString()}</p>
                </div>
              </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent,
              position: midPoint
            });

            infoWindow.open(map);

            // Fit bounds to show all points
            const bounds = new google.maps.LatLngBounds();
            points.forEach((point: google.maps.LatLngLiteral) =>
              bounds.extend(point)
            );
            map.fitBounds(bounds);

            setNotification({
              isOpen: true,
              type: "success",
              title: "Viewing on Map",
              message: `${entry.name} - Elevation profile with ${points.length} points`
            });
          }
          break;
        }

        default:
          setNotification({
            isOpen: true,
            type: "warning",
            title: "No Location Data",
            message: "Location data not available for this entry"
          });
          return;
      }

      // Close DataHub after a short delay to show the map
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error("Error viewing on map:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to display on map"
      });
    }
  };

  /**
   * Handle import file
   */
  const handleImport = async () => {
    if (!importFile) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "No File",
        message: "Please select a file to import"
      });
      return;
    }

    try {
      const fileExtension = importFile.name.split(".").pop()?.toLowerCase();
      const fileContent = await importFile.text();

      if (fileExtension === "json") {
        const data = JSON.parse(fileContent);
        // TODO: Validate and save JSON data
        setNotification({
          isOpen: true,
          type: "info",
          title: "Coming Soon",
          message: "JSON import is under development"
        });
      } else if (fileExtension === "csv") {
        // TODO: Parse and save CSV data
        setNotification({
          isOpen: true,
          type: "info",
          title: "Coming Soon",
          message: "CSV import is under development"
        });
      } else if (fileExtension === "kml") {
        // TODO: Parse and save KML data
        setNotification({
          isOpen: true,
          type: "info",
          title: "Coming Soon",
          message: "KML import is under development"
        });
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Invalid Format",
          message: "Please upload a JSON, CSV, or KML file"
        });
      }

      setShowImportDialog(false);
      setImportFile(null);
    } catch (error) {
      console.error("Import error:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Import Failed",
        message: "Failed to import file"
      });
    }
  };

  /**
   * Download template
   */
  const downloadTemplate = (format: "JSON" | "CSV" | "XLSX") => {
    if (format === "XLSX") {
      // Create workbook with sample data for all types
      const workbook = XLSX.utils.book_new();

      // Distance template
      const distanceData = [
        {
          Name: "Example Distance Measurement",
          "Total Distance (km)": "10.5",
          "Created At": new Date().toLocaleString(),
          "Saved At": new Date().toLocaleString(),
          Source: "Import"
        }
      ];
      const distanceSheet = XLSX.utils.json_to_sheet(distanceData);
      XLSX.utils.book_append_sheet(workbook, distanceSheet, "Distance");

      // Polygon template
      const polygonData = [
        {
          Name: "Example Polygon",
          "Area (sq km)": "5.25",
          "Perimeter (km)": "12.8",
          "Created At": new Date().toLocaleString(),
          "Saved At": new Date().toLocaleString(),
          Source: "Import"
        }
      ];
      const polygonSheet = XLSX.utils.json_to_sheet(polygonData);
      XLSX.utils.book_append_sheet(workbook, polygonSheet, "Polygon");

      // Circle template
      const circleData = [
        {
          Name: "Example Circle",
          "Radius (m)": "500",
          "Area (sq m)": "785398.16",
          "Center Lat": "28.6139",
          "Center Lng": "77.2090",
          "Created At": new Date().toLocaleString(),
          "Saved At": new Date().toLocaleString(),
          Source: "Import"
        }
      ];
      const circleSheet = XLSX.utils.json_to_sheet(circleData);
      XLSX.utils.book_append_sheet(workbook, circleSheet, "Circle");

      // Elevation template
      const elevationData = [
        {
          Name: "Example Elevation Profile",
          "Max Elevation (m)": "2500.5",
          "Min Elevation (m)": "1200.3",
          "Elevation Gain (m)": "1300.2",
          "Created At": new Date().toLocaleString(),
          "Saved At": new Date().toLocaleString(),
          Source: "Import"
        }
      ];
      const elevationSheet = XLSX.utils.json_to_sheet(elevationData);
      XLSX.utils.book_append_sheet(workbook, elevationSheet, "Elevation");

      // Infrastructure template
      const infrastructureData = [
        {
          Name: "Example POP",
          Type: "POP",
          "Unique ID": "POP.ABC123",
          "Network ID": "BHARAT-POP.ABC123",
          Latitude: "28.6139",
          Longitude: "77.2090",
          "Contact Name": "John Doe",
          "Contact No": "+91-9876543210",
          Status: "Active",
          "Structure Type": "Tower",
          "Is Rented": "No",
          "Created At": new Date().toLocaleString(),
          "Saved At": new Date().toLocaleString(),
          Source: "Import"
        }
      ];
      const infrastructureSheet = XLSX.utils.json_to_sheet(infrastructureData);
      XLSX.utils.book_append_sheet(
        workbook,
        infrastructureSheet,
        "Infrastructure"
      );

      // Download
      XLSX.writeFile(workbook, "gis-import-template.xlsx");
      return;
    }

    let content = "";
    let filename = "";
    let mimeType = "";

    if (format === "JSON") {
      content = JSON.stringify(
        [
          {
            id: "example-id",
            type: "Distance",
            name: "Example Measurement",
            createdAt: new Date().toISOString(),
            savedAt: new Date().toISOString(),
            fileSize: 0,
            source: "Import",
            data: {}
          }
        ],
        null,
        2
      );
      filename = "import-template.json";
      mimeType = "application/json";
    } else if (format === "CSV") {
      content =
        "id,type,name,createdAt,savedAt,source\nexample-id,Distance,Example Measurement," +
        new Date().toISOString() +
        "," +
        new Date().toISOString() +
        ",Import";
      filename = "import-template.csv";
      mimeType = "text/csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Export data
   */
  const handleExport = (format: ExportFormat) => {
    const toExport = entries.filter((e) =>
      selectedIds.size > 0 ? selectedIds.has(e.id) : true
    );

    if (toExport.length === 0) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "No Data",
        message: "No data to export"
      });
      return;
    }

    switch (format) {
      case "JSON":
        exportJSON(toExport);
        break;
      case "CSV":
        exportCSV(toExport);
        break;
      case "XLSX":
        exportXLSX(toExport);
        break;
      case "KML":
      case "KMZ":
        exportKML(toExport, format === "KMZ");
        break;
    }

    setShowExportMenu(false);
  };

  /**
   * Export to JSON
   */
  const exportJSON = (data: DataHubEntry[]) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      entries: data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    });
    downloadFile(blob, `gis-data-export-${Date.now()}.json`);

    setNotification({
      isOpen: true,
      type: "success",
      title: "Export Successful",
      message: `Exported ${data.length} item(s) to JSON`
    });
  };

  /**
   * Export to CSV
   */
  const exportCSV = (data: DataHubEntry[]) => {
    const headers = [
      "Type",
      "Name",
      "Created At",
      "Saved At",
      "Source",
      "Size (KB)"
    ];
    const rows = data.map((entry) => [
      entry.type,
      entry.name,
      entry.createdAt.toLocaleString(),
      entry.savedAt.toLocaleString(),
      entry.source,
      (entry.fileSize / 1024).toFixed(2)
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    downloadFile(blob, `gis-data-export-${Date.now()}.csv`);

    setNotification({
      isOpen: true,
      type: "success",
      title: "Export Successful",
      message: `Exported ${data.length} item(s) to CSV`
    });
  };

  /**
   * Export to XLSX
   */
  const exportXLSX = (data: DataHubEntry[]) => {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Group data by type
    const groupedData: { [key: string]: DataHubEntry[] } = {};
    data.forEach((entry) => {
      if (!groupedData[entry.type]) {
        groupedData[entry.type] = [];
      }
      groupedData[entry.type].push(entry);
    });

    // Create a sheet for each type
    Object.keys(groupedData).forEach((type) => {
      const entries = groupedData[type];
      let worksheetData: any[] = [];

      switch (type) {
        case "Distance":
          worksheetData = entries.map((entry) => ({
            Name: entry.name,
            "Total Distance (km)":
              (entry.data as any).totalDistance?.toFixed(2) || "N/A",
            "Created At": entry.createdAt.toLocaleString(),
            "Saved At": entry.savedAt.toLocaleString(),
            Source: entry.source
          }));
          break;

        case "Polygon":
          worksheetData = entries.map((entry) => ({
            Name: entry.name,
            "Area (sq km)": (entry.data as any).area?.toFixed(2) || "N/A",
            "Perimeter (km)":
              (entry.data as any).perimeter?.toFixed(2) || "N/A",
            "Created At": entry.createdAt.toLocaleString(),
            "Saved At": entry.savedAt.toLocaleString(),
            Source: entry.source
          }));
          break;

        case "Circle":
          worksheetData = entries.map((entry) => ({
            Name: entry.name,
            "Radius (m)": (entry.data as any).radius || "N/A",
            "Area (sq m)": (entry.data as any).area?.toFixed(2) || "N/A",
            "Center Lat": (entry.data as any).center?.lat?.toFixed(6) || "N/A",
            "Center Lng": (entry.data as any).center?.lng?.toFixed(6) || "N/A",
            "Created At": entry.createdAt.toLocaleString(),
            "Saved At": entry.savedAt.toLocaleString(),
            Source: entry.source
          }));
          break;

        case "Elevation":
          worksheetData = entries.map((entry) => ({
            Name: entry.name,
            "Max Elevation (m)":
              (entry.data as any).maxElevation?.toFixed(2) || "N/A",
            "Min Elevation (m)":
              (entry.data as any).minElevation?.toFixed(2) || "N/A",
            "Elevation Gain (m)":
              (entry.data as any).elevationGain?.toFixed(2) || "N/A",
            "Created At": entry.createdAt.toLocaleString(),
            "Saved At": entry.savedAt.toLocaleString(),
            Source: entry.source
          }));
          break;

        case "Infrastructure":
          worksheetData = entries.map((entry) => {
            const infra = entry.data as any;
            return {
              Name: entry.name,
              Type: infra.type || "N/A",
              "Unique ID": infra.uniqueId || "N/A",
              "Network ID": infra.networkId || "N/A",
              Latitude: infra.coordinates?.lat?.toFixed(6) || "N/A",
              Longitude: infra.coordinates?.lng?.toFixed(6) || "N/A",
              "Contact Name": infra.contactName || "N/A",
              "Contact No": infra.contactNo || "N/A",
              Status: infra.status || "N/A",
              "Structure Type": infra.structureType || "N/A",
              "Is Rented": infra.isRented ? "Yes" : "No",
              "Created At": entry.createdAt.toLocaleString(),
              "Saved At": entry.savedAt.toLocaleString(),
              Source: entry.source
            };
          });
          break;

        default:
          worksheetData = entries.map((entry) => ({
            Name: entry.name,
            Type: entry.type,
            "Created At": entry.createdAt.toLocaleString(),
            "Saved At": entry.savedAt.toLocaleString(),
            Source: entry.source
          }));
      }

      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, type);
    });

    // Generate buffer and download
    XLSX.writeFile(workbook, `gis-data-export-${Date.now()}.xlsx`);

    setNotification({
      isOpen: true,
      type: "success",
      title: "Export Successful",
      message: `Exported ${data.length} item(s) to XLSX`
    });
  };

  /**
   * Export to KML
   */
  const exportKML = (data: DataHubEntry[], compress: boolean) => {
    // For now, only export Infrastructure items with coordinates
    const geoData = data.filter((e) => e.type === "Infrastructure");

    if (geoData.length === 0) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "No Geographic Data",
        message: "Only Infrastructure items can be exported to KML"
      });
      return;
    }

    // Build KML content
    let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GIS Data Export</name>
`;

    geoData.forEach((entry) => {
      const infra = entry.data as any;
      kml += `    <Placemark>
      <name>${entry.name}</name>
      <description>${infra.contactName || ""}</description>
      <Point>
        <coordinates>${infra.coordinates.lng},${
        infra.coordinates.lat
      },0</coordinates>
      </Point>
    </Placemark>
`;
    });

    kml += `  </Document>
</kml>`;

    const blob = new Blob([kml], {
      type: "application/vnd.google-earth.kml+xml"
    });
    downloadFile(blob, `gis-data-export-${Date.now()}.kml`);

    setNotification({
      isOpen: true,
      type: "success",
      title: "Export Successful",
      message: `Exported ${geoData.length} item(s) to KML`
    });
  };

  /**
   * Download file helper
   */
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Get localStorage key for data type
   */
  const getStorageKey = (type: DataHubEntryType): string => {
    switch (type) {
      case "Distance":
        return "distanceMeasurements";
      case "Polygon":
        return "polygons";
      case "Circle":
        return "circles";
      case "Elevation":
        return "elevationProfiles";
      case "Infrastructure":
        return "infrastructures";
      case "SectorRF":
        return "sectorRFs";
      default:
        return "";
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * Get type icon
   */
  const getTypeIcon = (type: DataHubEntryType) => {
    const icons = {
      Distance: (
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
      ),
      Polygon: (
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
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
      Circle: (
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
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      Elevation: (
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
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
      ),
      Infrastructure: (
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      SectorRF: (
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
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      )
    };
    return icons[type];
  };

  /**
   * Get type color
   */
  const getTypeColor = (type: DataHubEntryType) => {
    const colors = {
      Distance:
        "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
      Polygon:
        "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
      Circle:
        "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20",
      Elevation:
        "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
      Infrastructure:
        "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
      SectorRF:
        "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
    };
    return colors[type];
  };

  const filteredEntries = applyFilters(entries);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className="fixed top-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-3xl w-full z-50 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-gray-700 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Hub
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Centralized GIS Data Repository
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAllData}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md"
              title="Refresh Data"
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
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
              Total Entries
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalEntries}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-xs text-green-600 dark:text-green-400 mb-1">
              Total Size
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatFileSize(stats.totalSize)}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">
              Manual
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.bySource.Manual}
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">
              Imported
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.bySource.Import}
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center justify-between mb-4 space-x-2">
          <div className="flex items-center space-x-2 flex-1">
            <select
              value={filters.type || ""}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value as any })
              }
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="Distance">Distance</option>
              <option value="Polygon">Polygon</option>
              <option value="Circle">Circle</option>
              <option value="Elevation">Elevation</option>
              <option value="Infrastructure">Infrastructure</option>
            </select>

            <select
              value={filters.source || ""}
              onChange={(e) =>
                setFilters({ ...filters, source: e.target.value as any })
              }
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Sources</option>
              <option value="Manual">Manual</option>
              <option value="Import">Import</option>
            </select>

            <input
              type="text"
              placeholder="Search..."
              value={filters.searchTerm || ""}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {viewMode === "list" ? "Grid" : "List"}
            </button>

            <button
              onClick={() => setShowImportDialog(true)}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 flex items-center space-x-1"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span>Import</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-1"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Export</span>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50">
                  {(
                    ["JSON", "CSV", "KML", "KMZ", "XLSX"] as ExportFormat[]
                  ).map((format) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {format}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-400">
              {selectedIds.size} item(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* Data Table/Grid */}
        {viewMode === "list" ? (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === filteredEntries.length &&
                        filteredEntries.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Source
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Size
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Saved At
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(entry.id)}
                        onChange={() => toggleSelection(entry.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div
                        className={`flex items-center space-x-2 px-2 py-1 rounded-md ${getTypeColor(
                          entry.type
                        )}`}
                      >
                        {getTypeIcon(entry.type)}
                        <span className="text-xs font-medium">
                          {entry.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                      {entry.name}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          entry.source === "Manual"
                            ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                            : "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                        }`}
                      >
                        {entry.source}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(entry.fileSize)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {entry.savedAt.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setViewEntry(entry)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded"
                          title="View Details"
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
                        <button
                          onClick={() => viewOnMap(entry)}
                          className="p-1 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded"
                          title="View on Map"
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
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDeleteEntry(entry.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded"
                          title="Delete"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div
                    className={`flex items-center space-x-2 px-2 py-1 rounded-md ${getTypeColor(
                      entry.type
                    )}`}
                  >
                    {getTypeIcon(entry.type)}
                    <span className="text-xs font-medium">{entry.type}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(entry.id)}
                    onChange={() => toggleSelection(entry.id)}
                    className="rounded border-gray-300"
                  />
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {entry.name}
                </h4>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(entry.fileSize)}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      entry.source === "Manual"
                        ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                        : "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                    }`}
                  >
                    {entry.source}
                  </span>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-2">
                  {entry.savedAt.toLocaleDateString()}
                </div>
                <div className="flex items-center justify-end space-x-1 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setViewEntry(entry)}
                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded flex items-center space-x-1"
                    title="View Details"
                  >
                    <svg
                      className="w-3 h-3"
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
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => viewOnMap(entry)}
                    className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded flex items-center space-x-1"
                    title="View on Map"
                  >
                    <svg
                      className="w-3 h-3"
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
                    <span>Map</span>
                  </button>
                  <button
                    onClick={() => confirmDeleteEntry(entry.id)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded flex items-center space-x-1"
                    title="Delete"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-lg font-medium mb-1">No data found</p>
            <p className="text-sm">
              Start creating measurements, polygons, or infrastructure to see
              them here
            </p>
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

      {/* View Entry Dialog */}
      {viewEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Entry Details
                </h3>
                <button
                  onClick={() => setViewEntry(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
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

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Type
                    </label>
                    <div
                      className={`mt-1 flex items-center space-x-2 px-3 py-2 rounded-md ${getTypeColor(
                        viewEntry.type
                      )}`}
                    >
                      {getTypeIcon(viewEntry.type)}
                      <span className="font-medium">{viewEntry.type}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Source
                    </label>
                    <div
                      className={`mt-1 px-3 py-2 rounded text-center ${
                        viewEntry.source === "Manual"
                          ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                          : "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                      }`}
                    >
                      {viewEntry.source}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {viewEntry.name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    ID
                  </label>
                  <p className="mt-1 text-gray-700 dark:text-gray-300 font-mono text-sm">
                    {viewEntry.id}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created At
                    </label>
                    <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">
                      {viewEntry.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Saved At
                    </label>
                    <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm">
                      {viewEntry.savedAt.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    File Size
                  </label>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">
                    {formatFileSize(viewEntry.fileSize)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Data
                  </label>
                  <pre className="mt-1 bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(viewEntry.data, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewEntry(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Import Data
                </h3>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Upload File
                  </label>
                  <input
                    type="file"
                    accept=".json,.csv,.kml"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Supported formats: JSON, CSV, KML
                  </p>
                </div>

                {importFile && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Selected: <strong>{importFile.name}</strong>
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Download Templates
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => downloadTemplate("JSON")}
                      className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => downloadTemplate("CSV")}
                      className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => downloadTemplate("XLSX")}
                      className="px-3 py-2 text-sm bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-medium"
                    >
                      XLSX
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportFile(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile}
                  className={`px-4 py-2 rounded-md ${
                    importFile
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
                Confirm Delete
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                Are you sure you want to delete this entry? This action cannot
                be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmId(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEntry}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataHub;
