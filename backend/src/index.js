// server.js - COMPLETELY FIXED VERSION (CHAT REMOVED) WITH COMMENT SUPPORT
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");
const jwt = require("jsonwebtoken");
const adminAuthRoutes = require('./routes/adminAuth');
const adminDashboardRoutes = require('./routes/adminDashboard');

// ✅ LOAD ENV FIRST
dotenv.config();

// ✅ ADD BACK PASSPORT CONFIGURATION
require("./config/passport");

const app = express();
const server = http.createServer(app);
// ===== GLOBAL STORAGE =====
const connectedClients = new Map(); // For tracking all connected clients
const examRooms = new Map();
const pendingCameraRequests = new Set();
const endedExams = new Set();
const studentAttemptsStorage = new Map();

// ===== PASSPORT INITIALIZATION =====
const passport = require("passport");
app.use(passport.initialize());

// ===== SOCKET.IO SETUP =====
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: false,
  connectTimeout: 8000,
  pingTimeout: 20000,
  pingInterval: 10000
});

// ===== MIDDLEWARES =====
app.use(cors({ 
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    "http://localhost:3000"
  ],
  credentials: true 
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


//========ADMIN============
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);

// ===== ROUTES =====
app.use("/api/auth", require("./routes/auth"));
app.use("/api/class", require("./routes/classes"));
app.use("/api/exams", require("./routes/examRoutes"));
app.use("/api/classwork", require("./routes/classwork"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/student-management", require("./routes/studentManagement"));
app.use("/api/notifications", require("./routes/notifications"));

// CHAT ROUTES COMPLETELY REMOVED
// THEME ROUTES COMPLETELY REMOVED

// ✅ ADD DEBUG ROUTE TO TEST ALL REGISTERED ROUTES
app.get("/api/debug-routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Regular route
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
        type: 'route'
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      routes.push({
        path: middleware.regexp.toString(),
        type: 'router',
        mounted: true
      });
    }
  });
  res.json({ 
    success: true,
    message: 'All registered routes',
    routes: routes
  });
});




// Sa server.js, idagdag ito bago ang health check:
app.post('/api/proctoring-alert', async (req, res) => {
  try {
    const alertData = req.body;
    console.log('🚨 Received proctoring alert from Python:', alertData);

    const { examId, studentSocketId, message, type, severity } = alertData;
    
    if (!examId) {
      return res.status(400).json({ error: 'examId is required' });
    }

    // Broadcast to teacher room
    io.to(`exam-${examId}`).emit('proctoring-alert', {
      ...alertData,
      timestamp: new Date().toISOString(),
      source: 'python_backend'
    });

    console.log(`✅ Proctoring alert forwarded to exam-${examId}`);
    res.json({ success: true, message: 'Alert forwarded' });
    
  } catch (error) {
    console.error('❌ Error forwarding proctoring alert:', error);
    res.status(500).json({ error: 'Failed to forward alert' });
  }
});

// ===== HEALTH CHECK =====
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    socketIO: "ENABLED",
    realTimeComments: "ENABLED",
    // CHAT STATUS REMOVED
    // THEME STATUS REMOVED
    timestamp: new Date().toISOString()
  });
});

// ===== COMMENT BROADCASTING FUNCTIONS =====
const broadcastNewComment = (quizId, comment) => {
  console.log(`📝 Broadcasting new comment to quiz-comments-${quizId}:`, comment._id);
  io.to(`quiz-comments-${quizId}`).emit('new-comment', comment);
};

const broadcastDeletedComment = (quizId, commentId) => {
  console.log(`🗑️ Broadcasting deleted comment to quiz-comments-${quizId}:`, commentId);
  io.to(`quiz-comments-${quizId}`).emit('comment-deleted', commentId);
};

// ===== SOCKET.IO AUTHENTICATION =====
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('❌ No token provided');
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userName = decoded.name;
    socket.userRole = decoded.role || 'student';
    console.log('✅ Socket authenticated:', socket.userName, 'Role:', socket.userRole);
    next();
    
  } catch (err) {
    console.log('❌ Socket auth failed');
    next(new Error('Authentication failed'));
  }
});


// Add this helper function
const isExamEnded = (examId) => {
  return endedExams.has(`exam-${examId}`);
};


const trackConnectedClient = (socket) => {
  connectedClients.set(socket.id, {
    userId: socket.userId,
    userName: socket.userName,
    userRole: socket.userRole,
    socketId: socket.id,
    connectedAt: new Date(),
    currentRoom: null
  });
  console.log(`📊 Client tracked: ${socket.userName} (${socket.id})`);
};

const updateClientRoom = (socketId, roomId) => {
  const client = connectedClients.get(socketId);
  if (client) {
    client.currentRoom = roomId;
    console.log(`📍 Client ${socketId} updated to room: ${roomId}`);
  }
};

const removeConnectedClient = (socketId) => {
  connectedClients.delete(socketId);
  console.log(`🗑️ Client removed: ${socketId}`);
};

const connected_clients = {};

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id, "User:", socket.userName, "Role:", socket.userRole);

  let currentRoom = null;
  


  // ===== ATTEMPTS PERSISTENCE =====
const studentAttemptsStorage = new Map(); // Store attempts by student ID

// Function to get student attempts
const getStudentAttempts = (studentId, examId) => {
  const key = `${examId}_${studentId}`;
  if (!studentAttemptsStorage.has(key)) {
    studentAttemptsStorage.set(key, {
      currentAttempts: 0,
      maxAttempts: 10,
      attemptsLeft: 10,
      history: []
    });
  }
  return studentAttemptsStorage.get(key);
};

// Function to save student attempts
const saveStudentAttempts = (studentId, examId, attempts) => {
  const key = `${examId}_${studentId}`;
  studentAttemptsStorage.set(key, attempts);
};

// server.js - ADD/UPDATE ang existing na tab switch handler

// ===== TAB SWITCH DETECTION HANDLER =====
socket.on('tab-switch-detected', (data) => {
  console.log('💻 Tab switch detected from student:', data);
  
  const { examId, studentSocketId, timestamp, count, timeSinceLast } = data;
  
  // ✅ Kunin ang student info mula sa connected_clients
  const studentInfo = connected_clients && connected_clients[studentSocketId];
  if (!studentInfo) {
    console.error(`❌ Student info not found for socketId: ${studentSocketId}`);
    return;
  }
  
  // ✅ Tiyaking connected si teacher
  const roomId = `exam-${examId}`;
  const room = examRooms.get(roomId);
  if (!room || !room.teacher) return;
  
  const teacherSocketId = room.teacher;
  
  // ✅ ENHANCE ALERT DATA
  const enhancedAlert = {
    examId: examId,
    studentSocketId: studentSocketId,
    studentId: studentInfo.userId,
    studentName: studentInfo.userName,
    message: `💻 Tab switch detected (Count: ${count}) - Student looked away from exam`,
    type: 'danger',
    severity: 'high',
    timestamp: new Date().toISOString(),
    detectionType: 'tab_switching',
    confidence: 0.95,
    metadata: {
      count: count,
      timeSinceLast: timeSinceLast,
      source: 'tab_switch_detection'
    }
  };
  
  console.log('📤 Sending tab switch alert to teacher:', {
    teacherSocketId: teacherSocketId,
    student: studentInfo.userName,
    count: count
  });
  
  // ✅ BROADCAST TO TEACHER SPECIFICALLY
  socket.to(teacherSocketId).emit('proctoring-alert', enhancedAlert);
  
  // ✅ UPDATE ATTEMPTS SYSTEM
  const currentAttempts = getStudentAttempts(studentInfo.userId, examId);
  const newAttempts = currentAttempts.currentAttempts + 0.5; // Tab switch = 0.5 attempt
  const attemptsLeft = Math.max(0, currentAttempts.maxAttempts - newAttempts);
  
  const updatedAttempts = {
    ...currentAttempts,
    currentAttempts: newAttempts,
    attemptsLeft: attemptsLeft,
    history: [
      ...currentAttempts.history,
      {
        timestamp: new Date().toISOString(),
        violation: 'tab_switching',
        message: `Tab switch detected (${count} times)`,
        attemptsLeft: attemptsLeft,
        timeSinceLast: timeSinceLast
      }
    ].slice(-10)
  };
  
  saveStudentAttempts(studentInfo.userId, examId, updatedAttempts);
  
  // ✅ SEND ATTEMPTS UPDATE TO STUDENT
  socket.emit('attempts-update', {
    attempts: updatedAttempts
  });
  
  // ✅ SEND ATTEMPTS UPDATE TO TEACHER
  socket.to(teacherSocketId).emit('student-attempts-update', {
    studentSocketId: studentSocketId,
    studentId: studentInfo.userId,
    attempts: updatedAttempts
  });
});

