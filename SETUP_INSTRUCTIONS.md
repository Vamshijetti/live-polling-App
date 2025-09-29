# Live Polling App - Setup Instructions

## Issues Fixed:
1. ✅ Socket connection URL changed from production to localhost
2. ✅ Added proper CORS configuration for local development
3. ✅ Added missing start scripts to backend package.json
4. ✅ Added error handling and connection status to frontend
5. ✅ Fixed missing React key props
6. ✅ Improved timer input with validation
7. ✅ Added nodemon for development

## How to Run the Application:

### Backend Setup:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```

The backend will run on http://localhost:3001

### Frontend Setup:
1. Navigate to the frontend directory:
   ```bash
   cd frontend/live-polling-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend will run on http://localhost:5173

## Important Notes:
- Make sure to start the backend server first before starting the frontend
- The frontend is configured to connect to http://localhost:3001
- If you see connection errors, ensure the backend is running on port 3001
- The app now includes proper error handling and connection status indicators

## Troubleshooting:
- If you get CORS errors, make sure both servers are running on the correct ports
- Check the browser console for any connection errors
- Ensure no other application is using port 3001

