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
    <div
     className="flex justify-center w-full h-[100] p-40"
    >
      {isConnected ? (
        <div
          className="w-full border border-[#6edff6] bg-[#134652]"
        >
          <h1 className="text-center text-3xl font-bold">Welcome, {name}</h1>
          {currentQuestion ? (
            (currentQuestion.answered == false || votingValidation == false) && !timerExpired && !allStudentsAnswered && !hasVoted ? (
              <div
                className="gap-y-4 gap-x-4 border-t border-[#6edff6] ml-0 md:ml-4 p-12"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Question: {currentQuestion.question}</h2>
                  {timeRemaining > 0 && (
                    <div className="bg-red-600 text-white px-3 py-1 rounded-md font-bold">
                      Time: {timeRemaining}s
                    </div>
                  )}
                </div>
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={`option-${index}-${option}`}
                    className={`flex hover:bg-gray-300 hover:text-black ${selectedOption === option ? 'border-2 border-green-500' : 'border border-[#6edff6]'} justify-between my-4 h-6 p-4 cursor-pointer items-center rounded-md`}
                    onClick={() => setSelectedOption(option)}
                  >
                    {option}
                  </div>
                ))}
                <Button
                  className="h-10 bg-green-600 w-1/5 rounded-lg font-semibold"
                  variant="primary"
                  onClick={handlePoling}
                  disabled={!selectedOption || hasVoted || timeRemaining === 0}
                >
                  {hasVoted ? "Voted" : timeRemaining === 0 ? "Time's Up" : "Submit"}
                </Button>
              </div>
            ) : (
              <div
                className="mt-12 mb-12 border border-[#6edff6] bg-[#134652]"
              >
                {timerExpired && (
                  <div className="bg-red-600 text-white p-3 rounded-md mb-4 text-center">
                    ⏰ Time's up! Here are the results:
                  </div>
                )}
                {allStudentsAnswered && !timerExpired && (
                  <div className="bg-green-600 text-white p-3 rounded-md mb-4 text-center">
                    ✅ All students have answered! Here are the results:
                    {timeRemaining > 0 && (
                      <div className="text-sm mt-1">
                        (Timer: {timeRemaining}s remaining)
                      </div>
                    )}
                  </div>
                )}
                {hasVoted && !allStudentsAnswered && !timerExpired && (
                  <div className="bg-blue-600 text-white p-3 rounded-md mb-4 text-center">
                    ✅ You have voted! Here are the live results:
                    {timeRemaining > 0 && (
                      <div className="text-sm mt-1">
                        (Waiting for other students... Timer: {timeRemaining}s remaining)
                      </div>
                    )}
                  </div>
                )}
                <h2
                  className="text-center items-center font-bold text-xl flex justify-center m-3"
                >
                  <img
                    src={tower}
                    alt=""
                    width="20px"
                    height="20px"
                    className="mr-5"
                  />
                  Live Results
                </h2>
                <ul
                  className="gap-y-4 gap-x-4 border-t border-[#6edff6] w-full"
                >
                  {currentQuestion &&
                    Object.entries(currentQuestion.optionsFrequency).map(
                      ([option]) => (
                        <div
                          key={`result-${option}`}
                          className="m-4"
                        >
                          <ProgressBar
                            now={
                              parseInt(currentQuestion.results[option]) ?? "0"
                            }
                            label={<span className="text-xl text-black font-semibold">{option}              {parseInt(
                              currentQuestion.results[option]
                            )}%</span>}
                            variant={getVariant(
                              parseInt(currentQuestion.results[option])
                            )}
                            animated={
                              getVariant(
                                parseInt(currentQuestion.results[option])
                              ) != "success"
                            }
                          />
                        </div>
                      )
                    )}
                </ul>
              </div>
            )
          ) : (
            <div className="text-center">
              {timerExpired ? (
                <div>
                  <h1 className="text-2xl font-bold text-red-500 mb-4">⏰ Time's up!</h1>
                  <p className="text-lg">Waiting for results...</p>
                </div>
              ) : allStudentsAnswered ? (
                <div>
                  <h1 className="text-2xl font-bold text-green-500 mb-4">✅ All students answered!</h1>
                  <p className="text-lg">Waiting for results...</p>
                </div>
              ) : hasVoted ? (
                <div>
                  <h1 className="text-2xl font-bold text-blue-500 mb-4">✅ You have voted!</h1>
                  <p className="text-lg">Waiting for results...</p>
                </div>
              ) : (
                <h1 className="item-center justify-center flex font-bold text-xl m-20">Waiting for question...</h1>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex w-full justify-center flex-col items-center gap-y-4"
        >
          <h2 className="text-2xl font-bold">Enter your name to participate in the contest</h2>
          {nameError && (
            <div className="bg-red-600 text-white p-2 rounded-md text-sm">
              {nameError}
            </div>
          )}
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            placeholder="Enter your name"
            required
            className="w-[45%] h-10 p-2.5 border border-[#0dcaf0] rounded-md bg-[#2a444a] outline-none text-white"
          />
          <Button className="bg-blue-600 h-10 w-1/5 rounded-lg font-semibold" variant="info" size="lg" onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      )}
    </div>
  );
};

export default Student;