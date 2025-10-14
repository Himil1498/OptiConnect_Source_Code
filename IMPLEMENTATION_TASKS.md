# Implementation Tasks - Delete Dialogs & Real-time Updates

## ✅ COMPLETED

### 1. Created Reusable Delete Confirmation Dialog
**File:** `OptiConnect_Frontend/src/components/common/DeleteConfirmationDialog.tsx`

**Features:**
- Beautiful modal design with backdrop
- Loading state with spinner
- Customizable title, message, and type (danger/warning)
- Shows item name or count
- Keyboard accessible
- Dark mode support

**Usage Example:**
```typescript
import DeleteConfirmationDialog from '../components/common/DeleteConfirmationDialog';

const [deleteDialog, setDeleteDialog] = useState({
  isOpen: false,
  itemId: null,
  itemName: ''
});

// Show dialog
const handleDeleteClick = (id: string, name: string) => {
  setDeleteDialog({
    isOpen: true,
    itemId: id,
    itemName: name
  });
};

// Confirm delete
const handleConfirmDelete = async () => {
  try {
    await deleteItem(deleteDialog.itemId);
    setDeleteDialog({ isOpen: false, itemId: null, itemName: '' });
  } catch (error) {
    // Handle error
  }
};

// In JSX
<DeleteConfirmationDialog
  isOpen={deleteDialog.isOpen}
  onClose={() => setDeleteDialog({ isOpen: false, itemId: null, itemName: '' })}
  onConfirm={handleConfirmDelete}
  title="Delete Item"
  message="Are you sure you want to delete this item? This action cannot be undone."
  itemName={deleteDialog.itemName}
  isLoading={isDeleting}
  type="danger"
/>
```

---

## 📋 TODO: Integrate Delete Dialogs

### Task 1: Add to Temporary Access Component

**File to modify:** `OptiConnect_Frontend/src/components/admin/TemporaryAccessManagement.tsx` (or similar)

**Steps:**
1. Import DeleteConfirmationDialog
2. Replace `window.confirm()` with DeleteConfirmationDialog
3. Add state for dialog

**Code snippet:**
```typescript
// At top
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

// Add state
const [deleteDialog, setDeleteDialog] = useState({
  isOpen: false,
  accessId: null,
  accessName: ''
});
const [isDeleting, setIsDeleting] = useState(false);

// Replace window.confirm
const handleRevokeClick = (access) => {
  setDeleteDialog({
    isOpen: true,
    accessId: access.id,
    accessName: `${access.user_name} - ${access.region_name}`
  });
};

const handleConfirmRevoke = async () => {
  setIsDeleting(true);
  try {
    await revokeAccess(deleteDialog.accessId);
    // Refresh list
    loadAccess();
    setDeleteDialog({ isOpen: false, accessId: null, accessName: '' });
  } catch (error) {
    console.error('Revoke failed:', error);
  } finally {
    setIsDeleting(false);
  }
};

// Add dialog to JSX
<DeleteConfirmationDialog
  isOpen={deleteDialog.isOpen}
  onClose={() => setDeleteDialog({ isOpen: false, accessId: null, accessName: '' })}
  onConfirm={handleConfirmRevoke}
  title="Revoke Temporary Access"
  message="Are you sure you want to revoke this temporary access?"
  itemName={deleteDialog.accessName}
  isLoading={isDeleting}
  type="warning"
/>
```

---

### Task 2: Add to Region Request Table

**File to modify:** `OptiConnect_Frontend/src/components/user/RegionRequestManagement.tsx` (or similar)

**Steps:**
1. Import DeleteConfirmationDialog
2. Add delete functionality (if not exists)
3. Replace any window.confirm with dialog

**Code snippet:**
```typescript
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

const [deleteDialog, setDeleteDialog] = useState({
  isOpen: false,
  requestId: null,
  requestDetails: ''
});

const handleDeleteRequest = (request) => {
  setDeleteDialog({
    isOpen: true,
    requestId: request.id,
    requestDetails: `${request.user_name} - ${request.region_name}`
  });
};

const handleConfirmDelete = async () => {
  try {
    await deleteRegionRequest(deleteDialog.requestId);
    loadRequests();
    setDeleteDialog({ isOpen: false, requestId: null, requestDetails: '' });
  } catch (error) {
    console.error('Delete failed:', error);
  }
};

// In JSX
<DeleteConfirmationDialog
  isOpen={deleteDialog.isOpen}
  onClose={() => setDeleteDialog({ isOpen: false, requestId: null, requestDetails: '' })}
  onConfirm={handleConfirmDelete}
  title="Delete Region Request"
  message="Are you sure you want to delete this request?"
  itemName={deleteDialog.requestDetails}
  type="danger"
/>
```

---

### Task 3: Add to User Management Bulk Delete

**File to modify:** `OptiConnect_Frontend/src/components/users/UserManagement.tsx`

**Steps:**
1. Import DeleteConfirmationDialog
2. Replace window.confirm for bulk delete with dialog

**Code snippet:**
```typescript
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';

const [bulkDeleteDialog, setBulkDeleteDialog] = useState({
  isOpen: false,
  count: 0
});

const handleBulkDeleteClick = () => {
  if (selectedUsers.length === 0) {
    alert('Please select users to delete');
    return;
  }
  
  setBulkDeleteDialog({
    isOpen: true,
    count: selectedUsers.length
  });
};

const handleConfirmBulkDelete = async () => {
  try {
    await bulkDeleteUsers(selectedUsers);
    setSelectedUsers([]);
    loadUsers();
    setBulkDeleteDialog({ isOpen: false, count: 0 });
  } catch (error) {
    console.error('Bulk delete failed:', error);
  }
};

// In JSX
<DeleteConfirmationDialog
  isOpen={bulkDeleteDialog.isOpen}
  onClose={() => setBulkDeleteDialog({ isOpen: false, count: 0 })}
  onConfirm={handleConfirmBulkDelete}
  title="Delete Multiple Users"
  message="Are you sure you want to delete the selected users? This action cannot be undone."
  itemCount={bulkDeleteDialog.count}
  type="danger"
/>
```

---

## 🔄 TODO: Real-time Updates for Expired Temporary Regions

### Requirement:
When a temporary region expires, it should update in:
1. User Management table
2. Bulk Assignment table
3. Any other component showing user regions

### Solution: Redux State Updates

The `useTemporaryRegionMonitor` hook already updates Redux when regions expire. We need to ensure components are subscribing to these updates.

### Task 4: Update User Management Component

**File:** `OptiConnect_Frontend/src/components/users/UserManagement.tsx`

**Ensure the component re-renders when user regions change:**

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

// In component
const { user: currentUser } = useSelector((state: RootState) => state.auth);

// When displaying users, use a useEffect to watch for auth changes
useEffect(() => {
  // Re-fetch users when current user's regions change
  // This ensures the displayed data is fresh
  loadUsers();
}, [currentUser?.assignedRegions]); // Re-run when regions change
```

**Better approach - Add a refresh mechanism:**

```typescript
// Add to component
const [refreshKey, setRefreshKey] = useState(0);

// Subscribe to auth updates
const { user } = useSelector((state: RootState) => state.auth);

useEffect(() => {
  // When user changes (regions updated), refresh the table
  setRefreshKey(prev => prev + 1);
}, [user?.assignedRegions]);

// Use refreshKey in your data fetching
useEffect(() => {
  loadUsers();
}, [refreshKey]);
```

---

### Task 5: Update Bulk Assignment Component

**File:** `OptiConnect_Frontend/src/components/admin/BulkRegionAssignment.tsx` (or similar)

Same pattern as above:

```typescript
const { user } = useSelector((state: RootState) => state.auth);

useEffect(() => {
  // Refresh available regions when user regions change
  loadAvailableRegions();
}, [user?.assignedRegions]);
```

---

## 🚨 URGENT: Fix CORS Error First!

Before implementing the above, **RESTART THE BACKEND**:

```bash
cd OptiConnect_Backend
# Press Ctrl+C to stop
npm start
```

Verify output shows:
```
🔒 CORS Enabled: http://localhost:3005
```

---

## 📝 Implementation Checklist

### Immediate (Do Now):
- [ ] **Restart backend server** (fixes CORS error)
- [ ] Test region requests work after restart

### Phase 1 (Delete Dialogs):
- [ ] Integrate DeleteConfirmationDialog in Temporary Access
- [ ] Integrate DeleteConfirmationDialog in Region Requests
- [ ] Integrate DeleteConfirmationDialog in User Management bulk delete
- [ ] Test all delete operations

### Phase 2 (Real-time Updates):
- [ ] Add Redux subscription to User Management
- [ ] Add Redux subscription to Bulk Assignment
- [ ] Test: Grant temp access → see it appear
- [ ] Test: Wait for expiry → see it disappear
- [ ] Test: Changes reflect without re-login

---

## 🎯 Expected Results

After implementation:

1. **Delete Operations:**
   - Beautiful confirmation dialogs instead of browser alerts
   - Clear messaging about what will be deleted
   - Loading states during deletion
   - Proper error handling

2. **Real-time Updates:**
   - Expired temporary regions disappear from all tables
   - No re-login required
   - All components stay in sync
   - Updates happen within 30 seconds of expiry

3. **No CORS Errors:**
   - All API calls work
   - Region requests can be submitted
   - No preflight errors

---

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check backend console for API errors  
3. Verify backend shows correct CORS port (3005)
4. Ensure monitor is running (console should show "✅ Temporary region monitor started")

---

**Priority Order:**
1. **Fix CORS (restart backend)** ← Do this NOW
2. Add delete dialogs ← Do this after CORS fixed
3. Test real-time updates ← Should already work with existing code
