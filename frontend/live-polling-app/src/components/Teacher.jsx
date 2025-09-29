import React, { useState, useEffect } from "react";
import PollingResult from "./PollingResult";
import { Button } from "react-bootstrap";

const Teacher = ({ socket }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([""]);
  const [questionPublished, setQuestionPublished] = useState(false);
  const [timer, setTimer] = useState(60); // Default timer value
  const [canAskNewQuestion, setCanAskNewQuestion] = useState(true);
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const [questionTimer, setQuestionTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [allStudentsAnswered, setAllStudentsAnswered] = useState(false);
  const [connectedStudents, setConnectedStudents] = useState([]);

  useEffect(() => {
    // Check question status on component mount
    if (socket) {
      socket.emit("get-question-status");
    }

    const handleQuestionStatus = (status) => {
      setCanAskNewQuestion(status.canAskNew);
    };

    const handleQuestionRestricted = (data) => {
      setRestrictionMessage(data.message);
      setCanAskNewQuestion(false);
    };

    const handleAllStudentsAnswered = () => {
      setCanAskNewQuestion(true);
      setRestrictionMessage("");
      setAllStudentsAnswered(true);
    };

    const handleNewQuestion = (question) => {
      setQuestionTimer(question.timer);
      setTimerActive(true);
      setAllStudentsAnswered(false); // Reset when new question starts
      
      // Clear any existing timer
      if (window.teacherTimer) {
        clearInterval(window.teacherTimer);
      }
      
      // Start countdown timer
      window.teacherTimer = setInterval(() => {
        setQuestionTimer(prev => {
          if (prev <= 1) {
            clearInterval(window.teacherTimer);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleStudentConnected = (students) => {
      setConnectedStudents(students);
    };

    const handleStudentDisconnected = (students) => {
      setConnectedStudents(students);
    };

    socket.on("question-status", handleQuestionStatus);
    socket.on("question-restricted", handleQuestionRestricted);
    socket.on("all-students-answered", handleAllStudentsAnswered);
    socket.on("new-question", handleNewQuestion);
    socket.on("student-connected", handleStudentConnected);
    socket.on("student-disconnected", handleStudentDisconnected);

    return () => {
      socket.off("question-status", handleQuestionStatus);
      socket.off("question-restricted", handleQuestionRestricted);
      socket.off("all-students-answered", handleAllStudentsAnswered);
      socket.off("new-question", handleNewQuestion);
      socket.off("student-connected", handleStudentConnected);
      socket.off("student-disconnected", handleStudentDisconnected);
      
      // Clean up timer
      if (window.teacherTimer) {
        clearInterval(window.teacherTimer);
      }
    };
  }, [socket]);

  const askQuestion = () => {
    if (!canAskNewQuestion) {
      setRestrictionMessage("Cannot ask new question. Please wait for all students to answer the current question.");
      return;
    }

    const questionData = {
      question,
      options: options.filter((option) => option.trim() !== ""),
      timer: Math.min(timer, 60), // Maximum 60 seconds
    };

    if (socket && question && questionData.options.length) {
      socket.emit("teacher-ask-question", questionData);
      setQuestionPublished(true);
      setRestrictionMessage("");
    }
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const updateOption = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const askAnotherQuestion = () => {
    setQuestionPublished(false);
    setQuestion("");
    setOptions([""]);
    setTimer(60);
    setRestrictionMessage("");
    setAllStudentsAnswered(false);
    setTimerActive(false);
    setQuestionTimer(0);
  };

  const removeStudent = (studentId) => {
    if (window.confirm("Are you sure you want to remove this student?")) {
      socket.emit("teacher-remove-student", { studentId });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-full mb-6">
            Live Poll
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Let's Get Started</h1>
          <p className="text-lg text-gray-600">
            You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
          </p>
        </div>
      
        {/* Connected Students List */}
        {connectedStudents.length > 0 && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Connected Students ({connectedStudents.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {connectedStudents.map((student) => (
                <div key={student.socketId} className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${student.voted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-gray-900 font-medium">{student.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {student.voted ? '(Voted)' : '(Not voted)'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeStudent(student.socketId)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors"
                    title="Remove student"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {questionPublished ? (
          <div className="space-y-6">
            <PollingResult socket={socket} />
            {timerActive && !allStudentsAnswered && (
              <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg text-center">
                <div className="flex justify-center items-center">
                  <span className="mr-2">Question Timer:</span>
                  <span className="font-bold text-xl">{questionTimer}s</span>
                </div>
              </div>
            )}
            {allStudentsAnswered && timerActive && (
              <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg text-center">
                <div className="flex justify-center items-center">
                  <span className="mr-2">✅ All students have answered!</span>
                  <span className="text-sm">(Timer: {questionTimer}s remaining)</span>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button 
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={askAnotherQuestion}
                disabled={timerActive && !allStudentsAnswered}
              >
                {timerActive && !allStudentsAnswered ? `Wait ${questionTimer}s` : 
                 allStudentsAnswered ? "Ask Another Question" : 
                 "Ask Another Question"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {restrictionMessage && (
              <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg">
                {restrictionMessage}
              </div>
            )}
            
            {/* Question Input Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-semibold text-gray-900">Enter your question</label>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Timer:</label>
                  <select 
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    value={timer} 
                    onChange={(e) => setTimer(parseInt(e.target.value))}
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                    <option value={90}>90 seconds</option>
                    <option value={120}>120 seconds</option>
                  </select>
                </div>
              </div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question here..."
                className="w-full h-32 border border-gray-300 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                maxLength={100}
              />
              <div className="flex justify-end mt-2">
                <span className="text-sm text-gray-500">{question.length}/100</span>
              </div>
            </div>

            {/* Options Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-semibold text-gray-900">Edit Options</label>
                <label className="text-sm text-gray-600">Is It Correct?</label>
              </div>
              
              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={`teacher-option-${index}`} className="flex items-center space-x-4">
                    <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder="Enter option text..."
                      className="flex-1 border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input type="radio" name={`correct-${index}`} className="mr-2" />
                        <span className="text-sm text-gray-600">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name={`correct-${index}`} className="mr-2" />
                        <span className="text-sm text-gray-600">No</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                className="mt-4 flex items-center space-x-2 text-purple-600 border border-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
                onClick={addOption}
              >
                <span className="text-lg">+</span>
                <span>Add More option</span>
              </button>
            </div>

            {/* Ask Question Button */}
            <div className="flex justify-end">
              <button 
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={askQuestion}
                disabled={!canAskNewQuestion}
              >
                {canAskNewQuestion ? "Ask Question" : "Wait for Students"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teacher;