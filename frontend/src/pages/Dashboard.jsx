import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Play,
    RefreshCw,
    Settings,
    Camera,
    Cpu,
    Zap,
    Users,
    Clock,
    TrendingUp,
    Brain,
    MapPin,
    AlertCircle,
    Sun,
    Moon,
    Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import MapComponent from '../components/MapComponent';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [junctions, setJunctions] = useState([]);
    const [selectedJunction, setSelectedJunction] = useState(null);
    const [advisory, setAdvisory] = useState(null);
    const [stats, setStats] = useState(null);
    const [isConnected, setIsConnected] = useState(true);
    const [mockPosition, setMockPosition] = useState({ lat: 28.6140, lng: 77.2185 });
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains('dark') ||
            window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const iconMap = {
        Users, Clock, TrendingUp, Brain, MapPin
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchJunctions = async () => {
            try {
                const res = await axios.get('/api/junctions');
                setJunctions(res.data);
                if (res.data.length > 0) setSelectedJunction(res.data[0]);
            } catch (err) {
                console.error("Error fetching junctions", err);
                setIsConnected(false);
            }
        };
        fetchJunctions();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/stats');
                setStats(res.data);
                setIsConnected(true);
            } catch (err) {
                console.error("Error fetching stats", err);
                setIsConnected(false);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!selectedJunction) return;

        const interval = setInterval(async () => {
            try {
                setMockPosition(prev => {
                    const newLat = prev.lat + (selectedJunction.lat - prev.lat) * 0.05;
                    const newLng = prev.lng + (selectedJunction.lng - prev.lng) * 0.05;
                    return { lat: newLat, lng: newLng };
                });

                const res = await axios.post('/api/advisory', {
                    junctionId: selectedJunction.id,
                    lat: mockPosition.lat,
                    lng: mockPosition.lng,
                    timestamp: Date.now() / 1000
                });
                setAdvisory(res.data);
            } catch (err) {
                console.error("Error fetching advisory", err);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, [selectedJunction, mockPosition]);

    const statusMap = {
        'online': 'status-online',
        'active': 'status-active',
        'operational': 'status-operational',
        'monitoring': 'status-monitoring'
    };

    const iconStatusMap = {
        'Cameras': Camera,
        'AI System': Cpu,
        'Traffic Lights': Zap
    };

    const trafficMetrics = stats?.trafficStats || [
        { label: 'Wait Time Reduction', value: '24.8%', change: '+4.2%', icon: 'Clock' },
        { label: 'AI Signal Accuracy', value: '98.2%', change: '+1.5%', icon: 'Brain' },
        { label: 'Vehicle Throughput', value: '1,482', change: '+8.1%', icon: 'Users' },
        { label: 'Fuel Saved (Pilot)', value: '185L', change: '+12.3%', icon: 'TrendingUp' },
    ];

    const systemStatus = stats?.systemStatus || [
        { label: 'Signal Controller', status: 'online' },
        { label: 'AI Engine', status: 'active' },
        { label: 'GIS Mapping', status: 'operational' },
    ];

    const renderContent = () => {
        if (activeTab === 'dashboard') {
            return (
                <>
                    {/* Header Section */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="GOI" className="h-8 dark:invert opacity-80" />
                                <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">GLOSA Control Center</h1>
                            </div>
                            <p className="text-[var(--text-secondary)] font-bold text-sm uppercase tracking-wider">National Smart Mobility Framework • New Delhi Pilot</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right mr-4 hidden lg:block">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">{currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-xl font-black text-navy dark:text-blue-400">{currentTime.toLocaleTimeString([], { hour12: true })}</p>
                            </div>
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>
                            <button className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg active:translate-y-0.5">
                                <Wifi className="h-4 w-4" /> Live Sync
                            </button>
                        </div>
                    </header>

                    {/* Core System Status */}
                    <section className="mb-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {systemStatus.map((item, idx) => {
                                const Icon = iconStatusMap[item.label] || Zap;
                                return (
                                    <div key={idx} className="gov-card flex items-center justify-between py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-slate-50 dark:bg-white/5 p-2 rounded-lg">
                                                <Icon className="h-5 w-5 text-navy dark:text-blue-400" />
                                            </div>
                                            <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{item.label}</span>
                                        </div>
                                        <span className={`status-badge ${statusMap[item.status] || 'bg-slate-100'}`}>{item.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Main Interface: Map & Advisory */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                        <div className="lg:col-span-8">
                            <div className="gov-card h-full p-0 overflow-hidden relative border-2 border-slate-100 dark:border-slate-800 shadow-2xl">
                                <div className="absolute top-6 left-6 z-[1000] space-y-2">
                                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-2 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1">Active Intersection</p>
                                        <h3 className="text-sm font-black text-navy dark:text-blue-400">RAJPATH CROSSING (SEC-04)</h3>
                                    </div>
                                </div>
                                <MapComponent
                                    junction={selectedJunction}
                                    vehiclePosition={mockPosition}
                                    distance={advisory?.distance || 500}
                                    signalStatus={advisory?.signalStatus || 'IDLE'}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <section className="gov-card bg-navy dark:bg-slate-900 text-white min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                                {/* Indian Theme Accent */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-600/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>

                                <h2 className="text-xs font-black text-blue-300 uppercase tracking-[0.3em] mb-8">AI Advisory Terminal</h2>

                                <div className={`w-40 h-40 rounded-full border-8 flex flex-col items-center justify-center mb-8 shadow-2xl transition-all duration-700 ${advisory?.signalStatus === 'GREEN' ? 'border-green-500/30' : advisory?.signalStatus === 'RED' ? 'border-red-500/30' : 'border-amber-500/30'}`}>
                                    <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 ${advisory?.signalStatus === 'GREEN' ? 'bg-green-600 shadow-green-900/50' : advisory?.signalStatus === 'RED' ? 'bg-red-600 shadow-red-900/50' : 'bg-amber-600 shadow-amber-900/50'}`}>
                                        <span className="text-[10px] font-black opacity-80 uppercase tracking-widest">{advisory?.signalStatus || 'SYNCING'}</span>
                                        <span className="text-6xl font-black">{advisory ? Math.round(advisory.secondsToChange) : "--"}</span>
                                        <span className="text-[10px] font-black opacity-60">SECONDS</span>
                                    </div>
                                </div>

                                <div className="w-full space-y-4 px-6">
                                    <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Recommended Approach Speed</p>
                                        <p className="text-4xl font-black">{advisory?.recommendedSpeed || '--'} <span className="text-sm font-bold opacity-60">KM/H</span></p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border-l-8 border-saffron">
                                        <Brain className="h-6 w-6 text-navy shrink-0" />
                                        <p className="text-sm font-black text-slate-900 leading-tight">{advisory?.message || "Optimizing signal synchronization..."}</p>
                                    </div>
                                </div>
                            </section>

                            <div className="gov-card border-l-4 border-green-600">
                                <h3 className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">Efficiency KPI</h3>
                                <p className="text-2xl font-black text-[var(--text-primary)]">AI Optimized <span className="text-green-600">+18%</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Operational Metrics Row */}
                    <section>
                        <h2 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.3em] mb-6">System Efficiency & Performance Metrics</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {trafficMetrics.map((metric, idx) => {
                                const Icon = iconMap[metric.icon] || TrendingUp;
                                return (
                                    <div key={idx} className="gov-card group hover:border-navy transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl group-hover:bg-navy/5 transition-colors">
                                                <Icon className="h-5 w-5 text-navy dark:text-blue-400" />
                                            </div>
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-md ${metric.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {metric.change}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase mb-1 tracking-widest">{metric.label}</p>
                                            <h3 className="text-3xl font-black text-[var(--text-primary)]">{metric.value}</h3>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            );
        }

        return null;
    };

    return (
        <div className="dashboard-container">
            <Sidebar isConnected={isConnected} activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="main-content relative overflow-hidden min-h-screen">

                {renderContent()}
            </main>
        </div>
    );
};

export default Dashboard;
