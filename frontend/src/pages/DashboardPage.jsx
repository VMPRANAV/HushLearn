import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    BookOpenIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusCircleIcon,
    QuestionMarkCircleIcon,
    DocumentTextIcon
} from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// --- Icon Map ---
const iconMap = {
    BookOpenIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusCircleIcon,
    DocumentTextIcon,
    QuestionMarkCircleIcon
};

const DashboardPage = ({ isSidebarOpen }) => {
    const [userName, setUserName] = useState('');
    const [stats, setStats] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [performance, setPerformance] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const backend = import.meta.env.VITE_URL || 'http://localhost:3000';

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUserName(JSON.parse(storedUser).username || 'User');
            } catch (e) {
                setUserName('User');
            }
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            if (!token) {
                setError("Authentication required.");
                setIsLoading(false);
                return;
            }

            try {
                const headers = { 'Authorization': `Bearer ${token}` };

                const [statsRes, activityRes] = await Promise.all([
                    fetch(`${backend}/api/dashboard/stats`, { headers }),
                    fetch(`${backend}/api/dashboard/recent-activity`, { headers })
                ]);

                if (!statsRes.ok || !activityRes.ok) throw new Error('Fetch failed');

                const statsData = await statsRes.json();
                const activityData = await activityRes.json();

                setStats(statsData.stats || []);
                setPerformance(statsData.performance || []);
                setRecentActivity(activityData || []);

            } catch (err) {
                setError("Could not load dashboard data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [backend]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-400 text-xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mb-8 md:mb-12"
            >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Welcome Back, {userName}!
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-slate-300 font-light">
                    Here's your learning snapshot.
                </p>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 mb-8">
                {/* Left Column - Stats & Performance */}
                <div className="xl:col-span-2 space-y-6 md:space-y-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {stats.map((stat, i) => <StatCard key={i} stat={stat} index={i} />)}
                    </div>
                    
                    {/* Performance Chart */}
                    <PerformanceChart data={performance} />
                </div>

                {/* Right Column - Recent Activity */}
                <div className="xl:col-span-1">
                    <RecentActivityList activities={recentActivity} />
                </div>
            </div>

            {/* Quick Actions Footer */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-white/5 backdrop-blur-xl p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl"
            >
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
                    Ready To Learn?
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <button 
                        className="px-4 py-3 md:px-5 md:py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all hover:scale-105 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm md:text-base" 
                        onClick={() => navigate('/summary')}
                    >
                        <DocumentTextIcon className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />
                        <span className="text-xs sm:text-sm md:text-base">Summarize PDF</span>
                    </button>
                    
                    <button 
                        className="px-4 py-3 md:px-5 md:py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all hover:scale-105 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm md:text-base" 
                        onClick={() => navigate('/flashcards')}
                    >
                        <BookOpenIcon className="h-5 w-5 md:h-6 md:w-6 text-pink-400" />
                        <span className="text-xs sm:text-sm md:text-base">FlashCards</span>
                    </button>
                    
                    <button 
                        className="px-4 py-3 md:px-5 md:py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all hover:scale-105 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm md:text-base" 
                        onClick={() => navigate('/qa')}
                    >
                        <QuestionMarkCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                        <span className="text-xs sm:text-sm md:text-base">Q&A Sets</span>
                    </button>
                    
                    <button 
                        className="px-4 py-3 md:px-5 md:py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:opacity-90 transition-all hover:scale-105 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm md:text-base shadow-lg" 
                        onClick={() => navigate('/quiz')}
                    >
                        <PlusCircleIcon className="h-6 w-6 md:h-7 md:w-7" />
                        <span className="text-xs sm:text-sm md:text-base">New Quiz</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- Sub-Components ---

const StatCard = ({ stat, index }) => {
    const colors = { 
        cyan: 'from-cyan-500/80 to-blue-500/80', 
        green: 'from-green-500/80 to-emerald-500/80', 
        purple: 'from-purple-500/80 to-indigo-500/80', 
        pink: 'from-pink-500/80 to-rose-500/80',
        orange: 'from-orange-500/80 to-amber-500/80' 
    };
    const IconComponent = iconMap[stat.icon] || BookOpenIcon;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }} 
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 relative overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all cursor-pointer shadow-lg hover:shadow-xl"
        >
            <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${colors[stat.color] || colors.cyan}`}></div>
            <IconComponent className="h-7 w-7 md:h-8 md:w-8 text-slate-300 mb-3 md:mb-4" />
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs md:text-sm text-slate-400">{stat.title}</p>
        </motion.div>
    );
};

const RecentActivityList = ({ activities }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl h-full"
    >
        <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
            Recent Activity
        </h3>
        <div className="space-y-3 md:space-y-4 max-h-[500px] md:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {activities.length > 0 ? (
                activities.map((activity, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                        className="flex items-center gap-3 md:gap-4 group hover:bg-white/5 p-2 md:p-3 rounded-xl transition-all cursor-pointer"
                    >
                        <div className={`flex-shrink-0 p-2 md:p-3 rounded-full ${
                            activity.type === 'quiz' ? 'bg-cyan-500/10' : 
                            activity.type === 'summary' ? 'bg-cyan-500/10' : 
                            activity.type === 'qa' ? 'bg-purple-500/10' :
                            'bg-pink-500/10'
                        }`}>
                            {activity.type === 'quiz' && <CheckCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />}
                            {activity.type === 'summary' && <DocumentTextIcon className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />}
                            {activity.type === 'qa' && <QuestionMarkCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />}
                            {activity.type === 'flashcards' && <BookOpenIcon className="h-5 w-5 md:h-6 md:w-6 text-pink-400" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold text-white truncate text-sm md:text-base">{activity.topic}</p>
                            <p className="text-xs md:text-sm text-slate-400">{activity.score}</p>
                        </div>
                        <p className="text-xs text-slate-500 hidden sm:block">
                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                        </p>
                    </motion.div>
                ))
            ) : (
                <div className="text-center text-slate-400 py-8">
                    <p>No recent activity</p>
                </div>
            )}
        </div>
    </motion.div>
);

const PerformanceChart = ({ data }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white/5 backdrop-blur-xl p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl"
        >
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                Performance Overview
            </h3>
            {data && data.length > 0 ? (
                <div className="h-64 md:h-80 lg:h-96 flex items-end justify-around gap-2 md:gap-4">
                    {data.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${item.value}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="flex-1 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t-lg relative group hover:from-cyan-400 hover:to-purple-400 transition-all"
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                                {item.label}: {item.value}%
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="h-64 md:h-80 flex items-center justify-center text-slate-400">
                    <p>No performance data available</p>
                </div>
            )}
        </motion.div>
    );
};

export default DashboardPage;