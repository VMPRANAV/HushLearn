const Classroom = require('../models/classroom.model');
const QuizService = require('../services/quiz.service');

// Generate random 6-character class code
const generateClassCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

exports.createClassroomFromQuiz = async (req, res) => {
  try {
    const { quizId, classroomName } = req.body;
    
    if (!classroomName || !quizId) {
      return res.status(400).json({ message: "Classroom name and quiz ID required" });
    }

    const classCode = generateClassCode();

    const newClassroom = new Classroom({
      name: classroomName,
      classCode,
      adminId: req.user.id,
      quizzes: [quizId],
      members: [req.user.id]
    });

    await newClassroom.save();
    res.status(201).json(newClassroom);
  } catch (error) {
    console.error('Error creating classroom:', error);
    res.status(500).json({ message: "Failed to create classroom" });
  }
};

// ADD THIS NEW FUNCTION
exports.getMyClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      $or: [
        { adminId: req.user.id },
        { members: req.user.id }
      ]
    }).populate('quizzes');

    res.status(200).json(classrooms);
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    res.status(500).json({ message: "Failed to fetch classrooms" });
  }
};

exports.joinClassroom = async (req, res) => {
  try {
    const { classCode } = req.body;
    
    if (!classCode) {
      return res.status(400).json({ message: "Class code is required" });
    }

    const classroom = await Classroom.findOne({ classCode: classCode.toUpperCase() })
      .populate('quizzes');

    if (!classroom) {
      return res.status(404).json({ message: "Invalid Class Code" });
    }

    // Add user to members if not already there
    if (!classroom.members.includes(req.user.id)) {
      classroom.members.push(req.user.id);
      await classroom.save();
    }

    res.status(200).json(classroom);
  } catch (error) {
    console.error('Error joining classroom:', error);
    res.status(500).json({ message: "Failed to join classroom" });
  }
};

exports.getClassroomLeaderboard = async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    const leaderboard = await QuizService.getClassroomLeaderboard(classroomId);
    
    // Format the response
    const formattedLeaderboard = leaderboard.map(entry => ({
      userId: entry._id,
      userName: entry.userDetails[0]?.username || 'Unknown',
      score: entry.totalScore,
      attempts: entry.attempts
    }));

    res.status(200).json(formattedLeaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};