// server.js - ADD sa teacher socket listeners

socket.on('student-attempts-update', (data) => {
  console.log('📊 Student attempts updated:', data);
  
  setStudentAttempts(prev => ({
    ...prev,
    [data.studentSocketId]: data.attempts
  }));
  
  // Update students list with attempts info
  setStudents(prev => prev.map(student => 
    student.socketId === data.studentSocketId 
      ? { 
          ...student, 
          violations: data.attempts.currentAttempts,
          attemptsLeft: data.attempts.attemptsLeft
        }
      : student
  ));
});

// Add tab switch specific handler for teacher
socket.on('forward-proctoring-alert', (data) => {
  console.log('📤 Received forwarded alert from server:', data);
  
  if (data.detectionType === 'tab_switching') {
    // ✅ Send to teacher specifically
    const roomId = `exam-${data.examId}`;
    const room = examRooms.get(roomId);
    if (room && room.teacher) {
      io.to(room.teacher).emit('proctoring-alert', data);
      console.log('🎯 Tab switch alert sent to teacher:', data.studentName);
    }
  }
});


  // ===== REAL-TIME COMMENT HANDLERS =====
  socket.on('join-quiz-comments', ({ quizId }) => {
    const roomName = `quiz-comments-${quizId}`;
    socket.join(roomName);
    console.log(`📝 User ${socket.userName} joined quiz comments room: ${roomName}`);
  });


  // ✅ ADDED: Main class chat message handler
  socket.on("send-chat-message", async (data) => {
    try {
      const { classId, message } = data;
      
      if (!message || !message.trim()) {
        return;
      }

      // Save to database
      const chatMessage = new ChatMessage({
        classId,
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        message: message.trim()
      });

      await chatMessage.save();
      
      // Populate user data for response
      await chatMessage.populate("userId", "name email");

      // Broadcast to all users in the class chat room
      const messageData = {
        _id: chatMessage._id,
        classId: chatMessage.classId,
        userId: {
          _id: chatMessage.userId._id,
          name: chatMessage.userId.name,
          email: chatMessage.userId.email
        },
        userName: chatMessage.userName,
        userRole: chatMessage.userRole,
        message: chatMessage.message,
        replies: chatMessage.replies || [],
        createdAt: chatMessage.createdAt,
        updatedAt: chatMessage.updatedAt
      };

      io.to(`class-chat-${classId}`).emit("new-chat-message", messageData);
      
      console.log(`💬 New chat message in class ${classId} from ${socket.userName}`);

    } catch (error) {
      console.error('❌ Error sending chat message:', error);
      socket.emit("chat-error", { message: "Failed to send message" });
    }
  });

  

  
  // ✅ ADD THIS NEW HANDLER FOR EXAM CHAT (after the class chat handlers)
  socket.on("send-exam-chat-message", async (data) => {
    try {
      console.log('💬 Received exam chat message:', data);
      
      const { roomId, message } = data;
      
      // ✅ SAFELY EXTRACT MESSAGE TEXT
      let messageText;
      if (typeof message === 'object' && message.text) {
        messageText = message.text;
      } else if (typeof message === 'string') {
        messageText = message;
      } else {
        console.error('❌ Invalid message format in exam chat:', message);
        return;
      }
      
      if (!messageText || !messageText.trim()) {
        return;
      }

      const messageData = {
        id: message.id || Date.now().toString(),
        text: messageText.trim(),
        sender: message.sender || socket.userRole,
        senderName: message.senderName || socket.userName,
        timestamp: message.timestamp || new Date(),
        type: message.type || socket.userRole
      };

      // ✅ BROADCAST TO EXAM ROOM
      io.to(roomId).emit("chat-message", {
        message: messageData,
        userName: socket.userName,
        userRole: socket.userRole
      });

      console.log(`💬 Exam chat broadcast to ${roomId}:`, messageData);

    } catch (error) {
      console.error('❌ Error in exam chat:', error);
    }
  });
// In server.js socket connection handlers, ADD/UPDATE:

// ✅ COMPLETE PROCTORING ALERT HANDLER
socket.on('proctoring-alert', (data) => {
  console.log('🚨 Received proctoring alert from student:', data);
  
  // Extract examId from multiple sources
  const examId = data.examId || 
                (data.roomId ? data.roomId.replace('exam-', '') : null) ||
                (socket.rooms ? Array.from(socket.rooms).find(room => room.startsWith('exam-'))?.replace('exam-', '') : null);
  
  if (!examId) {
    console.error('❌ No examId found in proctoring alert');
    return;
  }
  
  // ✅ ENHANCE THE ALERT DATA WITH STUDENT INFO
  const enhancedAlert = {
    ...data,
    studentSocketId: data.studentSocketId || socket.id,
    studentId: socket.userId,
    studentName: socket.userName,
    examId: examId,
    timestamp: new Date().toISOString(),
    serverReceivedAt: Date.now()
  };
  
  console.log(`📤 Forwarding enhanced alert to exam-${examId}:`, {
    student: socket.userName,
    message: data.message,
    detectionType: data.detectionType
  });
  
  // ✅ BROADCAST TO TEACHER AND ALL IN EXAM ROOM
  io.to(`exam-${examId}`).emit('proctoring-alert', enhancedAlert);
  
  // ✅ ALSO STORE IN DATABASE FOR PERSISTENCE (optional)
  storeProctoringAlert(enhancedAlert);
});

// ✅ ADD PYTHON DETECTION ENDPOINT
app.post('/api/proctoring/python-detection', async (req, res) => {
  try {
    const detectionData = req.body;
    console.log('🐍 Python detection received:', detectionData);
    
    const { exam_id, student_id, detection_type, confidence, message } = detectionData;
    
    if (!exam_id) {
      return res.status(400).json({ error: 'exam_id is required' });
    }
    
    // Forward to teacher room
    io.to(`exam-${exam_id}`).emit('python-detection', {
      examId: exam_id,
      studentId: student_id,
      detectionType: detection_type,
      confidence: confidence,
      message: message || `Python detection: ${detection_type}`,
      source: 'python_backend',
      timestamp: new Date().toISOString(),
      severity: confidence > 0.7 ? 'high' : 'medium'
    });
    
    console.log(`✅ Python detection forwarded to exam-${exam_id}`);
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error forwarding python detection:', error);
    res.status(500).json({ error: 'Failed to forward detection' });
  }
});

