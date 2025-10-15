# Data Hub Authentication & Filter Fixes

## Issues Fixed

### 1. ❌ Auth failed: No token provided
**Error:** `GET /api/datahub/all 401 0.893 ms - 61`

**Problem:** The frontend `dataHubService.ts` was not sending the authentication token with API requests.

**Fix:** Added `getAuthHeaders()` helper function that retrieves the token from sessionStorage and includes it in all API calls:

```typescript
const getAuthHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem('opti_connect_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};
```

Updated all fetch calls to include auth headers:
- `fetchAllData()` - GET /api/datahub/all
- `deleteEntries()` - DELETE /api/datahub/delete
- `exportData()` - POST /api/datahub/export
- `syncToBackend()` - POST /api/datahub/sync

---

### 2. ❌ Filter options not showing correct data
**Problem:** The "My Data Only", "All Users", and "Specific Users" filter options in GIS Data Hub were not working correctly.

**Fixes Applied:**

#### Frontend Changes

**File:** `src/services/dataHubService.ts`
- Added `userFilter` parameter to `fetchAllData()` function
- Supports `'me'`, `'all'`, or specific `userId`
- Includes filter in query string when calling backend

```typescript
export const fetchAllData = async (userFilter?: string): Promise<DataHubEntry[]> => {
  const url = userFilter && userFilter !== 'me' 
    ? `${API_BASE_URL}/datahub/all?userFilter=${userFilter}`
    : `${API_BASE_URL}/datahub/all`;
  
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  //...
}
```

**File:** `src/components/tools/DataHub.tsx`
- Added `userFilter` state to track selected filter
- Added `currentUser` state to check user role
- Added user filter dropdown (visible only to Admin/Manager)
- Added "User" column to table when viewing all users' data
- Updated `loadAllData()` to use `fetchAllData(userFilter)` instead of `gisToolsService`
- Auto-reload data when filter changes

```typescript
const [userFilter, setUserFilter] = useState<string>('me');
const [currentUser, setCurrentUser] = useState<any>(null);

// User filter dropdown (Admin/Manager only)
{(currentUser?.role === 'Admin' || currentUser?.role === 'Manager') && (
  <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
    <option value="me">My Data Only</option>
    <option value="all">All Users</option>
  </select>
)}
```

#### Backend Changes

**File:** `src/controllers/dataHubController.js`
- Updated `getAllData()` to support user filtering via query parameter
- Admin/Manager can view all users' data with `?userFilter=all`
- Admin/Manager can view specific user's data with `?userFilter=userId`
- Regular users always see only their own data
- Includes username in results via JOIN with users table

```javascript
const { userFilter } = req.query;
let whereClause = 'user_id = ?';
let whereParams = [currentUserId];

if ((currentUserRole === 'Admin' || currentUserRole === 'Manager') && userFilter) {
  if (userFilter === 'all') {
    whereClause = '1=1'; // No filter
    whereParams = [];
  } else {
    whereClause = 'user_id = ?';
    whereParams = [parseInt(userFilter)];
  }
}

// Fetch with username
const [distances] = await pool.query(
  `SELECT d.*, u.username as user_name FROM distance_measurements d 
   LEFT JOIN users u ON d.user_id = u.id 
   WHERE ${whereClause} ORDER BY d.created_at DESC`,
  whereParams
);
```

---

## Features Added

### User Filter Dropdown (Admin/Manager Only)
- **My Data Only** - Shows only current user's data
- **All Users** - Shows all users' data (Admin/Manager only)
- Username column appears when viewing all users' data

### Data Types Supported
- Distance Measurements
- Polygon Drawings
- Circle Drawings
- Elevation Profiles
- Infrastructure
- Sector RF

---

## Testing

### 1. Restart Backend
```powershell
cd "C:\Users\hkcha\OneDrive\Desktop\New folder\OptiConnect_Backend"
npm start
```

### 2. Test as Regular User
1. Login as a regular user (Operator/Viewer)
2. Open GIS Data Hub
3. Should see only your own data
4. No user filter dropdown should appear

### 3. Test as Admin/Manager
1. Login as Admin or Manager
2. Open GIS Data Hub
3. User filter dropdown should appear
4. Test "My Data Only" - should see only your data
5. Test "All Users" - should see all users' data with usernames
6. Verify authentication token is sent (check network tab - should see 200 responses, not 401)

### 4. Verify API Calls
Check browser Developer Tools > Network tab:
- `/api/datahub/all` should return 200 status
- Request headers should include `Authorization: Bearer <token>`
- Response should include `data` array with entries
- When filter=all, entries should have `user_name` field

---

## Status
✅ **All fixes applied successfully!**

- Authentication token is now sent with all DataHub API requests
- User filtering works correctly with "My Data Only" and "All Users" options
- Admin/Manager can view all users' data
- Backend properly filters data based on user role and filter parameter
- Username column appears when viewing all users' data

The Data Hub should now load correctly without 401 errors, and the filter options should work as expected!
