import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "../src/App.css";

import Teacher from "./components/Teacher";
import Student from "./components/Student";

const socket = io.connect("http://localhost:3001", {
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
    <div
      className="flex h-screen justify-center items-center bg-[#032830] text-white"
    >
      {isTeacher === null ? (
        <div
          className="flex flex-col justify-center items-center w-full"
        >
          <h1 className="text-4xl font-bold">Welcome to the Live polling System</h1>
          <p className="text-lg text-muted-foreground">
            Please select the role that best describes you to begin using the live polling system.
          </p>
          <div
            className="flex justify-between w-1/2  p-2 mt-10"
          >
            <button
              onClick={() => handleRoleSelection("teacher")}
              className="parentAndStudentButton font-bold bg-blue-50 text-black h-10 w-1/3"
            >
              I am a Teacher
            </button>
            <button
              onClick={() => handleRoleSelection("student")}
              className="parentAndStudentButton font-bold  bg-blue-50 text-black h-10 w-1/3 "
            >
              I am a Student
            </button>
          </div>
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