// ✅ FUNCTION TO STORE ALERTS IN DATABASE
async function storeProctoringAlert(alertData) {
  try {
    // Create a ProctoringAlert model if you don't have one
    const ProctoringAlert = require('./models/ProctoringAlert');
    
    const alert = new ProctoringAlert({
      examId: alertData.examId,
      studentId: alertData.studentId,
      studentName: alertData.studentName,
      studentSocketId: alertData.studentSocketId,
      detectionType: alertData.detectionType,
      message: alertData.message,
      severity: alertData.severity,
      confidence: alertData.confidence,
      metadata: alertData,
      timestamp: new Date(alertData.timestamp)
    });
    
    await alert.save();
    console.log('💾 Alert saved to database:', alert._id);
    
  } catch (error) {
    console.error('❌ Failed to save alert to database:', error);
  }
}




// Manual violation from teacher
socket.on('manual-violation', (data) => {
  console.log(`⚠️ Manual violation for ${data.studentSocketId}: ${data.violationType}`);
  
  // ✅ CORRECT: Use io.to() instead of sio.emit()
  io.to(`exam-${data.examId}`).emit('student-violation', {
    studentSocketId: data.studentSocketId,
    violationType: data.violationType,
    severity: 'manual',
    examId: data.examId,
    timestamp: new Date().toISOString()
  });
});

// Auto violations from proctoring
socket.on('proctoring-violation', (data) => {
  console.log(`⚠️ Auto violation for ${data.studentSocketId}: ${data.violationType}`);
  
  // ✅ CORRECT: Use io.to() instead of sio.emit()
  io.to(`exam-${data.examId}`).emit('student-violation', {
    studentSocketId: data.studentSocketId,
    violationType: data.violationType,
    severity: data.severity || 'auto',
    examId: data.examId,
    timestamp: new Date().toISOString()
  });
});

// ===== TIMER SYNC HANDLERS =====
socket.on('student-time-request', (data) => {
  console.log('🕒 Student requesting current time:', data.studentSocketId);
  
  const room = examRooms.get(data.roomId);
  if (room) {
    socket.emit('send-current-time', {
      studentSocketId: data.studentSocketId,
      timeLeft: room.timeLeft || 600,
      isTimerRunning: room.isTimerRunning || false,
      examStarted: room.examStarted || false,
      roomId: data.roomId
    });
    
    console.log('✅ Sent current time to student:', {
      time: room.timeLeft,
      running: room.isTimerRunning,
      student: data.studentSocketId
    });
  }
});

// Handle teacher timer broadcasts
socket.on('exam-time-update', (data) => {
  console.log('📢 Broadcasting timer update to room:', data.roomId);
  
  // Update room state
  if (examRooms.has(data.roomId)) {
    const room = examRooms.get(data.roomId);
    room.timeLeft = data.timeLeft;
    room.isTimerRunning = data.isTimerRunning;
    
    console.log(`✅ Room ${data.roomId} timer updated:`, {
      timeLeft: data.timeLeft,
      isRunning: data.isTimerRunning
    });
  }
  
  // Broadcast to all in room
  io.to(data.roomId).emit('exam-time-update', data);
});



// ===== TIMER MANAGEMENT FUNCTIONS =====
const calculateRemainingTime = (timerState) => {
  if (!timerState || !timerState.isRunning || !timerState.startedAt) {
    return timerState?.remainingSeconds || 0;
  }
  
  const now = new Date();
  const lastUpdated = timerState.lastUpdated || timerState.startedAt;
  const elapsedSeconds = Math.floor((now - lastUpdated) / 1000);
  const remaining = Math.max(0, (timerState.remainingSeconds || 0) - elapsedSeconds);
  
  return remaining;
};

const updateRoomTimer = (roomId, room) => {
  if (!room || !room.timerState) return;
  
  const remaining = calculateRemainingTime(room.timerState);
  room.timeLeft = remaining;
  
  // Update the room's timer state
  room.timerState.remainingSeconds = remaining;
  room.timerState.lastUpdated = new Date();
  
  return remaining;
};

const startTimerForRoom = async (roomId, examId, totalSeconds) => {
  const room = examRooms.get(roomId);
  if (!room) return;
  
  room.timerState = {
    remainingSeconds: totalSeconds,
    totalDuration: totalSeconds,
    isRunning: true,
    startedAt: new Date(),
    lastUpdated: new Date(),
    pausedAt: null
  };
  
  room.timeLeft = totalSeconds;
  room.isTimerRunning = true;
  
  // Also update in database
  try {
    const Exam = require('../models/Exam');
    await Exam.findByIdAndUpdate(examId, {
      'timerState.remainingSeconds': totalSeconds,
      'timerState.totalDuration': totalSeconds,
      'timerState.isRunning': true,
      'timerState.startedAt': new Date(),
      'timerState.lastUpdated': new Date()
    });
  } catch (error) {
    console.error('Error saving timer to DB:', error);
  }
};

const pauseTimerForRoom = async (roomId, examId) => {
  const room = examRooms.get(roomId);
  if (!room || !room.timerState) return;
  
  const remaining = calculateRemainingTime(room.timerState);
  
  room.timerState.isRunning = false;
  room.timerState.remainingSeconds = remaining;
  room.timerState.pausedAt = new Date();
  room.timerState.lastUpdated = new Date();
  
  room.timeLeft = remaining;
  room.isTimerRunning = false;
  
  // Update in database
  try {
    const Exam = require('../models/Exam');
    await Exam.findByIdAndUpdate(examId, {
      'timerState.remainingSeconds': remaining,
      'timerState.isRunning': false,
      'timerState.pausedAt': new Date(),
      'timerState.lastUpdated': new Date()
    });
  } catch (error) {
    console.error('Error pausing timer in DB:', error);
  }
};

const resumeTimerForRoom = async (roomId, examId) => {
  const room = examRooms.get(roomId);
  if (!room || !room.timerState) return;
  
  room.timerState.isRunning = true;
  room.timerState.pausedAt = null;
  room.timerState.lastUpdated = new Date();
  
  room.isTimerRunning = true;
  
  // Update in database
  try {
    const Exam = require('../models/Exam');
    await Exam.findByIdAndUpdate(examId, {
      'timerState.isRunning': true,
      'timerState.pausedAt': null,
      'timerState.lastUpdated': new Date()
    });
  } catch (error) {
    console.error('Error resuming timer in DB:', error);
  }
};

// Hanapin ang timer interval (mga line ~2000)
const timerInterval = setInterval(() => {
  examRooms.forEach((room, roomId) => {
    if (room.timerState && room.timerState.isRunning) {
      const remaining = calculateRemainingTime(room.timerState);
      room.timeLeft = remaining;
      
      // Auto-end if time is up
      if (remaining <= 0) {
        console.log(`⏰ Time expired for room ${roomId}`);
        
        // Broadcast to all students
        io.to(roomId).emit('exam-time-expired', {
          roomId: roomId,
          message: 'Time is up!',
          examId: roomId.replace('exam-', '')
        });
        
        // Stop timer
        room.timerState.isRunning = false;
        room.isTimerRunning = false;
      }
    }
  });
}, 1000);
// ✅ TIMER CONTROL HANDLERS
socket.on('start-exam-timer', async (data) => {
  console.log('⏰ Starting persistent timer for exam:', {
    examId: data.examId,
    roomId: data.roomId,
    totalSeconds: data.totalSeconds
  });
  
  await startTimerForRoom(data.roomId, data.examId, data.totalSeconds);
  
  // Broadcast to all in room
  io.to(data.roomId).emit('exam-time-update', {
    roomId: data.roomId,
    timeLeft: data.totalSeconds,
    isTimerRunning: true,
    timestamp: Date.now(),
    teacherName: 'Teacher'
  });
});

socket.on('pause-exam-timer', async (data) => {
  console.log('⏸️ Pausing timer for exam:', data.examId);
  await pauseTimerForRoom(data.roomId, data.examId);
  
  // Broadcast pause state
  const room = examRooms.get(data.roomId);
  if (room) {
    io.to(data.roomId).emit('exam-time-update', {
      roomId: data.roomId,
      timeLeft: room.timeLeft,
      isTimerRunning: false,
      timestamp: Date.now(),
      teacherName: 'Teacher'
    });
  }
});

socket.on('resume-exam-timer', async (data) => {
  console.log('▶️ Resuming timer for exam:', data.examId);
  await resumeTimerForRoom(data.roomId, data.examId);
  
  // Broadcast resume state
  const room = examRooms.get(data.roomId);
  if (room) {
    io.to(data.roomId).emit('exam-time-update', {
      roomId: data.roomId,
      timeLeft: room.timeLeft,
      isTimerRunning: true,
      timestamp: Date.now(),
      teacherName: 'Teacher'
    });
  }
});

socket.on('add-time-to-exam', async (data) => {
  console.log('➕ Adding time to exam:', {
    examId: data.examId,
    additionalSeconds: data.additionalSeconds
  });
  
  const room = examRooms.get(data.roomId);
  if (room && room.timerState) {
    const additionalSeconds = data.additionalSeconds || 300; // default 5 minutes
    
    if (room.timerState.isRunning) {
      // If running, add to remaining time
      room.timerState.remainingSeconds += additionalSeconds;
    } else {
      // If paused, add to total duration
      room.timerState.totalDuration += additionalSeconds;
      room.timerState.remainingSeconds += additionalSeconds;
    }
    
    room.timeLeft = room.timerState.remainingSeconds;
    room.timerState.lastUpdated = new Date();
    
    // Update database
    try {
      const Exam = require('../models/Exam');
      await Exam.findByIdAndUpdate(data.examId, {
        'timerState.remainingSeconds': room.timerState.remainingSeconds,
        'timerState.totalDuration': room.timerState.totalDuration,
        'timerState.lastUpdated': new Date()
      });
    } catch (error) {
      console.error('Error updating timer in DB:', error);
    }
    
    // Broadcast new time
    io.to(data.roomId).emit('exam-time-update', {
      roomId: data.roomId,
      timeLeft: room.timeLeft,
      isTimerRunning: room.isTimerRunning,
      timestamp: Date.now(),
      teacherName: 'Teacher',
      message: `Added ${Math.floor(additionalSeconds/60)} minutes`
    });
  }
});


socket.on('student-violation', (data) => {
  console.log('🚨 Student violation detected:', data);
  
  const { studentSocketId, violationType, severity, examId } = data;
  
  // Get student info
  const studentInfo = connectedClients.get(studentSocketId);
  const studentId = studentInfo?.userId || studentSocketId;
  
  // Get current attempts
  const currentAttempts = getStudentAttempts(studentId, examId);
  const newAttempts = currentAttempts.currentAttempts + 1;
  const attemptsLeft = Math.max(0, currentAttempts.maxAttempts - newAttempts);
  
  const updatedAttempts = {
    ...currentAttempts,
    currentAttempts: newAttempts,
    attemptsLeft: attemptsLeft,
    history: [
      ...currentAttempts.history,
      {
        timestamp: new Date().toISOString(),
        violationType: violationType,
        severity: severity,
        attemptsUsed: newAttempts,
        attemptsLeft: attemptsLeft
      }
    ].slice(-10)
  };
  
  saveStudentAttempts(studentId, examId, updatedAttempts);
  
  // Send to room
  const roomId = `exam-${examId}`;
  io.to(roomId).emit('student-violation', {
    ...data,
    studentId: studentId,
    currentAttempts: newAttempts,
    attemptsLeft: attemptsLeft
  });
  
  // Auto-disconnect if attempts exhausted
  if (attemptsLeft <= 0) {
    console.log(`🔌 Auto-disconnecting student ${studentSocketId}`);
    io.to(studentSocketId).emit('teacher-disconnect', {
      reason: 'Attempts exhausted',
      examId: examId
    });
  }
});

// Add this AFTER the student-violation handler
socket.on('request-attempts-sync', (data) => {
  const { studentId, examId, studentSocketId } = data;
  
  console.log(`🔄 Student requesting attempts sync:`, { studentId, examId, studentSocketId });
  
  const attempts = getStudentAttempts(studentId, examId);
  
  // Send attempts back to student
  socket.emit('attempts-sync-response', {
    studentId: studentId,
    examId: examId,
    attempts: attempts
  });
  
  // Also update teacher
  if (examId) {
    socket.to(`exam-${examId}`).emit('student-attempts-update', {
      studentSocketId: studentSocketId,
      studentId: studentId,
      attempts: attempts
    });
  }
});

  socket.on("delete-chat-message", async (data) => {
    try {
      const { messageId, classId } = data;
      
      // Find and soft delete the message
      const message = await ChatMessage.findById(messageId);
      if (message) {
        // Check if user has permission to delete (owner or teacher)
        if (message.userId.toString() === socket.userId || socket.userRole === 'teacher') {
          message.isDeleted = true;
          message.deletedAt = new Date();
          await message.save();

          // Broadcast deletion to all users in the class chat room
          io.to(`class-chat-${classId}`).emit("message-deleted", { messageId });
          
          console.log(`🗑️ Message ${messageId} deleted by ${socket.userName}`);
        } else {
          socket.emit("chat-error", { message: "Not authorized to delete this message" });
        }
      }
    } catch (error) {
      console.error('❌ Error deleting chat message:', error);
      socket.emit("chat-error", { message: "Failed to delete message" });
    }
  });

  socket.on("add-chat-reply", async (data) => {
    try {
      const { messageId, classId, replyMessage } = data;
      
      if (!replyMessage || !replyMessage.trim()) {
        socket.emit("chat-error", { message: "Reply cannot be empty" });
        return;
      }

      const parentMessage = await ChatMessage.findById(messageId);
      
      if (!parentMessage) {
        socket.emit("chat-error", { message: "Message not found" });
        return;
      }

      const replyData = {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        message: replyMessage.trim(),
        createdAt: new Date()
      };

      parentMessage.replies.push(replyData);
      await parentMessage.save();

      // Broadcast new reply to all users in the class chat room
      io.to(`class-chat-${classId}`).emit("reply-added", {
        messageId,
        reply: replyData
      });

      console.log(`💬 Reply added to message ${messageId} by ${socket.userName}`);
    } catch (error) {
      console.error('❌ Error adding chat reply:', error);
      socket.emit("chat-error", { message: "Failed to add reply" });
    }
  });

  // Handle typing indicators
  socket.on("typing-start", (data) => {
    socket.to(`class-chat-${data.classId}`).emit("user-typing", {
      userName: socket.userName,
      isTyping: true
    });
  });

  socket.on("typing-stop", (data) => {
    socket.to(`class-chat-${data.classId}`).emit("user-typing", {
      userName: socket.userName,
      isTyping: false
    });
  });

  // Leave class chat
  socket.on("leave-class-chat", ({ classId }) => {
    socket.leave(`class-chat-${classId}`);
    console.log(`💬 User ${socket.userName} left class chat: ${classId}`);
  });

  

  // ===== EXAM START/END HANDLERS =====
  socket.on('exam-started', (data) => {
    console.log('📢 Teacher started exam, broadcasting to room:', data.roomId);
    // Broadcast to all students in the room
    socket.to(data.roomId).emit('exam-started', data);
    
    // Also log who's in the room
    const room = examRooms.get(data.roomId);
    if (room) {
      console.log(`👥 Room ${data.roomId} has ${room.students.size} students`);
    }
  });

  // ✅ ADDED: Exam deployed event handler
  socket.on('exam-deployed', (data) => {
    console.log('📢 Teacher deployed exam, broadcasting to room:', data.roomId);
    // Broadcast to all students in the room
    socket.to(data.roomId).emit('exam-deployed', data);
    
    // Also log who's in the room
    const room = examRooms.get(data.roomId);
    if (room) {
      console.log(`👥 Room ${data.roomId} has ${room.students.size} students`);
    }
  });

 // ===== EXAM END HANDLER =====
