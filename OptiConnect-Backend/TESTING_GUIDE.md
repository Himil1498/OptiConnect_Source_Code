# 🧪 TESTING GUIDE - How to Test Your Backend APIs

## Method 1: Using Thunder Client (VS Code Extension) - **RECOMMENDED**

### Step 1: Install Thunder Client
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Thunder Client"
4. Install it
5. Click the Thunder Client icon in the sidebar

### Step 2: Test Server is Running

**Create New Request:**
- Method: `GET`
- URL: `http://localhost:5000`
- Click "Send"

**Expected Response:**
```json
{
  "success": true,
  "message": "🚀 PersonalGIS Backend API is running!",
  "version": "1.0.0"
}
```

### Step 3: Test Register API

**Create New Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/register`
- Headers: Click "Headers" tab
  - Add: `Content-Type` = `application/json`
- Body: Click "Body" tab, select "JSON"
  - Paste this:
```json
{
  "username": "admin",
  "email": "admin@opticonnect.com",
  "password": "admin123",
  "full_name": "Admin User",
  "role": "admin"
}
```
- Click "Send"

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@opticonnect.com",
    "full_name": "Admin User",
    "role": "admin"
  }
}
```

**⚠️ Copy the token** - you'll need it for other requests!

### Step 4: Test Login API

**Create New Request:**
- Method: `POST`
- URL: `http://localhost:5000/api/auth/login`
- Headers: `Content-Type` = `application/json`
- Body (JSON):
```json
{
  "email": "admin@opticonnect.com",
  "password": "admin123"
}
```
- Click "Send"

**Expected Response:** Same as register, with token and user data.

### Step 5: Test Get Current User (Protected Route)

**Create New Request:**
- Method: `GET`
- URL: `http://localhost:5000/api/auth/me`
- Headers:
  - `Content-Type` = `application/json`
  - `Authorization` = `Bearer YOUR_TOKEN_HERE` (replace with your actual token)
- Click "Send"

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@opticonnect.com",
    "full_name": "Admin User",
    "role": "admin",
    "regions": []
  }
}
```

---

## Method 2: Using Postman (Desktop App)

### Step 1: Download Postman
- Go to: https://www.postman.com/downloads/
- Download and install
- Open Postman

### Step 2: Create New Collection
1. Click "New" → "Collection"
2. Name it "PersonalGIS APIs"
3. Click "Add Request"

### Step 3: Test Same Requests as Above
Follow the same steps as Thunder Client method.

---

## Method 3: Using curl (Command Line)

### Open Command Prompt or PowerShell

### Test 1: Server Running
```bash
curl http://localhost:5000
```

### Test 2: Register User
```bash
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"email\":\"admin@opticonnect.com\",\"password\":\"admin123\",\"full_name\":\"Admin User\",\"role\":\"admin\"}"
```

### Test 3: Login
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@opticonnect.com\",\"password\":\"admin123\"}"
```

### Test 4: Get Current User (replace YOUR_TOKEN)
```bash
curl -X GET http://localhost:5000/api/auth/me ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Method 4: Using Browser (for GET requests only)

### Test Server Running:
1. Open browser
2. Go to: `http://localhost:5000`
3. You should see the JSON response

### Test Health Check:
Go to: `http://localhost:5000/api/health`

**Note:** Browser can only test GET requests. For POST/PUT/DELETE, use Thunder Client or Postman.

---

## 📋 Complete Test Checklist

### ✅ Basic Tests
- [ ] Server starts without errors
- [ ] Can access `http://localhost:5000`
- [ ] Health check works: `http://localhost:5000/api/health`
- [ ] MySQL connection successful (check terminal logs)

### ✅ Authentication Tests
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Receive JWT token on login
- [ ] Can get current user with token
- [ ] Cannot access protected routes without token
- [ ] Get 401 error with invalid token

