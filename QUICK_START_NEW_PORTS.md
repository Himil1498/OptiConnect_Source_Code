# 🚀 Quick Start Guide - New Ports & Real-Time Expiry

## ✅ What Changed

### Port Changes
- **Backend:** Port `5000` → `5005`
- **Frontend:** Port `3002` → `3005`

### New Feature
- **Real-time temporary region expiry** - Regions automatically disappear from map when they expire (no re-login needed!)

---

## 🎯 How to Start

### Step 1: Start Backend (Port 5005)

```bash
cd OptiConnect_Backend
npm start
```

**Expected Output:**
```
🚀 PersonalGIS Backend Server Started Successfully!
📡 Server: http://localhost:5005
```

### Step 2: Start Frontend (Port 3005)

```bash
cd OptiConnect_Frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view telecom-gis-platform in the browser.
Local: http://localhost:3005
```

### Step 3: Access Application

Open browser and go to: **http://localhost:3005**

---

## 🧪 Quick Test - Real-Time Expiry

### Test Scenario: 1-Minute Temporary Access

**Step 1: Login as Admin**
- URL: http://localhost:3005
- Email: admin@opticonnect.com
- Password: [your password]

**Step 2: Grant Temporary Access**
1. Go to **Users** → **Temporary Access**
2. Click **Grant Access**
3. Select a user (e.g., test user)
4. Select a region (e.g., "Maharashtra")
5. Set expiry: **1 minute from now**
6. Click **Grant**

**Step 3: Login as Test User**
1. Open **incognito/private window**
2. Go to http://localhost:3005
3. Login as test user
4. Go to **Map** page
5. Verify "Maharashtra" region is visible
6. **Open browser console (F12)**

**Step 4: Watch Magic Happen! ✨**
1. Keep map page open
2. Watch console for messages
3. After ~1 minute, you'll see:
   ```
   🔄 Temporary region access has changed
      Previous regions: ["Gujarat", "Maharashtra"]
      Current valid regions: ["Gujarat"]
   ⏰ Your temporary region access has expired
   ```
4. **Maharashtra disappears from map automatically!**
5. **No re-login needed!**

---

## 📊 Monitor Activity

### Backend Console
Watch for:
```
GET /api/temporary-access/current-regions 200
```
This call happens every 30 seconds to check region expiry.

### Frontend Console
Watch for:
```
✅ Temporary region monitor started (checking every 30s)
```

### Browser Network Tab (F12)
Watch for periodic API calls to:
```
/api/temporary-access/current-regions
```

---

## ⚙️ Configuration

### Change Check Interval

**File:** `OptiConnect_Frontend/src/App.tsx`

```typescript
// Current (30 seconds)
useTemporaryRegionMonitor(30000);

// Change to 10 seconds (faster testing)
useTemporaryRegionMonitor(10000);

// Change to 1 minute (production)
useTemporaryRegionMonitor(60000);
```

---

## 🐛 Troubleshooting

### Issue: Port Already in Use

**Backend:**
```bash
# Check what's using port 5005
netstat -ano | findstr :5005

# Kill the process (Windows)
taskkill /F /PID [process_id]
```

**Frontend:**
```bash
# Check what's using port 3005
netstat -ano | findstr :3005

# Kill the process (Windows)
taskkill /F /PID [process_id]
```

### Issue: Can't Connect to Backend

**Check:**
1. Backend is running on port 5005 (not 5000)
2. Frontend .env has correct API URL: `http://localhost:5005/api`
3. No CORS errors in console

### Issue: Monitor Not Working

**Check:**
1. User is logged in
2. User has some regions assigned
3. Console shows: `✅ Temporary region monitor started`
4. No JavaScript errors in console

---

## 📁 Key Files Changed

### Backend
- `OptiConnect_Backend/.env` - Port changed to 5005
- `OptiConnect_Backend/server.js` - Port default to 5005
- `OptiConnect_Backend/src/controllers/temporaryAccessController.js` - Added `getCurrentValidRegions()`
- `OptiConnect_Backend/src/routes/temporaryAccess.routes.js` - Added `/current-regions` route

### Frontend
- `OptiConnect_Frontend/.env` - Port changed to 3005, API URL to 5005
- `OptiConnect_Frontend/src/hooks/useTemporaryRegionMonitor.ts` - **NEW FILE** - Monitor hook
- `OptiConnect_Frontend/src/App.tsx` - Added monitor component

---

## 🎯 Success Checklist

After starting servers, verify:

- [ ] Backend running on **http://localhost:5005**
- [ ] Frontend running on **http://localhost:3005**
- [ ] Can login successfully
- [ ] Console shows: `✅ Temporary region monitor started`
- [ ] Network tab shows periodic calls to `/temporary-access/current-regions`
- [ ] Temporary regions expire automatically on map
- [ ] No re-login needed for expiry to take effect

---

## 📚 Full Documentation

For complete details, see: **REAL_TIME_REGION_EXPIRY_IMPLEMENTATION.md**

---

## 🎉 That's It!

Your OptiConnect GIS Platform now has:
- ✅ New ports (5005 backend, 3005 frontend)
- ✅ Real-time temporary region expiry
- ✅ Automatic map updates
- ✅ No re-login required

Enjoy! 🚀