// ✅ ADD EXAM ENDED HANDLER
socket.on('exam-ended', (data) => {
  console.log('🛑 Teacher ending exam:', data);
  
  const { roomId, examId } = data;
  
  // ✅ MARK EXAM AS ENDED
  endedExams.add(roomId);
  
  // ✅ BROADCAST TO ALL STUDENTS
  io.to(roomId).emit('exam-ended', {
    ...data,
    forcedExit: true
  });
  
  // ✅ DISCONNECT ALL STUDENTS
  const room = examRooms.get(roomId);
  if (room) {
    room.students.forEach((studentInfo, studentSocketId) => {
      const studentSocket = io.sockets.sockets.get(studentSocketId);
      if (studentSocket) {
        studentSocket.emit('force-exit-exam', {
          reason: 'Exam session has been ended by teacher',
          examId: examId,
          timestamp: new Date().toISOString()
        });
        
        // Kick student from room
        studentSocket.leave(roomId);
        console.log(`🔌 Kicked student ${studentSocketId} from room ${roomId}`);
      }
    });
    
    // Clear room data
    room.students.clear();
    room.examStarted = false;
    room.isTimerRunning = false;
  }
  
  console.log(`✅ Exam ${examId} marked as ended. Students cannot rejoin.`);
});

// ✅ ADD LIVE-CLASS-ENDED HANDLER
socket.on('live-class-ended', (data) => {
  console.log('🛑 Live class ended by teacher:', data);
  
  const { examId, classId, endedAt } = data;
  const roomId = `exam-${examId}`;
  
  // Mark as ended
  endedExams.add(roomId);
  
  // Broadcast to all in class (not just exam room)
  io.to(`class-${classId}`).emit('live-class-ended', {
    examId: examId,
    classId: classId,
    endedAt: endedAt || new Date().toISOString(),
    message: 'Live class has ended'
  });
  
  console.log(`✅ Live class ${examId} ended in class ${classId}`);
});


// ===== FORCE DISCONNECT HANDLER =====
socket.on('force-disconnect-student', (data) => {
  console.log(`🔌 Teacher force-disconnecting student:`, data);
  
  const { studentSocketId, reason, examId } = data;
  
  const studentSocket = io.sockets.sockets.get(studentSocketId);
  if (studentSocket) {
    // Send forced exit message
    studentSocket.emit('force-exit-exam', {
      reason: reason,
      examId: examId,
      forced: true,
      timestamp: new Date().toISOString()
    });
    
    // Remove from room
    const roomId = `exam-${examId}`;
    studentSocket.leave(roomId);
    
    // Update room state
    if (examRooms.has(roomId)) {
      const room = examRooms.get(roomId);
      room.students.delete(studentSocketId);
    }
    
    console.log(`✅ Force-disconnected student ${studentSocketId}`);
  }
});

// ===== EXAM STATUS CHECK =====
socket.on('check-exam-status', (data) => {
  const { examId, studentId } = data;
  const roomId = `exam-${examId}`;
  
  const status = {
    examId: examId,
    roomId: roomId,
    isActive: examRooms.has(roomId) && examRooms.get(roomId).examStarted,
    isEnded: isExamEnded(examId) || endedExams.has(roomId),
    canJoin: false,
    message: ''
  };
  
  if (status.isEnded) {
    status.message = 'This exam session has ended.';
    status.canJoin = false;
  } else if (status.isActive) {
    status.message = 'Exam is active. You can join.';
    status.canJoin = true;
  } else {
    status.message = 'Exam has not started yet.';
    status.canJoin = false;
  }
  
  socket.emit('exam-status-response', status);
  console.log(`📊 Exam status for ${examId}:`, status);
});

  // Handle teacher manually disconnecting students
  socket.on('disconnect-student', (data) => {
    console.log(`🔌 Teacher disconnecting student: ${data.studentSocketId} - Reason: ${data.reason}`);
    
    // Send disconnect command to student
    socket.to(data.studentSocketId).emit('teacher-disconnect', {
      reason: data.reason,
      examId: data.examId
    });
    
    // Remove student from room
    const room = examRooms.get(`exam-${data.examId}`);
    if (room && room.students.has(data.studentSocketId)) {
      room.students.delete(data.studentSocketId);
    }
  });

  // ===== DETECTION SETTINGS HANDLER =====
  socket.on('update-detection-settings', (data) => {
    console.log('🎯 Teacher updating detection settings for student:', data.studentSocketId);
    
    // Send to specific student
    socket.to(data.studentSocketId).emit('detection-settings-update', {
      settings: data.settings,
      customMessage: data.customMessage,
      examId: data.examId
    });
    
    console.log(`Settings updated for student ${data.studentSocketId}:`, data.settings);
  });

