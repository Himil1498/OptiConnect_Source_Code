# Comprehensive Fixes for Temporary Access & Regions

## Summary of All Issues

### ✅ FIXED Issues:
1. Region requests not appearing (column name mismatch) - FIXED
2. Case-sensitive role checking - FIXED
3. Temporary access timezone conversion - FIXED
4. Backend correctly calculates 2 minutes - CONFIRMED

### 🔧 TO FIX:
1. Delete dialog (use proper modal instead of `window.confirm`)
2. Frontend time display (use backend `time_remaining` data)
3. Auto-cleanup expired access (MySQL event scheduler)
4. Profile dropdown (show temporary vs permanent regions differently)

---

## Issue Analysis: Time Remaining Display

### Backend Logs Show:
```
🕐 Difference from now (minutes): 2  ✓ CORRECT!
```

### Frontend Shows:
```
"12h 31m 32s remaining"  ❌ WRONG!
```

### Root Cause:
The backend sends correct `time_remaining` data, but the frontend might have date parsing issues or is recalculating the time.

---

## Fix 1: Replace Delete Dialog with Proper Modal

### Current Code (Line 329-332):
```typescript
const handleDelete = async (grant: TemporaryRegionAccess) => {
  if (!window.confirm(`Are you sure you want to delete...`)) {
    return;
  }
```

### NEW CODE - Add Delete Modal State (after line 60):
```typescript
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [grantToDelete, setGrantToDelete] = useState<TemporaryRegionAccess | null>(null);
```

### NEW CODE - Update handleDelete Function:
```typescript
const handleDeleteConfirm = async () => {
  if (!grantToDelete || !currentUser) {
    setDeleteModalOpen(false);
    return;
  }

  setLoading(true);
  try {
    const success = await deleteTemporaryGrant(grantToDelete.id, currentUser);
    if (success) {
      showNotification('success', 'Grant Deleted', 'Temporary access grant deleted successfully.');
      await loadData();
    } else {
      showNotification('error', 'Error', 'Failed to delete temporary access grant.');
    }
  } catch (error) {
    showNotification('error', 'Error', 'Failed to delete temporary access grant.');
  } finally {
    setLoading(false);
    setDeleteModalOpen(false);
    setGrantToDelete(null);
  }
};
```

### NEW CODE - Update Delete Button (replace line 791-797):
```typescript
<button
  onClick={() => {
    setGrantToDelete(grant);
    setDeleteModalOpen(true);
  }}
  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
  title="Delete"
>
  <TrashIcon className="h-5 w-5" />
</button>
```

### NEW CODE - Add Delete Modal (add after Revoke Modal, around line 899):
```tsx
{/* Delete Confirmation Modal */}
{deleteModalOpen && grantToDelete && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
        <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
        Delete Temporary Access
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
        Are you sure you want to permanently delete this temporary access grant for{' '}
        <span className="font-semibold">{grantToDelete.userName}</span> to{' '}
        <span className="font-semibold">{grantToDelete.region}</span>?
      </p>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-6">
        <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start">
          <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
          <span>This action cannot be undone. The grant will be removed from the system.</span>
        </p>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => {
            setDeleteModalOpen(false);
            setGrantToDelete(null);
          }}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteConfirm}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Deleting...
            </>
          ) : (
            <>
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Grant
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Fix 2: Auto-Cleanup Expired Access (Backend)

### File: `ADD_CRON_CLEANUP.sql`

This SQL script creates a MySQL event that runs every 5 minutes to automatically remove expired temporary access from the `user_regions` table.

**To Apply:**
1. Open MySQL Workbench
2. Run the `ADD_CRON_CLEANUP.sql` file
3. The event will start immediately and run every 5 minutes

---

## Fix 3: Profile Dropdown - Show Temporary vs Permanent Regions

### File to Update: `src/components/common/NavigationBar.tsx`

### Find the Profile Dropdown Section (around line 150-300)

### Add These Functions at Component Level:
```typescript
// Fetch user's regions with temporary access status
const [userRegions, setUserRegions] = useState<{
  permanent: string[];
  temporary: { region: string; expiresAt: Date; timeRemaining: string }[];
  requested: { region: string; status: string }[];
}>({
  permanent: [],
  temporary: [],
  requested: []
});

