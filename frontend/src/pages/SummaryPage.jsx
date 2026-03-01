
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    DocumentTextIcon, 
    DocumentArrowUpIcon, 
    SparklesIcon, 
    CheckCircleIcon, 
    XCircleIcon,
    ArrowPathIcon,
    ChevronRightIcon, // Add this for the list
    BookOpenIcon
} from '@heroicons/react/24/solid';

const SummaryPage = ({ isSidebarOpen }) => {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [summary, setSummary] = useState(null);
    const [savedSummaries, setSavedSummaries] = useState([]); // New state for list
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);

    const backend = import.meta.env.VITE_URL || 'http://localhost:3000';

    // --- Fetch Saved Summaries ---
    const fetchSummaries = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${backend}/api/summaries`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSavedSummaries(data);
            }
        } catch (err) {
            console.error('Fetch summaries error:', err);
        }
    };

    useEffect(() => {
        fetchSummaries();
    }, [backend]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
            setFileName(file.name);
            setError(null);
        } else {
            setError("Please select a valid PDF file.");
        }
    };

    const handleGenerateSummary = async () => {
        if (!pdfFile) return setError("Please upload a PDF.");
        
        setIsLoading(true);
        setError(null);
        setProgress(30);

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', pdfFile);

            // 1. Upload & Embed
            const uploadRes = await fetch(`${backend}/api/summaries/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            if (!uploadRes.ok) throw new Error('Upload failed');
            const { fileId } = await uploadRes.json();
            setProgress(60);

            // 2. Summarize
            const genRes = await fetch(`${backend}/api/summaries/generate`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileId, topic: fileName }),
            });

            if (!genRes.ok) throw new Error('Summary generation failed');

            const data = await genRes.json();
            setSummary(data);
            setSavedSummaries(prev => [data, ...prev]); // Add new summary to list
            setProgress(100);
        } catch (err) {
            setError("Failed to generate summary. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen transition-all duration-300">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    AI PDF Summarizer
                </h1>
                <p className="text-xl text-slate-300 font-light">Transform long documents into concise, actionable insights.</p>
            </motion.div>

            <div className={`max-w-7xl mx-auto ${isSidebarOpen ? 'px-4' : 'px-6'}`}>
                <AnimatePresence mode="wait">
                    {!summary ? (
                        <motion.div 
                            key="generator"
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start"
                        >
                            {/* Left Panel: Upload */}
                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                                <label className={`group relative w-full border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all ${pdfFile ? 'border-cyan-400/50 bg-cyan-500/5' : 'border-white/20 hover:border-cyan-400/70'}`}>
                                    {pdfFile ? <CheckCircleIcon className="h-16 w-16 text-cyan-400 mb-4" /> : <DocumentArrowUpIcon className="h-16 w-16 text-slate-400 mb-4" />}
                                    <span className="text-white font-semibold">{fileName || 'Upload PDF for Summary'}</span>
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="application/pdf" />
                                </label>

                                <motion.button 
                                    onClick={handleGenerateSummary}
                                    disabled={isLoading || !pdfFile}
                                    className="w-full mt-8 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" /> : <SparklesIcon className="h-6 w-6" />}
                                    {isLoading ? "Summarizing..." : "Generate Summary"}
                                </motion.button>
                            </div>

                            {/* Right Panel: Saved Summaries List */}
                            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl min-h-[400px]">
                                <h3 className="text-2xl font-bold mb-8 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                                    Saved Summaries
                                </h3>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                    {savedSummaries.length > 0 ? savedSummaries.map((s, idx) => (
                                        <button 
                                            key={s._id} 
                                            onClick={() => setSummary(s)}
                                            className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <DocumentTextIcon className="h-6 w-6 text-cyan-400" />
                                                <div>
                                                    <p className="text-white font-medium truncate max-w-[200px]">{s.topic}</p>
                                                    <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <ChevronRightIcon className="h-5 w-5 text-slate-500 group-hover:text-cyan-400" />
                                        </button>
                                    )) : (
                                        <p className="text-slate-500 text-center py-10">No summaries yet.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* View Summary Panel */
                        <motion.div 
                            key="view"
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent flex items-center gap-2">
                                    <DocumentTextIcon className="h-7 w-7 text-cyan-400" /> {summary.topic}
                                </h2>
                                <button onClick={() => setSummary(null)} className="text-sm text-cyan-300 hover:text-cyan-100 font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                                    ← Back to List
                                </button>
                            </div>
                            <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap">
                                {summary.content}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SummaryPage;