socket.on("join-exam-room", async ({ roomId, userName, userId, userRole }) => {
  try {
    const examId = roomId.replace('exam-', '');
    
    console.log(`🚪 User ${userName} (${userRole}) attempting to join room: ${roomId}, Exam ID: ${examId}`);
    
    // ✅ CHECK IF EXAM HAS ENDED
    if (isExamEnded(examId) || endedExams.has(roomId)) {
      console.log(`❌ Blocked ${userName} from joining ended exam: ${roomId}`);
      socket.emit('exam-unavailable', {
        message: 'This exam session has ended',
        examId: examId,
        endedAt: new Date().toISOString()
      });
      return;
    }
    
    // ✅ CHECK EXAM TYPE AND REQUIREMENTS (FOR STUDENTS)
    if (userRole === 'student') {
      try {
        const Exam = require('./models/Exam');
        const exam = await Exam.findById(examId);
        
        if (exam) {
          const examType = exam.examType || 'asynchronous'; // Default to async
          
          console.log(`📊 Exam details for ${examId}:`, {
            examType: examType,
            title: exam.title,
            requiresCamera: exam.requiresCamera || true,
            requiresMicrophone: exam.requiresMicrophone || true
          });
          
          // ✅ FOR ASYNC EXAMS: ENFORCE STRICT ENTRY REQUIREMENTS
          if (examType === 'asynchronous') {
            console.log(`🔒 Async exam detected - enforcing strict entry for ${userName}`);
            
            // Emit strict requirements check to student
            socket.emit('async-exam-requirements', {
              examId: examId,
              examType: examType,
              requiresCamera: exam.requiresCamera || false,
              requiresMicrophone: exam.requiresMicrophone || false,
              title: exam.title,
              message: 'This asynchronous exam requires continuous monitoring. You must enable camera and microphone access to enter.',
              strictMode: true
            });
            
            // Don't immediately join the room - wait for student to confirm permissions
            // The student will need to emit 'async-exam-ready' after verifying permissions
            return; // Stop here, wait for student to confirm
          }
          
          // ✅ FOR LIVE CLASS EXAMS: Continue with normal flow
          console.log(`🎥 Live class exam - allowing ${userName} to join normally`);
        }
      } catch (dbError) {
        console.error('❌ Error fetching exam details:', dbError);
        // Continue with normal flow if DB error
      }
    }
    // Sa iyong server (backend) - DAGDAGAN ang socket handlers:

// When student is ready for exam
socket.on('student-ready-for-exam', async (data) => {
  const { examId, studentId, studentSocketId, permissionsGranted } = data;
  
  console.log(`👨‍🎓 Student ${studentId} ready for exam ${examId}`);
  
  // Add student to waiting room
  const waitingRoomKey = `waiting-room:${examId}`;
  await redisClient.sAdd(waitingRoomKey, studentSocketId);
  
  // Notify teacher
  const teacherSocketId = await getTeacherSocketId(examId);
  if (teacherSocketId) {
    io.to(teacherSocketId).emit('student-waiting', {
      examId,
      studentId,
      studentSocketId,
      permissionsGranted,
      timestamp: new Date().toISOString()
    });
  }
  
  // Notify all students in waiting room
  const waitingCount = await redisClient.sCard(waitingRoomKey);
  io.to(`exam-${examId}`).emit('waiting-room-update', {
    examId,
    waitingCount,
    status: 'waiting'
  });
});

// When teacher approves student
socket.on('teacher-approve-student', async (data) => {
  const { examId, studentSocketId } = data;
  
  // Remove from waiting room
  const waitingRoomKey = `waiting-room:${examId}`;
  await redisClient.sRem(waitingRoomKey, studentSocketId);
  
  // Notify student
  io.to(studentSocketId).emit('teacher-approve-exam-entry', {
    examId,
    approvedAt: new Date().toISOString()
  });
  
  // Update waiting room count
  const waitingCount = await redisClient.sCard(waitingRoomKey);
  io.to(`exam-${examId}`).emit('waiting-room-update', {
    examId,
    waitingCount,
    status: 'approved'
  });
});
    // ✅ PROCEED WITH NORMAL ROOM JOINING
    currentRoom = roomId;
    socket.join(roomId);
    
    // Store user role for chat
    socket.userRole = userRole;
    socket.examId = examId; // Store examId in socket
    
    // Initialize room if not exists
    if (!examRooms.has(roomId)) {
      examRooms.set(roomId, {
        teacher: null,
        students: new Map(),
        timeLeft: 0,
        isTimerRunning: false,
        examStarted: false,
        examType: 'asynchronous', // Default, will be updated
        // ✅ ADD PERSISTENT TIMER STATE
        timerState: {
          remainingSeconds: 0,
          totalDuration: 0,
          isRunning: false,
          startedAt: null,
          lastUpdated: new Date(),
          pausedAt: null
        }
      });
    }
    
    const room = examRooms.get(roomId);
    
    if (userRole === 'teacher') {
      room.teacher = socket.id;
      console.log(`👨‍🏫 Teacher ${userName} joined room ${roomId}`);
      
      // Teacher can update exam type if known
      try {
        const Exam = require('./models/Exam');
        const exam = await Exam.findById(examId);
        if (exam && exam.examType) {
          room.examType = exam.examType;
          console.log(`✅ Room ${roomId} exam type set to: ${exam.examType}`);
        }
      } catch (error) {
        console.error('Error updating room exam type:', error);
      }
      
    } else if (userRole === 'student') {
      // ✅ ADD STRICT PERMISSION FLAG FOR ASYNC EXAMS
      const studentData = {
        studentId: userId || socket.userId,
        studentName: userName || socket.userName,
        socketId: socket.id,
        joinedAt: new Date(),
        cameraEnabled: false,
        permissionsVerified: false, // Will be true after async-exam-ready
        examType: room.examType || 'asynchronous'
      };
      
      room.students.set(socket.id, studentData);
      console.log(`👨‍🎓 Student ${userName} joined room ${roomId}`, {
        examType: room.examType,
        permissionsVerified: studentData.permissionsVerified
      });
      
      // ✅ IMMEDIATELY SEND CURRENT TIMER TO NEW STUDENT
      setTimeout(() => {
        socket.emit('send-current-time', {
          studentSocketId: socket.id,
          timeLeft: room.timeLeft || 3600,
          isTimerRunning: room.isTimerRunning || false,
          examStarted: room.examStarted || false,
          roomId: roomId,
          examId: examId
        });
        
        console.log(`🕒 Sent timer to new student ${socket.id}:`, {
          time: room.timeLeft,
          running: room.isTimerRunning,
          examType: room.examType
        });
      }, 500);
      
      // Request current time from teacher
      setTimeout(() => {
        if (room.teacher) {
          socket.emit('student-time-request', {
            studentSocketId: socket.id,
            roomId: roomId,
            examId: examId
          });
        }
      }, 1500);
      
      // Notify teacher about student joining
      if (room.teacher) {
        socket.to(room.teacher).emit("student-joined", {
          studentId: userId || socket.userId,
          studentName: userName || socket.userName,
          socketId: socket.id,
          joinedAt: new Date(),
          examType: room.examType,
          permissionsVerified: studentData.permissionsVerified
        });
      }
    }
    
    // Send current room state to the new user
    const participants = {
      teacher: room.teacher,
      students: Array.from(room.students.values()),
      examType: room.examType,
      examStarted: room.examStarted
    };
    
    socket.emit("room-participants", participants);
    
    console.log(`✅ ${userName} successfully joined ${roomId}`, {
      totalStudents: room.students.size,
      examType: room.examType
    });

  } catch (error) {
    console.error('❌ Error joining room:', error);
    socket.emit("room-join-error", { 
      message: "Failed to join exam room",
      error: error.message 
    });
  }
});

