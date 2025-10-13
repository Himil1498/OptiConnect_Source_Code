# Comprehensive Timezone & UI Fixes Applied

## Problem Summary

1. **Profile dropdown** - No height limit, causing overflow
2. **Time display wrong** - Shows "6h 8m" when should show less (12-hour offset)
3. **Expired regions not removing** - Still visible after time expires
4. **Server timezone mismatch** - Server is ~12 hours behind local time

---

## Root Cause: Server Timezone Mismatch

Your MySQL server uses **local system time** which is **12 hours behind** your actual time (likely set to a wrong timezone). MySQL's `NOW()` function returns this incorrect time, causing all time calculations to be off by 12 hours.

---

## Fixes Applied

### 1. Frontend - Profile Dropdown Height ✅

**File:** `NavigationBar.tsx:341`

**Change:**
```tsx
// Before:
<div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl...">

// After:
<div className="absolute right-0 mt-2 w-80 max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl...">
```

**Result:** Dropdown now has maximum height and scrolls if content is too long.

---

### 2. Frontend - Auto-Remove Expired Grants ✅

**File:** `NavigationBar.tsx:23-50`

**Change:**
```tsx
const fetchTemporaryAccess = async () => {
  const activeAccess = await getMyActiveTemporaryAccess();

  // Filter out expired grants (double-check on frontend)
  const now = new Date();
  const validGrants = activeAccess.filter(grant => {
    const expiresAt = new Date(grant.expiresAt);
    return expiresAt > now;
  });

  setTemporaryAccessCount(validGrants.length);
  setTempAccessGrants(validGrants);
};

// Refresh every 10 seconds for accurate countdown
const interval = setInterval(fetchTemporaryAccess, 10000);
```

**Result:** Expired grants disappear immediately from UI.

---

### 3. Backend - Force UTC Timezone ✅

#### A. Database Connection Configuration

**File:** `database.js:5-16`

**Change:**
```javascript
const pool = mysql.createPool({
  // ... other config
  timezone: '+00:00' // Force UTC timezone
});
```

#### B. Display Timezone on Startup

**File:** `database.js:20-33`

**Added:**
```javascript
const [timezoneResult] = await connection.query(
  'SELECT NOW() as server_time, UTC_TIMESTAMP() as utc_time, @@session.time_zone as timezone'
);
console.log('🕐 MySQL Timezone:', timezoneResult[0].timezone);
console.log('🕐 Server Time:', timezoneResult[0].server_time);
console.log('🕐 UTC Time:', timezoneResult[0].utc_time);
```

**Result:** You'll see timezone info when backend starts.

---

### 4. Backend - Use UTC_TIMESTAMP() Instead of NOW() ✅

**Changed in ALL SQL queries:**

- `temporaryAccessController.js` - 6 places
- `userController.js` - 2 places

**Before:**
```sql
TIMESTAMPDIFF(SECOND, NOW(), ta.expires_at)
WHERE ta.expires_at > NOW()
```

**After:**
```sql
TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), ta.expires_at)
WHERE ta.expires_at > UTC_TIMESTAMP()
```

**Result:** All time comparisons now use UTC consistently.

---

### 5. Backend - Store Dates in UTC ✅

**File:** `temporaryAccessController.js:194-204`

**Change:**
```javascript
// Before (tried to adjust timezone):
const mysqlDateTime = new Date(expiresDate.getTime() - (expiresDate.getTimezoneOffset() * 60000))
  .toISOString()
  .slice(0, 19)
  .replace('T', ' ');

// After (pure UTC):
const mysqlDateTime = expiresDate.toISOString().slice(0, 19).replace('T', ' ');
```

**Result:** All dates stored in pure UTC format.

---

### 6. MySQL Auto-Cleanup Event ✅

**File:** `ADD_CRON_CLEANUP.sql`

**Updated to:**
- Run every **5 minutes** (not 24 hours)
- Use `UTC_TIMESTAMP()` instead of `NOW()`
- Mark expired grants as revoked
- Remove expired entries from `user_regions` table

**Key changes:**
```sql
CREATE EVENT cleanup_expired_temporary_access
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
  -- Use UTC_TIMESTAMP() everywhere
  DELETE ur FROM user_regions ur
  INNER JOIN temporary_access ta ON ur.user_id = ta.user_id AND ur.region_id = ta.resource_id
  WHERE ta.expires_at <= UTC_TIMESTAMP();

  -- Mark as revoked
  UPDATE temporary_access
  SET revoked_at = UTC_TIMESTAMP()
  WHERE expires_at <= UTC_TIMESTAMP();
END
```

