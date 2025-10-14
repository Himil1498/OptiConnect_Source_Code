@echo off
echo ========================================
echo RESTARTING BACKEND WITH NEW CORS CONFIG
echo ========================================
echo.
echo This will kill the old backend process and start a new one
echo with the correct CORS configuration (port 3005)
echo.
pause

echo.
echo Finding and killing backend process on port 5005...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5005') do (
    echo Killing process ID: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Starting backend server...
cd OptiConnect_Backend
start cmd /k "npm start"

echo.
echo ========================================
echo DONE! Backend is starting...
echo Wait for "Server is ready" message
echo Then check for: CORS Enabled: http://localhost:3005
echo ========================================
pause