### ✅ Error Handling Tests
- [ ] Register with duplicate email - should get error
- [ ] Login with wrong password - should get error
- [ ] Access protected route without token - should get 401
- [ ] Send invalid JSON - should get 400 error

---

## 🎯 Quick Test Script (All in Thunder Client)

### 1. Create a Collection "Auth Tests"

### 2. Add These Requests:

#### Request 1: Health Check
```
GET http://localhost:5000/api/health
```

#### Request 2: Register
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "test123",
  "full_name": "Test User",
  "role": "viewer"
}
```

#### Request 3: Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}
```

#### Request 4: Get Me
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer {{token}}
```

### 3. Run All Tests in Sequence

Thunder Client allows you to save the token from login response and use it in subsequent requests!

---

## 🔍 What to Look For

### ✅ Success Response Format:
```json
{
  "success": true,
  "data": {...}
}
```

### ❌ Error Response Format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

### 🔐 Token Format:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InZpZXdlciIsImlhdCI6MTcwNjg5MDAwMCwiZXhwIjoxNzA2ODkwOTAwfQ.signature_here
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Cannot connect to server"
**Solution:**
- Make sure server is running: `npm run dev`
- Check terminal for errors
- Verify URL is `http://localhost:5000` (not https)

### Issue 2: "MySQL Connection Failed"
**Solution:**
- Check MySQL is running
- Verify DB_PASSWORD in .env file
- Check database exists

### Issue 3: "401 Unauthorized"
**Solution:**
- Check you're using correct token
- Token format: `Bearer YOUR_TOKEN` (with space after Bearer)
- Token may be expired (15 minutes) - login again

### Issue 4: "User already exists"
**Solution:**
- Use different email
- Or delete user from database:
```sql
DELETE FROM users WHERE email = 'admin@opticonnect.com';
```

### Issue 5: "Invalid token"
**Solution:**
- Get new token by logging in again
- Check JWT_SECRET in .env is correct
- Make sure you copied the entire token

---

## 📊 Expected Response Times

- Health Check: ~50ms
- Register: ~100-200ms (password hashing takes time)
- Login: ~100-200ms
- Get User: ~50-100ms

If responses are slower, check your MySQL connection or server performance.

---

## 🎓 Pro Tips

1. **Save Your Requests:** In Thunder Client, save all requests in a collection for reuse
2. **Use Environment Variables:** Store base URL and token as variables
3. **Check Terminal:** Always watch server terminal for logs and errors
4. **Test Errors Too:** Try invalid data to ensure error handling works
5. **Use Auto-Complete:** Thunder Client has auto-complete for headers

---

## 📝 Test Log Template

Keep track of your tests:

```
Date: __________
Test: Register New User
URL: POST http://localhost:5000/api/auth/register
Status: ✅ Pass / ❌ Fail
Response Time: ____ ms
Notes: ___________________________

Date: __________
Test: Login
URL: POST http://localhost:5000/api/auth/login
Status: ✅ Pass / ❌ Fail
Response Time: ____ ms
Notes: ___________________________
```

---

## 🚀 Next Steps After Testing

Once all authentication tests pass:
1. ✅ Authentication system is working
2. ✅ Database connection is good
3. ✅ Server is configured correctly
4. ⏭️ Ready to create more APIs
5. ⏭️ Ready to connect frontend

---

## ❓ Need Help?

If something doesn't work:
1. Check the error message in Thunder Client response
2. Check server terminal for backend errors
3. Verify your .env file settings
4. Make sure all steps were followed

**Common Error Messages:**
- "ECONNREFUSED" → Server not running
- "ER_ACCESS_DENIED" → Wrong MySQL password
- "ER_NO_SUCH_TABLE" → Tables not created
- "Invalid token" → Token expired or incorrect

---

## 🎉 You're Ready to Test!

**Recommended Method:** Thunder Client (easiest for beginners)

**Start with:**
1. Test server is running
2. Register a user
3. Login with that user
4. Get current user info

**All working?** You're ready for the next phase! 🚀
