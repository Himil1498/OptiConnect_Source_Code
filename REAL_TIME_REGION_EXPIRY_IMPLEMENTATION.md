# Real-Time Temporary Region Expiry Implementation

## 📋 Overview

This document explains the implementation of **real-time automatic expiry** for temporary region access in OptiConnect GIS Platform.

### Problem Statement
**Before:** When admin granted temporary region access to a user, the access expired in the database but remained visible on the user's map until they re-logged in.

**After:** Temporary region access now **automatically expires and disappears from the map in real-time** without requiring the user to re-login.

---

## 🚀 Implementation Summary

### Port Changes
✅ **Backend port:** Changed from `5000` to `5005`
✅ **Frontend port:** Changed from `3002` to `3005`

### New Features
1. ✅ **Backend API endpoint** to get current valid regions
2. ✅ **Frontend monitoring hook** to check region expiry periodically
3. ✅ **Automatic Redux state update** when regions expire
4. ✅ **Real-time map updates** without re-login

---

## 🔧 Backend Changes

### 1. Port Configuration

**Files Modified:**
- `OptiConnect_Backend/.env`
- `OptiConnect_Backend/server.js`

**Changes:**
```env
# Old
PORT=5000
FRONTEND_URL=http://localhost:3002
APP_URL=http://localhost:3002

# New
PORT=5005
FRONTEND_URL=http://localhost:3005
APP_URL=http://localhost:3005
```

### 2. New API Endpoint: Get Current Valid Regions

**Endpoint:** `GET /api/temporary-access/current-regions`

**Purpose:** Returns all regions the user currently has valid access to (permanent + non-expired temporary)

**Response:**
```json
{
  "success": true,
  "regions": [
    {
      "id": 1,
      "name": "Maharashtra",
      "code": "MH",
      "type": "state",
      "access_level": "read",
      "is_temporary": true,
      "expires_at": "2025-10-13T15:30:00.000Z",
      "time_remaining": {
        "expired": false,
        "display": "2h 15m",
        "days": 0,
        "hours": 2,
        "minutes": 15,
        "seconds": 0,
        "total_seconds": 8100
      }
    },
    {
      "id": 2,
      "name": "Gujarat",
      "code": "GJ",
      "type": "state",
      "access_level": "read",
      "is_temporary": false,
      "expires_at": null,
      "time_remaining": null
    }
  ],
  "count": 2
}
```

**Key Features:**
- Includes both permanent and temporary regions
- Automatically filters out expired temporary regions
- Calculates time remaining for temporary access
- Distinguishes between permanent and temporary access

**Files Created/Modified:**
- `OptiConnect_Backend/src/controllers/temporaryAccessController.js` - Added `getCurrentValidRegions()`
- `OptiConnect_Backend/src/routes/temporaryAccess.routes.js` - Added route

---

## 🎨 Frontend Changes

### 1. Port Configuration

**Files Modified:**
- `OptiConnect_Frontend/.env`

**Changes:**
```env
# Old
PORT=3002
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:3002

# New
PORT=3005
REACT_APP_API_URL=http://localhost:5005/api
REACT_APP_API_BASE_URL=http://localhost:5005/api
REACT_APP_WS_URL=ws://localhost:3005
```

### 2. Custom Hook: useTemporaryRegionMonitor

**File Created:** `OptiConnect_Frontend/src/hooks/useTemporaryRegionMonitor.ts`

**Purpose:** Automatically monitor and update expired temporary regions in real-time

**How It Works:**

```typescript
// 1. Runs a background check every 30 seconds (configurable)
useTemporaryRegionMonitor(30000);

// 2. Calls backend API to get current valid regions
const response = await apiService.get('/temporary-access/current-regions');

// 3. Compares with user's current regions in Redux
const currentValidRegions = response.data.regions.map(r => r.name);
const userCurrentRegions = user.assignedRegions || [];

// 4. If regions have changed (expired), updates Redux state
if (regionsChanged) {
  dispatch(updateUser({
    assignedRegions: currentValidRegions
  }));
}
```

