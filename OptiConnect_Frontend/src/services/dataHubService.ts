/**
 * Data Hub Service - Backend Integration
 * Handles both localStorage and API communication
 */

import type { DataHubEntry } from "../types/gisTools.types";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const USE_BACKEND = process.env.REACT_APP_USE_BACKEND === "true";

/**
 * Fetch all data entries
 */
export const fetchAllData = async (): Promise<DataHubEntry[]> => {
  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE_URL}/data-hub/all`);
      if (!response.ok) throw new Error("Failed to fetch data");
      return await response.json();
    } catch (error) {
      console.error("Backend fetch failed, falling back to localStorage:", error);
      return fetchFromLocalStorage();
    }
  }
  return fetchFromLocalStorage();
};

/**
 * Fetch from localStorage
 */
const fetchFromLocalStorage = (): DataHubEntry[] => {
  const allEntries: DataHubEntry[] = [];

  try {
    // Load Distance Measurements
    const distances = JSON.parse(
      localStorage.getItem("gis_distance_measurements") || "[]"
    );
    distances.forEach((data: any) => {
      if (data && data.id && data.name) {
        allEntries.push({
          id: data.id,
          type: "Distance",
          name: data.name,
          createdAt: new Date(data.createdAt || Date.now()),
          savedAt: new Date(data.updatedAt || data.createdAt || Date.now()),
          fileSize: JSON.stringify(data).length,
          source: "Manual",
          data: data
        });
      }
    });

    // Load Polygons
    const polygons = JSON.parse(localStorage.getItem("gis_polygons") || "[]");
    polygons.forEach((data: any) => {
      if (data && data.id && data.name) {
        allEntries.push({
          id: data.id,
          type: "Polygon",
          name: data.name,
          createdAt: new Date(data.createdAt || Date.now()),
          savedAt: new Date(data.updatedAt || data.createdAt || Date.now()),
          fileSize: JSON.stringify(data).length,
          source: "Manual",
          data: data
        });
      }
    });

    // Load Circles
    const circles = JSON.parse(localStorage.getItem("gis_circles") || "[]");
    circles.forEach((data: any) => {
      if (data && data.id && data.name) {
        allEntries.push({
          id: data.id,
          type: "Circle",
          name: data.name,
          createdAt: new Date(data.createdAt || Date.now()),
          savedAt: new Date(data.updatedAt || data.createdAt || Date.now()),
          fileSize: JSON.stringify(data).length,
          source: "Manual",
          data: data
        });
      }
    });

    // Load Elevation Profiles
    const elevations = JSON.parse(
      localStorage.getItem("gis_elevation_profiles") || "[]"
    );
    elevations.forEach((data: any) => {
      if (data && data.id && data.name) {
        allEntries.push({
          id: data.id,
          type: "Elevation",
          name: data.name,
          createdAt: new Date(data.createdAt || Date.now()),
          savedAt: new Date(data.updatedAt || data.createdAt || Date.now()),
          fileSize: JSON.stringify(data).length,
          source: "Manual",
          data: data
        });
      }
    });

    // Load Infrastructure
    const infrastructures = JSON.parse(
      localStorage.getItem("gis_infrastructures") || "[]"
    );
    infrastructures.forEach((data: any) => {
      if (data && data.id && data.name) {
        allEntries.push({
          id: data.id,
          type: "Infrastructure",
          name: data.name,
          createdAt: new Date(data.createdOn || Date.now()),
          savedAt: new Date(data.updatedOn || data.createdOn || Date.now()),
          fileSize: JSON.stringify(data).length,
          source: data.source === "KML" ? "Import" : "Manual",
          data: data
        });
      }
    });

    // Load Sector RF
    const sectorRFs = JSON.parse(
      localStorage.getItem("gis_sector_rf") || "[]"
    );
    sectorRFs.forEach((data: any) => {
      if (data && data.id && data.name) {
        allEntries.push({
          id: data.id,
          type: "SectorRF",
          name: data.name,
          createdAt: new Date(data.createdAt || Date.now()),
          savedAt: new Date(data.updatedAt || data.createdAt || Date.now()),
          fileSize: JSON.stringify(data).length,
          source: "Manual",
          data: data
        });
      }
    });

    // Sort by savedAt descending
    allEntries.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
  } catch (error) {
    console.error("Error loading from localStorage:", error);
  }

  return allEntries;
};

/**
 * Delete entries (bulk)
 */
export const deleteEntries = async (ids: string[]): Promise<void> => {
  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE_URL}/data-hub/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      if (!response.ok) throw new Error("Failed to delete");
      return;
    } catch (error) {
      console.error("Backend delete failed, falling back to localStorage:", error);
    }
  }

  // Delete from localStorage
  const entries = await fetchFromLocalStorage();
  const toDelete = entries.filter((e) => ids.includes(e.id));
  const byType: { [key: string]: string[] } = {};

  toDelete.forEach((entry) => {
    if (!byType[entry.type]) byType[entry.type] = [];
    byType[entry.type].push(entry.id);
  });

  Object.keys(byType).forEach((type) => {
    const storageKey = getStorageKey(type as any);
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const filtered = existing.filter((item: any) => !byType[type].includes(item.id));
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  });
};

/**
 * Export data
 */
export const exportData = async (
  entries: DataHubEntry[],
  format: string
): Promise<Blob> => {
  if (USE_BACKEND && format === "XLSX") {
    try {
      const response = await fetch(`${API_BASE_URL}/data-hub/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries })
      });
      if (!response.ok) throw new Error("Failed to export");
      return await response.blob();
    } catch (error) {
      console.error("Backend export failed:", error);
      throw error;
    }
  }

  // Client-side export
  throw new Error("Client-side export not implemented for this format");
};

/**
 * Sync data to backend
 */
export const syncToBackend = async (): Promise<{ success: boolean; message: string }> => {
  if (!USE_BACKEND) {
    return { success: false, message: "Backend not configured" };
  }

  try {
    const localData = await fetchFromLocalStorage();
    const response = await fetch(`${API_BASE_URL}/data-hub/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: localData })
    });

    if (!response.ok) throw new Error("Sync failed");

    const result = await response.json();
    return { success: true, message: `Synced ${result.count} items` };
  } catch (error) {
    console.error("Sync to backend failed:", error);
    return { success: false, message: "Sync failed" };
  }
};

/**
 * Get storage key for data type
 */
const getStorageKey = (type: string): string => {
  switch (type) {
    case "Distance":
      return "gis_distance_measurements";
    case "Polygon":
      return "gis_polygons";
    case "Circle":
      return "gis_circles";
    case "Elevation":
      return "gis_elevation_profiles";
    case "Infrastructure":
      return "gis_infrastructures";
    case "SectorRF":
      return "gis_sector_rf";
    default:
      return "";
  }
};

/**
 * Check backend status
 */
export const checkBackendStatus = async (): Promise<boolean> => {
  if (!USE_BACKEND) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
};
