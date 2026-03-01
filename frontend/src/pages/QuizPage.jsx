import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DocumentArrowUpIcon, 
    BookOpenIcon,
    ChevronRightIcon,
    SparklesIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
    HomeIcon,
    UserGroupIcon, // Added for Classroom Mode
    TrophyIcon     // Added for Leaderboard
} from '@heroicons/react/24/solid';

// --- Reusable Progress Indicator Component ---
const ProgressIndicator = ({ progress, step }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="space-y-3 p-5 bg-black/20 rounded-2xl border border-white/10"
    >
        <div className="flex justify-between items-center mb-1">
            <p className="text-cyan-200 text-sm font-medium">{step}</p>
            <p className="font-mono text-sm text-slate-300">{progress}%</p>
        </div>
        <div className="relative w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
            <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            />
        </div>
    </motion.div>
);

// --- Sharing Utility for Community Flywheel ---
const shareToWhatsApp = (message) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};

const QuizPage = ({ isSidebarOpen }) => {
    // --- State Management ---
    const [prompt, setPrompt] = useState('Create a 5 question quiz on the key topics.');
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [savedQuizzes, setSavedQuizzes] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [quizResults, setQuizResults] = useState(null);
    
    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState('');
    const [error, setError] = useState(null);
    const [view, setView] = useState('generate'); // 'generate', 'take_quiz', 'results', 'leaderboard'

    // Classroom State
    const [activeClassroom, setActiveClassroom] = useState(null);
    const [classCodeInput, setClassCodeInput] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);

    // Authentication
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const backend = import.meta.env.VITE_URL || 'http://localhost:3000';
    const backendUrl = `${backend}/api/quizzes`;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const handleAuthError = (response) => {
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setError('Session expired. Please log in again.');
            setTimeout(() => window.location.reload(), 2000);
            return true;
        }
        return false;
    };

    // --- Data Fetching ---
    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const response = await fetch(backendUrl, { headers: getAuthHeaders() });
                if (handleAuthError(response)) return;
                const data = await response.json();
                setSavedQuizzes(data || []);
            } catch (err) {
                console.error('Error fetching quizzes:', err);
            }
        };

        if (isAuthenticated) fetchQuizzes();
    }, [isAuthenticated]);

    // --- Event Handlers ---
    const handleJoinClassroom = async () => {
        if (!classCodeInput) return;
        try {
            setIsLoading(true);
            const response = await fetch(`${backendUrl}/classroom/join`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ classCode: classCodeInput.toUpperCase() })
            });
            if (!response.ok) throw new Error("Invalid Class Code");
            const classroom = await response.json();
            setActiveClassroom(classroom);
            // Start the first quiz of the classroom
            if (classroom.quizzes && classroom.quizzes.length > 0) {
                handleStartQuiz(classroom.quizzes[0]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!prompt || !pdfFile) {
            setError("Please upload a PDF and provide instructions.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            setStep('Uploading PDF document...');
            setProgress(25);
            const formData = new FormData();
            formData.append('file', pdfFile);
            
            const uploadRes = await fetch(`${backendUrl}/upload`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: formData 
            });
            if (handleAuthError(uploadRes)) return;
            const { fileId } = await uploadRes.json();

            setStep('Generating quiz with AI...');
            setProgress(65);
            const genRes = await fetch(`${backendUrl}/generate`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ fileId, prompt }),
            });
            const newQuiz = await genRes.json();
            
            setStep('Quiz generated successfully!');
            setProgress(100);
            setTimeout(() => {
                setSavedQuizzes(prev => [newQuiz, ...prev]);
                handleStartQuiz(newQuiz);
                setProgress(0);
                setStep('');
            }, 1000);
        } catch (err) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartQuiz = (quiz) => {
        setCurrentQuiz(quiz);
        setQuizResults(null);
        setView('take_quiz');
    };

    const handleSubmitQuiz = async (answers) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${backendUrl}/${currentQuiz._id}/submit`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                    answers,
                    classroomId: activeClassroom ? activeClassroom._id : null 
                })
            });
            const resultsData = await response.json();
            setQuizResults(resultsData);

            if (activeClassroom) {
                const lbRes = await fetch(`${backendUrl}/classroom/${activeClassroom._id}/leaderboard`, {
                    headers: getAuthHeaders()
                });
                const lbData = await lbRes.json();
                setLeaderboard(lbData);
                setView('leaderboard');
            } else {
                setView('results');
            }
        } catch (err) {
            setError("Could not submit your quiz.");
        } finally {
            setIsLoading(false);
        }
    };

    const resetToGenerator = () => {
        setView('generate');
        setCurrentQuiz(null);
        setQuizResults(null);
        setActiveClassroom(null);
    };

    useEffect(() => {
        setIsAuthenticated(!!localStorage.getItem('token'));
        setIsCheckingAuth(false);
    }, []);

    if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Interactive Quiz Builder
                </h1>
            </motion.div>

            <div className={`max-w-7xl mx-auto ${isSidebarOpen ? 'px-4' : 'px-6'}`}>
                <AnimatePresence mode="wait">
                    {view === 'generate' && (
                        <motion.div key="generate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8">
                                    <input id="pdf-upload" type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                                        const file = e.target.files[0];
                                        setPdfFile(file);
                                        setFileName(file?.name || '');
                                    }} />
                                    <label htmlFor="pdf-upload" className="w-full border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer bg-white/5 hover:border-cyan-400 transition-all">
                                        <DocumentArrowUpIcon className="h-12 w-12 text-slate-400 mb-2" />
                                        <span className="text-white">{fileName || 'Upload PDF'}</span>
                                    </label>
                                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white min-h-[100px]" />
                                    <button onClick={handleGenerateQuiz} disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 p-4 rounded-xl font-bold">
                                        {isLoading ? 'Processing...' : 'Generate Quiz'}
                                    </button>
                                </div>

                                {/* Join Circle Panel */}
                                <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-cyan-500/30 shadow-2xl">
                                    <h3 className="text-xl font-bold mb-4 text-cyan-300 flex items-center gap-2">
                                        <UserGroupIcon className="h-6 w-6" /> Campus Community
                                    </h3>
                                    <div className="flex gap-2">
                                        <input value={classCodeInput} onChange={(e) => setClassCodeInput(e.target.value)} placeholder="ENTER CODE" className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" />
                                        <button onClick={handleJoinClassroom} className="bg-cyan-500 px-6 py-2 rounded-xl text-black font-bold">Join</button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                                <h3 className="text-2xl font-bold mb-8 text-white">Saved Quizzes</h3>
                                <SavedQuizzesList quizzes={savedQuizzes} onStart={handleStartQuiz} />
                            </div>
                        </motion.div>
                    )}

                    {view === 'take_quiz' && (
                        <Quizzer quiz={currentQuiz} onSubmit={handleSubmitQuiz} onBack={resetToGenerator} isLoading={isLoading} />
                    )}

                    {view === 'results' && (
                        <QuizResults results={quizResults} quiz={currentQuiz} onHome={resetToGenerator} />
                    )}

                    {view === 'leaderboard' && (
                        <Leaderboard classroom={activeClassroom} data={leaderboard} onBack={resetToGenerator} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Child Components ---

const Leaderboard = ({ classroom, data, onBack }) => (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
            <TrophyIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">{classroom?.name} Leaderboard</h2>
            <p className="text-cyan-400 font-mono mt-2">CODE: {classroom?.classCode}</p>
        </div>
        <div className="space-y-4">
            {data.map((entry, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-white font-bold">#{index + 1} {entry.userDetails[0]?.username}</span>
                    <span className="text-cyan-300 font-bold">{entry.totalScore} pts</span>
                </div>
            ))}
        </div>
        <button 
            onClick={() => shareToWhatsApp(`I'm competing in the ${classroom.name} on StudySnap! Use code ${classroom.classCode} to join the battle! ⚔️`)}
            className="w-full mt-6 bg-green-600 p-3 rounded-xl font-bold"
        >
            Invite Classmates
        </button>
        <button onClick={onBack} className="w-full mt-2 text-slate-400">Back to Home</button>
    </div>
);

