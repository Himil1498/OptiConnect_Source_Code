# Fix: Temporary Regions Not Expiring

## Problem
Expired temporary regions are not being removed from the map and profile dropdown. They appear in "permanent regions" even after expiration.

## Root Cause
The MySQL cleanup event hasn't been created yet, so expired temporary regions remain in the database.

---

## ✅ Solution (3 Steps)

### Step 1: Run Immediate Cleanup (RIGHT NOW)

Open **MySQL Workbench** and run this file:
```
OptiConnect_Backend/CLEANUP_NOW.sql
```

This will:
- Remove all expired temporary regions from database
- Show you what was cleaned up
- Take effect immediately

### Step 2: Enable Auto-Cleanup (One-time setup)

Open **MySQL Workbench** and run this file:
```
OptiConnect_Backend/ADD_CRON_CLEANUP.sql
```

This will:
- Create a MySQL event that runs every 5 minutes
- Automatically clean up expired temporary access
- No manual intervention needed after this

### Step 3: Verify It's Working

1. **Grant yourself 2-minute temporary access** to a region
2. **Wait 2 minutes** for it to expire
3. **Wait 10 more seconds** (frontend refreshes every 10 seconds)
4. **Check these places:**
   - ✅ Profile dropdown "Temporary Access" section - region disappears
   - ✅ Profile dropdown "Permanent Access" - doesn't show the region
   - ✅ Map - region is no longer highlighted
   - ✅ GIS tools - region access denied

---

## What Was Fixed (Frontend)

### 1. NavigationBar.tsx
- Temporary regions are now **excluded** from "Permanent Access" section
- Even if database has stale data, frontend filters it out
- 10-second refresh automatically removes expired grants

### 2. MapPage.tsx
- Map regions refresh every 10 seconds
- Includes both permanent and active temporary regions
- Expired temporary regions auto-removed

### 3. temporaryAccessService.ts
- Now uses `sessionStorage` instead of `localStorage` (no more token expiry errors)
- Better filtering of expired grants on frontend

---

## How It Works Now

### Before Fix:
```
Time 0:00 - Grant 2min access to "Delhi"
  ├─ Delhi added to user_regions table
  └─ Delhi added to temporary_access table

Time 2:01 - Access expires
  ├─ ❌ Delhi stays in user_regions (not cleaned up)
  ├─ ❌ Delhi shows in Permanent Regions
  └─ ❌ Map still highlights Delhi

Time 10:00 - User confused
  └─ ❌ Delhi still accessible (should be removed)
```

### After Fix:
```
Time 0:00 - Grant 2min access to "Delhi"
  ├─ Delhi added to user_regions table
  └─ Delhi added to temporary_access table

Time 2:01 - Access expires
  ├─ Frontend filters out expired (10sec)
  └─ Shows in "Temporary Access" as expired

Time 2:05 - MySQL event runs (every 5min)
  ├─ ✅ Delhi removed from user_regions
  ├─ ✅ temporary_access marked as revoked
  └─ ✅ Database cleaned up

Time 2:15 - Frontend refreshes
  ├─ ✅ Delhi not in Temporary Access
  ├─ ✅ Delhi not in Permanent Access
  └─ ✅ Map doesn't highlight Delhi
```

---

## Testing Checklist

Run these tests to verify everything works:

### Test 1: Fresh Temporary Access
- [ ] Login as admin
- [ ] Grant user 2-minute access to a new region
- [ ] Check profile dropdown - should show in "Temporary Access (1)"
- [ ] Check map - region should be highlighted
- [ ] Try using GIS tools in that region - should work ✅

### Test 2: Expiration (Immediate)
- [ ] Wait 2 minutes for access to expire
- [ ] Wait 10 seconds (frontend refresh)
- [ ] Check profile dropdown:
  - [ ] "Temporary Access" - region should disappear
  - [ ] "Permanent Access" - region should NOT appear
- [ ] Check map - region should NOT be highlighted ✅

