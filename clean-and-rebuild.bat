@echo off
echo.
echo ========================================
echo   CLEANING AND REBUILDING OPTICONNECT
echo ========================================
echo.

echo Step 1: Cleaning frontend build cache...
cd OptiConnect_Frontend
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo ✅ Frontend cache cleared
echo.

echo Step 2: Instructions for Browser Cache
echo.
echo ⚠️  IMPORTANT: Clear your browser cache NOW!
echo.
echo Method 1 - Quick (in browser):
echo   1. Press Ctrl + Shift + Delete
echo   2. Select "Cached images and files"
echo   3. Time range: "All time"
echo   4. Click "Clear data"
echo.
echo Method 2 - Console (in browser F12 console):
echo   localStorage.clear();
echo   sessionStorage.clear();
echo   caches.keys().then(k =^> k.forEach(key =^> caches.delete(key)));
echo   location.reload(true);
echo.
pause

echo.
echo Step 3: Starting backend server...
cd ..\OptiConnect_Backend
start cmd /k "npm start"
echo ✅ Backend server starting in new window
echo.

timeout /t 3 /nobreak > nul

echo Step 4: Starting frontend server...
cd ..\OptiConnect_Frontend
start cmd /k "npm start"
echo ✅ Frontend server starting in new window
echo.

echo ========================================
echo   CLEANUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo   1. Wait for both servers to start
echo   2. Go to http://localhost:3001
echo   3. Login with your credentials
echo   4. Check backend logs for real JWT token (eyJ...)
echo   5. NO mock_token should appear!
echo.
pause
