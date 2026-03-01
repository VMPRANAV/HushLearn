const express = require('express');
const router = express.Router();
const { 
  generateAndSaveSummary, 
  getUserSummaries,
  uploadAndEmbedPdf
} = require('../controllers/summary.controller');
const { protect } = require('../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(protect);

// Route to handle PDF upload first
router.post('/upload', upload.single('file'), uploadAndEmbedPdf);

// Route to generate summary from embedded file
router.post('/generate', generateAndSaveSummary);

router.get('/', getUserSummaries);

module.exports = router;