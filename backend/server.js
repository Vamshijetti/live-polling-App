const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
  credentials: true
}));
//------------------------------------------- Deployment ----------------------------
const __dirname1 = path.resolve(__dirname, "dist");
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    app.use(express.static(__dirname1));
    const indexfile = path.join(__dirname, "dist", "index.html");
    return res.sendFile(indexfile);
  });
}

//------------------------------------------- Deployment ----------------------------

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

let currentQuestion = {};
const connectedStudents = new Map();
let questionStartTime = null;
let questionTimer = null;

// Helper function to check if all students have answered
function allStudentsAnswered() {
  if (connectedStudents.size === 0) return true;
  return Array.from(connectedStudents.values()).every(student => student.voted);
}

// Helper function to check if question timer has expired
function isQuestionTimerExpired() {
  if (!questionStartTime || !currentQuestion.timer) return false;
  const elapsed = (Date.now() - questionStartTime) / 1000;
  return elapsed >= currentQuestion.timer;
}

// Helper function to get remaining time for a question
function getRemainingTime() {
  if (!questionStartTime || !currentQuestion.timer) return 0;
  const elapsed = (Date.now() - questionStartTime) / 1000;
  return Math.max(0, currentQuestion.timer - elapsed);
}

io.on("connection", (socket) => {
  socket.on("teacher-ask-question", (questionData) => {
    // Check if teacher can ask a new question
    const canAskNewQuestion = !currentQuestion.question || 
      currentQuestion.answered || 
      isQuestionTimerExpired() ||
      allStudentsAnswered();

    if (!canAskNewQuestion) {
      socket.emit("question-restricted", {
        message: "Cannot ask new question. Please wait for all students to answer or the timer to complete."
      });
      return;
    }

    const question = {
      question: questionData.question,
      options: questionData.options,
      optionsFrequency: {},
      answered: false,
      results: {},
      timer: Math.min(questionData.timer, 60), // Maximum 60 seconds
    };

    question.options.forEach((option) => {
      question.optionsFrequency[option] = 0;
    });

    // Clear any existing timer
    if (questionTimer) {
      clearTimeout(questionTimer);
    }

    currentQuestion = question;
    questionStartTime = Date.now();

    // Reset all students' voted status
    connectedStudents.forEach((student) => {
      student.voted = false;
    });

    io.emit("new-question", question);

    // Set new timer
    questionTimer = setTimeout(() => {
      if (!currentQuestion.answered) {
        const totalResponses = Object.values(
          currentQuestion.optionsFrequency
        ).reduce((acc, ans) => acc + ans, 0);

        Object.keys(currentQuestion.optionsFrequency).forEach((option) => {
          const percentage = totalResponses > 0 ? 
            (currentQuestion.optionsFrequency[option] / totalResponses) * 100 : 0;
          currentQuestion.results[option] = percentage;
        });

        currentQuestion.answered = true;
        io.emit("polling-results", currentQuestion.results);
      }
    }, question.timer * 1000);
  });

  socket.on("handle-polling", ({ option }) => {
    if (currentQuestion && currentQuestion.options?.includes(option) && !currentQuestion.answered) {
      // Check if student has already voted
      const student = connectedStudents.get(socket.id);
      if (student && student.voted) {
        socket.emit("already-voted", { message: "You have already voted for this question." });
        return;
      }

      if (currentQuestion.optionsFrequency[option]) {
        currentQuestion.optionsFrequency[option] += 1;
      } else {
        currentQuestion.optionsFrequency[option] = 1;
      }

      const totalResponses = Object.values(
        currentQuestion.optionsFrequency
      ).reduce((acc, ans) => acc + ans);

      Object.keys(currentQuestion.optionsFrequency).forEach((option) => {
        const percentage = totalResponses > 0 ? 
          (currentQuestion.optionsFrequency[option] / totalResponses) * 100 : 0;
        currentQuestion.results[option] = percentage;
      });

      if (student) {
        student.voted = true;
        connectedStudents.set(socket.id, student);
        io.emit("student-vote-validation", [...connectedStudents.values()]);
      }

      // Only emit polling results, not the question again
      io.emit("polling-results", currentQuestion.results);

      // Check if all students have answered
      if (allStudentsAnswered()) {
        currentQuestion.answered = true;
        io.emit("all-students-answered", { message: "All students have answered!" });
      }
    }
  });

  socket.on("student-set-name", ({ name }) => {
    // Check if name already exists (case-insensitive)
    const existingStudent = Array.from(connectedStudents.values()).find(
      student => student.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingStudent) {
      socket.emit("name-taken", { message: "This name is already taken. Please choose a different name." });
      return;
    }

    const student = {
      name,
      socketId: socket.id,
      voted: false,
    };

    connectedStudents.set(socket.id, student);
    console.log(`Student ${name} connected`);

    io.emit("student-connected", Array.from(connectedStudents.values()));
    
    // Send current question if one exists and not expired
    if (currentQuestion.question && !currentQuestion.answered && !isQuestionTimerExpired()) {
      const remainingTime = getRemainingTime();
      
      // Only send if there's still time remaining
      if (remainingTime > 0) {
        // Send question with remaining time
        const questionWithRemainingTime = {
          ...currentQuestion,
          timer: Math.ceil(remainingTime)
        };
        
        socket.emit("new-question", questionWithRemainingTime);
      }
    }
  });

  // New event to get current question status
  socket.on("get-question-status", () => {
    socket.emit("question-status", {
      hasQuestion: !!currentQuestion.question,
      isAnswered: currentQuestion.answered,
      canAskNew: !currentQuestion.question || 
        currentQuestion.answered || 
        isQuestionTimerExpired() ||
        allStudentsAnswered()
    });
  });

  // Teacher can remove a student
  socket.on("teacher-remove-student", ({ studentId }) => {
    const student = connectedStudents.get(studentId);
    if (student) {
      connectedStudents.delete(studentId);
      console.log(`Teacher removed student: ${student.name}`);
      
      // Notify the removed student
      io.to(studentId).emit("student-removed", { 
        message: "You have been removed from the polling session by the teacher." 
      });
      
      // Update all clients with new student list
      io.emit("student-disconnected", Array.from(connectedStudents.values()));
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");

    connectedStudents.get(socket.id);
    connectedStudents.delete(socket.id);

    io.emit("student-disconnected", Array.from(connectedStudents.values()));
  });
});
