import React, { useState, useEffect } from "react";
import { ProgressBar } from "react-bootstrap";
import {getVariant} from "../utils/util"

import tower from "../assets/tower-icon.png";

const PollingResult = ({ socket }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const handleNewQuestion = (question) => {
    setCurrentQuestion(question);
  };

  const handlePollingResults = (results) => {
    // Update the current question with new results
    setCurrentQuestion(prev => ({
      ...prev,
      results: results
    }));
  };

  useEffect(() => {
    socket.on("new-question", handleNewQuestion);
    socket.on("polling-results", handlePollingResults);

    return () => {
      socket.off("new-question", handleNewQuestion);
      socket.off("polling-results", handlePollingResults);
    };
  }, [socket]);

  return (
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
        {currentQuestion && currentQuestion.options ? (
          currentQuestion.options.map((option) => (
            <div
              key={`polling-result-${option}`}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">{option}</span>
                <span className="text-gray-600 font-semibold">
                  {parseInt(currentQuestion.results?.[option] ?? 0)}%
                </span>
              </div>
              <ProgressBar
                now={parseInt(currentQuestion.results?.[option] ?? 0) ?? "0"}
                variant={getVariant(
                  parseInt(currentQuestion.results?.[option] ?? 0)
                )}
                animated={
                  getVariant(parseInt(currentQuestion.results?.[option] ?? 0)) !=
                  "success"
                }
                className="h-3"
              />
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No results available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollingResult;