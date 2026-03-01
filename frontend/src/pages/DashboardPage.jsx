import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    BookOpenIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusCircleIcon,
    QuestionMarkCircleIcon,
    DocumentTextIcon // 1. Added DocumentTextIcon for Summaries
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
    DocumentTextIcon, // 2. Added to map
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

    if (isLoading) return <div className="text-white text-center p-10 text-xl">Loading...</div>;
    if (error) return <div className="text-red-400 text-center p-10 text-xl">{error}</div>;

    return (
        <div className={`max-w-7xl mx-auto transition-all duration-300 ${isSidebarOpen ? 'px-4' : 'px-6'}`}>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Welcome Back, {userName}!
                </h1>
                <p className="text-lg text-slate-300 font-light">Here's your learning snapshot.</p>
            </motion.div>

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8`}>
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, i) => <StatCard key={i} stat={stat} index={i} />)}
                    </div>
                    <PerformanceChart data={performance} />
                </div>
                <div className="lg:col-span-1">
                    <RecentActivityList activities={recentActivity} />
                </div>
            </div>

            {/* Quick Actions Footer */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-white">Ready To Learn</h3>
                <div className="flex flex-wrap gap-4">
                    <button className="px-5 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors flex items-center gap-2" onClick={() => navigate('/summary')}>
                        <DocumentTextIcon className="h-5 w-5 text-cyan-400" /><span> Summarize PDF</span>
                    </button>
                    <button className="px-5 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors flex items-center gap-2" onClick={() => navigate('/flashcards')}>
                        <BookOpenIcon className="h-5 w-5 text-pink-400" /><span> FlashCards</span>
                    </button>
                    <button className="px-5 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors flex items-center gap-2" onClick={() => navigate('/qa')}>
                        <QuestionMarkCircleIcon className="h-5 w-5 text-purple-400" /><span> Q&A Sets</span>
                    </button>
                    <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:opacity-90 transition-opacity flex items-center gap-2" onClick={() => navigate('/quiz')}>
                        <PlusCircleIcon className="h-6 w-6" /><span>New Quiz</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// --- Sub-Components ---

const StatCard = ({ stat, index }) => {
    // 3. Added 'orange' for the Summaries color theme
    const colors = { 
        cyan: 'from-cyan-500/80 to-blue-500/80', 
        green: 'from-green-500/80 to-emerald-500/80', 
        purple: 'from-purple-500/80 to-indigo-500/80', 
        pink: 'from-pink-500/80 to-rose-500/80',
        orange: 'from-orange-500/80 to-amber-500/80' 
    };
    const IconComponent = iconMap[stat.icon] || BookOpenIcon;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }} className="bg-white/5 p-5 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${colors[stat.color] || colors.cyan}`}></div>
            <IconComponent className="h-8 w-8 text-slate-300 mb-4" />
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.title}</p>
        </motion.div>
    );
};

const RecentActivityList = ({ activities }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-2xl h-full">
        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">Recent Activity</h3>
        <div className="space-y-4">
            {activities.map((activity, i) => (
                <div key={i} className="flex items-center gap-4 group">
                    {/* 4. Logic to handle different icons based on activity type */}
                    <div className={`flex-shrink-0 p-3 rounded-full ${
                        activity.type === 'quiz' ? 'bg-cyan-500/10' : 
                        activity.type === 'summary' ? 'bg-cyan-500/10' : 
                        activity.type === 'qa' ? 'bg-purple-500/10' :
                        'bg-pink-500/10'
                    }`}>
                        {activity.type === 'quiz' && <CheckCircleIcon className="h-6 w-6 text-cyan-400" />}
                        {activity.type === 'summary' && <DocumentTextIcon className="h-6 w-6 text-cyan-400" />}
                        {activity.type === 'qa' && <QuestionMarkCircleIcon className="h-6 w-6 text-purple-400" />}
                        {activity.type === 'flashcards' && <BookOpenIcon className="h-6 w-6 text-pink-400" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-white truncate">{activity.topic}</p>
                        <p className="text-sm text-slate-400">{activity.score}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                    </p>
                </div>
            ))}
        </div>
    </motion.div>
);

const PerformanceChart = ({ data }) => { /* ... existing chart logic ... */ };

export default DashboardPage;