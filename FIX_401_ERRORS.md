# Fix 401 Unauthorized Errors - Complete Guide

## Problem
You're getting persistent 401 errors because your current login token was issued with the OLD 15-minute expiry and has now expired.

## Solution Steps

### Option 1: Clear Browser Storage (RECOMMENDED)

1. **Open Browser DevTools** (F12 or Right-click → Inspect)

2. **Go to Application/Storage Tab**

3. **Clear localStorage:**
   - Find "Local Storage" in left sidebar
   - Click on `http://localhost:3001`
   - Click "Clear All" button OR delete these keys:
     - `opti_connect_token`
     - `persist:root`

4. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)

5. **Login again** - You'll get a NEW token with 2-hour expiry ✅

### Option 2: Logout & Login (EASIEST)

1. Click your **profile dropdown** (top right)
2. Click **"Sign Out"**
3. **Login again** with your credentials
4. You'll get a fresh 2-hour token ✅

### Option 3: Use Browser Console (QUICK)

1. Open **DevTools Console** (F12 → Console tab)
2. Paste and run:
   ```javascript
   localStorage.removeItem('opti_connect_token');
   localStorage.removeItem('persist:root');
   window.location.reload();
   ```
3. **Login again**

---

## Verify It's Fixed

After re-login, check:
1. ✅ No more 401 errors on Users page
2. ✅ Temporary Access loads without errors
3. ✅ Token lasts for **2 hours** (not 15 minutes)

---

## Why This Happened

- Backend was updated: JWT_EXPIRE changed from 15m → 2h
- Your OLD token (15min expiry) expired
- New tokens will last 2 hours ✅

## Prevention

Going forward:
- Tokens automatically refresh every 15 minutes
- Session persists across browser restarts
- Only need to re-login every 2 hours (security)
