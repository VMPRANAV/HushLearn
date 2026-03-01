const express = require('express');
const classroomController = require('../controllers/classroom.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

// Classroom Management
router.post('/create', protect, classroomController.createClassroomFromQuiz);
router.post('/join', protect, classroomController.joinClassroom);
router.get('/my-classrooms', protect, classroomController.getMyClassrooms); // ADD THIS
router.get('/:classroomId/leaderboard', protect, classroomController.getClassroomLeaderboard);

module.exports = router;