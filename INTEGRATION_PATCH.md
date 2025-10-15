# Integration Patch for ViewOnMapDetails Component

## Step 1: Add Import (Line ~14, after MapSettings import)
```typescript
import MapSettings from "../components/map/MapSettings";
import ViewOnMapDetails from "../components/map/ViewOnMapDetails";  // ADD THIS LINE
```

## Step 2: Add Component Usage (Before closing </PageContainer> tag, around line 1479)

Add this code RIGHT BEFORE `</PageContainer>`:

```typescript
      {/* View on Map Details Panel - Reopenable */}
      {viewOnMapOverlays && (
        <ViewOnMapDetails
          data={viewOnMapOverlays.data}
          type={viewOnMapOverlays.type}
          onClose={() => {
            // Clear overlays from map
            viewOnMapOverlays.overlays.forEach((overlay) => {
              if (overlay && overlay.setMap) {
                overlay.setMap(null);
              }
            });
            setViewOnMapOverlays(null);
          }}
          on360ViewClick={(lat, lng) => {
            setShow360ViewPosition({ lat, lng });
            setShow360View(true);
          }}
          onElevationGraphClick={() => {
            if (viewOnMapOverlays.type === 'elevation' && viewOnMapOverlays.data) {
              setElevationGraphData(viewOnMapOverlays.data);
              setShowElevationGraph(true);
            }}
          }}
        />
      )}
```

This creates a floating, minimizable details panel that:
- Shows all item details
- Can be minimized and reopened
- Has button to open 360° view for distance measurements
- Has button to open interactive elevation graph with units
- Can be closed to clear the overlay from map
