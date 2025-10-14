# Quick Start Testing Guide 🚀

## Step 1: Restart Backend (REQUIRED)

Double-click this file:
```
RESTART_BACKEND.bat
```

**Verify in terminal:**
```
🔒 CORS Enabled: http://localhost:3005
```
✅ MUST show port **3005** (not 3002)

---

## Step 2: Start Frontend

```bash
cd OptiConnect_Frontend
npm start
```

Wait for:
```
Compiled successfully!
Local: http://localhost:3005
```

---

## Step 3: Test Delete Dialogs

### A. Temporary Access Management
1. Navigate to **Admin → Temporary Access Management**
2. Click trash icon on any grant
3. ✅ Check: Dialog shows grant details (user - region)
4. ✅ Check: Cancel button works
5. ✅ Check: Delete button shows spinner
6. ✅ Check: Success notification appears
7. ✅ Check: Table updates

### B. Region Request Management
1. Navigate to **Admin → Region Requests**
2. Click delete on any request
3. ✅ Check: Dialog shows request details
4. ✅ Check: Works same as above

### C. User Management - Bulk Delete
1. Navigate to **Users → User Management**
2. Select 2-3 users (checkboxes)
3. Click **Delete** button in bulk actions bar
4. ✅ Check: Dialog shows user count
5. ✅ Check: All selected users deleted
6. ✅ Check: Selection cleared after

---

## Step 4: Test Real-Time Updates

### Setup
1. Open **Admin → Temporary Access Management**
2. Grant temporary access:
   - Select a user
   - Select a region
   - Set expiration to **2 minutes from now**
   - Enter reason
   - Click **Grant Access**

### Testing User Management
1. Navigate to **Users → User Management**
2. Find the user you granted access to
3. Open browser console (F12)
4. Wait without refreshing

**Within 60 seconds, you should see:**
```
🔄 User Management: Auto-refreshing user data to reflect region changes
✅ User Management: Users reloaded X
```

**After 2+ minutes:**
- User's temporary region should disappear from their assigned regions
- Console shows auto-refresh messages

### Testing Bulk Assignment
1. Navigate to **Admin → Bulk Region Assignment**
2. Find the same user
3. Check their assigned region count
4. Wait for expiration

**After 2+ minutes:**
- User's region count should decrease
- Console shows:
```
🔄 Bulk Assignment: Auto-refreshing user data to reflect region changes
```

---

## Step 5: Monitor Console

Open Browser Console (F12 → Console)

**Expected Messages:**

### On Page Load
```
✅ Temporary region monitor started (checking every 30s)
```

### Every 30 Seconds (Background)
*Silent check for expired regions*

### Every 60 Seconds (When on page)
```
🔄 User Management: Auto-refreshing user data to reflect region changes
✅ User Management: Users reloaded 5
```

### When Regions Expire
```
🔄 Temporary region access has changed
   Previous regions: ['Maharashtra', 'Gujarat']
   Current valid regions: ['Maharashtra']
⏰ Your temporary region access has expired
```

---

## Troubleshooting

### CORS Errors?
```bash
# Restart backend again
.\RESTART_BACKEND.bat

# Verify output shows port 3005
# Clear browser cache (Ctrl+Shift+Delete)
# Reload page (Ctrl+F5)
```

### No Auto-Refresh Messages?
- Check browser console for errors
- Verify backend is running
- Check Network tab for periodic requests
- Try closing and reopening page

### Delete Dialogs Not Working?
- Check browser console for errors
- Verify no JavaScript errors
- Try refreshing page

---

## Success Indicators ✅

You'll know everything is working when:

1. ✅ No CORS errors in console
2. ✅ Delete dialogs show and work correctly
3. ✅ Console shows monitoring activation message
4. ✅ Console shows auto-refresh every 60s
5. ✅ Temporary regions disappear from UI automatically
6. ✅ No need to manually refresh pages

---

## Performance Check

With all pages open, you should see approximately:
- **3-4 network requests per minute**
- Minimal CPU usage
- Smooth UI performance

This is normal and expected for real-time monitoring.

---

## Quick Video of Expected Behavior

**Delete Dialog:**
1. Click delete → Dialog appears
2. Shows item details
3. Click Delete → Spinner shows
4. Success notification → Table updates

**Real-Time Update:**
1. Grant temporary access (2 min expiration)
2. Navigate to User Management
3. See user has new region
4. Wait 2+ minutes
5. Region automatically disappears from UI
6. No page refresh needed!

---

## Need Help?

Check `UI_ENHANCEMENTS_COMPLETE.md` for:
- Detailed architecture
- Full testing checklist
- Troubleshooting guide
- Code examples

---

**Happy Testing! 🎉**

All features are implemented and ready to test.
