import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { ProgressBar, Button } from "react-bootstrap";
import tower from "../assets/tower-icon.png";

import { getVariant } from "../utils/util";

const Student = ({ socket }) => {
  const [name, setName] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [connectedStudents, setConnectedStudents] = useState(null);
  const [votingValidation, setVotingValidation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [allStudentsAnswered, setAllStudentsAnswered] = useState(false);

  useEffect(() => {
    // Check if there's a stored name, but don't auto-connect
    const storedName = localStorage.getItem("studentName");
    if (storedName) {
      setName(storedName);
    }

    const handleNewQuestion = (question) => {
      setCurrentQuestion(question);
      setShowQuestion(true);
      setSelectedOption("");
      setHasVoted(false);
      setTimeRemaining(question.timer);
      setTimerExpired(false);
      setAllStudentsAnswered(false);

      // Clear any existing timer
      if (window.questionTimer) {
        clearInterval(window.questionTimer);
      }

      // Start countdown timer
      window.questionTimer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(window.questionTimer);
            setShowQuestion(false);
            setTimerExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleStudentVoteValidation = (connectedStudents) => {
      setConnectedStudents(connectedStudents);
    };

    const handleNameTaken = (data) => {
      setNameError(data.message);
    };

    const handleAlreadyVoted = (data) => {
      alert(data.message);
    };

    const handlePollingResults = (results) => {
      // Update the current question with new results without restarting timer
      setCurrentQuestion(prev => ({
        ...prev,
        results: results
      }));
    };

    const handleAllStudentsAnswered = () => {
      setAllStudentsAnswered(true);
      setShowQuestion(false); // Show results instead of question
    };

    const handleStudentRemoved = (data) => {
      alert(data.message);
      // Redirect to name input or show removed message
      setIsConnected(false);
      setShowQuestion(false);
      setCurrentQuestion(null);
    };

    socket.on("new-question", handleNewQuestion);
    socket.on("student-vote-validation", handleStudentVoteValidation);
    socket.on("name-taken", handleNameTaken);
    socket.on("already-voted", handleAlreadyVoted);
    socket.on("polling-results", handlePollingResults);
    socket.on("all-students-answered", handleAllStudentsAnswered);
    socket.on("student-removed", handleStudentRemoved);

    return () => {
      socket.off("new-question", handleNewQuestion);
      socket.off("student-vote-validation", handleStudentVoteValidation);
      socket.off("name-taken", handleNameTaken);
      socket.off("already-voted", handleAlreadyVoted);
      socket.off("polling-results", handlePollingResults);
      socket.off("all-students-answered", handleAllStudentsAnswered);
      socket.off("student-removed", handleStudentRemoved);
      
      // Clean up timer
      if (window.questionTimer) {
        clearInterval(window.questionTimer);
      }
    };
  }, [socket]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError("Please enter a name");
      return;
    }
    setNameError("");
    localStorage.setItem("studentName", name);
    socket.emit("student-set-name", { name });
    setIsConnected(true);
    setShowQuestion(true);
  };

  const handlePoling = () => {
    if (hasVoted) {
      alert("You have already voted for this question.");
      return;
    }
    socket.emit("handle-polling", {
      option: selectedOption,
    });
    setHasVoted(true);
    setShowQuestion(false); // Immediately show results after voting
  };

  useEffect(() => {
    const found = connectedStudents
      ? connectedStudents?.find((data) => data.socketId === socket.id)
      : undefined;
    if (found) {
      setVotingValidation(found.voted);
    }
  }, [connectedStudents]);

  return (
    <div className="min-h-screen bg-white">
      {!isConnected ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-full mb-6">
                Live Poll
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Enter Your Name</h1>
              <p className="text-gray-600">Please enter your name to join the polling session</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                placeholder="Enter your name"
                required
                className="w-full p-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
              />
              {nameError && (
                <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg mt-3 text-sm">
                  {nameError}
                </div>
              )}
              <button
                onClick={handleSubmit}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-white">
          {/* Header */}
          <div className="bg-gray-900 text-white p-4">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <span className="text-sm">Student Interface</span>
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 py-8">
            {currentQuestion ? (
              (currentQuestion.answered == false || votingValidation == false) && !timerExpired && !allStudentsAnswered && !hasVoted ? (
                <div>
                  {/* Timer Display */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">Question 1</h2>
                      <div className="flex items-center text-red-600">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-bold text-xl">
                          {Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:
                          {(timeRemaining % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-white border border-purple-200 rounded-lg p-6 shadow-sm">
                    {/* Question */}
                    <div className="bg-gray-100 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">{currentQuestion.question}</h3>
                    </div>
                    
                    {/* Options */}
                    <div className="space-y-3 mb-6">
                      {currentQuestion.options.map((option, index) => (
                        <div 
                          key={`option-${index}-${option}`} 
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedOption === option 
                              ? 'border-purple-500 bg-purple-50' 
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                          onClick={() => setSelectedOption(option)}
                        >
                          <input
                            type="radio"
                            name="polling"
                            value={option}
                            checked={selectedOption === option}
                            onChange={() => setSelectedOption(option)}
                            className="mr-4 w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <label className="flex items-center cursor-pointer flex-1">
                            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center mr-3 text-sm font-bold text-gray-600">
                              {index + 1}
                            </span>
                            <span className={`${selectedOption === option ? 'text-purple-700 font-medium' : 'text-gray-900'}`}>
                              {option}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handlePoling}
                        disabled={!selectedOption || hasVoted || timeRemaining === 0}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {hasVoted ? "Voted" : timeRemaining === 0 ? "Time's Up" : "Submit"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Status Messages */}
                  {timerExpired && (
                    <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg text-center">
                      ⏰ Time's up! Here are the results:
                    </div>
                  )}
                  {allStudentsAnswered && !timerExpired && (
                    <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg text-center">
                      ✅ All students have answered! Here are the results:
                      {timeRemaining > 0 && (
                        <div className="text-sm mt-1">
                          (Timer: {timeRemaining}s remaining)
                        </div>
                      )}
                    </div>
                  )}
                  {hasVoted && !allStudentsAnswered && !timerExpired && (
                    <div className="bg-blue-100 border border-blue-300 text-blue-800 p-4 rounded-lg text-center">
                      ✅ You have voted! Here are the live results:
                      {timeRemaining > 0 && (
                        <div className="text-sm mt-1">
                          (Waiting for other students... Timer: {timeRemaining}s remaining)
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Results */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <h2 className="text-center items-center font-bold text-xl flex justify-center mb-6">
                      <img
                        src={tower}
                        alt=""
                        width="20px"
                        height="20px"
                        className="mr-3"
                      />
                      Live Results
                    </h2>
                    <div className="space-y-4">
                      {currentQuestion &&
                        Object.entries(currentQuestion.optionsFrequency).map(
                          ([option]) => (
                            <div
                              key={`result-${option}`}
                              className="space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-gray-900 font-medium">{option}</span>
                                <span className="text-gray-600 font-semibold">
                                  {parseInt(currentQuestion.results[option]) ?? "0"}%
                                </span>
                              </div>
                              <ProgressBar
                                now={
                                  parseInt(currentQuestion.results[option]) ?? "0"
                                }
                                variant={getVariant(
                                  parseInt(currentQuestion.results[option])
                                )}
                                animated={
                                  getVariant(
                                    parseInt(currentQuestion.results[option])
                                  ) != "success"
                                }
                                className="h-3"
                              />
                            </div>
                          )
                        )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Waiting for question...</h2>
                  <p className="text-gray-600">The teacher will ask a question soon</p>
                  {timerExpired && (
                    <p className="text-yellow-600 mt-2">⏰ Time's up!</p>
                  )}
                  {allStudentsAnswered && (
                    <p className="text-green-600 mt-2">✅ All students answered!</p>
                  )}
                  {hasVoted && (
                    <p className="text-blue-600 mt-2">✅ You have voted!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Student;