const SavedQuizzesList = ({ quizzes, onStart }) => (
    <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {quizzes.map((quiz) => (
            <button key={quiz._id} onClick={() => onStart(quiz)} className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex justify-between">
                <span className="text-white truncate pr-4">{quiz.topic}</span>
                <ChevronRightIcon className="h-5 w-5 text-slate-500" />
            </button>
        ))}
    </div>
);

const Quizzer = ({ quiz, onSubmit, onBack, isLoading }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const currentQuestion = quiz.questions[currentIndex];

    return (
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">{quiz.topic}</h2>
            <div className="p-6 bg-black/20 rounded-xl mb-8">
                <p className="text-xl text-white">{currentQuestion.questionText}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {currentQuestion.options.map((option, index) => (
                    <button 
                        key={index} 
                        onClick={() => setSelectedAnswers({...selectedAnswers, [currentIndex]: index})}
                        className={`p-4 rounded-xl text-left border-2 ${selectedAnswers[currentIndex] === index ? 'border-cyan-400 bg-cyan-400/10' : 'border-transparent bg-white/5'}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            <div className="flex justify-between">
                <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="text-slate-400">Previous</button>
                {currentIndex === quiz.questions.length - 1 ? (
                    <button onClick={() => onSubmit(Object.entries(selectedAnswers).map(([q, a]) => ({ questionIndex: parseInt(q), selectedAnswerIndex: a })))} className="bg-cyan-500 px-8 py-2 rounded-xl text-black font-bold">
                        {isLoading ? 'Submitting...' : 'Finish'}
                    </button>
                ) : (
                    <button onClick={() => setCurrentIndex(currentIndex + 1)} className="bg-white/10 px-8 py-2 rounded-xl">Next</button>
                )}
            </div>
        </div>
    );
};

const QuizResults = ({ results, quiz, onHome }) => (
    <div className="bg-white/5 p-8 rounded-3xl max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Quiz Complete!</h2>
        <p className="text-6xl font-bold text-cyan-400 mb-4">{results.score} / {results.totalQuestions}</p>
        <button 
            onClick={() => shareToWhatsApp(`I just scored ${results.score}/${results.totalQuestions} on ${quiz.topic} using StudySnap! 🚀`)}
            className="bg-green-600 px-8 py-3 rounded-xl font-bold text-white mb-4 w-full"
        >
            Share Score to WhatsApp
        </button>
        <button onClick={onHome} className="text-slate-400 w-full">Back to Generator</button>
    </div>
);

export default QuizPage;