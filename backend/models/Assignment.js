const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  wordCount: {
    type: Number,
    required: true
  },
  universityName: {
    type: String,
    trim: true,
    default: ''
  },
  format: {
    type: String,
    enum: ['Essay', 'Report', 'Case Study', 'Technical'],
    required: true
  },
  studentName: {
    type: String,
    trim: true,
    default: ''
  },
  rollNumber: {
    type: String,
    trim: true,
    default: ''
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);