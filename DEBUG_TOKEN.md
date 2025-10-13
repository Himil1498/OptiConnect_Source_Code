# Debug Token Issue - Step by Step

## Step 1: Check What Token is Stored

Open browser console (F12 → Console) and run:

```javascript
// Check if token exists
const token = localStorage.getItem('opti_connect_token');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);
console.log('Token preview:', token?.substring(0, 100));

// Check Redux persist
const persist = localStorage.getItem('persist:root');
if (persist) {
  const parsed = JSON.parse(persist);
  const auth = JSON.parse(parsed.auth);
  console.log('Redux Auth State:', {
    isAuthenticated: auth.isAuthenticated,
    hasToken: !!auth.token,
    tokenPreview: auth.token?.substring(0, 50)
  });
}
```

## Step 2: Test Token with Backend

Run in console:

```javascript
const token = localStorage.getItem('opti_connect_token');

fetch('http://localhost:5000/api/users', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
.catch(e => console.error('API Error:', e));
```

## Step 3: Check Backend Logs

After running the above, check your backend terminal for:
- 🔑 Token received: ...
- ✅ Token decoded: ...
- OR ❌ Token verification failed: ...

## Step 4: Solutions Based on Output

### If "No token provided"
→ Frontend is not sending the token
→ Check axios interceptor

### If "Invalid or expired token"
→ Token signature mismatch or expired
→ Need to re-login

### If "Token has expired"
→ Old token still in use
→ Clear localStorage and login again
