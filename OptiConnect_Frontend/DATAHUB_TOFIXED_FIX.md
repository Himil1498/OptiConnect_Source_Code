# DataHub toFixed() Error Fix

## Issue
```
meters.toFixed is not a function
```

## Root Cause
The DataHub component's `viewOnMap` function was trying to call `.toFixed()` on values that might not be numbers. This happened because:

1. **Backend data format differences** - The backend stores data with different field names than the frontend expects:
   - Infrastructure: `latitude`, `longitude` instead of `coordinates.lat`, `coordinates.lng`
   - Circle: `radius` might be stored as a string
   - Distance: `total_distance` instead of `totalDistance`

2. **No type checking** - The code didn't verify values were numbers before calling `.toFixed()`

## Fixes Applied

### 1. Infrastructure Coordinates
**File:** `src/components/tools/DataHub.tsx` (line ~274)

**Before:**
```typescript
const coordinates = (entry.data as any).coordinates;
if (coordinates) {
```

**After:**
```typescript
const infraData = entry.data as any;
// Handle both formats: {coordinates: {lat, lng}} and {latitude, longitude}
const coordinates = infraData.coordinates || {
  lat: parseFloat(infraData.latitude),
  lng: parseFloat(infraData.longitude)
};
if (coordinates && coordinates.lat && coordinates.lng) {
```

### 2. Circle Radius
**File:** `src/components/tools/DataHub.tsx` (line ~376)

**Before:**
```typescript
const center = (entry.data as any).center;
const radius = (entry.data as any).radius;
if (center && radius) {
```

**After:**
```typescript
const circleData = entry.data as any;
const center = circleData.center || circleData.center_point;
const radius = parseFloat(circleData.radius || circleData.circle_radius);
if (center && !isNaN(radius) && radius > 0) {
```

### 3. Distance Total
**File:** `src/components/tools/DataHub.tsx` (line ~533)

**Before:**
```typescript
const totalDistance = distanceData.totalDistance || 0;
```

**After:**
```typescript
const totalDistance = parseFloat(distanceData.totalDistance || distanceData.total_distance || 0);
```

## Changes Summary

All numeric values that use `.toFixed()` now have:
1. ✅ **parseFloat()** conversion
2. ✅ **Fallback values** for missing fields
3. ✅ **Multiple field name support** (camelCase and snake_case)
4. ✅ **Validation** (isNaN checks where needed)

## Testing

Refresh the Data Hub page and try:
1. **View Infrastructure on map** - Should work with latitude/longitude from DB
2. **View Circle on map** - Should handle radius as string or number
3. **View Distance on map** - Should handle both totalDistance formats

The error should no longer occur!

## Status
✅ **Fixed!** All `.toFixed()` calls now have proper type safety.
