const Summary = require('../models/summary.model');
const AiService = require('../services/ai.service');
const fs = require('fs').promises;

/**
 * @desc      Save a new PDF summary
 * @route     POST /api/summaries
 */
exports.createSummary = async (req, res) => {
  try {
    const { sourceFileId, topic, content } = req.body;

    const summary = await Summary.create({
      userId: req.user.id,
      sourceFileId,
      topic,
      content
    });

    res.status(201).json({ status: 'success', data: summary });
  } catch (error) {
    res.status(500).json({ message: 'Error saving summary' });
  }
};

/**
 * @desc      Upload and embed PDF
 * @route     POST /api/summaries/upload
 */
exports.uploadAndEmbedPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileId = req.file.filename;
    
    // Call AiService to embed the file immediately so retrieveContext works
    await AiService.extractAndStorePdf(req.file.path, req.user.id, fileId);
    
    // Clean up the uploaded file after processing
    await fs.unlink(req.file.path);
    
    res.json({ fileId });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up file on error
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Upload and embedding failed' });
  }
};

/**
 * @desc      Generate and save summary
 * @route     POST /api/summaries/generate
 */
exports.generateAndSaveSummary = async (req, res) => {
  try {
    const { fileId, topic } = req.body;
    const userId = req.user.id;

    if (!fileId) {
      return res.status(400).json({ message: 'fileId is required' });
    }

 
    const summaryText = await AiService.generateSummary(fileId);

 
    const summary = await Summary.create({
      userId,
      sourceFileId: fileId,
      topic: topic || 'PDF Summary',
      content: summaryText
    });

    res.status(201).json(summary);
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
};

/**
 * @desc      Get all summaries for the logged-in user
 * @route     GET /api/summaries
 */
exports.getUserSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.user.id }) //
      .sort({ createdAt: -1 }); // Newest first
    res.status(200).json(summaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summaries' });
  }
};