// ✅ ADD NEW HANDLER FOR ASYNC EXAM PERMISSION VERIFICATION
socket.on('async-exam-ready', async (data) => {
  try {
    const { examId, permissionsGranted, studentSocketId } = data;
    const roomId = `exam-${examId}`;
    
    console.log(`🔐 Student ${studentSocketId} reporting async exam readiness:`, {
      examId: examId,
      permissionsGranted: permissionsGranted,
      roomId: roomId
    });
    
    if (!examRooms.has(roomId)) {
      console.error(`❌ Room ${roomId} not found for async-exam-ready`);
      socket.emit('async-exam-error', {
        message: 'Exam room not found'
      });
      return;
    }
    
    const room = examRooms.get(roomId);
    
    if (!room.students.has(studentSocketId || socket.id)) {
      console.error(`❌ Student ${studentSocketId || socket.id} not found in room ${roomId}`);
      socket.emit('async-exam-error', {
        message: 'Student not registered in room'
      });
      return;
    }
    
    const studentId = studentSocketId || socket.id;
    const studentData = room.students.get(studentId);
    
    if (!permissionsGranted) {
      console.log(`❌ Student ${studentData.studentName} failed permissions check`);
      
      socket.emit('async-exam-rejected', {
        message: 'Camera and microphone permissions are REQUIRED for this asynchronous exam.',
        requiresRetry: true
      });
      
      // Remove student from room if permissions not granted
      room.students.delete(studentId);
      socket.leave(roomId);
      
      return;
    }
    
    // ✅ PERMISSIONS GRANTED - ALLOW ENTRY
    studentData.permissionsVerified = true;
    studentData.permissionsVerifiedAt = new Date();
    
    console.log(`✅ Student ${studentData.studentName} verified permissions for async exam`);
    
    // Now actually join the room
    socket.join(roomId);
    
    // Send success confirmation
    socket.emit('async-exam-accepted', {
      message: 'Permissions verified. Entering exam...',
      examId: examId,
      examType: 'asynchronous',
      requiresCamera: true,
      requiresMicrophone: true,
      strictMode: true
    });
    
    // Notify teacher
    if (room.teacher) {
      socket.to(room.teacher).emit('student-permissions-verified', {
        studentId: studentData.studentId,
        studentName: studentData.studentName,
        socketId: studentId,
        examId: examId,
        verifiedAt: studentData.permissionsVerifiedAt,
        examType: 'asynchronous'
      });
    }
    
    // Send timer info
    setTimeout(() => {
      socket.emit('send-current-time', {
        studentSocketId: studentId,
        timeLeft: room.timeLeft || 3600,
        isTimerRunning: room.isTimerRunning || false,
        examStarted: room.examStarted || false,
        roomId: roomId,
        examId: examId,
        examType: 'asynchronous'
      });
    }, 500);
    
  } catch (error) {
    console.error('❌ Error in async-exam-ready:', error);
    socket.emit('async-exam-error', {
      message: 'Failed to verify permissions'
    });
  }
});

// ✅ ADD HANDLER FOR STUDENT PERMISSION STATUS UPDATES
socket.on('student-permission-status', (data) => {
  const { examId, cameraActive, microphoneActive, studentSocketId } = data;
  const roomId = `exam-${examId}`;
  
  if (examRooms.has(roomId)) {
    const room = examRooms.get(roomId);
    const studentId = studentSocketId || socket.id;
    
    if (room.students.has(studentId)) {
      const student = room.students.get(studentId);
      student.cameraActive = cameraActive;
      student.microphoneActive = microphoneActive;
      student.lastPermissionUpdate = new Date();
      
      console.log(`📊 Student ${student.studentName} permission update:`, {
        camera: cameraActive,
        microphone: microphoneActive
      });
      
      // Notify teacher if monitoring is interrupted
      if (room.teacher && (!cameraActive || !microphoneActive)) {
        socket.to(room.teacher).emit('student-monitoring-interrupted', {
          studentSocketId: studentId,
          studentName: student.studentName,
          cameraActive: cameraActive,
          microphoneActive: microphoneActive,
          timestamp: new Date().toISOString(),
          examId: examId
        });
      }
    }
  }
});

// ✅ HANDLE STUDENT PERMISSION VIOLATIONS DURING EXAM
socket.on('student-permission-violation', (data) => {
  const { examId, violationType, studentSocketId, details } = data;
  const roomId = `exam-${examId}`;
  
  console.log(`🚨 Student permission violation in ${roomId}:`, {
    studentSocketId: studentSocketId,
    violationType: violationType,
    details: details
  });
  
  if (examRooms.has(roomId)) {
    const room = examRooms.get(roomId);
    
    // Notify teacher
    if (room.teacher) {
      socket.to(room.teacher).emit('student-violation-detected', {
        studentSocketId: studentSocketId,
        studentName: room.students.get(studentSocketId)?.studentName || 'Unknown',
        violationType: violationType,
        details: details,
        timestamp: new Date().toISOString(),
        examId: examId,
        examType: room.examType,
        severity: 'high'
      });
    }
    
    // Auto-disconnect for severe violations in async exams
    if (room.examType === 'asynchronous' && 
        (violationType === 'camera_disabled' || violationType === 'microphone_disabled')) {
      
      console.log(`🔌 Auto-disconnecting student ${studentSocketId} for permission violation in async exam`);
      
      // Give warning first
      socket.to(studentSocketId).emit('permission-violation-warning', {
        message: `⚠️ ${violationType === 'camera_disabled' ? 'Camera' : 'Microphone'} disabled in strict async exam!`,
        warning: 'Re-enable within 10 seconds or will be disconnected.',
        countdown: 10,
        examId: examId
      });
      
      // Auto-disconnect after warning
      setTimeout(() => {
        if (examRooms.has(roomId)) {
          const currentRoom = examRooms.get(roomId);
          if (currentRoom.students.has(studentSocketId)) {
            const student = currentRoom.students.get(studentSocketId);
            
            if ((violationType === 'camera_disabled' && !student.cameraActive) ||
                (violationType === 'microphone_disabled' && !student.microphoneActive)) {
              
              // Force disconnect
              socket.to(studentSocketId).emit('force-exit-exam', {
                reason: `Strict async exam violation: ${violationType}`,
                examId: examId,
                violation: violationType,
                timestamp: new Date().toISOString()
              });
              
              // Remove from room
              currentRoom.students.delete(studentSocketId);
              console.log(`✅ Auto-disconnected student ${studentSocketId} for permission violation`);
            }
          }
        }
      }, 10000);
    }
  }
});


  // Add a function to clear timer cache
const clearAllTimerCache = () => {
  // Clear localStorage
  localStorage.removeItem(`timer-${examId}`);
  
  // Clear state
  setTimeLeft(null);
  setIsTimerRunning(false);
  
  // Request fresh timer from teacher
  if (socketRef.current && socketRef.current.connected) {
    socketRef.current.emit('student-time-request', {
      studentSocketId: socketRef.current.id,
      roomId: `exam-${examId}`,
      examId: examId,
      forceRefresh: true
    });
  }
  
  console.log('🧹 Timer cache cleared, requesting fresh timer from teacher');
};


// Add this in server.js after the other socket handlers:
socket.on('set-exam-timer', (data) => {
  console.log('⏰ Teacher setting exam timer:', data);
  
  const { roomId, timeLeft } = data;
  
  if (examRooms.has(roomId)) {
    const room = examRooms.get(roomId);
    room.timeLeft = timeLeft;
    room.timerState.remainingSeconds = timeLeft;
    room.timerState.totalDuration = timeLeft;
    
    // Broadcast to all students
    io.to(roomId).emit('exam-time-update', {
      roomId: roomId,
      timeLeft: timeLeft,
      isTimerRunning: room.isTimerRunning,
      timestamp: Date.now(),
      teacherName: 'Teacher'
    });
    
    console.log(`✅ Timer set for room ${roomId}: ${timeLeft} seconds`);
  }
});
  // Sa server.js, idagdag ito sa socket handlers
