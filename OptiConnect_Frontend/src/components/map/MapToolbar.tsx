import React, { useState } from "react";
import { useAppDispatch } from "../../store";
import { setActiveGISTool } from "../../store/slices/mapSlice";
import type { GISToolType } from "../../types/gisTools.types";
import DistanceMeasurementTool from "../tools/DistanceMeasurementTool";
import PolygonDrawingTool from "../tools/PolygonDrawingTool";
import CircleDrawingTool from "../tools/CircleDrawingTool";
import ElevationProfileTool from "../tools/ElevationProfileTool";
import InfrastructureManagementTool from "../tools/InfrastructureManagementTool";
import SectorRFTool from "../tools/SectorRFTool";
// import DataHub from "../tools/DataHub";
import GlobalSearch from "../search/GlobalSearch";
import MapControlsPanel from "./MapControlsPanel";

interface MapToolbarProps {
  map: google.maps.Map | null;
  layersState: {
    Distance: { visible: boolean; count: number };
    Polygon: { visible: boolean; count: number };
    Circle: { visible: boolean; count: number };
    Elevation: { visible: boolean; count: number };
    Infrastructure: { visible: boolean; count: number };
    SectorRF: { visible: boolean; count: number };
  };
  onLayerToggle: (layer: string) => void;
  onOpenSettings?: () => void;
  onDataSaved?: () => void;
}

/**
 * Unified Map Toolbar - Horizontal layout with all controls
 * Contains: GIS Tools, Layers, Search, and Map Controls
 */
