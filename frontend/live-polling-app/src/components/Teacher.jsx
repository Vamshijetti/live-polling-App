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
    <div
      className="w-[60%] h-[80vh] text-white"
    >
      <h1 className="text-3xl font-bold mb-5">Teacher Interface</h1>
      
      {/* Connected Students List */}
      {connectedStudents.length > 0 && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-bold mb-3">Connected Students ({connectedStudents.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {connectedStudents.map((student) => (
              <div key={student.socketId} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${student.voted ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-white">{student.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {student.voted ? '(Voted)' : '(Not voted)'}
                  </span>
                </div>
                <button
                  onClick={() => removeStudent(student.socketId)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
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
        <>
          <PollingResult socket={socket} />
          {timerActive && !allStudentsAnswered && (
            <div className="bg-yellow-600 text-white p-3 rounded-md mb-4 text-center">
              <div className="flex justify-center items-center">
                <span className="mr-2">Question Timer:</span>
                <span className="font-bold text-xl">{questionTimer}s</span>
              </div>
            </div>
          )}
          {allStudentsAnswered && timerActive && (
            <div className="bg-green-600 text-white p-3 rounded-md mb-4 text-center">
              <div className="flex justify-center items-center">
                <span className="mr-2">✅ All students have answered!</span>
                <span className="text-sm">(Timer: {questionTimer}s remaining)</span>
              </div>
            </div>
          )}
          <Button 
            className="bg-green-600 rounded-lg h-10 w-1/4 font-semibold" 
            variant="primary" 
            onClick={askAnotherQuestion}
            disabled={timerActive && !allStudentsAnswered}
          >
            {timerActive && !allStudentsAnswered ? `Wait ${questionTimer}s` : 
             allStudentsAnswered ? "Ask Another Question ?" : 
             "Ask Another Question ?"}
          </Button>
        </>
      ) : (
        <div
         className="flex flex-col gap-y-4"
        >
          {restrictionMessage && (
            <div className="bg-red-600 text-white p-3 rounded-md mb-4">
              {restrictionMessage}
            </div>
          )}
          <label className="text">Enter Question and Options</label>
          <textarea
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter question..."
            className="w-[50%] h-24 border border-[#0dcaf0] bg-[#2a444a] outline-none text-white rounded-md p-2.5"
          />
          <br />
          <label>Enter Options:</label>
          {options.map((option, index) => (
            <div key={`teacher-option-${index}`}>
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Enter Option number ${index + 1}`}
                className="w-[35%] h-11 p-3 border border-[#0dcaf0] rounded-md bg-[#2a444a] outline-none text-white"
              />
            </div>
          ))}
          <div
            className="flex justify-between"
          >
            <Button className="bg-green-600 rounded-lg h-10 w-1/4 font-semibold " variant="outline-info" onClick={addOption}>
              Add another option +
            </Button>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Timer (seconds):</label>
              <input 
                className="text-black w-20 h-10 px-2 border border-[#0dcaf0] rounded-md" 
                type="number" 
                min="10" 
                max="300" 
                value={timer} 
                onChange={(e) => setTimer(parseInt(e.target.value) || 60)} 
              />
            </div>
            <Button 
              className="bg-blue-600 rounded-lg h-10 w-1/4 font-semibold" 
              variant="primary" 
              onClick={askQuestion}
              disabled={!canAskNewQuestion}
            >
              {canAskNewQuestion ? "Ask Question" : "Wait for Students"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teacher;