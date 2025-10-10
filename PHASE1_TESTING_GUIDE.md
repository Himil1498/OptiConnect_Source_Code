# PHASE 1 TESTING GUIDE: USER MANAGEMENT

## WHAT WAS DONE

### Files Created/Modified:
1. ✅ **`OptiConnect_Frontend/src/services/userService.ts`** - Complete backend integration
   - getAllUsers() - Fetch all users from backend
   - getUserById() - Fetch single user
   - createUser() - Create new user in backend
   - updateUser() - Update existing user
   - deleteUser() - Delete user from backend
   - bulkDeleteUsers() - Delete multiple users
   - bulkUpdateStatus() - Update status for multiple users
   - Transformation functions between backend and frontend models

2. ✅ **`OptiConnect_Frontend/src/components/users/UserManagement.tsx`** - Updated to use backend APIs
   - Added loading states (isLoading, loadingError)
   - Replaced mock data loading with API calls
   - Updated create user to call backend
   - Updated edit user to call backend
   - Updated delete user to call backend
   - Updated bulk delete to call backend
   - Updated bulk status change to call backend
   - Added loading indicators in UI
   - Added error handling with retry button

3. ✅ **`BACKEND_INTEGRATION_MASTER_PLAN.md`** - Created comprehensive integration plan

---

## HOW TO TEST PHASE 1

### Prerequisites:
1. **Backend running:** `cd OptiConnect-Backend && npm run dev`
2. **Frontend running:** `cd OptiConnect_Frontend && npm start`
3. **Test user created:** Run `node quick-test.js` to create admin@opticonnect.com
4. **Logged in:** Login to frontend with admin@opticonnect.com / Admin@123

---

## TEST SCENARIOS

### Test 1: View Users (Load from Backend)
**Objective:** Verify users are loaded from backend, not localStorage

**Steps:**
1. Navigate to User Management page
2. Open browser DevTools (F12) → Network tab
3. Refresh page
4. Look for network request: `GET http://localhost:5000/api/users`

**Expected Result:**
- ✅ Network request shows successful (Status 200)
- ✅ Table displays users from backend
- ✅ If no users, shows "No users found" message
- ✅ If request fails, shows error with Retry button

**What to Check:**
- Console shows: "🔄 Loading data..."
- Console shows: "✅ Total entries loaded: X"
- Table populates with backend data
- Loading spinner appears briefly

---

### Test 2: Create New User (Backend)
**Objective:** Create user via frontend, verify it appears in backend database

**Steps:**
1. Click "Add New User" button
2. Fill in form:
   - Username: `test_user1`
   - Full Name: `Test User One`
   - Email: `testuser1@opticonnect.com`
   - Password: `Test@123`
   - Gender: Male
   - Phone Number: `+91-9876543210`
   - Office Location: `Mumbai Office`
   - Role: Manager
   - Address: (fill all fields)
   - Assigned Regions: Select Maharashtra
   - Status: Active
3. Click "Create User"
4. Wait for response

**Expected Result:**
- ✅ Modal closes
- ✅ User list reloads
- ✅ New user appears in table
- ✅ Network request: `POST http://localhost:5000/api/users` (Status 200)

**Verify in Database:**
```sql
SELECT * FROM users WHERE email = 'testuser1@opticonnect.com';
```

**Expected:**
- User exists in database
- `full_name` = "Test User One"
- `username` = "test_user1"
- `role` = "manager"
- `is_active` = 1
- `regions` = JSON array containing "Maharashtra"

**Error Scenarios to Test:**
- Try creating user with existing email → Should show error
- Try creating user with existing username → Should show error
- Submit form with empty required fields → Should show validation errors

---

### Test 3: Edit Existing User (Backend)
**Objective:** Edit user via frontend, verify changes in backend database

**Steps:**
1. Find a user in the table
2. Click the Edit button (pencil icon)
3. Modify fields:
   - Change name: "Test User One Updated"
   - Change role: Admin
   - Add another region: Gujarat
4. Click "Update User"
5. Wait for response

**Expected Result:**
- ✅ Modal closes
- ✅ User list reloads
- ✅ Changes appear in table
- ✅ Network request: `PUT http://localhost:5000/api/users/[id]` (Status 200)

**Verify in Database:**
```sql
SELECT * FROM users WHERE id = [user_id];
```

**Expected:**
- `full_name` = "Test User One Updated"
- `role` = "admin"
- `regions` = JSON array containing both Maharashtra and Gujarat
- `updated_at` timestamp is recent

---

### Test 4: Delete Single User (Backend)
**Objective:** Delete user via frontend, verify removal from backend database

**Steps:**
1. Find a test user in the table
2. Click the Delete button (trash icon)
3. Confirm deletion in dialog
4. Wait for response

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ After confirm, user disappears from table
- ✅ Network request: `DELETE http://localhost:5000/api/users/[id]` (Status 200)

**Verify in Database:**
```sql
SELECT * FROM users WHERE id = [user_id];
```

**Expected:**
- User does not exist (returns empty result)

**Error Scenarios to Test:**
- Try deleting yourself (logged-in user) → Backend may prevent this
- Cancel the delete dialog → User should remain in table

---

### Test 5: Bulk Delete Users (Backend)
**Objective:** Delete multiple users at once

**Steps:**
1. Create 3 test users first (use Test 2)
2. Select checkboxes for 2-3 users
3. Click "Delete" in bulk actions bar
4. Confirm deletion
5. Wait for response

**Expected Result:**
- ✅ Bulk actions bar shows "X user(s) selected"
- ✅ After confirm, users disappear from table
- ✅ Network request: `DELETE http://localhost:5000/api/users/bulk-delete` (Status 200)
- ✅ Selection clears

**Verify in Database:**
```sql
SELECT * FROM users WHERE id IN ([id1], [id2], [id3]);
```

**Expected:**
- All selected users are deleted from database

---

### Test 6: Bulk Status Change (Backend)
**Objective:** Activate/deactivate multiple users at once

**Steps:**
1. Create 2-3 active test users
2. Select checkboxes for them
3. Click "Deactivate" in bulk actions bar
4. Wait for response
5. Verify status changed to Inactive

**Expected Result:**
- ✅ Users show "Inactive" status badge (gray)
- ✅ Network request: `PATCH http://localhost:5000/api/users/bulk-status` (Status 200)
- ✅ Selection clears

**Then test activation:**
1. Select the same users (now inactive)
2. Click "Activate" in bulk actions bar
3. Verify status changed back to Active

**Verify in Database:**
```sql
SELECT username, is_active FROM users WHERE id IN ([id1], [id2]);
```

**Expected:**
- After deactivate: `is_active` = 0
- After activate: `is_active` = 1

---

### Test 7: Search & Filter (Frontend)
**Objective:** Verify search and filters work with backend data

**Steps:**
1. Ensure you have users with different roles (Admin, Manager, User)
2. Use search box: Type user email/name
3. Use role filter: Select "Manager"
4. Use status filter: Select "Active"
5. Click "Clear Filters"

**Expected Result:**
- ✅ Search filters users in real-time
- ✅ Role filter shows only selected role
- ✅ Status filter shows only active/inactive users
- ✅ Clear filters resets all filters
- ✅ All filtering happens on frontend (no new API calls)

**Note:** Search is client-side filtering on already loaded data

---

### Test 8: Loading States (UI)
**Objective:** Verify loading indicators work correctly

**Steps:**
1. Refresh page and watch for loading spinner
2. Create a user and watch for loading state
3. Delete a user and watch for loading state
4. Simulate slow network (DevTools → Network → Throttling → Slow 3G)
5. Try any operation

**Expected Result:**
- ✅ Loading spinner appears during data fetch
- ✅ Buttons disabled during operations (create/edit/delete)
- ✅ Table shows loading indicator
- ✅ No duplicate API calls

---

### Test 9: Error Handling (Edge Cases)
**Objective:** Verify error scenarios are handled gracefully

**Scenarios to Test:**

**A. Backend Not Running:**
1. Stop backend server
2. Refresh User Management page
3. Expected: Error message with "Failed to load users" + Retry button
4. Click Retry → Still fails
5. Start backend, click Retry → Should load successfully

**B. Network Error During Create:**
1. Stop backend
2. Try creating a user
3. Expected: Alert showing "Failed to create user: [error]"
4. Form stays open, data not lost

**C. Validation Errors:**
1. Try creating user with invalid email format
2. Try creating user with missing required fields
3. Expected: Red error messages under fields

**D. Duplicate Email:**
1. Create user with email "test@example.com"
2. Try creating another user with same email
3. Expected: Backend returns error, frontend shows alert

---

### Test 10: Data Persistence (Critical)
**Objective:** Verify data persists across sessions

**Steps:**
1. Create 2 new users via frontend
2. Close browser tab
3. Reopen frontend, login again
4. Navigate to User Management

**Expected Result:**
- ✅ Both users appear in table
- ✅ All user details correct
- ✅ No data loss
- ✅ Data loaded from backend, not localStorage

**Verify:** Check browser → Application → Local Storage → Should NOT see user data there (should be in backend database only)

---

## BACKEND VERIFICATION

### Direct Backend API Testing (Optional)

**1. Get All Users:**
```bash
curl http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@opticonnect.com",
      "full_name": "Admin User",
      "role": "admin",
      "is_active": true,
      "regions": "[\"Maharashtra\"]",
      ...
    }
  ]
}
```

**2. Create User:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "curl_test",
    "email": "curltest@opticonnect.com",
    "password": "Test@123",
    "full_name": "Curl Test User",
    "role": "viewer",
    "department": "Test Dept",
    "is_active": true
  }'
