import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChartPieIcon,
    QueueListIcon,
    PuzzlePieceIcon,
    QuestionMarkCircleIcon,
    DocumentTextIcon,
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/solid';

const Sidebar = ({ isSidebarOpen, setSidebarOpen, user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: ChartPieIcon, path: '/dashboard' },
        { id: 'flashcards', label: 'Flashcards', icon: QueueListIcon, path: '/flashcards' },
        { id: 'quiz', label: 'Interactive Quiz', icon: PuzzlePieceIcon, path: '/quiz' },
        { id: 'qa', label: 'Question Answers', icon: QuestionMarkCircleIcon, path: '/qa' },
        { id: 'summary', label: 'PDF Summarizer', icon: DocumentTextIcon, path: '/summary' }
    ];

    const handleNavigation = (path) => {
        navigate(path);
        // Don't close sidebar on desktop, only on mobile
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    return (
        <>
            {/* Hamburger Button - Fixed Position, Always Visible */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="fixed top-4 left-4 z-[60] p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 shadow-lg hover:shadow-xl transition-all"
            >
                <AnimatePresence mode="wait">
                    {isSidebarOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 180, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <XMarkIcon className="h-6 w-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 180, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -180, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Bars3Icon className="h-6 w-6 text-white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Mobile Backdrop - Only show on mobile when open */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    x: isSidebarOpen ? 0 : '-100%',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed lg:sticky top-0 left-0 h-screen w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-white/10 z-50 flex flex-col shadow-2xl"
            >
                {/* Header - Add padding to avoid hamburger overlap */}
                <div className="pt-20 px-6 pb-6 border-b border-white/10">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    >
                       Study Buddy
                    </motion.h2>
                    <p className="text-sm text-slate-400 mt-1">AI-Powered Learning</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        
                        return (
                            <motion.button
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleNavigation(item.path)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                    transition-all duration-200 group
                                    ${isActive 
                                        ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30' 
                                        : 'hover:bg-white/5 border border-transparent'
                                    }
                                `}
                            >
                                <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}`} />
                                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                    {item.label}
                                </span>
                            </motion.button>
                        );
                    })}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-white/10 space-y-3">
                    {user && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate">{user.username || 'User'}</p>
                                <p className="text-xs text-slate-400 truncate">{user.email || ''}</p>
                            </div>
                        </div>
                    )}
                    
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors border border-red-500/20"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        <span className="text-sm font-medium">Logout</span>
                    </motion.button>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;