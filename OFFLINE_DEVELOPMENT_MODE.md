# Offline Development Mode - Mock API Guide

## 🏠 Working From Home Without Backend Access?

This guide explains how to use **Mock API Mode** to develop and test the frontend without needing access to the backend server at your company.

---

## 🎯 What is Mock API Mode?

Mock API Mode allows you to work on the frontend UI/UX without needing the real backend server. It uses **fake data** that simulates real API responses, so you can:

✅ Login to the application
✅ View and interact with all UI components
✅ Test user management features
✅ Work on UI enhancements
✅ See realistic data in all pages

---

## ⚡ Quick Start

### Step 1: Enable Mock Mode

Edit your `.env` file in `OptiConnect_Frontend` folder:

```env
# Set this to true for offline development
REACT_APP_USE_MOCK_API=true
```

### Step 2: Restart Frontend

```bash
cd OptiConnect_Frontend
npm start
```

### Step 3: Login with Mock Credentials

Open http://localhost:3001 and login with any of these credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@opticonnect.com | Admin@123 |
| **Manager** | john.manager@opticonnect.com | Manager@123 |
| **Technician** | sarah.tech@opticonnect.com | Tech@123 |
| **User** | mike.user@opticonnect.com | User@123 |

That's it! You're now working in offline mode! 🎉

---

## 🔄 Switching Between Real and Mock API

### At Home (No Backend Access)
```env
REACT_APP_USE_MOCK_API=true
```

### At Office (With Backend Access)
```env
REACT_APP_USE_MOCK_API=false
```

**Note:** You need to restart the frontend after changing this value.

---

## 📊 Available Mock Data

### Mock Users (5 Total)

1. **Admin User**
   - ID: OCGID001
   - Username: admin
   - Email: admin@opticonnect.com
   - Password: Admin@123
   - Role: Admin
   - Regions: Maharashtra, Gujarat, Rajasthan
   - Status: Active

2. **Manager - John**
   - ID: OCGID002
   - Username: manager1
   - Email: john.manager@opticonnect.com
   - Password: Manager@123
   - Role: Manager
   - Regions: Delhi, Haryana, Punjab
   - Status: Active

3. **Technician - Sarah**
   - ID: OCGID003
   - Username: tech1
   - Email: sarah.tech@opticonnect.com
   - Password: Tech@123
   - Role: Technician
   - Regions: Karnataka, Tamil Nadu
   - Status: Active

4. **User - Mike**
   - ID: OCGID004
   - Username: user1
   - Email: mike.user@opticonnect.com
   - Password: User@123
   - Role: User
   - Regions: Maharashtra
   - Status: Active

5. **Inactive User**
   - ID: OCGID005
   - Email: inactive@opticonnect.com
   - Status: Inactive (cannot login)

### Mock Regions (8 Total)

- Maharashtra (MH)
- Gujarat (GJ)
- Rajasthan (RJ)
- Delhi (DL)
- Haryana (HR)
- Punjab (PB)
- Karnataka (KA)
- Tamil Nadu (TN)

### Mock Groups (4 Total)

- Admin Group
- North Zone Team
- South Zone Team
- Field Engineers

---

## ✨ Features That Work in Mock Mode

### ✅ Fully Working Features

1. **Authentication**
   - Login with mock credentials
   - Logout
   - Session management
   - Role-based access

2. **User Management**
   - View all users
   - Create new users
   - Edit users
   - Delete users
   - Bulk operations
   - Search and filters

3. **Dashboard**
   - View user stats
   - See assigned regions
   - View profile information

4. **Navigation**
   - All menu items accessible
   - Profile dropdown
   - Dark/Light mode toggle
   - Responsive navigation

5. **UI Components**
   - All forms and modals
   - Tables and lists
   - Charts and graphs
   - Tooltips and notifications

### ⚠️ Limited Features

These work but with simplified data:

- Map features (limited mock tower data)
- Analytics (empty charts, can add mock data)
- Real-time updates (simulated delays)

---

## 🛠️ Adding More Mock Data

### Add a New Mock User

Edit `src/services/mockData.ts`:

```typescript
export const mockUsers: User[] = [
  // ... existing users ...
  {
    id: 'OCGID006',
    username: 'newuser',
    name: 'New User Name',
    email: 'newuser@opticonnect.com',
    password: 'Pass@123',
    gender: 'Male',
    phoneNumber: '+91 98765 43215',
    address: {
      street: 'Address Here',
      city: 'City',
      state: 'State',
      pincode: '000000'
    },
    officeLocation: 'Office',
    assignedUnder: [],
    role: 'User', // Admin, Manager, Technician, or User
    assignedRegions: ['Maharashtra'],
    groups: [],
    status: 'Active',
    loginHistory: [],
    company: 'Opti Telemedia',
    permissions: ['view_map'],
    lastLogin: new Date().toISOString()
  }
];
```

### Add a New Mock Region

```typescript
export const mockRegions = [
  // ... existing regions ...
  { id: 9, name: 'Kerala', code: 'KL', type: 'state', userCount: 5 }
];
```

---

## 🎨 Perfect for UI Development

Mock mode is ideal for:

### 1. **UI/UX Improvements**
- Redesign components without backend
- Test new layouts and styles
- Experiment with animations
- Adjust responsive behavior

