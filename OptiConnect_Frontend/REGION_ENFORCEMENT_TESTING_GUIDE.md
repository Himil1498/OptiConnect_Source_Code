# Region Enforcement Testing Guide

## ✅ STATUS: FULLY WORKING (As of 2025-10-04)

**Region access control is now perfectly working in development mode!**

All features tested and verified:
- ✅ Admin can access all regions
- ✅ Non-admin users restricted to assigned regions only
- ✅ All 5 GIS tools enforce region restrictions
- ✅ Visual boundary highlighting shows assigned regions
- ✅ Error notifications display correct state names
- ✅ Boundary customization settings (color, opacity, auto-dim)

**Backend Integration Status:**
- Currently working in **development mode** with static test users
- Backend integration planned (will verify if region enforcement persists)
- Static mode uses `india.json` GeoJSON file for state boundary detection

---

## Quick Start Testing Steps

1. **Logout** if you're currently logged in (click profile dropdown → Sign Out)
2. **Login with test user** (see Sample Test Users section below)
3. **Navigate to Map page** from the navigation bar
4. **Open any GIS tool** from the toolbar (Distance, Polygon, Circle, etc.)
5. **Click on different states** to test region enforcement
6. **Check the results:**
   - **Admin user**: Should work everywhere ✅
   - **Field Engineer**: Should only work in Maharashtra & Karnataka ✅
   - **Viewer**: Should only work in Delhi ✅

---

## How to Test Region-Based Access Control

### 1. Test with Admin User
**Expected Result:** Admin can access ALL regions

1. Login as Admin (admin@example.com)
2. Open any GIS tool (Distance, Polygon, Circle, Elevation, Infrastructure)
3. Click anywhere on the map in ANY state
4. ✅ Should work - Admin has full access

---

### 2. Test with Non-Admin User (Assigned Region)
**Expected Result:** User can only work in assigned regions

1. Login as Field Engineer (field@example.com)
2. Check their assigned regions in User Management:
   - Example: Maharashtra, Karnataka
3. Open a GIS tool
4. Click within Maharashtra or Karnataka
5. ✅ Should work - Tool accepts the point
6. Click outside assigned regions (e.g., Tamil Nadu)
7. ❌ Should show error: "Region Access Denied - You don't have access to [State Name]"

---

### 3. Test Each GIS Tool

#### Distance Measurement Tool
1. Activate the tool
2. Click point A in assigned region → ✅ Works
3. Click point B in assigned region → ✅ Works
4. Click point C in non-assigned region → ❌ Error notification

#### Polygon Drawing Tool
1. Activate the tool
2. Add vertices in assigned region → ✅ Works
3. Try to add vertex in non-assigned region → ❌ Error notification

#### Circle Drawing Tool
1. Activate the tool
2. Place center in assigned region → ✅ Works
3. Place center in non-assigned region → ❌ Error notification

#### Elevation Profile Tool
1. Activate the tool
2. Add points in assigned region → ✅ Works
3. Add point in non-assigned region → ❌ Error notification

#### Infrastructure Management Tool
1. Activate the tool
2. Add infrastructure in assigned region → ✅ Works
3. Try to add in non-assigned region → ❌ Error notification

---

### 4. Check Error Messages

When access is denied, you should see:

**Notification Dialog:**
- **Title:** "Region Access Denied"
- **Type:** Error (red)
- **Message:** "You don't have access to [State Name]. Assigned regions: [List]"

---

### 5. Test User Without Assigned Regions

1. Create a new user with NO assigned regions
2. Try to use any GIS tool
3. ❌ Should show: "No regions assigned to your account"

---

### 6. Visual Verification

**On the Map:**
- Assigned regions: **Blue highlighting** (darker when hovered)
- Non-assigned regions: **Gray/dimmed** (barely visible)
- Only assigned regions show info window on click

---

### 7. Test Edge Cases

#### Cross-Region Measurements
1. Start distance measurement in assigned region (Point A)
2. Try to add Point B in non-assigned region
3. ❌ Should block Point B with error

#### Geocoding Failure
1. If Google Geocoding API fails (rare)
2. System allows access (graceful fallback)
3. Check browser console for "Region detection failed - allowing access"

