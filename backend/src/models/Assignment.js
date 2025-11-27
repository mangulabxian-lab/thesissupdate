// models/Assignment.js - UPDATED WITH COMPLETION TRACKING
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { 
    type: String, 
    enum: ["assignment", "quiz", "question", "material", "announcement", "topic"],
    required: true 
  },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Assignment-specific fields
  dueDate: { type: Date },
  points: { type: Number },
  
  // ✅ COMPLETION TRACKING FOR ASSIGNMENTS
  completedBy: [{
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    completedAt: { 
      type: Date, 
      default: Date.now 
    },
    submittedWork: String, // File URL or text submission
    grade: Number,
    feedback: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Quiz-specific fields
  questions: [{
    question: String,
    type: { type: String, enum: ["multiple_choice", "true_false", "short_answer"] },
    options: [String],
    correctAnswer: String,
    points: Number
  }],
  
  // Material-specific fields
  attachments: [{
    filename: String,
    url: String,
    fileType: String
  }],
  
  // Common fields
  topic: { type: String },
  isPublished: { type: Boolean, default: false },
  scheduledPost: { type: Date },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assignmentSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

// ✅ Method to check if student has completed the assignment
assignmentSchema.methods.hasStudentCompleted = function(studentId) {
  return this.completedBy.some(completion => 
    completion.studentId.toString() === studentId.toString()
  );
};

module.exports = mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema);