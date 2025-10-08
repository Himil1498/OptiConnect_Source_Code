# LocalStorage Data Management Guide

## Overview
The application uses **localStorage** to persist user data in development mode. This allows users to create, edit, and manage users without needing a backend API.

---

## 🗄️ **Current LocalStorage Implementation**

### **Storage Keys**
```typescript
STORAGE_KEYS = {
  USERS_LIST: 'opti_connect_users_list',       // All users data
  CURRENT_USER: 'opti_connect_user',            // Currently logged-in user
  AUTH_TOKEN: 'opti_connect_token',             // Authentication token
}
```

### **What's Stored**

#### 1. **Authentication Data**
- **Key**: `opti_connect_user`
- **Stores**: Currently logged-in user object
- **Updated**: On login, profile updates
- **Example**:
```json
{
  "id": "USER001",
  "username": "admin_raj",
  "name": "Rajesh Kumar",
  "email": "rajesh.kumar@jio.com",
  "role": "Admin",
  "assignedRegions": ["Maharashtra", "Gujarat"],
  ...
}
```

#### 2. **Auth Token**
- **Key**: `opti_connect_token`
- **Stores**: Mock authentication token
- **Updated**: On login/logout
- **Example**: `"mock_token_1234567890"`

#### 3. **Users List** (New Feature)
- **Key**: `opti_connect_users_list`
- **Stores**: Array of all created users
- **Updated**: On create, edit, delete operations
- **Example**:
```json
[
  {
    "id": "USER001",
    "username": "admin_raj",
    "name": "Rajesh Kumar",
    "assignedRegions": ["Maharashtra"],
    ...
  },
  {
    "id": "USER002",
    "username": "manager_priya",
    "assignedRegions": ["Delhi", "Punjab"],
    ...
  }
]
```

---

## 🛠️ **New Utility Functions**

### **File**: `src/utils/userStorage.ts`

#### **Core Functions**

1. **getUsersFromStorage()**
   - Get all users from localStorage
   - Returns: `User[]`

2. **addUserToStorage(user: User)**
   - Add new user to storage
   - Returns: `boolean` (success/failure)

3. **updateUserInStorage(userId: string, updates: Partial<User>)**
   - Update existing user
   - Returns: `boolean`

4. **deleteUserFromStorage(userId: string)**
   - Delete user from storage
   - Returns: `boolean`

5. **bulkUpdateUsersInStorage(userIds: string[], updates: Partial<User>)**
   - Update multiple users at once
   - Returns: `boolean`

6. **bulkDeleteUsersFromStorage(userIds: string[])**
   - Delete multiple users at once
   - Returns: `boolean`

7. **getUserByEmailFromStorage(email: string)**
   - Find user by email for login
   - Returns: `User | null`

8. **validateUserCredentials(email: string, password: string)**
   - Validate login credentials
   - Updates login history
   - Returns: `User | null`

---

## 📝 **How It Works**

### **1. User Creation Flow**
```typescript
// User creates new user in UserManagement
→ Form submitted
→ addUserToStorage(newUser)
→ User added to localStorage['opti_connect_users_list']
→ UI updated with new user
→ Alert: "User created successfully! Data saved to localStorage."
```

### **2. User Login Flow**
```typescript
// User logs in with email/password
→ validateUserCredentials(email, password)
→ Finds user in localStorage['opti_connect_users_list']
→ Updates login history
→ Saves to localStorage['opti_connect_user']
→ Saves token to localStorage['opti_connect_token']
→ User redirected to dashboard
```

### **3. Region Assignment Flow**
```typescript
// Admin assigns regions to user
→ User created/edited with assignedRegions: ['Maharashtra', 'Gujarat']
→ Saved to localStorage
→ User logs in
→ getUsersFromStorage() → finds user data
→ assignedRegions loaded from localStorage
→ Map highlights only assigned regions
```

---

## 🔄 **Data Persistence**

### **When Data is Saved**
✅ User creation - immediately saved
✅ User update - immediately saved
✅ User deletion - immediately saved
✅ Bulk operations - immediately saved
✅ Login - updates login history
✅ Status changes - immediately saved

### **When Data is Loaded**
✅ App initialization - loads current user
✅ UserManagement page load - loads all users
✅ MapPage load - loads current user's regions
✅ Login - validates against stored users

---

## 💾 **Storage Capacity**

### **LocalStorage Limits**
- **Maximum**: ~5-10 MB per domain
- **Current Usage**: ~50 KB for 100 users
- **Recommended**: Max 1000 users in localStorage

### **Check Storage Usage**
```typescript
import { getStorageStats } from './utils/userStorage';

const stats = getStorageStats();
console.log(`Storage size: ${stats.storageSize} bytes`);
console.log(`Total users: ${stats.totalUsers}`);
```

---

## 🧪 **Testing the Feature**

### **Test Scenario 1: Create User with Regions**
1. Navigate to `/users`
2. Click "Add New User"
3. Fill in all fields
4. Select regions: Maharashtra, Gujarat
5. Click "Create User"
6. **Expected**: Alert "User created successfully! Data saved to localStorage"
7. **Verify**: Open DevTools → Application → LocalStorage → Check `opti_connect_users_list`

