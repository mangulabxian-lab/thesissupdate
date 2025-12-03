// models/ProctoringAlert.js
const mongoose = require('mongoose');

const proctoringAlertSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentSocketId: String,
  detectionType: {
    type: String,
    enum: [
      'audio_detection',
      'tab_switching',
      'suspicious_gesture',
      'screenshot_detection',
      'phone_usage',
      'multiple_people',
      'gaze_deviation',
      'no_face_detected',
      'python_detection',
      'unknown'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  confidence: Number,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedBy: String,
  acknowledgedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('ProctoringAlert', proctoringAlertSchema);