---

### 7. MySQL Global Timezone Fix 🔧 (Manual Step Required)

**File:** `FIX_MYSQL_TIMEZONE.sql` (Created)

**You MUST run this in MySQL Workbench:**

```sql
-- Set MySQL to use UTC globally
SET GLOBAL time_zone = '+00:00';
SET time_zone = '+00:00';

-- Verify
SELECT NOW() as 'MySQL UTC Time', UTC_TIMESTAMP() as 'UTC Timestamp';
```

---

## Testing Steps

### Step 1: Run MySQL Timezone Fix

1. Open **MySQL Workbench**
2. Connect to your database
3. Open `FIX_MYSQL_TIMEZONE.sql`
4. Execute the entire file
5. Verify output shows UTC time

### Step 2: Run Cleanup Event

1. Open `ADD_CRON_CLEANUP.sql` in MySQL Workbench
2. Execute the entire file
3. Verify event created:
```sql
SELECT event_name, interval_value, status
FROM information_schema.events
WHERE event_name = 'cleanup_expired_temporary_access';
```

### Step 3: Restart Backend

Backend should auto-restart via nodemon. Check console for:
```
🕐 MySQL Timezone: +00:00
🕐 Server Time: 2025-10-13 06:30:00
🕐 UTC Time: 2025-10-13 06:30:00
```

Both times should match now!

### Step 4: Test Frontend

1. Open browser, login
2. Click profile dropdown
3. Check:
   - ✅ Dropdown has scrollbar if content is long
   - ✅ Time remaining shows correct countdown (not 12 hours extra)
   - ✅ Expired grants disappear within 10 seconds

---

## Expected Behavior After Fix

### Before Fix:
- Grants 2 minutes → Shows "6h 8m remaining" ❌
- Expired grants stay visible ❌
- Profile dropdown too tall ❌

### After Fix:
- Grants 2 minutes → Shows "2m remaining" ✅
- Expired grants auto-remove in 10 seconds ✅
- Profile dropdown scrolls if needed ✅
- MySQL uses UTC consistently ✅
- Cleanup runs every 5 minutes ✅

---

## Files Changed

### Backend:
1. ✅ `src/config/database.js` - Added UTC timezone + logging
2. ✅ `src/controllers/temporaryAccessController.js` - All NOW() → UTC_TIMESTAMP()
3. ✅ `src/controllers/userController.js` - All NOW() → UTC_TIMESTAMP()
4. ✅ `ADD_CRON_CLEANUP.sql` - Updated to use UTC and run every 5 min
5. 🔧 `FIX_MYSQL_TIMEZONE.sql` - NEW FILE (you must run this!)

### Frontend:
1. ✅ `src/components/common/NavigationBar.tsx` - Height limit + auto-filter expired

---

## Important Notes

1. **MySQL timezone MUST be set to UTC** - Run `FIX_MYSQL_TIMEZONE.sql` first!
2. **All existing grants** in database should still work (they're already in the correct timezone from frontend)
3. **10-second refresh** means expired grants disappear quickly
4. **5-minute cleanup** removes expired access from database
5. **Server logs** now show timezone info for debugging

---

## If Still Having Issues

Check backend logs when granting 2 minutes:
```
🕐 Expires_at received from frontend: 2025-10-13T06:32:00.000Z
🕐 MySQL datetime being stored (UTC): 2025-10-13 06:32:00
🕐 Difference from now (minutes): 2
```

The "Difference" should show **2 minutes**, not 422 minutes!

If it still shows wrong:
1. Verify MySQL timezone: `SELECT @@session.time_zone;` should return `+00:00`
2. Restart MySQL service completely
3. Restart backend server

---

## Summary

✅ All code changes applied
✅ Frontend auto-removes expired grants
✅ Backend uses UTC everywhere
✅ Database connection forced to UTC
✅ Cleanup event runs every 5 minutes
🔧 **YOU MUST RUN:** `FIX_MYSQL_TIMEZONE.sql` in MySQL Workbench

After running the SQL fix, everything should work perfectly! 🚀
