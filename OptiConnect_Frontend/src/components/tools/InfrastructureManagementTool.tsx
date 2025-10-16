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
import { isPointInAssignedRegion, getUserAssignedRegionsSync, detectStateFromCoordinates } from "../../utils/regionMapping";
import NotificationDialog from "../common/NotificationDialog";
import { trackToolUsage } from "../../services/analyticsService";
import { useAppSelector } from "../../store";
import { apiService } from "../../services/apiService";

interface InfrastructureManagementToolProps {
  map: google.maps.Map | null;
  onSave?: (infrastructure?: Infrastructure) => void;
  onClose?: () => void;
}

/**
 * Infrastructure Management Tool - Backend Integrated
 * KML import and manual POP/SubPOP management with API
 */
const InfrastructureManagementTool: React.FC<
  InfrastructureManagementToolProps
> = ({ map, onSave, onClose }) => {
  const { user } = useAppSelector((state) => state.auth);
  const [startTime] = useState<number>(Date.now());
  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  // KML Import states
  const [showImportPreview, setShowImportPreview] = useState<boolean>(false);
  const [importSession, setImportSession] = useState<{
    sessionId: string;
    items: any[];
  } | null>(null);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<number>>(
    new Set()
  );
  // Icon/type selection for imported items (NEW FEATURE)
  const [importItemTypes, setImportItemTypes] = useState<Map<number, InfrastructureType>>(
    new Map()
  );

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pop_count: 0,
    subpop_count: 0,
    kml_count: 0,
    manual_count: 0
  });

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

  // Load infrastructures from backend on mount
  useEffect(() => {
    loadInfrastructures();
    loadStats();
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
   * Transform backend data to frontend format
   */
  const transformBackendToFrontend = (backendData: any): Infrastructure => {
    return {
      id: backendData.id.toString(),
      type: backendData.item_type as InfrastructureType,
      name: backendData.item_name,
      uniqueId: backendData.unique_id,
      networkId: backendData.network_id || "",
      refCode: backendData.ref_code,
      coordinates: {
        lat: parseFloat(backendData.latitude),
        lng: parseFloat(backendData.longitude)
      },
      address: {
        street: backendData.address_street || "",
        city: backendData.address_city || "",
        state: backendData.address_state || "",
        pincode: backendData.address_pincode || ""
      },
      contactName: backendData.contact_name || "",
      contactNo: backendData.contact_phone || "",
      contactEmail: backendData.contact_email,
      isRented: backendData.is_rented || false,
      rentAmount: backendData.rent_amount,
      agreementDates: backendData.agreement_start_date
        ? {
            start: new Date(backendData.agreement_start_date),
            end: new Date(backendData.agreement_end_date)
          }
        : undefined,
      landlordName: backendData.landlord_name,
      landlordContact: backendData.landlord_contact,
      natureOfBusiness: backendData.nature_of_business,
      owner: backendData.owner,
      structureType: backendData.structure_type || "Tower",
      height: backendData.height,
      upsAvailability: backendData.ups_availability || false,
      upsCapacity: backendData.ups_capacity,
      backupCapacity: backendData.backup_capacity || "",
      powerSource: backendData.power_source || "Grid",
      equipmentList: backendData.equipment_list
        ? JSON.parse(backendData.equipment_list)
        : undefined,
      connectedTo: backendData.connected_to
        ? JSON.parse(backendData.connected_to)
        : undefined,
      bandwidth: backendData.bandwidth,
      source: backendData.source || "Manual",
      kmlFileName: backendData.kml_filename,
      createdOn: new Date(backendData.created_at),
      updatedOn: new Date(backendData.updated_at || backendData.created_at),
      status: backendData.status || "Active",
      notes: backendData.notes
    };
  };

  /**
   * Transform frontend data to backend format
   */
  const transformFrontendToBackend = (
    frontendData: Partial<Infrastructure>
  ) => {
    return {
      item_type: frontendData.type,
      item_name: frontendData.name,
      unique_id: frontendData.uniqueId,
      network_id: frontendData.networkId,
      ref_code: frontendData.refCode,
      latitude: frontendData.coordinates?.lat,
      longitude: frontendData.coordinates?.lng,
      height: frontendData.height,
      address_street: frontendData.address?.street,
      address_city: frontendData.address?.city,
      address_state: frontendData.address?.state,
      address_pincode: frontendData.address?.pincode,
      contact_name: frontendData.contactName,
      contact_phone: frontendData.contactNo,
      contact_email: frontendData.contactEmail,
      is_rented: frontendData.isRented,
      rent_amount: frontendData.rentAmount,
      agreement_start_date: frontendData.agreementDates?.start,
      agreement_end_date: frontendData.agreementDates?.end,
      landlord_name: frontendData.landlordName,
      landlord_contact: frontendData.landlordContact,
      nature_of_business: frontendData.natureOfBusiness,
      owner: frontendData.owner,
      structure_type: frontendData.structureType,
      ups_availability: frontendData.upsAvailability,
      ups_capacity: frontendData.upsCapacity,
      backup_capacity: frontendData.backupCapacity,
      power_source: frontendData.powerSource,
      equipment_list: frontendData.equipmentList,
      connected_to: frontendData.connectedTo,
      bandwidth: frontendData.bandwidth,
      status: frontendData.status,
      source: frontendData.source,
      notes: frontendData.notes
    };
  };

  /**
   * Load infrastructures from backend with region filtering
   * Now properly filters by user's assigned regions (consistent with other GIS tools)
   */
  const loadInfrastructures = async () => {
    try {
      setIsLoading(true);

      console.log("🏗️ Loading infrastructure data for user:", user?.name);
      console.log("📍 User assigned regions:", user?.assignedRegions);

      // Load all infrastructure from backend
      const data = await apiService.getAllInfrastructure();
      const transformed = data.map(transformBackendToFrontend);

      console.log(`📦 Received ${transformed.length} infrastructure items from backend`);

      // ✅ REGION FILTERING FIX:
      // Apply client-side region filtering based on user's assigned regions
      // This ensures users only see infrastructure in their assigned regions
      const assignedRegions = getUserAssignedRegionsSync(user);

      let filtered: Infrastructure[];

      if (user?.role === 'Admin' || assignedRegions.length === 0) {
        // Admin sees all infrastructure
        console.log("👑 Admin user - showing all infrastructure");
        filtered = transformed;
      } else {
        // Filter by user's assigned regions
        console.log(`🔍 Filtering by assigned regions: ${assignedRegions.join(', ')}`);

        filtered = transformed.filter((infra) => {
          // Detect which region this infrastructure belongs to
          const infraRegion = detectStateFromCoordinates(
            infra.coordinates.lat,
            infra.coordinates.lng
          );

          if (!infraRegion) {
            console.warn(`⚠️ Could not detect region for infrastructure: ${infra.name} at (${infra.coordinates.lat}, ${infra.coordinates.lng})`);
            return false; // Exclude if region cannot be determined
          }

          // Check if infrastructure's region matches any assigned region
          const normalizeRegion = (r: string) => r.trim().toLowerCase();
          const isInAssignedRegion = assignedRegions.some(
            (assignedRegion) => {
              const normalizedAssigned = normalizeRegion(assignedRegion);
              const normalizedInfra = normalizeRegion(infraRegion);
              return (
                normalizedAssigned === normalizedInfra ||
                normalizedAssigned.includes(normalizedInfra) ||
                normalizedInfra.includes(normalizedAssigned)
              );
            }
          );

          if (isInAssignedRegion) {
            console.log(`✅ ${infra.name} in ${infraRegion} - INCLUDED`);
          } else {
            console.log(`❌ ${infra.name} in ${infraRegion} - EXCLUDED (not in assigned regions)`);
          }

          return isInAssignedRegion;
        });

        console.log(`✅ Filtered to ${filtered.length} infrastructure items (from ${transformed.length} total)`);
      }

      setInfrastructures(filtered);
    } catch (error: any) {
      console.error("Error loading infrastructures:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Load Failed",
        message: error.message || "Failed to load infrastructure data"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load statistics
   */
  const loadStats = async () => {
    try {
      const data = await apiService.getInfrastructureStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
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
      setIsLoading(true);
      const text = await file.text();

      console.log("📄 KML File Info:", {
        name: file.name,
        size: file.size,
        textLength: text.length,
        preview: text.substring(0, 200)
      });

      // Validate KML content
      if (!text || text.trim().length === 0) {
        throw new Error("KML file is empty");
      }

      if (!text.includes("<kml") && !text.includes("<?xml")) {
        throw new Error("Invalid KML file format");
      }

      // Send to backend for parsing and staging
      const result = await apiService.importKML(text, file.name);

      setImportSession({
        sessionId: result.importSessionId,
        items: result.items
      });

      // Pre-select all items
      const allIds = result.items.map((item: any) => item.id);
      setSelectedImportIds(new Set(allIds));

      setShowImportPreview(true);
      setNotification({
        isOpen: true,
        type: "success",
        title: "Import Ready",
        message: `${result.itemCount} items ready for preview. Review and save.`
      });
    } catch (error: any) {
      console.error("Error importing KML:", error);

      // Extract error message from backend response
      let errorMessage = "Failed to import KML file";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setNotification({
        isOpen: true,
        type: "error",
        title: "Import Failed",
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  /**
   * Save selected imported items
   */
  const handleSaveImportedItems = async () => {
    if (!importSession) return;

    try {
      setIsLoading(true);
      const result = await apiService.saveImportedItems(
        importSession.sessionId,
        Array.from(selectedImportIds)
      );

      setNotification({
        isOpen: true,
        type: "success",
        title: "Import Complete",
        message: `Successfully saved ${result.count} items`
      });

      // Reload data
      await loadInfrastructures();
      await loadStats();

      // Close preview
      setShowImportPreview(false);
      setImportSession(null);
      setSelectedImportIds(new Set());
    } catch (error: any) {
      console.error("Error saving imported items:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        message: error.message || "Failed to save imported items"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete import session
   */
  const handleCancelImport = async () => {
    if (!importSession) return;

    try {
      await apiService.deleteImportSession(importSession.sessionId);
      setShowImportPreview(false);
      setImportSession(null);
      setSelectedImportIds(new Set());
    } catch (error) {
      console.error("Error canceling import:", error);
    }
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
        message: "Please fill in all required fields (Name and Coordinates)"
      });
      return;
    }

    // Check if point is in assigned region
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
        message: regionCheck.message || "You don't have access to this region."
      });
      return;
    }

    try {
      setIsLoading(true);

      // Generate unique IDs
      const ids = generateUniqueId(formData.type as InfrastructureType);

      const dataToSend = transformFrontendToBackend({
        ...formData,
        uniqueId: ids.uniqueId,
        networkId: ids.networkId,
        coordinates: coordinates,
        source: "Manual"
      });

      await apiService.createInfrastructure(dataToSend);

      // Track tool usage
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

      // Reload data
      await loadInfrastructures();
      await loadStats();
      resetForm();

      if (onSave) onSave();
    } catch (error: any) {
      console.error("Error creating infrastructure:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Creation Failed",
        message: error.message || "Failed to create infrastructure"
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generate unique ID
   */
  const generateUniqueId = (
    type: InfrastructureType
  ): { uniqueId: string; networkId: string } => {
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

    if (!isPointInsideIndia(lat, lng)) {
      showOutsideIndiaWarning();
      return;
    }

    setNewInfraLocation({ lat, lng });
    setIsPlacingMarker(false);
  };

  /**
   * Open View modal
   */
  const handleViewInfra = (infra: Infrastructure) => {
    setViewingInfra(infra);
    setShowViewModal(true);
  };

  /**
   * Toggle selection
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
   * Select/deselect all
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
   * Bulk delete
   */
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      setNotification({
        isOpen: true,
        type: "warning",
        title: "No Selection",
        message: "Please select items to delete"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Delete each selected item
      for (const id of Array.from(selectedItems)) {
        await apiService.deleteInfrastructure(id);
      }

      setNotification({
        isOpen: true,
        type: "success",
        title: "Deleted",
        message: `${selectedItems.size} item(s) deleted successfully`
      });

      // Reload data
      await loadInfrastructures();
      await loadStats();
      setSelectedItems(new Set());
    } catch (error: any) {
      console.error("Error deleting items:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: error.message || "Failed to delete items"
      });
    } finally {
      setIsLoading(false);
    }
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

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setIsLoading(true);
      await apiService.deleteInfrastructure(deleteConfirmId);

      setNotification({
        isOpen: true,
        type: "success",
        title: "Deleted",
        message: "Infrastructure deleted successfully"
      });

      // Reload data
      await loadInfrastructures();
      await loadStats();
      setDeleteConfirmId(null);
    } catch (error: any) {
      console.error("Error deleting infrastructure:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: error.message || "Failed to delete infrastructure"
      });
    } finally {
      setIsLoading(false);
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
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/75 dark:bg-gray-800/75 flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-10 w-10 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Loading...
            </p>
          </div>
        </div>
      )}

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
            {stats.pop_count}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">POPs</div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.subpop_count}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            SubPOPs
          </div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.kml_count}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            From KML
          </div>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.manual_count}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Manual</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
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
            disabled={isLoading}
            className="hidden"
          />
        </label>
        <button
          onClick={() => setShowTable(!showTable)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center"
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

      {/* Import Preview Modal */}
      {showImportPreview && importSession && (
        <div className="fixed top-12 inset-0 bg-black/50 flex items-center justify-center z-[100010]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Import Preview - {importSession.items.length} Items
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Review and select items to import. Regions auto-detected from
                coordinates.
              </p>
            </div>

            <div className="p-4">
              {/* Select All */}
              <div className="mb-3 flex items-center">
                <input
                  type="checkbox"
                  checked={
                    selectedImportIds.size === importSession.items.length
                  }
                  onChange={() => {
                    if (selectedImportIds.size === importSession.items.length) {
                      setSelectedImportIds(new Set());
                    } else {
                      setSelectedImportIds(
                        new Set(importSession.items.map((i) => i.id))
                      );
                    }
                  }}
                  className="rounded border-gray-300 mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Select All ({selectedImportIds.size} selected)
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {importSession.items.map((item) => (
                  <div
                    key={item.uniqueId}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedImportIds.has(item.id)}
                      onChange={() => {
                        const newSet = new Set(selectedImportIds);
                        if (newSet.has(item.id)) {
                          newSet.delete(item.id);
                        } else {
                          newSet.add(item.id);
                        }
                        setSelectedImportIds(newSet);
                      }}
                      className="rounded border-gray-300 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            item.type === "POP"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                        {item.detectedRegionId && " • Region detected"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-2">
              <button
                onClick={handleCancelImport}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveImportedItems}
                disabled={isLoading || selectedImportIds.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
              >
                Save Selected ({selectedImportIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Form - COMPLETE VERSION with ALL Fields */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md space-y-4 max-h-[70vh] overflow-y-auto">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Add New Infrastructure - Complete Form
          </h4>

          {/* === SECTION 1: Basic Information === */}
          <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Basic Information
            </h5>

            {/* Type */}
            <div className="grid grid-cols-2 gap-2">
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
                  <option value="Tower">Tower</option>
                  <option value="Building">Building</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
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
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Infrastructure Name *
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
          </div>

          {/* === SECTION 2: Location === */}
          <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Location *
            </h5>

            {/* Map Click Button */}
            <button
              onClick={() => setIsPlacingMarker(!isPlacingMarker)}
              type="button"
              className={`w-full px-3 py-2 text-sm font-medium rounded-md ${
                isPlacingMarker
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
              }`}
            >
              {isPlacingMarker
                ? "✓ Click Map to Set Location"
                : "📍 Click to Place on Map"}
            </button>

            {/* OR Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-2 text-xs text-gray-500 dark:text-gray-400">
                OR
              </span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            {/* Manual Coordinates */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="any"
                placeholder="Latitude *"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude *"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleManualCoordinates}
              type="button"
              disabled={!manualLat || !manualLng}
              className="w-full px-3 py-2 text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/30 disabled:opacity-50"
            >
              Set Coordinates
            </button>

            {/* Current Location Display */}
            {newInfraLocation && (
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-400 font-mono">
                ✓ {newInfraLocation.lat.toFixed(6)},{" "}
                {newInfraLocation.lng.toFixed(6)}
              </div>
            )}

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Height (meters)
              </label>
              <input
                type="number"
                step="any"
                value={formData.height || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    height: parseFloat(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="e.g., 45"
              />
            </div>
          </div>

          {/* === SECTION 3: Address === */}
          <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Address
            </h5>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address?.street || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      street: e.target.value
                    } as any
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Building, Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.address?.city || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        city: e.target.value
                      } as any
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.address?.state || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: {
                        ...formData.address,
                        state: e.target.value
                      } as any
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="State"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.address?.pincode || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: {
                      ...formData.address,
                      pincode: e.target.value
                    } as any
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Pincode"
              />
            </div>
          </div>

          {/* === SECTION 4: Contact Information === */}
          <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Contact Information
            </h5>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={formData.contactName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Contact person name"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.contactNo || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="+91 1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          {/* === SECTION 5: Rental Information === */}
          <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Rental Information
            </h5>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isRented || false}
                onChange={(e) =>
                  setFormData({ ...formData, isRented: e.target.checked })
                }
                className="rounded border-gray-300"
              />
              <label className="text-sm text-gray-700 dark:text-gray-300">
                This infrastructure is rented
              </label>
            </div>

            {formData.isRented && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Rent (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.rentAmount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rentAmount: parseFloat(e.target.value)
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Amount"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Agreement Start Date
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
                            ...formData.agreementDates,
                            start: new Date(e.target.value)
                          } as any
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Agreement End Date
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
                            ...formData.agreementDates,
                            end: new Date(e.target.value)
                          } as any
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Landlord Name
                  </label>
                  <input
                    type="text"
                    value={formData.landlordName || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, landlordName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Landlord name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Landlord Contact
                  </label>
                  <input
                    type="text"
                    value={formData.landlordContact || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        landlordContact: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="Landlord contact number"
                  />
                </div>
              </>
            )}
          </div>

          {/* === SECTION 6: Owner & Business Information === */}
          <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Owner & Business
            </h5>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.owner || ""}
                onChange={(e) =>
                  setFormData({ ...formData, owner: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Owner name"
              />
            </div>

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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="E.g., Telecom, ISP, Data Center"
              />
            </div>
          </div>

          {/* === SECTION 7: Technical Details === */}
          <div className="space-y-3 border-b border-gray-300 dark:border-gray-600 pb-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Technical Details
            </h5>

            <div className="grid grid-cols-2 gap-2">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Power Source
                </label>
                <select
                  value={formData.powerSource || "Grid"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      powerSource: e.target.value as any
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="Grid">Grid</option>
                  <option value="Solar">Solar</option>
                  <option value="Generator">Generator</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* UPS */}
            <div className="flex items-center space-x-2">
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
              <label className="text-sm text-gray-700 dark:text-gray-300">
                UPS Available
              </label>
            </div>

            {formData.upsAvailability && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  UPS Capacity
                </label>
                <input
                  type="text"
                  value={formData.upsCapacity || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, upsCapacity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="e.g., 10 KVA"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Backup Capacity
              </label>
              <input
                type="text"
                value={formData.backupCapacity || ""}
                onChange={(e) =>
                  setFormData({ ...formData, backupCapacity: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="e.g., 4 hours, 20 KVA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bandwidth
              </label>
              <input
                type="text"
                value={formData.bandwidth || ""}
                onChange={(e) =>
                  setFormData({ ...formData, bandwidth: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="e.g., 1 Gbps, 100 Mbps"
              />
            </div>
          </div>

          {/* === SECTION 8: Additional Notes === */}
          <div className="space-y-3 pb-3">
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Additional Information
            </h5>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm"
                placeholder="Any additional notes or comments..."
              />
            </div>
          </div>

          {/* === Action Buttons === */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={resetForm}
              type="button"
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddInfrastructure}
              type="button"
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Add Infrastructure
            </button>
          </div>
        </div>
      )}

      {/* Table View - Keeping existing table UI with backend data */}
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
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
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
