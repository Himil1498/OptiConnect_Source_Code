/**
 * Map Visualization Utilities
 * Shared logic for visualizing GIS data on the map
 */

interface DataEntry {
  id: string;
  type: string;
  name: string;
  createdAt: Date;
  data: any;
}

interface BookmarkService {
  addBookmark: (bookmark: any) => void;
  deleteBookmark: (id: string) => boolean;
}

/**
 * Create full elevation graph modal
 */
function createElevationModal(entry: DataEntry, elevationData: any[], minElev: number, maxElev: number) {
  // Create modal overlay
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 900px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  const elevRange = maxElev - minElev || 1;
  const chartWidth = 800;
  const chartHeight = 400;

  // Build elevation chart path
  const chartPoints = elevationData.map((point: any, i: number) => {
    const x = (i / (elevationData.length - 1)) * chartWidth;
    const normalizedElev = (point.elevation - minElev) / elevRange;
    const y = chartHeight - (normalizedElev * (chartHeight - 40) + 20);
    return `${x},${y}`;
  }).join(" ");

  // Build area fill path
  const areaPath = `0,${chartHeight} ${chartPoints} ${chartWidth},${chartHeight}`;

  // Calculate statistics
  const totalDistance = entry.data.distance || 0;
  const elevationGain = entry.data.elevationGain || 0;
  const elevationLoss = entry.data.elevationLoss || 0;
  const avgGrade = totalDistance > 0 ? ((elevationGain / (totalDistance * 1000)) * 100) : 0;

  modalContent.innerHTML = `
    <div style="background: linear-gradient(135deg, #C2410C 0%, #9A3412 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">⛰️ ${entry.name}</h2>
          <p style="margin: 0; font-size: 14px; opacity: 0.9;">Elevation Profile Analysis</p>
        </div>
        <button id="close-modal" style="background: rgba(255, 255, 255, 0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
          ×
        </button>
      </div>
    </div>

    <div style="padding: 24px;">
      <!-- Statistics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); padding: 16px; border-radius: 8px; border-left: 4px solid #C2410C;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9A3412; font-weight: 600; text-transform: uppercase;">Distance</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #C2410C;">${(totalDistance / 1000).toFixed(2)} km</p>
        </div>
        <div style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); padding: 16px; border-radius: 8px; border-left: 4px solid #16A34A;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #15803D; font-weight: 600; text-transform: uppercase;">Elevation Gain</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #16A34A;">${elevationGain.toFixed(0)} m</p>
        </div>
        <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); padding: 16px; border-radius: 8px; border-left: 4px solid #DC2626;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #991B1B; font-weight: 600; text-transform: uppercase;">Elevation Loss</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #DC2626;">${elevationLoss.toFixed(0)} m</p>
        </div>
        <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: 16px; border-radius: 8px; border-left: 4px solid #2563EB;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #1E40AF; font-weight: 600; text-transform: uppercase;">Avg Grade</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #2563EB;">${avgGrade.toFixed(1)}%</p>
        </div>
      </div>

      <!-- Elevation Range -->
      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <div style="flex: 1; background: #F9FAFB; padding: 12px; border-radius: 8px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280; font-weight: 600;">⬆️ Highest Point</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1F2937;">${maxElev.toFixed(1)} m</p>
        </div>
        <div style="flex: 1; background: #F9FAFB; padding: 12px; border-radius: 8px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280; font-weight: 600;">⬇️ Lowest Point</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1F2937;">${minElev.toFixed(1)} m</p>
        </div>
        <div style="flex: 1; background: #F9FAFB; padding: 12px; border-radius: 8px;">
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280; font-weight: 600;">📊 Total Climb</p>
          <p style="margin: 0; font-size: 18px; font-weight: 700; color: #1F2937;">${(maxElev - minElev).toFixed(1)} m</p>
        </div>
      </div>

      <!-- Elevation Graph -->
      <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #E5E7EB; margin-bottom: 16px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1F2937;">📊 Elevation Profile</h3>
        <div style="overflow-x: auto;">
          <svg width="${chartWidth}" height="${chartHeight + 60}" style="display: block;">
            <!-- Grid lines -->
            ${[0, 0.25, 0.5, 0.75, 1].map(ratio => `
              <line x1="0" y1="${20 + (chartHeight - 40) * ratio}" x2="${chartWidth}" y2="${20 + (chartHeight - 40) * ratio}"
                    stroke="#E5E7EB" stroke-width="1" stroke-dasharray="4,4"/>
              <text x="-5" y="${20 + (chartHeight - 40) * ratio + 4}"
                    fill="#6B7280" font-size="11px" text-anchor="end">
                ${(maxElev - elevRange * ratio).toFixed(0)}m
              </text>
            `).join('')}

            <!-- Area fill -->
            <polygon points="${areaPath}" fill="url(#elevGradient)" opacity="0.3"/>

            <!-- Elevation line -->
            <polyline points="${chartPoints}" fill="none" stroke="#C2410C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>

            <!-- Data points -->
            ${elevationData.map((point: any, i: number) => {
              const x = (i / (elevationData.length - 1)) * chartWidth;
              const normalizedElev = (point.elevation - minElev) / elevRange;
              const y = chartHeight - (normalizedElev * (chartHeight - 40) + 20);
              return i % Math.ceil(elevationData.length / 20) === 0 ?
                `<circle cx="${x}" cy="${y}" r="4" fill="#C2410C" stroke="white" stroke-width="2"/>` : '';
            }).join('')}

            <!-- Gradient definition -->
            <defs>
              <linearGradient id="elevGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#C2410C;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#FED7AA;stop-opacity:0.3" />
              </linearGradient>
            </defs>

            <!-- X-axis labels -->
            ${[0, 0.25, 0.5, 0.75, 1].map(ratio => `
              <text x="${chartWidth * ratio}" y="${chartHeight + 40}"
                    fill="#6B7280" font-size="11px" text-anchor="middle">
                ${((totalDistance / 1000) * ratio).toFixed(1)} km
              </text>
            `).join('')}
          </svg>
        </div>
        <p style="margin: 12px 0 0 0; text-align: center; font-size: 12px; color: #6B7280;">Distance (km) →</p>
      </div>

      ${entry.data.description ? `
      <div style="background: #FEF3C7; padding: 16px; border-radius: 8px; border-left: 4px solid #F59E0B; margin-bottom: 16px;">
        <p style="margin: 0; font-size: 14px; color: #78350F;"><strong>📝 Description:</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #92400E;">${entry.data.description}</p>
      </div>
      ` : ""}

      <div style="border-top: 2px solid #E5E7EB; padding-top: 16px; margin-top: 16px;">
        <p style="margin: 0; font-size: 12px; color: #9CA3AF; text-align: center;">
          ⏰ Created: ${new Date(entry.createdAt).toLocaleString()} • ${elevationData.length} data points
        </p>
      </div>
    </div>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  // Close modal handlers
  const closeModal = () => {
    document.body.removeChild(modalOverlay);
  };

  const closeBtn = modalContent.querySelector('#close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    (closeBtn as HTMLElement).addEventListener('mouseenter', () => {
      (closeBtn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.3)';
    });
    (closeBtn as HTMLElement).addEventListener('mouseleave', () => {
      (closeBtn as HTMLElement).style.background = 'rgba(255, 255, 255, 0.2)';
    });
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Close on Escape key
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);
}

/**
 * Create map overlays and info windows for a data entry
 * Returns array of overlays that can be removed later
 */
export function createVisualizationForEntry(
  entry: DataEntry,
  map: google.maps.Map,
  bookmarkService?: BookmarkService
): google.maps.MVCObject[] {
  const overlays: google.maps.MVCObject[] = [];

  // Helper function to create bookmark button HTML
  const createBookmarkButton = (entryId: string) => {
    if (!bookmarkService) return '';
    return `
      <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
        <button id="bookmark-btn-${entryId}" style="padding: 8px 16px; font-size: 13px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">
          ⭐ Bookmark
        </button>
      </div>
    `;
  };

  switch (entry.type) {
    case "Infrastructure": {
      const infraData = entry.data as any;
      const coordinates = infraData.coordinates || infraData.location || { lat: 0, lng: 0 };

      const marker = new google.maps.Marker({
        map: map,
        position: coordinates,
        title: entry.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#10B981",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2
        },
        label: {
          text: "🏢",
          color: "#FFFFFF",
          fontSize: "14px"
        }
      });

      // Format address
      let addressDisplay = "";
      if (infraData.address) {
        if (typeof infraData.address === "object") {
          const addr = infraData.address;
          addressDisplay = [addr.street, addr.city, addr.state, addr.pincode]
            .filter(Boolean)
            .join(", ");
        } else {
          addressDisplay = infraData.address;
        }
      }

      const infoContent = `
        <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 20px; margin-right: 8px;">🏢</span>
              <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${entry.name}</h3>
            </div>
            <p style="margin: 0; font-size: 12px; opacity: 0.9;">Infrastructure</p>
          </div>
          <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
              <span style="color: #6B7280; font-weight: 500;">📍 Type:</span>
              <span style="color: #1F2937; font-weight: 600;">${infraData.type || "N/A"}</span>

              <span style="color: #6B7280; font-weight: 500;">🔢 Unique ID:</span>
              <span style="color: #1F2937; font-weight: 600;">${infraData.uniqueId || "N/A"}</span>

              <span style="color: #6B7280; font-weight: 500;">🌐 Network ID:</span>
              <span style="color: #1F2937; font-weight: 600;">${infraData.networkId || "N/A"}</span>

              <span style="color: #6B7280; font-weight: 500;">📌 Coordinates:</span>
              <span style="color: #1F2937; font-weight: 600; font-family: monospace;">${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}</span>
            </div>
          </div>
          ${addressDisplay ? `
          <div style="background: #EFF6FF; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #3B82F6;">
            <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📫 Address:</strong><br/>${addressDisplay}</p>
          </div>
          ` : ""}
          ${infraData.contactPerson ? `
          <div style="background: #F0FDF4; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #10B981;">
            <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>👤 Contact:</strong> ${infraData.contactPerson}</p>
            ${infraData.contactNumber ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #1F2937;"><strong>📞 Phone:</strong> ${infraData.contactNumber}</p>` : ""}
          </div>
          ` : ""}
          ${infraData.description || infraData.notes ? `
          <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
            <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${infraData.description || infraData.notes}</p>
          </div>
          ` : ""}
          ${createBookmarkButton(entry.id)}
          <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
            <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(entry.createdAt).toLocaleString()}</p>
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({ content: infoContent });
      marker.addListener("click", () => infoWindow.open(map, marker));
      infoWindow.open(map, marker); // Auto-open

      // Add bookmark functionality
      if (bookmarkService) {
        google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const bookmarkBtn = document.getElementById(`bookmark-btn-${entry.id}`);
          if (bookmarkBtn) {
            bookmarkBtn.addEventListener("click", () => {
              bookmarkService.addBookmark({
                name: entry.name,
                type: "Infrastructure",
                location: coordinates,
                description: infraData.description || infraData.notes
              });
              alert("✅ Bookmark added successfully!");
            });
          }
        });
      }

      overlays.push(marker);
      break;
    }

    case "Circle": {
      const center = entry.data.center;
      const radius = entry.data.radius;
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
            scale: 8,
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
                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${entry.name}</h3>
              </div>
              <p style="margin: 0; font-size: 12px; opacity: 0.9;">Circle</p>
            </div>
            <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                <span style="color: #6B7280; font-weight: 500;">🔵 Radius:</span>
                <span style="color: #1F2937; font-weight: 600;">${(radius / 1000).toFixed(2)} km</span>

                <span style="color: #6B7280; font-weight: 500;">📐 Area:</span>
                <span style="color: #1F2937; font-weight: 600;">${(area / 1000000).toFixed(2)} km²</span>

                <span style="color: #6B7280; font-weight: 500;">🔄 Circumference:</span>
                <span style="color: #1F2937; font-weight: 600;">${(circumference / 1000).toFixed(2)} km</span>

                <span style="color: #6B7280; font-weight: 500;">📌 Center:</span>
                <span style="color: #1F2937; font-weight: 600; font-family: monospace;">${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}</span>
              </div>
            </div>
            ${entry.data.description ? `
            <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
              <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${entry.data.description}</p>
            </div>
            ` : ""}
            <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({ content: infoContent });
        marker.addListener("click", () => infoWindow.open(map, marker));
        infoWindow.open(map, marker); // Auto-open

        overlays.push(circle, marker);
      }
      break;
    }

    case "Distance": {
      const points = entry.data.points;
      if (points && points.length > 0) {
        // Draw polyline
        const polyline = new google.maps.Polyline({
          map: map,
          path: points,
          strokeColor: "#3B82F6",
          strokeOpacity: 1.0,
          strokeWeight: 3
        });
        overlays.push(polyline);

        // Add numbered markers
        points.forEach((point: google.maps.LatLngLiteral, index: number) => {
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
        });

        // Info marker at midpoint
        const totalDistance = entry.data.totalDistance || 0;
        const midIndex = Math.floor(points.length / 2);
        const midPoint = points[midIndex];

        const infoContent = `
          <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 20px; margin-right: 8px;">📏</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${entry.name}</h3>
              </div>
              <p style="margin: 0; font-size: 12px; opacity: 0.9;">Distance Measurement</p>
            </div>
            <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                <span style="color: #6B7280; font-weight: 500;">📏 Total Distance:</span>
                <span style="color: #1F2937; font-weight: 600;">${(totalDistance / 1000).toFixed(2)} km</span>

                <span style="color: #6B7280; font-weight: 500;">📍 Points:</span>
                <span style="color: #1F2937; font-weight: 600;">${points.length}</span>
              </div>
            </div>
            ${entry.data.description ? `
            <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
              <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${entry.data.description}</p>
            </div>
            ` : ""}
            <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(entry.createdAt).toLocaleString()}</p>
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

        const infoWindow = new google.maps.InfoWindow({ content: infoContent });
        infoMarker.addListener("click", () => infoWindow.open(map, infoMarker));
        infoWindow.open(map, infoMarker); // Auto-open

        overlays.push(infoMarker);
      }
      break;
    }

    case "Polygon": {
      const vertices = entry.data.vertices || entry.data.path || [];
      if (vertices && vertices.length > 0) {
        const polygonData = entry.data;
        const polygon = new google.maps.Polygon({
          map: map,
          paths: vertices,
          fillColor: polygonData.color || "#F59E0B",
          fillOpacity: polygonData.fillOpacity || 0.35,
          strokeColor: polygonData.color || "#F59E0B",
          strokeOpacity: 0.8,
          strokeWeight: polygonData.strokeWeight || 2
        });
        overlays.push(polygon);

        // Calculate center
        let latSum = 0, lngSum = 0;
        vertices.forEach((p: google.maps.LatLngLiteral) => {
          latSum += p.lat;
          lngSum += p.lng;
        });
        const center = { lat: latSum / vertices.length, lng: lngSum / vertices.length };

        const area = entry.data.area || 0;
        const perimeter = entry.data.perimeter || 0;

        const infoContent = `
          <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 20px; margin-right: 8px;">⬟</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${entry.name}</h3>
              </div>
              <p style="margin: 0; font-size: 12px; opacity: 0.9;">Polygon</p>
            </div>
            <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                <span style="color: #6B7280; font-weight: 500;">📐 Area:</span>
                <span style="color: #1F2937; font-weight: 600;">${(area / 1000000).toFixed(2)} km²</span>

                <span style="color: #6B7280; font-weight: 500;">📏 Perimeter:</span>
                <span style="color: #1F2937; font-weight: 600;">${(perimeter / 1000).toFixed(2)} km</span>

                <span style="color: #6B7280; font-weight: 500;">📍 Vertices:</span>
                <span style="color: #1F2937; font-weight: 600;">${vertices.length}</span>
              </div>
            </div>
            ${entry.data.description ? `
            <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
              <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${entry.data.description}</p>
            </div>
            ` : ""}
            <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          </div>
        `;

        const marker = new google.maps.Marker({
          position: center,
          map: map,
          title: entry.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#F59E0B",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2
          }
        });

        const infoWindow = new google.maps.InfoWindow({ content: infoContent });
        marker.addListener("click", () => infoWindow.open(map, marker));
        infoWindow.open(map, marker); // Auto-open

        overlays.push(marker);
      }
      break;
    }

    case "Bookmark": {
      const location = entry.data.location;
      if (location) {
        const marker = new google.maps.Marker({
          map: map,
          position: location,
          title: entry.name,
          animation: google.maps.Animation.DROP,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#F59E0B",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2
          },
          label: {
            text: "⭐",
            color: "#FFFFFF",
            fontSize: "14px"
          }
        });

        const infoContent = `
          <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 20px; margin-right: 8px;">⭐</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${entry.name}</h3>
              </div>
              <p style="margin: 0; font-size: 12px; opacity: 0.9;">Bookmarked Location</p>
            </div>
            ${entry.data.description ? `
            <div style="background: #EFF6FF; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #3B82F6;">
              <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${entry.data.description}</p>
            </div>
            ` : ""}
            ${entry.data.category ? `
            <div style="background: #F0FDF4; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>🏷️ Category:</strong> ${entry.data.category}</p>
            </div>
            ` : ""}
            <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                <span style="color: #6B7280; font-weight: 500;">📌 Coordinates:</span>
                <span style="color: #1F2937; font-weight: 600; font-family: monospace;">${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}</span>
              </div>
            </div>
            <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
              <button id="delete-bookmark-${entry.id}" style="padding: 8px 16px; font-size: 13px; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">
                🗑️ Delete
              </button>
            </div>
            <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(entry.createdAt).toLocaleString()}</p>
            </div>
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({ content: infoContent });
        marker.addListener("click", () => infoWindow.open(map, marker));
        infoWindow.open(map, marker); // Auto-open

        // Add delete functionality
        if (bookmarkService) {
          google.maps.event.addListenerOnce(infoWindow, "domready", () => {
            const deleteBtn = document.getElementById(`delete-bookmark-${entry.id}`);
            if (deleteBtn) {
              deleteBtn.addEventListener("click", () => {
                // Create custom confirmation dialog
                const confirmDialog = document.createElement('div');
                confirmDialog.style.cssText = `
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: rgba(0, 0, 0, 0.5);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 10000;
                  backdrop-filter: blur(4px);
                `;

                confirmDialog.innerHTML = `
                  <div style="background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); max-width: 400px; width: 90%; font-family: system-ui, -apple-system, sans-serif;">
                    <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 32px;">⚠️</span>
                        <div>
                          <h3 style="margin: 0; font-size: 20px; font-weight: 700;">Delete Bookmark</h3>
                          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">This action cannot be undone</p>
                        </div>
                      </div>
                    </div>
                    <div style="padding: 24px;">
                      <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151;">
                        Are you sure you want to delete the bookmark <strong>"${entry.name}"</strong>?
                      </p>
                      <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button id="cancel-delete" style="padding: 10px 20px; font-size: 14px; background: #F3F4F6; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                          Cancel
                        </button>
                        <button id="confirm-delete" style="padding: 10px 20px; font-size: 14px; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                `;

                document.body.appendChild(confirmDialog);

                const confirmBtn = confirmDialog.querySelector('#confirm-delete');
                const cancelBtn = confirmDialog.querySelector('#cancel-delete');

                const removeDialog = () => {
                  document.body.removeChild(confirmDialog);
                };

                confirmBtn?.addEventListener('click', () => {
                  bookmarkService.deleteBookmark(entry.id);
                  marker.setMap(null);
                  infoWindow.close();
                  removeDialog();
                  // Trigger a custom event to notify GlobalSearch to reload bookmarks
                  window.dispatchEvent(new CustomEvent('bookmarkDeleted'));
                });

                cancelBtn?.addEventListener('click', removeDialog);
                confirmDialog.addEventListener('click', (e) => {
                  if (e.target === confirmDialog) removeDialog();
                });
              });
            }
          });
        }

        overlays.push(marker);
      }
      break;
    }

    case "Elevation": {
      const points = entry.data.points;
      if (points && points.length > 0) {
        // Draw polyline
        const polyline = new google.maps.Polyline({
          map: map,
          path: points,
          strokeColor: "#C2410C",
          strokeOpacity: 1.0,
          strokeWeight: 3
        });
        overlays.push(polyline);

        // Add point markers
        points.forEach((point: google.maps.LatLngLiteral, index: number) => {
          const pointMarker = new google.maps.Marker({
            position: point,
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#C2410C",
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
        });

        // Info at midpoint
        const midIndex = Math.floor(points.length / 2);
        const midPoint = points[midIndex];

        // Build elevation graph SVG
        const elevationData = entry.data.elevationData || [];
        let chartPoints = "";
        let minElev = Infinity;
        let maxElev = -Infinity;

        if (elevationData.length > 0) {
          elevationData.forEach((point: any) => {
            const elev = point.elevation || 0;
            minElev = Math.min(minElev, elev);
            maxElev = Math.max(maxElev, elev);
          });

          const elevRange = maxElev - minElev || 1;
          const chartWidth = 300;
          const chartHeight = 100;

          chartPoints = elevationData
            .map((point: any, i: number) => {
              const x = (i / (elevationData.length - 1)) * chartWidth;
              const normalizedElev = (point.elevation - minElev) / elevRange;
              const y = chartHeight - (normalizedElev * (chartHeight - 20) + 10);
              return `${x},${y}`;
            })
            .join(" ");
        }

        const infoContent = `
          <div style="padding: 12px; max-width: 350px; font-family: system-ui, -apple-system, sans-serif;">
            <div style="background: linear-gradient(135deg, #C2410C 0%, #9A3412 100%); color: white; padding: 12px; margin: -12px -12px 12px -12px; border-radius: 8px 8px 0 0;">
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 20px; margin-right: 8px;">⛰️</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${entry.name}</h3>
              </div>
              <p style="margin: 0; font-size: 12px; opacity: 0.9;">Elevation Profile</p>
            </div>
            ${elevationData.length > 0 ? `
            <div style="background: #FFF7ED; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #9A3412;">📊 Elevation Graph</p>
              <svg width="300" height="100" style="background: white; border-radius: 4px; border: 1px solid #FED7AA;">
                <polyline points="${chartPoints}" fill="none" stroke="#C2410C" stroke-width="2"/>
                <line x1="0" y1="90" x2="300" y2="90" stroke="#E5E7EB" stroke-width="1"/>
              </svg>
            </div>
            ` : ""}
            <div style="background: #F9FAFB; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px;">
                <span style="color: #6B7280; font-weight: 500;">📏 Distance:</span>
                <span style="color: #1F2937; font-weight: 600;">${entry.data.distance ? (entry.data.distance / 1000).toFixed(2) + " km" : "N/A"}</span>

                ${elevationData.length > 0 ? `
                <span style="color: #6B7280; font-weight: 500;">⬆️ High Point:</span>
                <span style="color: #1F2937; font-weight: 600;">${maxElev.toFixed(1)} m</span>

                <span style="color: #6B7280; font-weight: 500;">⬇️ Low Point:</span>
                <span style="color: #1F2937; font-weight: 600;">${minElev.toFixed(1)} m</span>

                <span style="color: #6B7280; font-weight: 500;">📈 Elevation Gain:</span>
                <span style="color: #1F2937; font-weight: 600;">${entry.data.elevationGain ? entry.data.elevationGain.toFixed(1) + " m" : "N/A"}</span>
                ` : ""}
              </div>
            </div>
            ${entry.data.description ? `
            <div style="background: #FEF3C7; padding: 10px; border-radius: 6px; margin-bottom: 10px; border-left: 3px solid #F59E0B;">
              <p style="margin: 0; font-size: 13px; color: #1F2937;"><strong>📝 Description:</strong><br/>${entry.data.description}</p>
            </div>
            ` : ""}
            ${elevationData.length > 0 ? `
            <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
              <button id="view-full-graph-${entry.id}" style="padding: 8px 16px; font-size: 13px; background: linear-gradient(135deg, #C2410C 0%, #9A3412 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(194, 65, 12, 0.3);">
                📊 View Full Graph
              </button>
            </div>
            ` : ""}
            ${createBookmarkButton(entry.id)}
            <div style="border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 8px;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-align: center;">⏰ Created: ${new Date(entry.createdAt).toLocaleString()}</p>
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

        const infoWindow = new google.maps.InfoWindow({ content: infoContent });
        infoMarker.addListener("click", () => infoWindow.open(map, infoMarker));
        infoWindow.open(map, infoMarker); // Auto-open

        // Add event listener for view full graph button
        if (elevationData.length > 0) {
          google.maps.event.addListenerOnce(infoWindow, "domready", () => {
            const viewGraphBtn = document.getElementById(`view-full-graph-${entry.id}`);
            if (viewGraphBtn) {
              viewGraphBtn.addEventListener("click", () => {
                createElevationModal(entry, elevationData, minElev, maxElev);
              });
            }

            // Add bookmark functionality
            if (bookmarkService) {
              const bookmarkBtn = document.getElementById(`bookmark-btn-${entry.id}`);
              if (bookmarkBtn) {
                bookmarkBtn.addEventListener("click", () => {
                  bookmarkService.addBookmark({
                    name: entry.name,
                    type: "Elevation",
                    location: points[0],
                    description: entry.data.description
                  });
                  alert("✅ Bookmark added successfully!");
                });
              }
            }
          });
        }

        overlays.push(infoMarker);
      }
      break;
    }
  }

  return overlays;
}
