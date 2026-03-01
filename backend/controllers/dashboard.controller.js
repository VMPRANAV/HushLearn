const Quiz = require('../models/quiz.model');
const FlashcardSet = require('../models/flashcardSet.model');
const QuizAttempt = require('../models/quizAttempt.model');
const Summary = require('../models/summary.model'); // Ensure this import is correct

/**
 * @desc      Get all dashboard stats in one call
 * @route     GET /api/dashboard/stats
 * @access    Private
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch all counts and attempts in parallel
    const [
      flashcardSetCount,
      quizCount,
      attempts,
      summaryCount
    ] = await Promise.all([
      FlashcardSet.countDocuments({ userId }),
      Quiz.countDocuments({ userId }),
      QuizAttempt.find({ userId }).sort({ createdAt: -1 }),
      Summary.countDocuments({ userId }) // Correctly fetching summary count
    ]);

    // 2. Calculate average score for the performance chart
    const quizzesTaken = attempts.length;
    let totalScore = 0;
    let totalPossible = 0;
    
    attempts.forEach(attempt => {
      totalScore += attempt.score;
      totalPossible += attempt.totalQuestions;
    });
    const averageScore = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

    // 3. Format Stats (Matches the iconMap in your DashboardPage.jsx)
    const stats = [
      { title: "Quizzes Taken", value: quizzesTaken, icon: "CheckCircleIcon", color: "green" },
      { title: "Average Score", value: `${averageScore}%`, icon: "ChartBarIcon", color: "cyan" },
      { title: "Summaries", value: summaryCount, icon: "DocumentTextIcon", color: "orange" }, // New Stat Card
      { title: "Flashcard Sets", value: flashcardSetCount, icon: "BookOpenIcon", color: "pink" },
    ];
    
    // 4. Performance Chart (Last 5 attempts)
    const performance = attempts.slice(0, 5).reverse().map((attempt, index) => ({
        label: `Attempt ${attempts.length - (attempts.slice(0, 5).length - 1) + index}`,
        value: Math.round((attempt.score / attempt.totalQuestions) * 100)
    }));

    res.status(200).json({ stats, performance });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  }
};

/**
 * @desc      Get recent activity including Summaries
 * @route     GET /api/dashboard/recent-activity
 * @access    Private
 */
exports.getRecentActivity = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch latest 3 of each type
        const [recentQuizzes, recentSets, recentSummaries] = await Promise.all([
            Quiz.find({ userId }).sort({ createdAt: -1 }).limit(3),
            FlashcardSet.find({ userId }).sort({ createdAt: -1 }).limit(3),
            Summary.find({ userId }).sort({ createdAt: -1 }).limit(3) // Fetch recent summaries
        ]);

        const quizzes = recentQuizzes.map(q => ({
            id: q._id,
            type: 'quiz',
            topic: q.topic,
            score: `${q.questions.length} questions`,
            time: q.createdAt
        }));

        const flashcards = recentSets.map(s => ({
            id: s._id,
            type: 'flashcards',
            topic: s.topic,
            score: `${s.flashcards.length} cards`,
            time: s.createdAt
        }));

        const summaries = recentSummaries.map(sum => ({
            id: sum._id,
            type: 'summary', // Matches the logic in your DashboardPage.jsx
            topic: sum.topic,
            score: 'PDF Summary',
            time: sum.createdAt
        }));

        // Combine, sort by time, and take the top 3 overall
        const recentActivity = [...quizzes, ...flashcards, ...summaries]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 3);
            
        res.status(200).json(recentActivity);

    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ message: 'Failed to fetch recent activity.' });
    }
};