#### Multiple Assigned Regions
1. Login as user with multiple regions (e.g., Maharashtra + Karnataka)
2. Should be able to work in BOTH regions
3. Cannot work in regions not in the list

---

## Quick Test Checklist

- [ ] Admin can access all regions
- [ ] Non-admin blocked from non-assigned regions
- [ ] Non-admin can work in assigned regions
- [ ] Error message shows correct region name
- [ ] All 5 GIS tools enforce restrictions
- [ ] Visual highlighting shows assigned regions
- [ ] Users with no regions are blocked completely

---

## Sample Test Users

**IMPORTANT:** Password can be anything (any text) in development mode.

**Admin:**
- Email: admin@example.com
- Password: any text (e.g., "admin")
- Name: Admin User
- Role: Admin
- Regions: All (Admin role bypasses region checks)
- Expected: Can click anywhere on India map ✅

**Manager (Field Engineer):**
- Email: field@example.com
- Password: any text (e.g., "field")
- Name: Field Engineer
- Role: Manager
- Regions: Maharashtra, Karnataka
- Expected:
  - Can work in: Maharashtra, Karnataka ✅
  - Blocked from: Delhi, Tamil Nadu, Gujarat, etc. ❌

**User (Viewer):**
- Email: viewer@example.com
- Password: any text (e.g., "viewer")
- Name: Viewer User
- Role: User
- Regions: Delhi only
- Expected:
  - Can work in: Delhi ✅
  - Blocked from: Maharashtra, Karnataka, Tamil Nadu, etc. ❌

---

## Troubleshooting

**Issue:** Region check not working
- Check if Google Maps API is loaded
- Check browser console for errors
- Verify user has `assignedRegions` field in auth context

**Issue:** All regions blocked
- Check if user is logged in
- Verify assignedRegions is not empty array

**Issue:** All regions allowed
- Check if user role is 'Admin'
- Check if geocoding is failing (console logs)

---

## NEW: Boundary Customization Settings

**Feature:** Users can now customize region boundary appearance with auto-dimming when tools are active.

### How to Access:
1. Look for the **indigo gear icon (⚙️)** in the map controls (top-right area)
2. Click to open **Boundary Settings** panel

### Available Settings:

**Enable/Disable Boundaries**
- Toggle to show/hide region boundaries entirely

**Boundary Color**
- 8 preset colors: Blue, Green, Purple, Red, Orange, Pink, Cyan, Indigo
- Custom color picker for any color

**Normal Opacity**
- Slider: 0-100%
- Controls boundary visibility when no tool is active

**Auto-Dim When Tool Active**
- Checkbox: Enable/Disable auto-dimming
- Reduces visual clutter when using GIS tools
- Boundaries stay visible but dimmed

**Dimmed Opacity**
- Slider: 0-100%
- Controls boundary opacity when a GIS tool is active
- Default: 20% (subtle but visible)

**Live Preview**
- Shows how boundaries will look in normal and dimmed states

**Persistence**
- Settings saved to browser localStorage
- Persist across sessions

### Default Settings:
- Enabled: Yes
- Color: Blue (#3B82F6)
- Normal Opacity: 50%
- Auto-Dim: Enabled
- Dimmed Opacity: 20%

### Testing the Feature:
1. Open Boundary Settings (gear icon)
2. Change color to Purple
3. Set normal opacity to 70%
4. Save changes
5. Boundaries should update immediately
6. Activate a GIS tool (e.g., Distance)
7. Boundaries should auto-dim to 20% opacity
8. Close the tool
9. Boundaries should return to 70% opacity
10. Refresh page - settings should persist

---

## Backend Integration Checklist

When backend is integrated, verify:
- [ ] User authentication pulls real user data
- [ ] `assignedRegions` field comes from database
- [ ] Region enforcement still works with backend users
- [ ] Admin role check works with backend auth
- [ ] GeoJSON state detection still accurate
- [ ] Error messages display correctly
- [ ] Boundary settings persist per user account (if implemented)

---

## Known Limitations

1. **State Detection Dependency:** Requires Google Maps Geocoding API for accurate state identification
2. **GeoJSON Property:** Relies on `st_nm` property in india.json file
3. **Fallback Behavior:** If geocoding fails, system allows access (graceful degradation)
4. **Development Mode:** Currently uses static test users (see Sample Test Users section)