const MapToolbar: React.FC<MapToolbarProps> = ({
  map,
  layersState,
  onLayerToggle,
  onOpenSettings,
  onDataSaved
}) => {
  const dispatch = useAppDispatch();
  const [activeTool, setActiveTool] = useState<GISToolType | null>(null);
  const [showGISDropdown, setShowGISDropdown] = useState(false);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);
  // const [showDataHub, setShowDataHub] = useState(false);
  const gisDropdownRef = React.useRef<HTMLDivElement>(null);
  const layersDropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        gisDropdownRef.current &&
        !gisDropdownRef.current.contains(event.target as Node)
      ) {
        setShowGISDropdown(false);
      }
      if (
        layersDropdownRef.current &&
        !layersDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLayersDropdown(false);
      }
    };

    if (showGISDropdown || showLayersDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showGISDropdown, showLayersDropdown]);

  const tools = [
    {
      id: "distance" as GISToolType,
      name: "Distance Measurement",
      icon: "📏"
    },
    {
      id: "polygon" as GISToolType,
      name: "Polygon Drawing",
      icon: "⬡"
    },
    {
      id: "circle" as GISToolType,
      name: "Circle/Radius",
      icon: "○"
    },
    {
      id: "elevation" as GISToolType,
      name: "Elevation Profile",
      icon: "⛰️"
    },
    {
      id: "infrastructure" as GISToolType,
      name: "Infrastructure Mgmt",
      icon: "📡"
    },
    {
      id: "sectorRF" as GISToolType,
      name: "Sector RF Coverage",
      icon: "📶"
    }
  ];

  const handleToolSelect = (toolId: GISToolType) => {
    if (activeTool === toolId) {
      setActiveTool(null);
      dispatch(setActiveGISTool(null));
    } else {
      setActiveTool(toolId);
      dispatch(setActiveGISTool(toolId));
    }
    setShowGISDropdown(false);
  };

  // const handleDataHub = () => {
  //   setShowDataHub(true);
  //   setShowGISDropdown(false);
  // };

  const closeTool = () => {
    setActiveTool(null);
    dispatch(setActiveGISTool(null));
  };

  const layers = [
    {
      id: "Distance",
      name: "Distance",
      icon: "📏",
      count: layersState.Distance.count,
      visible: layersState.Distance.visible
    },
    {
      id: "Polygon",
      name: "Polygon",
      icon: "⬡",
      count: layersState.Polygon.count,
      visible: layersState.Polygon.visible
    },
    {
      id: "Circle",
      name: "Circle",
      icon: "○",
      count: layersState.Circle.count,
      visible: layersState.Circle.visible
    },
    {
      id: "Elevation",
      name: "Elevation",
      icon: "⛰️",
      count: layersState.Elevation.count,
      visible: layersState.Elevation.visible
    },
    {
      id: "Infrastructure",
      name: "Infrastructure",
      icon: "📡",
      count: layersState.Infrastructure.count,
      visible: layersState.Infrastructure.visible
    },
    {
      id: "SectorRF",
      name: "Sector RF",
      icon: "📶",
      count: layersState.SectorRF.count,
      visible: layersState.SectorRF.visible
    }
  ];

  return (
    <>
      {/* Unified Toolbar */}
      <div className="absolute top-2 left-12 right-4 z-40 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left Section: GIS Tools + Layers */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* GIS Tools Dropdown */}
          <div className="relative" ref={gisDropdownRef}>
            <button
              onClick={() => {
                setShowGISDropdown(!showGISDropdown);
                setShowLayersDropdown(false);
              }}
              className={`h-11 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                showGISDropdown ? "ring-2 ring-blue-500" : ""
              }`}
              title="GIS Analysis Suite"
            >
              <span className="text-lg">🎯</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                GIS Tools
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showGISDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* GIS Tools Dropdown Menu */}
            {showGISDropdown && (
              <div className="absolute top-12 left-0 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      activeTool === tool.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className="text-xl">{tool.icon}</span>
                    <span className="text-sm font-medium">{tool.name}</span>
                    {activeTool === tool.id && (
                      <svg
                        className="w-4 h-4 ml-auto"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700" />
                {/* <button
                  onClick={handleDataHub}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-xl">💾</span>
                  <span className="text-sm font-medium">Data Hub</span>
                </button> */}
              </div>
            )}
          </div>

          {/* Layers Dropdown */}
          <div className="relative" ref={layersDropdownRef}>
            <button
              onClick={() => {
                setShowLayersDropdown(!showLayersDropdown);
                setShowGISDropdown(false);
              }}
              className={`h-11 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                showLayersDropdown ? "ring-2 ring-blue-500" : ""
              }`}
              title="Map Layers Control"
            >
              <span className="text-lg">📊</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Layers
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  showLayersDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Layers Dropdown Menu */}
            {showLayersDropdown && (
              <div className="absolute top-12 left-0 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => onLayerToggle(layer.id)}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-lg">{layer.icon}</span>
                    <span className="text-sm font-medium flex-1">
                      {layer.name} ({layer.count})
                    </span>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center ${
                        layer.visible
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 dark:bg-gray-600"
                      }`}
                    >
                      {layer.visible && (
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Center Section: Global Search */}
          <div className="flex-1 max-w-lg pointer-events-auto">
            <GlobalSearch map={map} />
          </div>
          {/* Right Section: Map Controls */}
          <div className="pointer-events-auto">
            <MapControlsPanel map={map} onOpenSettings={onOpenSettings} />
          </div>
        </div>
      </div>

      {/* Tool Components */}
      {activeTool === "distance" && (
        <DistanceMeasurementTool
          map={map}
          onSave={onDataSaved}
          onClose={closeTool}
        />
      )}
      {activeTool === "polygon" && (
        <PolygonDrawingTool
          map={map}
          onSave={onDataSaved}
          onClose={closeTool}
        />
      )}
      {activeTool === "circle" && (
        <CircleDrawingTool map={map} onSave={onDataSaved} onClose={closeTool} />
      )}
      {activeTool === "elevation" && (
        <ElevationProfileTool
          map={map}
          onSave={onDataSaved}
          onClose={closeTool}
        />
      )}
      {activeTool === "infrastructure" && (
        <InfrastructureManagementTool
          map={map}
          onSave={onDataSaved}
          onClose={closeTool}
        />
      )}
      {activeTool === "sectorRF" && (
        <SectorRFTool map={map} onSave={onDataSaved} onClose={closeTool} />
      )}
      {/* {showDataHub && (
        <DataHub map={map} onClose={() => setShowDataHub(false)} />
      )} */}
    </>
  );
};

export default MapToolbar;