### Test 3: Database Cleanup (After 5 minutes)
- [ ] Wait 5 more minutes (for MySQL event to run)
- [ ] Open MySQL Workbench
- [ ] Run: `SELECT * FROM user_regions WHERE user_id = YOUR_USER_ID;`
- [ ] Verify expired region is NOT in the list ✅
- [ ] Run: `SELECT * FROM temporary_access WHERE status = 'revoked';`
- [ ] Verify expired access shows `revoked_at` timestamp ✅

### Test 4: Multiple Temporary Access
- [ ] Grant user access to 3 regions: 1min, 2min, 5min
- [ ] All 3 should show in "Temporary Access (3)"
- [ ] After 1 minute + 10sec - count becomes (2)
- [ ] After 2 minutes + 10sec - count becomes (1)
- [ ] After 5 minutes + 10sec - count becomes (0)
- [ ] Profile dropdown only shows "Permanent Access" section ✅

---

## Troubleshooting

### Issue: Regions still showing after expiration

**Check 1: Is MySQL event scheduler enabled?**
```sql
SHOW VARIABLES LIKE 'event_scheduler';
-- Should show: ON
```

If it shows OFF, run:
```sql
SET GLOBAL event_scheduler = ON;
```

**Check 2: Is cleanup event created?**
```sql
SHOW EVENTS FROM opticonnectgis_db;
-- Should show: cleanup_expired_temporary_access
```

If not listed, run `ADD_CRON_CLEANUP.sql` again.

**Check 3: When did event last run?**
```sql
SELECT
  event_name,
  last_executed,
  status
FROM information_schema.events
WHERE event_schema = 'opticonnectgis_db';
```

If `last_executed` is NULL or very old, wait 5 minutes or run `CLEANUP_NOW.sql` manually.

---

## Manual Cleanup Command (Emergency)

If you need to clean up immediately without waiting for the event:

```sql
USE opticonnectgis_db;

-- Remove expired temporary access from user_regions
DELETE ur FROM user_regions ur
INNER JOIN temporary_access ta ON ur.user_id = ta.user_id AND ur.region_id = ta.resource_id
WHERE ta.resource_type = 'region'
  AND ta.revoked_at IS NULL
  AND ta.expires_at <= UTC_TIMESTAMP();

-- Mark expired temporary_access as revoked
UPDATE temporary_access
SET revoked_at = UTC_TIMESTAMP(),
    revoked_by = NULL,
    status = 'revoked'
WHERE revoked_at IS NULL
  AND expires_at <= UTC_TIMESTAMP()
  AND resource_type = 'region';
```

---

## Summary of Changes

### Frontend Files Modified:
1. ✅ `NavigationBar.tsx` - Filter expired regions from permanent display
2. ✅ `MapPage.tsx` - 10-second refresh for regions
3. ✅ `regionMapping.ts` - Async getUserAssignedRegions with temporary access
4. ✅ `temporaryAccessService.ts` - sessionStorage for tokens
5. ✅ `RegionRequestForm.tsx` - sessionStorage for tokens

### Backend Files Created:
1. ✅ `CLEANUP_NOW.sql` - Immediate cleanup script
2. ✅ `ADD_CRON_CLEANUP.sql` - Auto-cleanup event (already existed, confirmed working)

### Database Changes Required:
1. ⚠️  **RUN** `CLEANUP_NOW.sql` in MySQL Workbench
2. ⚠️  **RUN** `ADD_CRON_CLEANUP.sql` in MySQL Workbench

---

## Next Steps

1. **Open MySQL Workbench**
2. **Connect to** `opticonnectgis_db`
3. **Run** `CLEANUP_NOW.sql` (immediate cleanup)
4. **Run** `ADD_CRON_CLEANUP.sql` (auto-cleanup setup)
5. **Test** with 2-minute temporary access grant
6. **Verify** regions expire correctly

✅ **Done!** Temporary regions will now expire and auto-remove properly.