### **Test Scenario 2: Login with Created User**
1. Logout from current session
2. Login with newly created user's email
3. Navigate to `/map`
4. **Expected**: Only assigned regions (Maharashtra, Gujarat) are highlighted
5. **Verify**: Legend shows "Access to 2 regions"

### **Test Scenario 3: Edit User Regions**
1. Go to `/users`
2. Edit the user
3. Change assignedRegions to: Delhi, Punjab
4. Save
5. Logout and login with that user
6. **Expected**: Map now shows Delhi and Punjab highlighted

### **Test Scenario 4: Bulk Operations**
1. Select multiple users
2. Click "Activate" or "Deactivate"
3. **Expected**: All selected users updated in localStorage
4. Refresh page
5. **Verify**: Changes persisted

---

## 🔍 **Viewing Stored Data**

### **Chrome DevTools**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Local Storage**
4. Select your domain
5. Look for keys:
   - `opti_connect_users_list` - All users
   - `opti_connect_user` - Current user
   - `opti_connect_token` - Auth token

### **Firefox DevTools**
1. Open DevTools (F12)
2. Go to **Storage** tab
3. Select **Local Storage**
4. View stored data

---

## 🚀 **Features Enabled by LocalStorage**

### **✅ Currently Working**
- User creation persists across page refreshes
- Login with created users
- Region assignments persist
- User data survives browser restart
- Bulk operations work correctly
- Search and filter use stored data
- Map region highlighting based on stored regions

### **🔄 Automatic Sync**
- Changes in UserManagement → immediately in localStorage
- Login → updates from localStorage
- MapPage → reads from localStorage
- All operations → real-time persistence

---

## 📊 **Data Structure Example**

### **Complete User Object in LocalStorage**
```json
{
  "id": "USER004",
  "username": "manager_mumbai",
  "name": "Suresh Patel",
  "email": "suresh.patel@jio.com",
  "password": "********",
  "gender": "Male",
  "phoneNumber": "+91-9876543215",
  "address": {
    "street": "Plot 45, BKC",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400051"
  },
  "officeLocation": "Mumbai Regional Office",
  "assignedUnder": ["USER001"],
  "role": "Manager",
  "assignedRegions": ["Maharashtra", "Goa", "Gujarat"],
  "status": "Active",
  "loginHistory": [
    {
      "timestamp": "2025-01-15T14:30:00.000Z",
      "location": "Web Application"
    }
  ],
  "company": "Jio",
  "permissions": ["read", "write", "manage_team"]
}
```

---

## 🔐 **Security Considerations**

### **Current Implementation (Development)**
- Passwords stored as plain text (mock data)
- No encryption
- Client-side only
- Suitable for development/testing

### **Production Recommendations**
- Never store passwords in localStorage
- Use secure backend API
- Implement proper authentication (JWT)
- Encrypt sensitive data
- Use HTTPS only
- Implement CSRF protection

---

## 🛠️ **Troubleshooting**

### **Issue**: Created user not showing after refresh
**Solution**: Check if `initializeUsersStorage()` is called on component mount

### **Issue**: Region assignments not persisting
**Solution**: Verify `updateUserInStorage()` is called after region change

### **Issue**: Login fails with created user
**Solution**: Check `validateUserCredentials()` - in dev mode, any password works

### **Issue**: localStorage full error
**Solution**: Clear old data or export users and reimport

---

## 🔧 **Manual Operations**

### **Clear All User Data**
```typescript
import { clearUsersFromStorage } from './utils/userStorage';
clearUsersFromStorage();
```

### **Export Users**
```typescript
import { exportUsersFromStorage } from './utils/userStorage';
const jsonData = exportUsersFromStorage();
console.log(jsonData); // Copy and save
```

### **Import Users**
```typescript
import { importUsersToStorage } from './utils/userStorage';
const jsonString = '...'; // Your JSON data
importUsersToStorage(jsonString, false); // false = replace, true = merge
```

---

## 📈 **Migration to Backend**

### **When Backend is Ready**
1. Replace `getUsersFromStorage()` with API calls
2. Update `addUserToStorage()` → `apiService.createUser()`
3. Update `updateUserInStorage()` → `apiService.updateUser()`
4. Keep localStorage as cache (optional)
5. Sync on connection restore

### **Hybrid Approach** (Offline Support)
```typescript
// Try API first, fallback to localStorage
async function getUsers() {
  try {
    const users = await apiService.getUsers();
    saveUsersToStorage(users); // Cache
    return users;
  } catch (error) {
    return getUsersFromStorage(); // Fallback
  }
}
```

---

## ✅ **Summary**

### **What Works Now**
✅ Create users → Saved to localStorage
✅ Edit users → Updated in localStorage
✅ Delete users → Removed from localStorage
✅ Login with created users → Works perfectly
✅ Region assignments → Persist and highlight on map
✅ Bulk operations → All saved to localStorage
✅ Data survives page refresh and browser restart
✅ No backend needed for testing

### **Benefits**
- Instant CRUD operations
- No network latency
- Works offline
- Easy testing and development
- No backend setup required
- Real-time updates

---

**Status**: ✅ FULLY IMPLEMENTED
**Storage**: localStorage (client-side)
**Persistence**: Across sessions and browser restarts
**Tested**: All CRUD operations working
**Production**: Ready for backend migration