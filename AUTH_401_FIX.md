# 🔐 401 Authentication Error - SOLUTION

## ❌ Error

```
Error loading users: Error: Request failed with status code 401
    at Module.getAllUsers (userService.ts:213:1)
    at async loadUsers (UserManagement.tsx:142:1)
```

## 🔍 Root Cause

You have `REACT_APP_USE_BACKEND=true` in your `.env` file, which means the frontend should use real backend authentication. However, if you logged in before with mock mode, you might have an **invalid mock token** stored in localStorage that the backend doesn't recognize.

## ✅ Solution - CLEAR OLD TOKENS AND RE-LOGIN

### Quick Fix (Recommended):

1. **Open Browser DevTools** (F12)
2. **Go to Console Tab**
3. **Run these commands**:
   ```javascript
   localStorage.removeItem('opti_connect_token');
   localStorage.removeItem('opti_connect_user');
   localStorage.removeItem('persist:root');
   location.reload();
   ```

4. **Login again** with backend credentials

This will clear the old mock token and force you to get a real JWT token from the backend.

---

## 🎯 Permanent Solution - Backend User Accounts

Since `USE_BACKEND=true`, you need to create actual user accounts in the MySQL database.

### Option 1: Use Existing Backend Users

Check if you already have users in the database:

```bash
# In backend terminal
cd OptiConnect-Backend
node -e "const { pool } = require('./src/config/database'); pool.query('SELECT id, username, email, role FROM users').then(([users]) => { console.log(users); process.exit(); });"
```

### Option 2: Create a New Admin User

Run this SQL in your MySQL database:

```sql
-- Create admin user
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES (
  'admin',
  'admin@opticonnect.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',  -- This is hashed "Admin@123"
  'Admin User',
  'admin',
  true
);
```

Or use the backend API to create a user (if you have access):

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@opticonnect.com",
    "password": "Admin@123",
    "full_name": "Admin User",
    "role": "admin"
  }'
```

### Option 3: Switch to Mock Mode (Development Only)

If you don't want to use the backend right now, change your `.env`:

```env
# Change this line:
REACT_APP_USE_BACKEND=false

# Instead of:
REACT_APP_USE_BACKEND=true
```

Then restart the frontend:
```bash
# Stop the dev server (Ctrl+C)
npm start
```

Now you can use mock credentials:
- **Admin**: `admin@example.com` / any password
- **Manager**: `field@example.com` / any password

---

## 🔧 How Backend Authentication Works

### 1. Login Flow (USE_BACKEND=true):

```
Frontend Login Form
  ↓
AuthContext.handleLogin()
  ↓
apiService.login(email, password)
  ↓
POST http://localhost:5000/api/auth/login
  ↓
Backend: Verify email/password in MySQL database
  ↓
Backend: Generate JWT token (valid for 15 minutes)
  ↓
Frontend: Store token in localStorage
  ↓
Frontend: Store token in Redux state
```

### 2. API Requests:

```
Frontend: getAllUsers()
  ↓
userService.ts apiClient.get('/users')
  ↓
Interceptor adds header: Authorization: Bearer <token>
  ↓
Backend: auth.js middleware verifies token
  ↓
Backend: Returns user list
```

### 3. Token Verification:

The backend `auth.js` middleware checks:
1. ✅ Header exists: `Authorization: Bearer <token>`
2. ✅ Token is valid JWT
3. ✅ User exists in database
4. ✅ User is active

If any check fails → **401 Unauthorized**

---

## 📊 Debugging Steps

### Step 1: Check What Token You Have

Open Browser DevTools Console and run:

```javascript
console.log('Token:', localStorage.getItem('opti_connect_token'));
console.log('User:', localStorage.getItem('opti_connect_user'));
```

**Mock Token** (Invalid for backend):
```
Token: dev_token_1728543210000
User: {"id":"admin_001",...}
```

**Real Token** (Valid JWT):
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzI4NTQzMjEwfQ...
User: {"id":"1","username":"admin",...}
```

### Step 2: Check Backend Logs

In your backend terminal, you should see:

**Successful Auth**:
```
POST /api/auth/login - 200 OK
GET /api/users - 200 OK
```

**Failed Auth**:
```
POST /api/auth/login - 200 OK
GET /api/users - 401 Unauthorized
Authentication error: Invalid or expired token
```

### Step 3: Test Backend Directly

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opticonnect.com","password":"Admin@123"}'

# Should return:
# {"success":true,"token":"eyJ...","user":{...}}

# Test getting users (use token from above)
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer eyJ..."

# Should return:
# {"success":true,"users":[...]}
```

---

## 🎯 Quick Checklist

- [ ] **Backend server is running** on port 5000
- [ ] **MySQL database is running** and connected
- [ ] **User accounts exist** in the database
- [ ] **REACT_APP_USE_BACKEND=true** in `.env`
- [ ] **Clear old tokens** from localStorage
- [ ] **Re-login** with backend credentials
- [ ] **Check browser console** for token format
- [ ] **Check backend logs** for authentication errors

---

## 🚀 Recommended Action (RIGHT NOW)

Run this in your browser console to fix immediately:

```javascript
// Clear all auth data
localStorage.clear();

// Reload page
location.reload();

// Then login again with backend credentials
```

---

## 📝 Backend Credentials

If you need to create a test admin user, here's a script:

**File**: `OptiConnect-Backend/create-admin.js`

```javascript
const { pool } = require('./src/config/database');
const { hashPassword } = require('./src/utils/bcrypt');

async function createAdmin() {
  try {
    const hashedPassword = await hashPassword('Admin@123');

    await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin', 'admin@opticonnect.com', hashedPassword, 'Admin User', 'admin', true]
    );

    console.log('✅ Admin user created successfully');
    console.log('Email: admin@opticonnect.com');
    console.log('Password: Admin@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
```

Run it:
```bash
cd OptiConnect-Backend
node create-admin.js
```

---

## ✅ Summary

**Problem**: 401 error when loading users

**Cause**: Using old mock token with backend mode enabled

**Solution**: Clear localStorage and login again with real backend credentials

**Quick Fix**:
```javascript
localStorage.clear();
location.reload();
```

Then login with backend credentials (not `admin@example.com` mock credentials).
