const express = require('express');
const multer = require('multer');
const quizController = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Quiz routes only
router.post('/upload', protect, upload.single('file'), quizController.processPdfForQuiz);
router.post('/generate', protect, quizController.generateQuiz);
router.get('/', protect, quizController.getQuizzes);
router.post('/:quizId/submit', protect, quizController.submitQuizAttempt);

module.exports = router;
