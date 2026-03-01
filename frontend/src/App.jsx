import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/SideBar';
import DashboardPage from './pages/DashboardPage';
import FlashcardPage from './pages/FlashcardPage';
import QuizPage from './pages/QuizPage';
import LandingPage from './pages/LandingPage';
import QAPage from './pages/QAPage';
import SummaryPage from './pages/SummaryPage';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children, isAuthenticated }) => {
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return children;
};

// Main Layout Component
const MainLayout = ({ children, isSidebarOpen, setSidebarOpen, user, onLogout }) => {
    return (
        <div className="flex min-h-screen bg-gray-900 text-white font-sans">
            <Sidebar 
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
                onLogout={onLogout}
            />
            
            <main className="flex-1 flex flex-col min-h-screen">
                <div className="flex-1 p-4 sm:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

const App = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
            try {
                const userData = JSON.parse(savedUser);
                setUser(userData);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing saved user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setIsCheckingAuth(false);
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${import.meta.env.VITE_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(err => console.log('Logout endpoint error:', err));
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            setSidebarOpen(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route 
                    path="/" 
                    element={
                        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage onLogin={handleLogin} />
                    } 
                />

                {/* Dashboard */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <MainLayout isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} user={user} onLogout={handleLogout}>
                                <DashboardPage isSidebarOpen={isSidebarOpen} user={user} />
                            </MainLayout>
                        </ProtectedRoute>
                    } 
                />

                {/* Quiz */}
                <Route 
                    path="/quiz" 
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <MainLayout isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} user={user} onLogout={handleLogout}>
                                <QuizPage isSidebarOpen={isSidebarOpen} user={user} />
                            </MainLayout>
                        </ProtectedRoute>
                    } 
                />

                {/* Flashcards */}
                <Route 
                    path="/flashcards" 
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <MainLayout isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} user={user} onLogout={handleLogout}>
                                <FlashcardPage isSidebarOpen={isSidebarOpen} user={user} />
                            </MainLayout>
                        </ProtectedRoute>
                    } 
                />

                {/* Q&A */}
                <Route
                    path ="/qa"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <MainLayout isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} user={user} onLogout={handleLogout}>
                                <QAPage isSidebarOpen={isSidebarOpen} user={user} />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                {/* PDF Summarizer */}
                <Route
                    path ="/summary"
                    element={
                        <ProtectedRoute isAuthenticated={isAuthenticated}>
                            <MainLayout isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} user={user} onLogout={handleLogout}>
                                <SummaryPage isSidebarOpen={isSidebarOpen} user={user} />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route 
                    path="*" 
                    element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} 
                />
            </Routes>
        </Router>
    );
};

export default App;