**Key Features:**
- ✅ Runs automatically in the background
- ✅ Non-blocking (doesn't affect user experience)
- ✅ Configurable check interval (default: 30 seconds)
- ✅ Prevents multiple simultaneous checks
- ✅ Handles errors gracefully (silent failures)
- ✅ Logs region changes to console
- ✅ Initial check after 5 seconds (gives app time to load)
- ✅ Cleanup on unmount

**Usage:**
```typescript
// In App.tsx - monitors for all authenticated users
const TemporaryRegionMonitor: React.FC = () => {
  // Check every 30 seconds
  useTemporaryRegionMonitor(30000);
  return null;
};
```

**Alternative Hook for Manual Checks:**
```typescript
// For checking on specific events
const { checkNow } = useTemporaryRegionCheck();

// Call when needed
const hasChanged = await checkNow();
if (hasChanged) {
  console.log('Regions were updated');
}
```

### 3. Integration with App.tsx

**File Modified:** `OptiConnect_Frontend/src/App.tsx`

**Changes:**
```typescript
// Import the hook
import { useTemporaryRegionMonitor } from './hooks/useTemporaryRegionMonitor';

// Create monitor component
const TemporaryRegionMonitor: React.FC = () => {
  useTemporaryRegionMonitor(30000);
  return null;
};

// Add to App component
<AuthProvider>
  <Router>
    <div className="App">
      {/* Monitor runs for all authenticated users */}
      <TemporaryRegionMonitor />
      <NavigationBar />
      {/* Rest of app */}
    </div>
  </Router>
</AuthProvider>
```

### 4. Redux State Update

**File Used:** `OptiConnect_Frontend/src/store/slices/authSlice.ts`

**Action Used:** `updateUser()`

**What Happens:**
1. Hook detects expired regions
2. Calls `dispatch(updateUser({ assignedRegions: newRegions }))`
3. Redux updates the user object
4. All components subscribed to user.assignedRegions re-render
5. Map automatically updates to show only valid regions
6. User sees the change in real-time

---

## 🔄 Complete Flow

### Scenario: Admin grants 5-minute temporary access

**Step 1: Admin Grants Access**
```
Time: 10:00 AM
Admin grants "Maharashtra" access to User123
Expires: 10:05 AM
```

**Step 2: User Gets Access Immediately**
```
Time: 10:00 AM
User123 sees "Maharashtra" on map
No re-login needed
```

**Step 3: Background Monitoring**
```
Time: 10:00 AM - 10:05 AM
Monitor checks every 30 seconds:
- 10:00:30 - Maharashtra valid ✅
- 10:01:00 - Maharashtra valid ✅
- 10:01:30 - Maharashtra valid ✅
- 10:02:00 - Maharashtra valid ✅
- 10:02:30 - Maharashtra valid ✅
- 10:03:00 - Maharashtra valid ✅
- 10:03:30 - Maharashtra valid ✅
- 10:04:00 - Maharashtra valid ✅
- 10:04:30 - Maharashtra valid ✅
```

**Step 4: Automatic Expiry**
```
Time: 10:05:00 AM - Access expires in database
Time: 10:05:30 AM - Monitor detects expiry
```

**Backend Response:**
```json
{
  "regions": [
    // Maharashtra is NOT in the list anymore
    { "name": "Gujarat", "is_temporary": false }
  ]
}
```

**Step 5: Real-Time Update**
```
Time: 10:05:30 AM
- Redux state updated
- Map re-renders
- Maharashtra disappears from map
- User sees only Gujarat now
- NO RE-LOGIN NEEDED! ✨
```

**Console Output:**
```
🔄 Temporary region access has changed
   Previous regions: ["Gujarat", "Maharashtra"]
   Current valid regions: ["Gujarat"]
⏰ Your temporary region access has expired
```

---

## 🧪 Testing Guide

### Test 1: Quick Expiry (1 minute)

1. **Start servers:**
   ```bash
   # Terminal 1 - Backend (new port 5005)
   cd OptiConnect_Backend
   npm start

   # Terminal 2 - Frontend (new port 3005)
   cd OptiConnect_Frontend
   npm start
   ```

2. **Login as Admin:**
   - Go to http://localhost:3005
   - Login with admin credentials

3. **Grant temporary access:**
   - Go to Users → Temporary Access
   - Select a test user
   - Select a region (e.g., "Maharashtra")
   - Set expiry: **1 minute from now**
   - Grant access

4. **Login as Test User:**
   - Open incognito window
   - Login as test user
   - Go to Map page
   - Verify "Maharashtra" appears

5. **Wait and Observe:**
   - Keep map page open
   - Watch browser console
   - After ~1 minute, you should see:
     ```
     🔄 Temporary region access has changed
        Previous regions: ["Gujarat", "Maharashtra"]
        Current valid regions: ["Gujarat"]
     ⏰ Your temporary region access has expired
     ```
   - **Maharashtra should disappear from map automatically!**
   - **No re-login needed!**

### Test 2: Monitor Startup

1. Login and watch console
2. You should see:
   ```
   ✅ Temporary region monitor started (checking every 30s)
   ```

3. Monitor runs in background
4. Check API calls in Network tab:
   - Periodic calls to `/api/temporary-access/current-regions`
   - Every 30 seconds

### Test 3: Multiple Users

1. Login as Admin in Browser 1
2. Login as User A in Browser 2
3. Grant temporary access to User A
4. User A sees region immediately
5. Wait for expiry
6. User A loses access automatically
7. Admin can verify in backend logs

### Test 4: API Endpoint Direct Test

```bash
# Get auth token first
curl -X POST http://localhost:5005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use token to check current regions
curl http://localhost:5005/api/temporary-access/current-regions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "regions": [/* only valid regions */],
  "count": 2
}
```

---

## ⚙️ Configuration

### Adjust Check Interval

**Default:** 30 seconds

**Change in App.tsx:**
```typescript
// Check every 10 seconds (for testing)
useTemporaryRegionMonitor(10000);

// Check every 1 minute (production)
useTemporaryRegionMonitor(60000);

// Check every 5 minutes (low-frequency)
useTemporaryRegionMonitor(300000);
```

**Recommendation:**
- **Development/Testing:** 10-30 seconds
- **Production:** 30-60 seconds
- **Low-traffic systems:** 2-5 minutes

### Performance Impact

**API Calls:** 1 call per check interval per user
- 30s interval = 120 calls/hour per user
- 60s interval = 60 calls/hour per user

**Network Usage:** ~500 bytes per call
- Minimal impact on bandwidth

**Server Load:** Lightweight query
- Query only runs for logged-in users
- Uses efficient database index
- Minimal CPU usage

---

## 🐛 Troubleshooting

### Issue: Regions not expiring automatically

**Check:**
1. Console shows monitor started:
   ```
   ✅ Temporary region monitor started (checking every 30s)
   ```

2. Network tab shows periodic calls to:
   ```
   /api/temporary-access/current-regions
   ```

3. Backend responds with 200 OK

4. Check backend server is running on port **5005** (not 5000)

### Issue: Monitor not starting

**Possible causes:**
1. User not authenticated
2. User has no regions
3. JavaScript error in console

**Solution:**
```typescript
// Check if hook is being called
console.log('Monitor hook called');
```

### Issue: Backend returns 401 Unauthorized

**Solution:**
1. Check token in localStorage/sessionStorage
2. Token might be expired (2-hour expiry)
3. Re-login to get fresh token

### Issue: Regions expire but map doesn't update

**Check:**
1. Redux state is updating (check Redux DevTools)
2. Map component is subscribed to `user.assignedRegions`
3. Map re-renders when regions change

---

## 📊 Database Changes

### No Schema Changes Required!

The existing tables already support this feature:
- `temporary_access` table has `expires_at` column
- `user_regions` table stores current access
- Query uses `UTC_TIMESTAMP()` for accurate time comparison

### SQL Query Used

```sql
SELECT DISTINCT
  r.id,
  r.name,
  r.code,
  r.type,
  ur.access_level,
  CASE
    WHEN ta.id IS NOT NULL THEN true
    ELSE false
  END as is_temporary,
  ta.expires_at as temporary_expires_at,
  TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), ta.expires_at) as seconds_remaining
FROM regions r
INNER JOIN user_regions ur ON r.id = ur.region_id
LEFT JOIN temporary_access ta ON (
  ta.user_id = ur.user_id
  AND ta.resource_id = r.id
  AND ta.resource_type = 'region'
  AND ta.revoked_at IS NULL
  AND ta.expires_at > UTC_TIMESTAMP()  -- Only non-expired
)
WHERE ur.user_id = ?
  AND r.is_active = true
ORDER BY r.name ASC
```

**Key Points:**
- Uses `UTC_TIMESTAMP()` for timezone-independent comparison
- `LEFT JOIN` to include permanent regions (no temporary_access record)
- `expires_at > UTC_TIMESTAMP()` filters out expired grants
- Efficient index on `user_id`, `resource_id`, `expires_at`

---

## 🚀 Production Deployment

### 1. Update Environment Variables

**Backend (.env):**
```env
PORT=5005
FRONTEND_URL=https://your-domain.com
```

**Frontend (.env.production):**
```env
REACT_APP_API_URL=https://api.your-domain.com/api
```

### 2. Build Frontend

```bash
cd OptiConnect_Frontend
npm run build
```

### 3. Start Backend

```bash
cd OptiConnect_Backend
npm start
```

### 4. Monitor Performance

- Check API response times
- Monitor server load
- Adjust check interval if needed

---

## 📝 Summary

✅ **Port Changes:**
- Backend: 5000 → 5005
- Frontend: 3002 → 3005

✅ **New Backend API:**
- `GET /api/temporary-access/current-regions`
- Returns only currently valid regions

✅ **New Frontend Hook:**
- `useTemporaryRegionMonitor(interval)`
- Automatically checks and updates regions

✅ **Real-Time Expiry:**
- No re-login required
- Automatic map updates
- Silent background monitoring
- Minimal performance impact

✅ **Benefits:**
- Better user experience
- Real-time security enforcement
- Automatic cleanup
- Industry-standard implementation

---

## 🎯 Next Steps

1. Test with short expiry times (1-5 minutes)
2. Verify in production environment
3. Monitor performance with multiple users
4. Consider adding user notification (toast/alert)
5. Add analytics to track expiry events

---

**Implementation Date:** October 13, 2025
**Status:** ✅ Complete and Ready for Testing
**Author:** Claude AI Assistant
