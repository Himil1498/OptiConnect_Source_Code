import React, { useState, useEffect } from "react";
import { fetchAllData } from "../../services/dataHubService";
import type { DataHubEntry } from "../../types/gisTools.types";

interface LayerManagerProps {
  map: google.maps.Map | null;
  onClose?: () => void;
}

interface LayerState {
  visible: boolean;
  count: number;
  overlays: google.maps.MVCObject[];
}

interface LayersState {
  Distance: LayerState;
  Polygon: LayerState;
  Circle: LayerState;
  Elevation: LayerState;
  Infrastructure: LayerState;
}

/**
 * Layer Manager - Control visibility and management of all map layers
 */
const LayerManager: React.FC<LayerManagerProps> = ({ map, onClose }) => {
  const [layers, setLayers] = useState<LayersState>({
    Distance: { visible: false, count: 0, overlays: [] },
    Polygon: { visible: false, count: 0, overlays: [] },
    Circle: { visible: false, count: 0, overlays: [] },
    Elevation: { visible: false, count: 0, overlays: [] },
    Infrastructure: { visible: false, count: 0, overlays: [] }
  });

  const [entries, setEntries] = useState<DataHubEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(true);

  // Load all data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchAllData();
    setEntries(data);

    // Update counts
    const newLayers = { ...layers };
    newLayers.Distance.count = data.filter((e) => e.type === "Distance").length;
    newLayers.Polygon.count = data.filter((e) => e.type === "Polygon").length;
    newLayers.Circle.count = data.filter((e) => e.type === "Circle").length;
    newLayers.Elevation.count = data.filter(
      (e) => e.type === "Elevation"
    ).length;
    newLayers.Infrastructure.count = data.filter(
      (e) => e.type === "Infrastructure"
    ).length;
    setLayers(newLayers);
  };

  /**
   * Toggle layer visibility
   */
  const toggleLayer = (type: keyof LayersState) => {
    if (!map) return;

    const newLayers = { ...layers };
    const isCurrentlyVisible = newLayers[type].visible;

    if (isCurrentlyVisible) {
      // Hide layer - remove all overlays
      clearLayer(type);
      newLayers[type].visible = false;
    } else {
      // Show layer - create all overlays
      const typeEntries = entries.filter((e) => e.type === type);
      const overlays = createOverlays(type, typeEntries);
      newLayers[type].overlays = overlays;
      newLayers[type].visible = true;

      // Fit bounds if overlays exist
      if (overlays.length > 0) {
        fitBoundsToLayer(type);
      }
    }

    setLayers(newLayers);
  };

  /**
   * Create overlays for a specific layer type
   */
  const createOverlays = (
    type: keyof LayersState,
    typeEntries: DataHubEntry[]
  ): google.maps.MVCObject[] => {
    if (!map) return [];

    const overlays: google.maps.MVCObject[] = [];

    typeEntries.forEach((entry) => {
      switch (type) {
        case "Infrastructure": {
          const coordinates = (entry.data as any).coordinates;
          if (coordinates) {
            const marker = new google.maps.Marker({
              position: coordinates,
              map: map,
              title: entry.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#EF4444",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2
              }
            });

            const infraData = entry.data as any;
            const infoContent = `
              <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 20px; margin-right: 8px;">🏢</span>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${
                      entry.name
                    }</h3>
                  </div>
                  <p style="margin: 0; font-size: 12px; opacity: 0.9;">Infrastructure</p>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                    <span style="color: #6B7280; font-weight: 500;">📍 Type:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      infraData.type || "N/A"
                    }</span>

                    <span style="color: #6B7280; font-weight: 500;">🔢 Unique ID:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      infraData.uniqueId || "N/A"
                    }</span>

                    <span style="color: #6B7280; font-weight: 500;">🌐 Network ID:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      infraData.networkId || "N/A"
                    }</span>

                    <span style="color: #6B7280; font-weight: 500;">📌 Coordinates:</span>
                    <span style="color: #1F2937; font-weight: 600; font-family: monospace;">${coordinates.lat.toFixed(
                      6
                    )}, ${coordinates.lng.toFixed(6)}</span>
                  </div>
                </div>
                ${
                  infraData.address
                    ? `
                  <div style="background: #EFF6FF; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #3B82F6;">
                    <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📫 Address:</strong><br/>${infraData.address}</p>
                  </div>
                `
                    : ""
                }
                ${
                  infraData.contactPerson
                    ? `
                  <div style="background: #F0FDF4; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #10B981;">
                    <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>👤 Contact:</strong> ${
                      infraData.contactPerson
                    }</p>
                    ${
                      infraData.contactNumber
                        ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #1F2937;"><strong>📞 Phone:</strong> ${infraData.contactNumber}</p>`
                        : ""
                    }
                  </div>
                `
                    : ""
                }
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
            marker.addListener("click", () => infoWindow.open(map, marker));

            overlays.push(marker);
          }
          break;
        }

        case "Circle": {
          const center = (entry.data as any).center;
          const radius = (entry.data as any).radius;
          if (center && radius) {
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

            const area = Math.PI * radius * radius;
            const circumference = 2 * Math.PI * radius;
            const infoContent = `
              <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 20px; margin-right: 8px;">⭕</span>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${
                      entry.name
                    }</h3>
                  </div>
                  <p style="margin: 0; font-size: 12px; opacity: 0.9;">Circle / Radius</p>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                    <span style="color: #6B7280; font-weight: 500;">📏 Radius:</span>
                    <span style="color: #1F2937; font-weight: 600;">${(
                      radius / 1000
                    ).toFixed(2)} km (${radius.toFixed(0)} m)</span>

                    <span style="color: #6B7280; font-weight: 500;">📐 Area:</span>
                    <span style="color: #1F2937; font-weight: 600;">${(
                      area / 1000000
                    ).toFixed(2)} km²</span>

                    <span style="color: #6B7280; font-weight: 500;">🔄 Circumference:</span>
                    <span style="color: #1F2937; font-weight: 600;">${(
                      circumference / 1000
                    ).toFixed(2)} km</span>

                    <span style="color: #6B7280; font-weight: 500;">📌 Center:</span>
                    <span style="color: #1F2937; font-weight: 600; font-family: monospace;">${center.lat.toFixed(
                      6
                    )}, ${center.lng.toFixed(6)}</span>
                  </div>
                </div>
                ${
                  (entry.data as any).description
                    ? `
                  <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
                    <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${
                      (entry.data as any).description
                    }</p>
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
            marker.addListener("click", () => infoWindow.open(map, marker));

            overlays.push(circle, marker);
          }
          break;
        }

        case "Distance": {
          const points = (entry.data as any).points;
          if (points && points.length > 0) {
            // Draw the polyline
            const polyline = new google.maps.Polyline({
              map: map,
              path: points,
              strokeColor: "#3B82F6",
              strokeOpacity: 1.0,
              strokeWeight: 3
            });

            overlays.push(polyline);

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
                overlays.push(pointMarker);
              }
            );

            // Add info marker at midpoint
            const distanceData = entry.data as any;
            const totalDistance = distanceData.totalDistance || 0;
            const midIndex = Math.floor(points.length / 2);
            const midPoint = points[midIndex];

            const infoContent = `
              <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
                <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 20px; margin-right: 8px;">📏</span>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${
                      entry.name
                    }</h3>
                  </div>
                  <p style="margin: 0; font-size: 12px; opacity: 0.9;">Distance Measurement</p>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                    <span style="color: #6B7280; font-weight: 500;">📍 Total Distance:</span>
                    <span style="color: #1F2937; font-weight: 600; font-size: 16px; color: #3B82F6;">${totalDistance.toFixed(
                      2
                    )} km</span>

                    <span style="color: #6B7280; font-weight: 500;">🔢 Points:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      points.length
                    }</span>

                    <span style="color: #6B7280; font-weight: 500;">➡️ Segments:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      points.length - 1
                    }</span>
                  </div>
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

            const infoMarker = new google.maps.Marker({
              position: midPoint,
              map: map,
              title: entry.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: "#1E40AF",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2
              },
              label: {
                text: "ℹ️",
                color: "#FFFFFF",
                fontSize: "12px"
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent
            });
            infoMarker.addListener("click", () =>
              infoWindow.open(map, infoMarker)
            );

            overlays.push(infoMarker);
          }
          break;
        }

        case "Polygon": {
          const vertices =
            (entry.data as any).vertices || (entry.data as any).path;
          if (vertices && vertices.length > 0) {
            const polygonData = entry.data as any;
            const polygon = new google.maps.Polygon({
              map: map,
              paths: vertices,
              fillColor: polygonData.color || "#10B981",
              fillOpacity: polygonData.fillOpacity || 0.35,
              strokeColor: polygonData.color || "#10B981",
              strokeOpacity: 0.8,
              strokeWeight: polygonData.strokeWeight || 2
            });

            overlays.push(polygon);

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
                overlays.push(vertexMarker);
              }
            );

            // Calculate center for info marker
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
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 20px; margin-right: 8px;">⬟</span>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${
                      entry.name
                    }</h3>
                  </div>
                  <p style="margin: 0; font-size: 12px; opacity: 0.9;">Polygon</p>
                </div>
                <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                    <span style="color: #6B7280; font-weight: 500;">📐 Area:</span>
                    <span style="color: #1F2937; font-weight: 600; font-size: 16px; color: #10B981;">${
                      area < 10000
                        ? `${area.toFixed(2)} m²`
                        : area < 1000000
                        ? `${(area / 10000).toFixed(2)} hectares`
                        : `${(area / 1000000).toFixed(2)} km²`
                    }</span>

                    <span style="color: #6B7280; font-weight: 500;">📏 Perimeter:</span>
                    <span style="color: #1F2937; font-weight: 600;">${(
                      perimeter / 1000
                    ).toFixed(2)} km</span>

                    <span style="color: #6B7280; font-weight: 500;">🔢 Vertices:</span>
                    <span style="color: #1F2937; font-weight: 600;">${
                      vertices.length
                    }</span>
                  </div>
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

            const infoMarker = new google.maps.Marker({
              position: center,
              map: map,
              title: entry.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: "#047857",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2
              },
              label: {
                text: "ℹ️",
                color: "#FFFFFF",
                fontSize: "12px"
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent
            });
            infoMarker.addListener("click", () =>
              infoWindow.open(map, infoMarker)
            );

            overlays.push(infoMarker);
          }
          break;
        }

        case "Elevation": {
          const points = (entry.data as any).points;
          if (points && points.length > 0) {
            // Draw the polyline
            const polyline = new google.maps.Polyline({
              map: map,
              path: points,
              strokeColor: "#F59E0B",
              strokeOpacity: 1.0,
              strokeWeight: 3
            });

            overlays.push(polyline);

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
                overlays.push(pointMarker);
              }
            );

            // Add info marker at midpoint
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
                <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
                  <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 20px; margin-right: 8px;">📈</span>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${
                      entry.name
                    }</h3>
                  </div>
                  <p style="margin: 0; font-size: 12px; opacity: 0.9;">Elevation Profile</p>
                </div>

                <!-- Elevation Chart -->
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

            const infoMarker = new google.maps.Marker({
              position: midPoint,
              map: map,
              title: entry.name,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 9,
                fillColor: "#C2410C",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2
              },
              label: {
                text: "ℹ️",
                color: "#FFFFFF",
                fontSize: "12px"
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: infoContent
            });
            infoMarker.addListener("click", () =>
              infoWindow.open(map, infoMarker)
            );

            overlays.push(infoMarker);
          }
          break;
        }
      }
    });

    return overlays;
  };

  /**
   * Clear specific layer
   */
  const clearLayer = (type: keyof LayersState) => {
    const layer = layers[type];
    layer.overlays.forEach((overlay) => {
      if (overlay instanceof google.maps.Marker) {
        overlay.setMap(null);
      } else if (overlay instanceof google.maps.Polyline) {
        overlay.setMap(null);
      } else if (overlay instanceof google.maps.Polygon) {
        overlay.setMap(null);
      } else if (overlay instanceof google.maps.Circle) {
        overlay.setMap(null);
      }
    });

    const newLayers = { ...layers };
    newLayers[type].overlays = [];
    newLayers[type].visible = false;
    setLayers(newLayers);
  };

  /**
   * Clear all layers and reset to India view
   */
  const clearAllLayers = () => {
    Object.keys(layers).forEach((key) => {
      clearLayer(key as keyof LayersState);
    });

    // Reset map to India view
    if (map) {
      map.setCenter({ lat: 20.5937, lng: 78.9629 }); // Center of India
      map.setZoom(5); // Show full India
    }
  };

  /**
   * Fit map bounds to show all overlays of a layer
   */
  const fitBoundsToLayer = (type: keyof LayersState) => {
    if (!map) return;

    const typeEntries = entries.filter((e) => e.type === type);
    if (typeEntries.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    typeEntries.forEach((entry) => {
      switch (type) {
        case "Infrastructure": {
          const coords = (entry.data as any).coordinates;
          if (coords) bounds.extend(coords);
          break;
        }
        case "Circle": {
          const center = (entry.data as any).center;
          const radius = (entry.data as any).radius;
          if (center && radius) {
            const earthRadius = 6371000;
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
          }
          break;
        }
        case "Distance":
        case "Elevation": {
          const points = (entry.data as any).points;
          if (points)
            points.forEach((p: google.maps.LatLngLiteral) => bounds.extend(p));
          break;
        }
        case "Polygon": {
          const vertices =
            (entry.data as any).vertices || (entry.data as any).path;
          if (vertices)
            vertices.forEach((v: google.maps.LatLngLiteral) =>
              bounds.extend(v)
            );
          break;
        }
      }
    });

    map.fitBounds(bounds);
  };

  /**
   * Show all layers at once
   */
  const showAllLayers = () => {
    Object.keys(layers).forEach((key) => {
      const type = key as keyof LayersState;
      if (layers[type].count > 0 && !layers[type].visible) {
        toggleLayer(type);
      }
    });
  };

  const layerConfig = [
    {
      type: "Distance" as const,
      color: "blue",
      icon: "📏",
      name: "Distance Measurements"
    },
    { type: "Polygon" as const, color: "green", icon: "⬟", name: "Polygons" },
    { type: "Circle" as const, color: "purple", icon: "⭕", name: "Circles" },
    {
      type: "Elevation" as const,
      color: "orange",
      icon: "📈",
      name: "Elevation Profiles"
    },
    {
      type: "Infrastructure" as const,
      color: "red",
      icon: "🏢",
      name: "Infrastructure"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
      green:
        "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
      purple:
        "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
      orange:
        "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
      red: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-10 overflow-hidden w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
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
          Map Layers Control
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <svg
              className={`w-5 h-5 transition-transform ${
                isMinimized ? "rotate-180" : ""
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
        </div>
      </div>

      {/* Layer Controls */}
      {!isMinimized && (
        <div className="p-3 space-y-2 max-w-xs">
          {/* Layer List */}
          {layerConfig.map((config) => (
            <div
              key={config.type}
              className={`flex items-center justify-between p-2 rounded-lg ${getColorClasses(
                config.color
              )}`}
            >
              <div className="flex items-center space-x-2 flex-1">
                <span className="text-lg">{config.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{config.name}</p>
                  <p className="text-xs opacity-75">
                    {layers[config.type].count} items
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => toggleLayer(config.type)}
                  className={`px-3 py-1 text-xs rounded-md ${
                    layers[config.type].visible
                      ? "bg-white dark:bg-gray-700 shadow-sm font-medium"
                      : "bg-white/50 dark:bg-gray-700/50"
                  }`}
                  disabled={layers[config.type].count === 0}
                  title={layers[config.type].visible ? "Hide" : "Show"}
                >
                  {layers[config.type].visible ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => clearLayer(config.type)}
                  className="p-1 text-xs hover:bg-white/50 dark:hover:bg-gray-700/50 rounded"
                  disabled={!layers[config.type].visible}
                  title="Clear"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={showAllLayers}
              className="w-full px-3 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 font-medium"
            >
              Show All Layers
            </button>
            <button
              onClick={clearAllLayers}
              className="w-full px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md font-medium flex items-center justify-center"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear All Layers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerManager;
