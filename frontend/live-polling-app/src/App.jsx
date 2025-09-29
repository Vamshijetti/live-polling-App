import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "../src/App.css";

import Teacher from "./components/Teacher";
import Student from "./components/Student";

const socket = io.connect("https://live-polling-app-cspr.onrender.com", {
  transports: ['websocket', 'polling']
});

const App = () => {
  const [isTeacher, setIsTeacher] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server");
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setConnectionStatus("error");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  const handleRoleSelection = (role) => {
    setIsTeacher(role === "teacher");
  };

  if (connectionStatus === "error") {
    return (
      <div className="flex h-screen justify-center items-center bg-[#032830] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Connection Error</h1>
          <p>Unable to connect to the server. Please make sure the backend is running on port 3001.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (connectionStatus === "connecting") {
    return (
      <div className="flex h-screen justify-center items-center bg-[#032830] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Connecting to server...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {isTeacher === null ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-full mb-6">
              Live Poll
            </div>
            <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
              Welcome to the Live Polling System
            </h1>
            <p className="text-lg text-gray-600 text-center max-w-2xl">
              Please select the role that best describes you to begin using the live polling system.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 max-w-4xl">
            {/* Student Card */}
            <div 
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                isTeacher === false 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => handleRoleSelection("student")}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">I'm a Student</h3>
              <p className="text-gray-600">
                Submit answers and view live poll results in real-time.
              </p>
            </div>

            {/* Teacher Card */}
            <div 
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                isTeacher === true 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => handleRoleSelection("teacher")}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">I'm a Teacher</h3>
              <p className="text-gray-600">
                Create and manage polls, ask questions, and monitor your students' responses in real-time.
              </p>
            </div>
          </div>

          {/* Continue Button */}
          {isTeacher !== null && (
            <button
              onClick={() => {
                // Role is already selected, this will show the interface
              }}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg"
            >
              Continue
            </button>
          )}
        </div>
      ) : isTeacher ? (
        <Teacher socket={socket} />
      ) : (
        <Student socket={socket} />
      )}
    </div>
  );
};

export default App;