### 2. **Component Development**
- Create new React components
- Test component interactions
- Debug UI issues
- Refine user experience

### 3. **Design System Work**
- Update colors and themes
- Refine spacing and typography
- Test dark mode
- Polish visual consistency

### 4. **Form Testing**
- Test form validations
- Improve error messages
- Enhance user input experience
- Test different field types

---

## 🔍 How It Works

### Architecture

```
Frontend (Your PC)
    ↓
Check: REACT_APP_USE_MOCK_API=true?
    ↓
YES → Use mockApiService.ts
    ↓
Return fake data from mockData.ts
    ↓
UI displays normally
```

### API Flow

**Normal Mode (Backend Required):**
```
LoginPage → apiService → HTTP Request → Backend Server → Database
```

**Mock Mode (Offline):**
```
LoginPage → apiService → mockApiService → mockData → Return fake response
```

The UI doesn't know the difference! It receives the same data structure in both modes.

---

## 📝 Files Involved

| File | Purpose |
|------|---------|
| `.env` | Toggle mock mode on/off |
| `src/services/mockData.ts` | Mock user/region/group data |
| `src/services/mockApiService.ts` | Simulates API responses |
| `src/services/apiService.ts` | Checks mode and routes requests |

---

## 🐛 Troubleshooting

### Issue: Can't login

**Check:**
1. Is `REACT_APP_USE_MOCK_API=true` in `.env`?
2. Did you restart the frontend after changing `.env`?
3. Are you using the correct mock credentials?

**Solution:**
```bash
# 1. Edit .env file
REACT_APP_USE_MOCK_API=true

# 2. Stop frontend (Ctrl+C)
# 3. Restart
cd OptiConnect_Frontend
npm start

# 4. Try logging in with:
# Email: admin@opticonnect.com
# Password: Admin@123
```

### Issue: Getting "Cannot connect to server" error

This means mock mode is NOT enabled properly.

**Solution:**
- Verify `.env` has `REACT_APP_USE_MOCK_API=true`
- Make sure the file is in `OptiConnect_Frontend/.env` (not OptiConnect-Backend)
- Restart the frontend app

### Issue: Mock data not showing

**Check browser console:**
```
Press F12 → Console Tab
```

You should see:
```
📱 MOCK MODE ENABLED - Using fake data for offline development
✅ You can login with any of these mock credentials:
   - admin@opticonnect.com / Admin@123
   ...
```

If you don't see this, mock mode is not enabled.

### Issue: Created user disappears after refresh

This is expected behavior in mock mode! Mock data resets when you refresh the page since it's stored in memory, not a real database.

**Workaround:**
- Use browser's "Don't reload" feature while testing
- Or add permanent test data to `mockData.ts`

---

## ⚙️ Advanced Configuration

### Adjust API Delay

Mock APIs have simulated delays (500-800ms) to mimic real API calls. To change:

Edit `src/services/mockApiService.ts`:

```typescript
// Change this function
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// To faster (100ms):
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Or instant (0ms):
const delay = (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms));
```

### Add Console Logging

To see what's happening:

```typescript
// In mockApiService.ts, add logging to any function:
login: async (email: string, password: string) => {
  console.log('🔐 Mock Login attempt:', email);
  await delay(800);

  const user = getMockUserByCredentials(email, password);
  console.log('👤 Found user:', user);

  // ... rest of code
}
```

---

## 🚀 Best Practices

### 1. Always Switch Back at Office

When you get to office:

```env
# At office - use real backend
REACT_APP_USE_MOCK_API=false
```

### 2. Don't Commit Mock Mode Enabled

Before committing code to Git:

```bash
# Check your .env
cat .env | grep MOCK

# Should show:
REACT_APP_USE_MOCK_API=false
```

### 3. Test Both Modes

Before submitting work:
- Test with mock mode (offline)
- Test with real backend (at office)

### 4. Add Test Data as Needed

If you need specific test scenarios, add them to `mockData.ts`:

```typescript
// Example: User with no regions
{
  id: 'OCGID999',
  username: 'noregions',
  email: 'noregions@test.com',
  password: 'Test@123',
  // ... other fields ...
  assignedRegions: [], // Empty array for testing
  status: 'Active'
}
```

---

## 📚 Related Documentation

- `EMAIL_VERIFICATION_SETUP.md` - Email verification system
- `IMPLEMENTATION_SUMMARY.md` - Recent changes summary
- `README.md` - Full project setup

---

## ✅ Summary

**To Work From Home:**

1. Set `REACT_APP_USE_MOCK_API=true` in `.env`
2. Restart frontend: `npm start`
3. Login with mock credentials (admin@opticonnect.com / Admin@123)
4. Work on UI/UX improvements
5. All changes will work with real backend later!

**To Work At Office:**

1. Set `REACT_APP_USE_MOCK_API=false` in `.env`
2. Restart frontend
3. Login with real credentials
4. Backend server must be running

---

**Need Help?** Check the browser console (F12) for detailed logs about which mode you're in and any errors.

---

**Generated:** October 9, 2025
**Status:** Mock mode fully implemented and tested
**Recommendation:** Use this for all offline development work!