useEffect(() => {
  if (user) {
    loadUserRegions();
  }
}, [user]);

const loadUserRegions = async () => {
  try {
    // Get permanent regions from user object
    const permanentRegions = user?.regions || [];

    // Get temporary access
    const tempAccess = await getMyActiveTemporaryAccess();
    const temporaryRegions = tempAccess.map(grant => ({
      region: grant.region,
      expiresAt: grant.expiresAt,
      timeRemaining: grant.timeRemaining?.display || 'Calculating...'
    }));

    // Get requested regions (you'll need to create this API endpoint)
    // const requested = await getMyRegionRequests();

    setUserRegions({
      permanent: permanentRegions,
      temporary: temporaryRegions,
      requested: [] // Fill this when you have the API
    });
  } catch (error) {
    console.error('Failed to load user regions:', error);
  }
};
```

### Replace the Regions Display in Dropdown:
```tsx
{/* Permanent Regions */}
{userRegions.permanent.length > 0 && (
  <div className="px-4 py-2">
    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
      Permanent Access
    </p>
    <div className="space-y-1">
      {userRegions.permanent.map((region, idx) => (
        <div key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-300 py-1">
          <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {region}
        </div>
      ))}
    </div>
  </div>
)}

{/* Temporary Access */}
{userRegions.temporary.length > 0 && (
  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
    <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-2 flex items-center">
      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Temporary Access
    </p>
    <div className="space-y-2">
      {userRegions.temporary.map((item, idx) => (
        <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-900 dark:text-white">{item.region}</span>
            <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
              {item.timeRemaining}
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Expires: {new Date(item.expiresAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* Requested Regions */}
{userRegions.requested.length > 0 && (
  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center">
      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Pending Requests
    </p>
    <div className="space-y-1">
      {userRegions.requested.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between text-sm py-1">
          <span className="text-gray-700 dark:text-gray-300">{item.region}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
            {item.status}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

---

## Summary of Files to Modify

### Backend:
1. ✅ `regionRequestController.js` - Fixed (already done)
2. ✅ `temporaryAccessController.js` - Fixed (already done)
3. 🔧 Run `ADD_CRON_CLEANUP.sql` in MySQL Workbench

### Frontend:
1. 🔧 `TemporaryAccessManagement.tsx` - Add delete modal
2. 🔧 `NavigationBar.tsx` - Update profile dropdown
3. ✅ `temporaryAccessService.ts` - Already using backend `time_remaining`

---

## Testing Checklist

### After Applying Fixes:

1. **Delete Dialog**:
   - [ ] Click delete button on a temporary access grant
   - [ ] See proper modal with warning icon
   - [ ] Cancel button works
   - [ ] Delete button removes the grant

2. **Time Remaining**:
   - [ ] Grant 2-minute access
   - [ ] Should show "2m remaining" not "12h remaining"
   - [ ] Backend logs show correct duration

3. **Auto-Cleanup**:
   - [ ] Run `SELECT * FROM information_schema.events;` in MySQL
   - [ ] Should see `cleanup_expired_temporary_access` event
   - [ ] After 5 minutes, expired access should be removed from `user_regions`

4. **Profile Dropdown**:
   - [ ] Login as user with temporary access
   - [ ] Click profile dropdown
   - [ ] See "Permanent Access" section (green checkmark)
   - [ ] See "Temporary Access" section (yellow, with countdown)
   - [ ] See "Pending Requests" section (blue, with status)

---

## Still Having Time Display Issues?

If after applying these fixes the time still shows incorrectly:

1. Open DevTools → Network tab
2. Find `GET /api/temporary-access` request
3. Check Response → Look for `time_remaining` object
4. Share the `time_remaining` values with me

The backend is correct (`Difference: 2 minutes`), so if the frontend still shows wrong time, we need to debug the date parsing.
