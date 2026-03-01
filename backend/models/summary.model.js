const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sourceFileId: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: [true, 'A topic/title is required for the summary.'],
    trim: true,
  },
  content: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Summary', summarySchema);