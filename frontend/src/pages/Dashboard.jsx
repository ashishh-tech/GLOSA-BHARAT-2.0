import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Play,
    RefreshCw,
    Settings,
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
    Wifi,
    BarChart3,
    Route,
    LogOut,
    Lock,
    UserCircle
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
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authData, setAuthData] = useState({ username: '', password: '' });
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



    useEffect(() => {
        // Recover user from local storage
        const savedUser = localStorage.getItem('glosaUser');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            setIsLoggedIn(true);
        }
    }, []);

    // Periodic Location Sync
    useEffect(() => {
        if (!isLoggedIn || !user) return;

        const syncLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        await axios.post('/api/user/sync-location', {
                            username: user.username,
                            lat: latitude,
                            lng: longitude
                        });
                        console.log("📍 Location synced to MongoDB");
                    } catch (err) {
                        console.error("Location sync failed", err);
                    }
                });
            }
        };

        syncLocation();
        const interval = setInterval(syncLocation, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, [isLoggedIn, user]);

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
        'AI Engine': Cpu,
        'Signal Controller': Zap,
        'Traffic Lights': Zap,
        'AI System': Cpu
    };

    const systemStatus = (stats?.systemStatus || [
        { label: 'Signal Controller', status: 'online' },
        { label: 'AI Engine', status: 'active' },
        { label: 'GIS Mapping', status: 'operational' },
    ]).filter(item => {
        const label = item.label.toLowerCase();
        return !label.includes('fleet') && !label.includes('camera');
    });

    const trafficMetrics = stats?.trafficStats || [
        { label: 'Wait Time Reduction', value: '24.8%', change: '+4.2%', icon: 'Clock' },
        { label: 'AI Signal Accuracy', value: '98.2%', change: '+1.5%', icon: 'Brain' },
        { label: 'Vehicle Throughput', value: '1,482', change: '+8.1%', icon: 'Users' },
        { label: 'Fuel Saved (Pilot)', value: '185L', change: '+12.3%', icon: 'TrendingUp' },
    ];

    const iconMap = {
        'Clock': Clock,
        'Brain': Brain,
        'Users': Users,
        'TrendingUp': TrendingUp,
        'Stats': BarChart3,
        'Route': Route
    };

    const handleLiveDiscovery = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsDiscovering(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await axios.post('/api/junctions/discover', {
                    lat: latitude,
                    lng: longitude
                });

                // Refresh junctions
                const refreshRes = await axios.get('/api/junctions');
                setJunctions(refreshRes.data);

                if (refreshRes.data.length > 0) {
                    // Try to pick one of the newly discovered OSM junctions
                    const latest = refreshRes.data.find(j => j.id.startsWith('OSM-')) || refreshRes.data[0];
                    setSelectedJunction(latest);
                    setMockPosition({ lat: latitude, lng: longitude });
                    alert(`✅ ${res.data.count} Live Junctions discovered near you!`);
                }
            } catch (err) {
                console.error("Discovery failed", err);
                alert("Failed to discover nearby junctions. Check console for details.");
            } finally {
                setIsDiscovering(false);
            }
        }, (error) => {
            console.error("Geolocation error", error);
            alert("Could not access GPS. Please check permissions.");
            setIsDiscovering(false);
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/auth/login', authData);
            setUser(res.data.user);
            setIsLoggedIn(true);
            localStorage.setItem('glosaUser', JSON.stringify(res.data.user));

            // Immediately get location after login
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    setMockPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                });
            }
        } catch (err) {
            alert("Auth failed: " + (err.response?.data?.error || "Unknown error"));
        }
    };

    const handleLogout = () => {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('glosaUser');
    };

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
                            <div className="text-right mr-4 hidden lg:block border-r pr-4 border-slate-200 dark:border-slate-800">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase">{currentTime.toLocaleDateString('en-IN', { weekday: 'long' })}</p>
                                <p className="text-xl font-black text-navy dark:text-blue-400">{currentTime.toLocaleTimeString([], { hour12: true })}</p>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 mr-2">
                                <div className="bg-navy text-white p-2 rounded-lg">
                                    <UserCircle className="h-5 w-5" />
                                </div>
                                <div className="pr-3">
                                    <p className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1">Active Operator</p>
                                    <p className="text-xs font-black text-navy dark:text-blue-400 uppercase leading-none">{user?.username || 'Guest'}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-red-100 transition-all border border-red-100"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Sign Out</span>
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

        if (activeTab === 'simulation') {
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <Route className="h-8 w-8 text-saffron" />
                            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">AI Advisory Terminal</h1>
                        </div>
                        <p className="text-[var(--text-secondary)] font-bold text-sm uppercase tracking-wider">Predictive Signal Sync & Speed Optimization</p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 gov-card p-0 overflow-hidden relative min-h-[500px] border-2 border-navy/20 shadow-2xl">
                            <MapComponent
                                junction={selectedJunction}
                                vehiclePosition={mockPosition}
                                distance={advisory?.distance || 500}
                                signalStatus={advisory?.signalStatus || 'IDLE'}
                            />
                        </div>
                        <div className="space-y-6">
                            <div className={`gov-card text-center p-8 border-b-8 shadow-2xl transition-all duration-700 ${advisory?.signalStatus === 'GREEN' ? 'border-green-600' : advisory?.signalStatus === 'RED' ? 'border-red-600' : 'border-amber-500'}`}>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Current Signal Phase</p>
                                <div className={`w-32 h-32 rounded-full mx-auto flex flex-col items-center justify-center mb-6 ${advisory?.signalStatus === 'GREEN' ? 'bg-green-600' : advisory?.signalStatus === 'RED' ? 'bg-red-600' : 'bg-amber-600'} text-white shadow-xl`}>
                                    <span className="text-5xl font-black">{advisory ? Math.round(advisory.secondsToChange) : "--"}</span>
                                    <span className="text-[10px] font-black opacity-80">SECONDS</span>
                                </div>
                                <h3 className={`text-2xl font-black uppercase ${advisory?.signalStatus === 'GREEN' ? 'text-green-600' : advisory?.signalStatus === 'RED' ? 'text-red-600' : 'text-amber-600'}`}>
                                    {advisory?.signalStatus || 'DETECTING...'}
                                </h3>
                            </div>

                            <div className="gov-card bg-navy text-white p-6 border-l-8 border-saffron shadow-xl">
                                <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-4">GLOSA Recommendation</p>
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-sm font-bold opacity-80 text-blue-50">Target Speed</span>
                                    <span className="text-4xl font-black text-saffron">{advisory?.recommendedSpeed || '--'} <small className="text-xs opacity-60">KM/H</small></span>
                                </div>
                                <div className="bg-white/10 p-4 rounded-xl border border-white/10 flex items-start gap-3">
                                    <Brain className="h-5 w-5 text-saffron shrink-0" />
                                    <p className="text-xs font-bold leading-relaxed">{advisory?.message || "Analyzing traffic flows for optimal throughput..."}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'metrics') {
            return (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900 dark:text-white">
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <BarChart3 className="h-8 w-8 text-navy dark:text-blue-400" />
                            <h1 className="text-3xl font-black tracking-tight">System Performance Analytics</h1>
                        </div>
                        <p className="text-[var(--text-secondary)] font-bold text-sm uppercase tracking-wider">Real-time Efficiency Monitoring & Throughput Data</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trafficMetrics.map((metric, idx) => {
                            const Icon = iconMap[metric.icon] || TrendingUp;
                            return (
                                <div key={idx} className="gov-card group hover:border-navy transition-all border-navy/10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-navy/5 p-2.5 rounded-xl group-hover:bg-navy/10 transition-colors">
                                            <Icon className="h-6 w-6 text-navy dark:text-blue-400" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-black text-slate-500 uppercase mb-1 tracking-widest">{metric.label}</p>
                                    <h3 className="text-4xl font-black">{metric.value}</h3>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="gov-card p-8 min-h-[300px] flex flex-col justify-center border-t-4 border-t-saffron">
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-white/10 pb-2">AI Optimization Impact</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-black uppercase mb-2">
                                        <span>Wait Time Reduction</span>
                                        <span className="text-green-600">88% Effectiveness</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[88%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-black uppercase mb-2">
                                        <span>Fuel Savings</span>
                                        <span className="text-blue-600">74% Target</span>
                                    </div>
                                    <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[74%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="gov-card p-8 min-h-[300px] flex flex-col items-center justify-center border-t-4 border-t-navy bg-slate-50/50 dark:bg-white/0">
                            <div className="bg-navy text-white p-4 rounded-full mb-4">
                                <Zap className="h-8 w-8 text-saffron" />
                            </div>
                            <h3 className="text-xl font-black mb-2">Real-time Throughput</h3>
                            <p className="text-xs font-bold text-slate-500 text-center uppercase tracking-wide">Live data processing enabled via secure GOI gateway</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'settings') {
            return (
                <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 dark:text-white">
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            <Settings className="h-8 w-8 text-slate-400" />
                            <h1 className="text-3xl font-black tracking-tight">Terminal Configuration</h1>
                        </div>
                        <p className="text-[var(--text-secondary)] font-bold text-sm uppercase tracking-wider">System Preferences & Operator Settings</p>
                    </header>

                    <div className="space-y-6">
                        <section className="gov-card p-8">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Interface Theme</h3>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-navy dark:bg-blue-600 text-white' : 'bg-white text-navy shadow-sm'}`}>
                                        {isDarkMode ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm">{isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}</h4>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Optimized for high-visibility terminal viewing</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className="bg-navy text-white px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-md"
                                >
                                    Toggle Theme
                                </button>
                            </div>
                        </section>

                        <section className="gov-card p-8 border-l-8 border-blue-500">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Backend Synchronization</h3>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className="text-sm font-black uppercase tracking-tight">{isConnected ? 'Link Operational' : 'Link Offline'}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">v2.0.4 Platinum</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors">
                                    <RefreshCw className="h-4 w-4 text-navy dark:text-blue-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Force Re-Sync</span>
                                </button>
                                <button className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-colors">
                                    <Wifi className="h-4 w-4 text-navy dark:text-blue-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Gateway Logs</span>
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] dark:bg-slate-950 flex font-inter transition-colors duration-500 overflow-hidden">
            <AnimatePresence>
                {!isLoggedIn && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-navy/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border-t-8 border-saffron"
                        >
                            <div className="text-center mb-8">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="GOI" className="h-16 mx-auto mb-6 dark:invert" />
                                <h1 className="text-3xl font-black text-navy dark:text-blue-400 tracking-tight mb-2">GLOSA BHARAT</h1>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">National Smart Mobility Gateway</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Operator ID</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            value={authData.username}
                                            onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold text-navy dark:text-white focus:ring-2 focus:ring-navy outline-none transition-all"
                                            placeholder="Enter Gateway ID..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Access Terminal Key</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="password"
                                            required
                                            value={authData.password}
                                            onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold text-navy dark:text-white focus:ring-2 focus:ring-navy outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-navy text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 hover:brightness-110 shadow-xl active:scale-[0.98] transition-all"
                                >
                                    AUTHENTICATE GATEWAY
                                </button>

                                <p className="text-[10px] text-center text-slate-400 font-bold px-4">
                                    Unauthorized access to National Traffic Systems is strictly monitored and recorded.
                                </p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <main className="flex-1 p-8 h-screen overflow-y-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
