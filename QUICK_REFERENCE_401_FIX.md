# 🚀 QUICK REFERENCE - 401 Fix

## ⚡ Quick Fix Commands

### Clear Storage & Restart (Most Common Fix)
```javascript
// Browser Console (F12)
localStorage.clear(); sessionStorage.clear(); location.reload();
```

### Check Token Type
```javascript
// Browser Console
const token = localStorage.getItem('opti_connect_token');
console.log('Is JWT?', token?.startsWith('eyJ'));
console.log('Has mock?', token?.includes('mock'));
```

---

## 🔍 What Was Fixed

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| 401 Errors | Mock tokens in development | Removed dev bypasses in apiService.ts |
| Token expiry | 24h too long | Changed to 2h (more secure) |
| Role mismatch | Case-sensitive checks | Made role checks case-insensitive |
| DateTime errors | ISO format | Convert to MySQL format |
| TypeScript errors | Missing STORAGE_KEY | Added constant back |

---

## 📂 Files Modified

### Backend
- `.env` → JWT_EXPIRE=2h
- `src/middleware/auth.js` → Enhanced logging
- `src/controllers/temporaryAccessController.js` → Case-insensitive roles + datetime fix

### Frontend
- `src/services/apiService.ts` → Removed mock tokens, always use backend
- `src/services/temporaryAccessService.ts` → Fixed TypeScript errors

---

## 🎯 How Token System Works Now

1. **Login** → Get JWT token (valid 2 hours)
2. **Auto-refresh** → Every 15 minutes (backend API call)
3. **Persist** → Survives browser restarts
4. **Expiry** → Re-login after 2 hours

---

## ✅ Good vs Bad Backend Logs

### ✅ GOOD (After Fix)
```
🔑 Token received: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ Token decoded: { id: 1, email: 'admin@example.com', role: 'admin' }
```

### ❌ BAD (Before Fix)
```
🔑 Token received: refreshed_mock_token_1760168844817...
❌ Token verification failed: Invalid token
```

---

## 🔧 Troubleshooting Decision Tree

```
401 Error?
  │
  ├─ Check: Token has 'mock' in it?
  │   ├─ YES → Clear localStorage & re-login
  │   └─ NO → Continue to next check
  │
  ├─ Check: Backend logs show "Invalid token"?
  │   ├─ YES → Token expired, re-login
  │   └─ NO → Continue to next check
  │
  ├─ Check: Backend running?
  │   ├─ NO → Start backend server
  │   └─ YES → Continue to next check
  │
  ├─ Check: Frontend compiled successfully?
  │   ├─ NO → Fix compilation errors first
  │   └─ YES → Continue to next check
  │
  └─ Hard refresh browser (Ctrl+Shift+R)
```

---

## 📞 Quick Diagnostic Commands

### Verify Fix Installation
```bash
cd C:\Users\hkcha\OneDrive\Desktop\OptiConnect
node verify-fix.js
```

### Check Backend Config
```bash
cd OptiConnect_Backend
node check-token.js
```

### Test Token Manually
```javascript
// Browser Console
fetch('http://localhost:5000/api/users', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('opti_connect_token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('✅', d))
.catch(e => console.error('❌', e));
```

---

## 📋 Post-Fix Checklist

- [ ] Cleared localStorage
- [ ] Restarted frontend server
- [ ] Re-logged in
- [ ] Token starts with `eyJ`
- [ ] No 401 errors on any page
- [ ] Backend shows `✅ Token decoded`
- [ ] Waited 15 min - auto-refresh works

---

## 🎓 Key Learnings

1. **Never use mock tokens in development** - Always test with real backend
2. **JWT expiry = 2 hours** - Good balance of security and convenience
3. **Auto-refresh every 15 minutes** - Keeps session alive seamlessly
4. **Case-insensitive roles** - Handles "Admin" vs "admin" gracefully
5. **Enhanced logging** - Makes debugging 100x easier

---

## 📚 Documentation Files

- `COMPREHENSIVE_401_FIX_COMPLETE.md` - Full explanation and fix
- `FINAL_TESTING_CHECKLIST.md` - Step-by-step testing guide
- `verify-fix.js` - Automated verification script
- `DEBUG_TOKEN.md` - Original debugging steps
- `FIX_401_ERRORS.md` - Original fix instructions

---

**Need help? Check COMPREHENSIVE_401_FIX_COMPLETE.md for detailed explanation!**