socket.on('student-timer-sync', (data) => {
  console.log('🔄 Student timer sync:', {
    student: data.studentSocketId,
    timeLeft: data.timeLeft,
    isRunning: data.isTimerRunning,
    examId: data.examId
  });
  
  // Store in room for persistence
  const roomId = data.roomId || `exam-${data.examId}`;
  if (examRooms.has(roomId)) {
    const room = examRooms.get(roomId);
    if (room.students.has(data.studentSocketId)) {
      const student = room.students.get(data.studentSocketId);
      student.timerState = {
        timeLeft: data.timeLeft,
        isRunning: data.isTimerRunning,
        lastUpdated: new Date()
      };
      console.log(`💾 Timer saved for student ${data.studentSocketId}:`, student.timerState);
    }
  }
});

// Add in socket.io connection handler
socket.on('force-timer-sync', (data) => {
  console.log('🔄 Force timer sync requested:', data);
  
  // Update room state
  if (examRooms.has(data.roomId)) {
    const room = examRooms.get(data.roomId);
    room.timeLeft = data.timeLeft;
    room.isTimerRunning = data.isTimerRunning;
  }
  
  // Broadcast to all students with priority
  io.to(data.roomId).emit('exam-time-update', {
    roomId: data.roomId,
    timeLeft: data.timeLeft,
    isTimerRunning: data.isTimerRunning,
    timestamp: Date.now(),
    teacherName: 'Teacher',
    priority: 'high',
    forceUpdate: true
  });
});

socket.on('clear-student-timers', (data) => {
  io.to(data.roomId).emit('clear-timer-cache', {
    examId: data.examId
  });
});



  // ✅ FIXED: Request student camera (teacher to student)
  socket.on("request-student-camera", ({ studentSocketId, roomId }) => {
    const requestKey = `${studentSocketId}-${roomId}`;
    
    if (pendingCameraRequests.has(requestKey)) {
      console.log('⚠️ Duplicate camera request blocked:', requestKey);
      return;
    }
    
    pendingCameraRequests.add(requestKey);
    console.log('📹 Teacher requesting camera from student:', studentSocketId);
    
    socket.to(studentSocketId).emit("camera-request", {
      from: socket.id,
      roomId
    });
    
    // Remove from pending after 10 seconds
    setTimeout(() => {
      pendingCameraRequests.delete(requestKey);
    }, 10000);
  });

  // WebRTC Signaling Events
  socket.on("webrtc-offer", (data) => {
    console.log('📹 Forwarding WebRTC offer to:', data.target);
    socket.to(data.target).emit("webrtc-offer", {
      offer: data.offer,
      from: socket.id,
      userInfo: {
        userId: socket.userId,
        name: socket.userName
      }
    });
  });

  socket.on("webrtc-answer", (data) => {
    console.log('📹 Forwarding WebRTC answer to:', data.target);
    socket.to(data.target).emit("webrtc-answer", {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on("ice-candidate", (data) => {
    console.log('🧊 Forwarding ICE candidate to:', data.target);
    socket.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Student camera response
  socket.on("camera-response", (data) => {
    console.log('📹 Student camera response from:', socket.id, 'Enabled:', data.enabled);
    socket.to(data.teacherSocketId).emit("camera-response", {
      enabled: data.enabled,
      socketId: socket.id,
      studentId: socket.userId,
      studentName: socket.userName
    });

    // Update room state
    if (currentRoom && examRooms.has(currentRoom)) {
      const room = examRooms.get(currentRoom);
      if (room.students.has(socket.id)) {
        room.students.get(socket.id).cameraEnabled = data.enabled;
      }
    }
  });

  // Get room participants
  socket.on("get-room-participants", (roomId) => {
    if (examRooms.has(roomId)) {
      const room = examRooms.get(roomId);
      socket.emit("room-participants", {
        teacher: room.teacher,
        students: Array.from(room.students.values())
      });
    }
  });

  // Disconnect
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} - Reason: ${reason}`);
    
    // Leave all comment rooms
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('quiz-comments-')) {
        console.log(`📝 User automatically left comment room: ${room}`);
      }
    });
    
    if (currentRoom && examRooms.has(currentRoom)) {
      const room = examRooms.get(currentRoom);
      
      // Remove from room
      if (room.teacher === socket.id) {
        room.teacher = null;
        console.log(`👨‍🏫 Teacher left room ${currentRoom}`);
        // Notify all students that teacher left
        socket.to(currentRoom).emit("teacher-left");
      } else if (room.students.has(socket.id)) {
        const studentInfo = room.students.get(socket.id);
        room.students.delete(socket.id);
        console.log(`👨‍🎓 Student ${studentInfo.studentName} left room ${currentRoom}`);
        
        // Notify teacher that student left
        if (room.teacher) {
          socket.to(room.teacher).emit("student-left", {
            socketId: socket.id,
            studentId: studentInfo.studentId
          });
        }
      }

      // Clean up empty rooms
      if (!room.teacher && room.students.size === 0) {
        examRooms.delete(currentRoom);
        console.log(`🗑️ Room ${currentRoom} cleaned up`);
      }
    }
  });

  // Connection error handling
  socket.on("connect_error", (error) => {
    console.error('❌ Socket connection error:', error);
  });

  socket.on("error", (error) => {
    console.error('❌ Socket error:', error);
  });
});

// ===== EXPORT COMMENT FUNCTIONS FOR USE IN ROUTES =====
module.exports = {
  app,
  io,
  endedExams, // ✅ Export for use in routes
  examRooms,
  broadcastNewComment,
  broadcastDeletedComment,
  isExamEnded // ✅ Export the helper function
};

// ===== START SERVER =====
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ MongoDB connected");

    // ✅ FIXED: Changed from 3001 to 3000
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
      console.log(`✅ Socket.IO: ENABLED with room management`);
      console.log(`✅ REAL-TIME COMMENTS: ENABLED for quizzes`);
      console.log(`✅ CHAT SYSTEM: DISABLED (removed)`);
      console.log(`✅ CORS: Enabled for ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
      console.log(`✅ TIMER SYNC: Enabled for exam sessions`);
      console.log(`✅ DETECTION SETTINGS: Enabled for individual student control`);
      console.log(`✅ DEBUG: Routes available at /api/debug-routes`);
    });
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
};

// Function to cleanup old ended exams (run periodically)
const cleanupEndedExams = () => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  
  // Remove old ended exams from memory (optional - for memory management)
  endedExams.forEach((timestamp, examId) => {
    if (timestamp < oneHourAgo) {
      endedExams.delete(examId);
      console.log(`🧹 Cleaned up old ended exam: ${examId}`);
    }
  });
  
  // Also clean up examRooms for ended exams
  examRooms.forEach((room, roomId) => {
    if (endedExams.has(roomId) && room.students.size === 0) {
      examRooms.delete(roomId);
      console.log(`🧹 Cleaned up empty ended exam room: ${roomId}`);
    }
  });
};

// Run cleanup every hour
setInterval(cleanupEndedExams, 60 * 60 * 1000);

startServer();