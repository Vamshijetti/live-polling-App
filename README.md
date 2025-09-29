# Live Polling Application

## Overview

The Live Polling Application is a real-time interactive polling platform designed for classrooms, workshops, or events. It allows teachers to create and publish polls while students participate and see results instantly. The app is built with React on the frontend and Node.js, Express, and Socket.io on the backend to deliver a smooth, responsive experience.

## Features

### Teacher Interface
- Create a new poll
- View live polling results
- Ask a new question only if:


- No question has been asked yet, or
- All students have answered the previous question


### Student Interface

- Enter name on first visit (unique to each tab)
- Submit answers once a question is asked
- View live polling results after submission
- Maximum of 60 seconds to answer a question, after which results are shown


### Real-time Communication
- **Socket.io Integration:** Ensures instant updates and synchronization between teacher and student interfaces.
- **Student Validation:** Tracks student responses to prevent multiple submissions and ensures data integrity.

## Technologies Used
- Frontend: React (Redux optional but preferred)
- Backend: Express.js with Socket.io for polling functionality
an bchvgeqkdabc