```

**3. Update User:**
```bash
curl -X PUT http://localhost:5000/api/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "full_name": "Updated Name",
    "role": "manager"
  }'
```

**4. Delete User:**
```bash
curl -X DELETE http://localhost:5000/api/users/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## COMMON ISSUES & FIXES

### Issue 1: "Failed to fetch users"
**Possible Causes:**
- Backend not running
- CORS error
- Wrong API URL in .env
- Authentication token missing/expired

**Fix:**
1. Check backend is running: `http://localhost:5000/api/health`
2. Check frontend .env: `REACT_APP_API_URL=http://localhost:5000/api`
3. Check backend .env: `FRONTEND_URL=http://localhost:3001`
4. Re-login to refresh token

---

### Issue 2: CORS Error
**Symptoms:** Console shows "Access to fetch... has been blocked by CORS policy"

**Fix:**
1. Check backend .env has correct FRONTEND_URL
2. Restart backend server after changing .env
3. Clear browser cache (Ctrl+Shift+Delete)
4. Hard refresh (Ctrl+F5)

---

### Issue 3: "User already exists"
**Symptoms:** Can't create user with certain email/username

**Cause:** User with that email/username exists in database

**Fix:**
1. Use different email/username, OR
2. Delete existing user first, OR
3. Check database: `SELECT * FROM users WHERE email = 'x@y.com'`

---

### Issue 4: Users Load from Mock Data
**Symptoms:** See mock users (Rajesh Kumar, Priya Sharma, Amit Singh)

**Cause:** Backend request failed, fallback to mock data

**Fix:**
1. Check console for error messages
2. Verify backend is running
3. Check Network tab for failed requests
4. Fix backend connection issue
5. Click Retry button

---

### Issue 5: TypeScript Errors
**Symptoms:** Build fails with TypeScript errors in userService.ts

**Common Errors:**
- `Property 'regions' does not exist` → Backend might return `regions` as array, not string
- `Type 'number' is not assignable to type 'string'` → ID transformation issue

**Fix:**
1. Check backend response format in Network tab
2. Update transformation functions if backend schema changed
3. Add console.log in transformBackendUser() to debug

---

## SUCCESS CRITERIA

Phase 1 is successful when ALL of these work:

✅ **1. Create User:**
- Frontend form → Backend database
- User appears in table
- Can login with created user

✅ **2. View Users:**
- Data loaded from backend
- No mock data used
- All fields displayed correctly

✅ **3. Edit User:**
- Changes saved to backend
- Table updates automatically
- Database reflects changes

✅ **4. Delete User:**
- User removed from backend
- User disappears from table
- Database confirms deletion

✅ **5. Bulk Operations:**
- Bulk delete works
- Bulk status change works
- Correct API calls made

✅ **6. Error Handling:**
- Loading indicators shown
- Errors displayed clearly
- Retry button works
- No crashes

✅ **7. Data Persistence:**
- Data survives page refresh
- Data survives browser close
- Data in database, not localStorage

---

## NEXT STEPS

After Phase 1 passes all tests:

**Phase 2: Core GIS Tools**
- Distance Measurement Tool
- Polygon Drawing Tool
- Circle Drawing Tool

**Implementation Steps:**
1. Create distanceMeasurementService.ts
2. Update DistanceMeasurementTool.tsx
3. Create polygonDrawingService.ts
4. Update PolygonDrawingTool.tsx
5. Create circleDrawingService.ts
6. Update CircleDrawingTool.tsx
7. Update DataHub to load from backend

Follow the same pattern as Phase 1:
- Create service file
- Add transformation functions
- Update component with API calls
- Add loading states
- Test thoroughly

---

## DEBUGGING TIPS

**Enable Detailed Logging:**
1. Open browser console (F12)
2. Look for these logs:
   - `🔄 Loading data...`
   - `✅ Total entries loaded: X`
   - `Error fetching users: ...`

**Check Network Requests:**
1. Open DevTools → Network tab
2. Filter by "users"
3. Check request/response for each operation
4. Look for failed requests (red)
5. Inspect request payload and response data

**Database Inspection:**
```sql
-- See all users
SELECT * FROM users;

-- See recent users
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- See inactive users
SELECT * FROM users WHERE is_active = 0;

-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;
```

**Backend Logs:**
Check backend terminal for logs showing:
- Incoming requests
- Database queries
- Errors/warnings
- Success messages

---

## CONGRATULATIONS!

If all tests pass, you've successfully completed **Phase 1: User Management Backend Integration**! 🎉

Your application now:
- Stores users in MySQL database (not localStorage)
- Supports full CRUD operations via backend APIs
- Handles errors gracefully
- Shows loading states
- Persists data across sessions

**Ready for Phase 2!** 🚀
