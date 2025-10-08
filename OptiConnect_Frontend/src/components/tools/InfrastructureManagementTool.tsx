/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import type {
  Infrastructure,
  InfrastructureType,
  InfrastructureFilters
} from "../../types/gisTools.types";
import {
  isPointInsideIndia,
  showOutsideIndiaWarning
} from "../../utils/indiaBoundaryCheck";
import { isPointInAssignedRegion } from "../../utils/regionMapping";
import NotificationDialog from "../common/NotificationDialog";
import { trackToolUsage } from "../../services/analyticsService";
import { useAppSelector } from "../../store";

interface InfrastructureManagementToolProps {
  map: google.maps.Map | null;
  onSave?: (infrastructure?: Infrastructure) => void;
  onClose?: () => void;
}

/**
 * Infrastructure Management Tool - Phase 4.5
 * KML import and manual POP/SubPOP management
 */
const InfrastructureManagementTool: React.FC<
  InfrastructureManagementToolProps
> = ({ map, onSave, onClose }) => {
  const { user } = useAppSelector((state) => state.auth);
  const [startTime] = useState<number>(Date.now());
  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>([]);
  const [markers, setMarkers] = useState<Map<string, google.maps.Marker>>(
    new Map()
  );
  const [selectedInfra, setSelectedInfra] = useState<Infrastructure | null>(
    null
  );
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [filters, setFilters] = useState<InfrastructureFilters>({});
  const [isPlacingMarker, setIsPlacingMarker] = useState<boolean>(false);
  const [newInfraLocation, setNewInfraLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [manualLat, setManualLat] = useState<string>("");
  const [manualLng, setManualLng] = useState<string>("");
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewingInfra, setViewingInfra] = useState<Infrastructure | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for adding/editing
  const [formData, setFormData] = useState<Partial<Infrastructure>>({
    type: "POP",
    name: "",
    networkId: "",
    contactName: "",
    contactNo: "",
    isRented: false,
    structureType: "Tower",
    upsAvailability: false,
    backupCapacity: "",
    powerSource: "Grid",
    status: "Active"
  });
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

  // Load infrastructures from localStorage on mount
  useEffect(() => {
    loadInfrastructures();
  }, []);

  // Click listener for placing markers
  useEffect(() => {
    if (!map || !isPlacingMarker) return;

    const clickListener = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          // Check if location is inside India
          if (!isPointInsideIndia(lat, lng)) {
            showOutsideIndiaWarning();
            return;
          }

          setNewInfraLocation({ lat, lng });
          setIsPlacingMarker(false);
        }
      }
    );

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, isPlacingMarker]);

  // Render markers when infrastructures change
  useEffect(() => {
    if (!map) return;
    renderMarkers();
  }, [infrastructures, map]);

  /**
   * Load infrastructures from localStorage
   */
  const loadInfrastructures = () => {
    const saved = localStorage.getItem("gis_infrastructures");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Convert date strings back to Date objects
      const infrastructuresWithDates = parsed.map((infra: any) => ({
        ...infra,
        createdOn: new Date(infra.createdOn),
        updatedOn: new Date(infra.updatedOn),
        agreementDates: infra.agreementDates
          ? {
              start: new Date(infra.agreementDates.start),
              end: new Date(infra.agreementDates.end)
            }
          : undefined
      }));
      setInfrastructures(infrastructuresWithDates);
    }
  };

  /**
   * Save infrastructures to localStorage
   */
  const saveInfrastructures = (infras: Infrastructure[]) => {
    localStorage.setItem("gis_infrastructures", JSON.stringify(infras));
    setInfrastructures(infras);

    // Notify parent component that data was saved
    if (onSave) {
      onSave();
    }
  };

  /**
   * Render markers on map
   */
  const renderMarkers = () => {
    if (!map) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    const newMarkers = new Map<string, google.maps.Marker>();

    // Filter infrastructures
    const filtered = applyFilters(infrastructures);

    // Create markers for each infrastructure
    filtered.forEach((infra) => {
      const icon = getMarkerIcon(infra);

      const marker = new google.maps.Marker({
        position: infra.coordinates,
        map: map,
        title: infra.name,
        icon: icon,
        label:
          infra.source === "KML"
            ? undefined
            : {
                text: infra.type === "POP" ? "P" : "S",
                color: "white",
                fontWeight: "bold"
              }
      });

      // Add click listener
      marker.addListener("click", () => {
        setSelectedInfra(infra);
        showInfoWindow(marker, infra);
      });

      newMarkers.set(infra.id, marker);
    });

    setMarkers(newMarkers);
  };

  /**
   * Get marker icon based on infrastructure properties
   */
  const getMarkerIcon = (infra: Infrastructure): google.maps.Symbol => {
    // Different colors for KML vs Manual
    const isKML = infra.source === "KML";
    const isPOP = infra.type === "POP";

    let color = "";
    if (isKML) {
      color = isPOP ? "#4CAF50" : "#8BC34A"; // Green shades for KML
    } else {
      color = isPOP ? "#2196F3" : "#03A9F4"; // Blue shades for Manual
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: isPOP ? 10 : 7
    };
  };

  /**
   * Show info window for infrastructure
   */
  const showInfoWindow = (
    marker: google.maps.Marker,
    infra: Infrastructure
  ) => {
    const content = `
      <div class="p-2">
        <h3 class="font-bold text-lg mb-2">${infra.name}</h3>
        <div class="text-sm space-y-1">
          <p><strong>Type:</strong> ${infra.type}</p>
          <p><strong>ID:</strong> ${infra.uniqueId || infra.networkId}</p>
          <p><strong>Status:</strong> <span class="px-2 py-1 rounded ${
            infra.status === "Active"
              ? "bg-green-100 text-green-800"
              : infra.status === "Inactive"
              ? "bg-gray-100 text-gray-800"
              : infra.status === "Maintenance"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-blue-100 text-blue-800"
          }">${infra.status}</span></p>
          <p><strong>Contact:</strong> ${infra.contactName} (${
      infra.contactNo
    })</p>
          <p><strong>Source:</strong> ${infra.source}</p>
          ${
            infra.isRented
              ? `<p><strong>Rented:</strong> ₹${infra.rentAmount}/month</p>`
              : ""
          }
        </div>
      </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
      content: content
    });

    infoWindow.open(map, marker);
  };

  /**
   * Apply filters
   */
  const applyFilters = (infras: Infrastructure[]): Infrastructure[] => {
    let filtered = [...infras];

    if (filters.type) {
      filtered = filtered.filter((i) => i.type === filters.type);
    }
    if (filters.source) {
      filtered = filtered.filter((i) => i.source === filters.source);
    }
    if (filters.status) {
      filtered = filtered.filter((i) => i.status === filters.status);
    }
    if (filters.state) {
      filtered = filtered.filter((i) =>
        i.address.state.toLowerCase().includes(filters.state!.toLowerCase())
      );
    }
    if (filters.city) {
      filtered = filtered.filter((i) =>
        i.address.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(term) ||
          i.uniqueId.toLowerCase().includes(term) ||
          i.networkId.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  /**
   * Handle KML file import
   */
  const handleKMLImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const placemarks = xmlDoc.getElementsByTagName("Placemark");
      const newInfras: Infrastructure[] = [];

      for (let i = 0; i < placemarks.length; i++) {
        const placemark = placemarks[i];
        const name =
          placemark.getElementsByTagName("name")[0]?.textContent ||
          `Import ${i + 1}`;
        const description =
          placemark.getElementsByTagName("description")[0]?.textContent || "";
        const coordinates = placemark
          .getElementsByTagName("coordinates")[0]
          ?.textContent?.trim();

        if (coordinates) {
          const [lng, lat] = coordinates.split(",").map(parseFloat);

          // Determine type from name or description
          const type: InfrastructureType =
            name.toLowerCase().includes("subpop") ||
            description.toLowerCase().includes("subpop")
              ? "SubPOP"
              : "POP";

          const infra: Infrastructure = {
            id: `kml_${Date.now()}_${i}`,
            type,
            name,
            uniqueId: `KML-${type}-${String(i + 1).padStart(3, "0")}`,
            networkId: `NET-${Date.now()}-${i}`,
            coordinates: { lat, lng },
            address: {
              street: "",
              city: "",
              state: "",
              pincode: ""
            },
            contactName: "",
            contactNo: "",
            isRented: false,
            structureType: "Tower",
            upsAvailability: false,
            backupCapacity: "",
            powerSource: "Grid",
            source: "KML",
            kmlFileName: file.name,
            createdOn: new Date(),
            updatedOn: new Date(),
            status: "Active",
            notes: description
          };

          newInfras.push(infra);
        }
      }

      if (newInfras.length > 0) {
        saveInfrastructures([...infrastructures, ...newInfras]);
        setNotification({
          isOpen: true,
          type: "success",
          title: "Import Successful!",
          message: `Successfully imported ${newInfras.length} infrastructure items from KML`
        });
      } else {
        setNotification({
          isOpen: true,
          type: "warning",
          title: "No Data Found",
          message: "No valid placemarks found in KML file"
        });
      }
    } catch (error) {
      console.error("Error importing KML:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Import Failed",
        message: "Failed to import KML file. Please check the file format."
      });
    }

    // Reset input
    event.target.value = "";
  };

  /**
   * Add new infrastructure
   */
  const handleAddInfrastructure = async () => {
    // Check if we have coordinates from either map click OR manual entry
    let coordinates: { lat: number; lng: number } | null = null;

    if (newInfraLocation) {
      coordinates = newInfraLocation;
    } else if (manualLat && manualLng) {
      const lat = parseFloat(manualLat);
      const lng = parseFloat(manualLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Validate coordinates are within India
        if (!isPointInsideIndia(lat, lng)) {
          showOutsideIndiaWarning();
          return;
        }
        coordinates = { lat, lng };
      }
    }

    if (!coordinates || !formData.name) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Missing Information",
        message:
          "Please fill in all required fields (Name and Coordinates - either click on map OR enter manually)"
      });
      return;
    }

    // Check if point is in assigned region (Region-based access control)
    const regionCheck = await isPointInAssignedRegion(
      coordinates.lat,
      coordinates.lng,
      user
    );
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

    // Generate unique IDs
    const ids = generateUniqueId(formData.type as InfrastructureType);

    const newInfra: Infrastructure = {
      id: `manual_${Date.now()}`,
      type: formData.type as InfrastructureType,
      name: formData.name,
      uniqueId: ids.uniqueId,
      networkId: ids.networkId,
      coordinates: coordinates,
      address: formData.address || {
        street: "",
        city: "",
        state: "",
        pincode: ""
      },
      contactName: formData.contactName || "",
      contactNo: formData.contactNo || "",
      contactEmail: formData.contactEmail,
      isRented: formData.isRented || false,
      rentAmount: formData.rentAmount,
      agreementDates: formData.agreementDates,
      landlordName: formData.landlordName,
      landlordContact: formData.landlordContact,
      structureType: formData.structureType || "Tower",
      height: formData.height,
      upsAvailability: formData.upsAvailability || false,
      upsCapacity: formData.upsCapacity,
      backupCapacity: formData.backupCapacity || "",
      powerSource: formData.powerSource || "Grid",
      equipmentList: formData.equipmentList,
      connectedTo: formData.connectedTo,
      bandwidth: formData.bandwidth,
      source: "Manual",
      createdOn: new Date(),
      updatedOn: new Date(),
      status: formData.status || "Active",
      notes: formData.notes
    };

    saveInfrastructures([...infrastructures, newInfra]);

    // Track tool usage for analytics
    const duration = Math.round((Date.now() - startTime) / 1000);
    trackToolUsage({
      toolName: "infrastructure-management",
      userId: user?.id || "guest",
      userName: user?.name || "Guest User",
      duration
    });

    setNotification({
      isOpen: true,
      type: "success",
      title: "Success!",
      message: "Infrastructure added successfully!"
    });
    resetForm();
  };

  /**
   * Generate unique ID in format POP.xxxxxx or SUBPOP.xxxxxx
   * Returns both uniqueId and networkId
   */
  const generateUniqueId = (
    type: InfrastructureType
  ): { uniqueId: string; networkId: string } => {
    // Generate random 6-character alphanumeric ID
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    if (type === "POP") {
      return {
        uniqueId: `POP.${randomId}`,
        networkId: `BHARAT-POP.${randomId}`
      };
    } else {
      return {
        uniqueId: `SUBPOP.${randomId}`,
        networkId: `BHARAT-SUBPOP.${randomId}`
      };
    }
  };

  /**
   * Set location from manual coordinate entry
   */
  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "Invalid Coordinates",
        message: "Please enter valid latitude and longitude values"
      });
      return;
    }

    // Check if coordinates are inside India
    if (!isPointInsideIndia(lat, lng)) {
      showOutsideIndiaWarning();
      return;
    }

    setNewInfraLocation({ lat, lng });
    setIsPlacingMarker(false);
  };

  /**
   * Open View modal for infrastructure
   */
  const handleViewInfra = (infra: Infrastructure) => {
    setViewingInfra(infra);
    setShowViewModal(true);
  };

  /**
   * Toggle selection of an infrastructure item
   */
  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  /**
   * Select/deselect all visible items
   */
  const toggleSelectAll = () => {
    const visibleInfras = applyFilters(infrastructures);
    if (selectedItems.size === visibleInfras.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(visibleInfras.map((i) => i.id)));
    }
  };

  /**
   * Bulk delete selected items
   */
  const handleBulkDelete = () => {
    if (selectedItems.size === 0) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "No Selection",
        message: "Please select items to delete"
      });
      return;
    }

    const remaining = infrastructures.filter((i) => !selectedItems.has(i.id));
    saveInfrastructures(remaining);
    setSelectedItems(new Set());
    setNotification({
      isOpen: true,
      type: "success",
      title: "Deleted",
      message: `${selectedItems.size} item(s) deleted successfully`
    });
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      type: "POP",
      name: "",
      networkId: "",
      contactName: "",
      contactNo: "",
      isRented: false,
      structureType: "Tower",
      upsAvailability: false,
      backupCapacity: "",
      powerSource: "Grid",
      status: "Active"
    });
    setNewInfraLocation(null);
    setShowAddForm(false);
    setIsPlacingMarker(false);
    setManualLat("");
    setManualLng("");
  };

  /**
   * Delete infrastructure
   */
  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      const updated = infrastructures.filter((i) => i.id !== deleteConfirmId);
      saveInfrastructures(updated);
      setDeleteConfirmId(null);
      setNotification({
        isOpen: true,
        type: "success",
        title: "Deleted",
        message: "Infrastructure deleted successfully"
      });
    }
  };

  /**
   * Navigate to infrastructure on map
   */
  const navigateToInfra = (infra: Infrastructure) => {
    if (map) {
      map.setCenter(infra.coordinates);
      map.setZoom(15);

      const marker = markers.get(infra.id);
      if (marker) {
        showInfoWindow(marker, infra);
      }
    }
  };

  return (
    <div className="fixed top-16 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-2xl z-40 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 top-0 bg-white dark:bg-gray-800 pb-2">
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
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          Infrastructure Management
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {infrastructures.filter((i) => i.type === "POP").length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">POPs</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {infrastructures.filter((i) => i.type === "SubPOP").length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            SubPOPs
          </div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {infrastructures.filter((i) => i.source === "KML").length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            From KML
          </div>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {infrastructures.filter((i) => i.source === "Manual").length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Manual</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center justify-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New
        </button>
        <label className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-green-100 dark:bg-green-900/20 rounded-md hover:bg-green-200 dark:hover:bg-green-900/30 cursor-pointer flex items-center justify-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Import KML
          <input
            type="file"
            accept=".kml"
            onChange={handleKMLImport}
            className="hidden"
          />
        </label>
        <button
          onClick={() => setShowTable(!showTable)}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {showTable ? "Hide" : "Show"} Table
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Add New Infrastructure
          </h4>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as InfrastructureType
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="POP">POP</option>
              <option value="SubPOP">SubPOP</option>
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              placeholder="e.g., Mumbai Central POP"
            />
          </div>

          {/* Network ID */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Network ID *
            </label>
            <input
              type="text"
              value={formData.networkId}
              onChange={(e) =>
                setFormData({ ...formData, networkId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
              placeholder="e.g., NET-MUM-001"
            />
          </div> */}

          {/* Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Location *
            </label>

            {/* Option 1: Click on Map */}
            <button
              onClick={() => setIsPlacingMarker(!isPlacingMarker)}
              className={`w-full px-3 py-2 text-sm font-medium rounded-md ${
                isPlacingMarker
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
              }`}
            >
              {isPlacingMarker ? "Cancel Map Click" : "Click to Place on Map"}
            </button>

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-2 text-xs text-gray-500 dark:text-gray-400">
                OR
              </span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Option 2: Manual Entry */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleManualCoordinates}
              disabled={!manualLat || !manualLng}
              className="w-full px-3 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Manual Coordinates
            </button>

            {/* Current Coordinates Display */}
            {newInfraLocation && (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400 font-mono">
                ✓ Location Set: {newInfraLocation.lat.toFixed(6)},{" "}
                {newInfraLocation.lng.toFixed(6)}
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Number
              </label>
              <input
                type="text"
                value={formData.contactNo}
                onChange={(e) =>
                  setFormData({ ...formData, contactNo: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Address
            </label>
            <input
              type="text"
              placeholder="Street"
              value={formData.address?.street || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: {
                    ...formData.address,
                    street: e.target.value,
                    city: formData.address?.city || "",
                    state: formData.address?.state || "",
                    pincode: formData.address?.pincode || ""
                  }
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="City"
                value={formData.address?.city || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      street: formData.address?.street || "",
                      city: e.target.value,
                      state: formData.address?.state || "",
                      pincode: formData.address?.pincode || ""
                    }
                  })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              />
              <input
                type="text"
                placeholder="State"
                value={formData.address?.state || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      street: formData.address?.street || "",
                      city: formData.address?.city || "",
                      state: e.target.value,
                      pincode: formData.address?.pincode || ""
                    }
                  })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              />
              <input
                type="text"
                placeholder="Pincode"
                value={formData.address?.pincode || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      street: formData.address?.street || "",
                      city: formData.address?.city || "",
                      state: formData.address?.state || "",
                      pincode: e.target.value
                    }
                  })
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Reference Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reference Code
            </label>
            <input
              type="text"
              value={formData.refCode || ""}
              onChange={(e) =>
                setFormData({ ...formData, refCode: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
              placeholder="e.g., REF-001"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={formData.status || "Active"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Planned">Planned</option>
              <option value="RFS">RFS</option>
            </select>
          </div>

          {/* Rental Information */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isRented || false}
                onChange={(e) =>
                  setFormData({ ...formData, isRented: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Is Rented
              </span>
            </label>

            {formData.isRented && (
              <div className="space-y-2 pl-6">
                <input
                  type="number"
                  placeholder="Rent Amount"
                  value={formData.rentAmount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rentAmount: parseFloat(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Agreement Start
                    </label>
                    <input
                      type="date"
                      value={
                        formData.agreementDates?.start
                          ? new Date(formData.agreementDates.start)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreementDates: {
                            start: new Date(e.target.value),
                            end: formData.agreementDates?.end || new Date()
                          }
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Agreement End
                    </label>
                    <input
                      type="date"
                      value={
                        formData.agreementDates?.end
                          ? new Date(formData.agreementDates.end)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreementDates: {
                            start: formData.agreementDates?.start || new Date(),
                            end: new Date(e.target.value)
                          }
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nature of Business */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nature of Business
            </label>
            <input
              type="text"
              value={formData.natureOfBusiness || ""}
              onChange={(e) =>
                setFormData({ ...formData, natureOfBusiness: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
              placeholder="e.g., LBO, Enterprise"
            />
          </div>

          {/* Structure Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Structure Type
            </label>
            <select
              value={formData.structureType || "Tower"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  structureType: e.target.value as any
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="Tower">Tower</option>
              <option value="Building">Building</option>
              <option value="Ground">Ground</option>
              <option value="Rooftop">Rooftop</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* UPS & Backup */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.upsAvailability || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    upsAvailability: e.target.checked
                  })
                }
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                UPS Availability
              </span>
            </label>

            <input
              type="text"
              placeholder="Backup Capacity (in KVA)"
              value={formData.backupCapacity || ""}
              onChange={(e) =>
                setFormData({ ...formData, backupCapacity: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={resetForm}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleAddInfrastructure}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Infrastructure
            </button>
          </div>
        </div>
      )}

      {/* Table View */}
      {showTable && (
        <div className="mb-4">
          {/* Filters */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <select
              value={filters.type || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  type: e.target.value as InfrastructureType | undefined
                })
              }
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="POP">POP</option>
              <option value="SubPOP">SubPOP</option>
            </select>
            <select
              value={filters.source || ""}
              onChange={(e) =>
                setFilters({ ...filters, source: e.target.value as any })
              }
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Sources</option>
              <option value="KML">KML</option>
              <option value="Manual">Manual</option>
            </select>
            <input
              type="text"
              value={filters.searchTerm || ""}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value })
              }
              placeholder="Search..."
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-400">
                {selectedItems.size} item(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md max-h-96">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.size ===
                          applyFilters(infrastructures).length &&
                        applyFilters(infrastructures).length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Type
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Source
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {applyFilters(infrastructures).map((infra) => (
                  <tr
                    key={infra.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(infra.id)}
                        onChange={() => toggleItemSelection(infra.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                      {infra.name}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          infra.type === "POP"
                            ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                            : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        }`}
                      >
                        {infra.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm font-mono text-gray-600 dark:text-gray-400">
                      {infra.uniqueId}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          infra.source === "KML"
                            ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                            : "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                        }`}
                      >
                        {infra.source}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          infra.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : infra.status === "Inactive"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {infra.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm space-x-1">
                      <button
                        onClick={() => handleViewInfra(infra)}
                        className="text-purple-600 hover:text-purple-800 dark:text-purple-400"
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
                        onClick={() => navigateToInfra(infra)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(infra.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Marker Legend
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Manual POP</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Manual SubPOP
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-400">KML POP</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-lime-400"></div>
            <span className="text-gray-600 dark:text-gray-400">KML SubPOP</span>
          </div>
        </div>
      </div>

      {/* View Detail Modal */}
      {showViewModal && viewingInfra && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Infrastructure Details
              </h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingInfra(null);
                }}
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

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {viewingInfra.name}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Type
                  </label>
                  <p className="text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        viewingInfra.type === "POP"
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      }`}
                    >
                      {viewingInfra.type}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Unique ID
                  </label>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {viewingInfra.uniqueId}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Network ID
                  </label>
                  <p className="text-sm font-mono text-gray-900 dark:text-white">
                    {viewingInfra.networkId}
                  </p>
                </div>
                {viewingInfra.refCode && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Reference Code
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {viewingInfra.refCode}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </label>
                  <p className="text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        viewingInfra.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : viewingInfra.status === "Inactive"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {viewingInfra.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Coordinates
                </label>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {viewingInfra.coordinates.lat.toFixed(6)},{" "}
                  {viewingInfra.coordinates.lng.toFixed(6)}
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Address
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {viewingInfra.address.street &&
                    `${viewingInfra.address.street}, `}
                  {viewingInfra.address.city &&
                    `${viewingInfra.address.city}, `}
                  {viewingInfra.address.state &&
                    `${viewingInfra.address.state} `}
                  {viewingInfra.address.pincode}
                </p>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Contact Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {viewingInfra.contactName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Contact Number
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {viewingInfra.contactNo}
                  </p>
                </div>
                {viewingInfra.contactEmail && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {viewingInfra.contactEmail}
                    </p>
                  </div>
                )}
              </div>

              {/* Rental Information */}
              {viewingInfra.isRented && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Rental Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingInfra.rentAmount && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Rent Amount
                        </label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          ₹{viewingInfra.rentAmount}
                        </p>
                      </div>
                    )}
                    {viewingInfra.agreementDates && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Agreement Start
                          </label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(
                              viewingInfra.agreementDates.start
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Agreement End
                          </label>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(
                              viewingInfra.agreementDates.end
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Details */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Technical Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Structure Type
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {viewingInfra.structureType}
                    </p>
                  </div>
                  {viewingInfra.natureOfBusiness && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Nature of Business
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {viewingInfra.natureOfBusiness}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      UPS Available
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {viewingInfra.upsAvailability ? "Yes" : "No"}
                    </p>
                  </div>
                  {viewingInfra.backupCapacity && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Backup Capacity
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {viewingInfra.backupCapacity}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Power Source
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {viewingInfra.powerSource}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Metadata
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Source
                    </label>
                    <p className="text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          viewingInfra.source === "KML"
                            ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                            : "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                        }`}
                      >
                        {viewingInfra.source}
                      </span>
                    </p>
                  </div>
                  {viewingInfra.kmlFileName && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        KML File
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {viewingInfra.kmlFileName}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Created On
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(viewingInfra.createdOn).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Updated On
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(viewingInfra.updatedOn).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingInfra.notes && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Notes
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {viewingInfra.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  navigateToInfra(viewingInfra);
                  setShowViewModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                View on Map
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingInfra(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10001]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-6 h-6 text-red-600"
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
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Confirm Delete
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete this infrastructure? This
                  action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
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

export default InfrastructureManagementTool;
