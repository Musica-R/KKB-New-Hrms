import React, { useState, useEffect } from 'react';
import '../styles/DashboardHome.css';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
    const [dashboardData, setDashboardData] = useState({
        total_employees: 0,
        present_count: 0,
        absent_count: 0,
        late_checkin_count: 0
    });

    const navigate = useNavigate();

    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('https://storekkb.mpdatahub.com/api/dashboard-list');
                const result = await response.json();
                if (result.success) {
                    setDashboardData(result.data);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        const loadAdminData = () => {
            try {
                const possibleKeys = ['user', 'adminData', 'admin', 'userData', 'authUser'];
                let foundData = null;

                for (let key of possibleKeys) {
                    const stored = localStorage.getItem(key);
                    if (stored) {
                        try {
                            const parsed = JSON.parse(stored);
                            if (parsed && typeof parsed === 'object') {
                                if (parsed.user) {
                                    foundData = parsed.user;
                                } else {
                                    foundData = parsed;
                                }
                                break;
                            }
                        } catch (e) { }
                    }
                }

                setAdminData(foundData);
            } catch (error) {
                console.error("Error loading admin data", error);
            }
        };

        fetchDashboardData();
        loadAdminData();
    }, []);

    const { total_employees, present_count, absent_count, late_checkin_count } = dashboardData;
    const maxNumber = Math.max(total_employees, present_count, absent_count, late_checkin_count);
    const scaleBase = Math.max(maxNumber * 1.2, 10);
    const getPercentage = (value) => (value / scaleBase) * 100;

    const getInitials = (name) => {
        if (!name) return 'AD';
        return name.substring(0, 2).toUpperCase();
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        const [hour, minute] = timeString.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${minute} ${ampm}`;
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `https://storekkb.mpdatahub.com/images/${imagePath}`;
    };

    if (loading) {
        return (
            <div className="dashboard-home loading-container">
                <div className="loader-pulse"></div>
                <p>Loading your workspace...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-home">
            <div className="welcome-banner glass-panel fade-in-up">

                <button className="settings-icon-corner" onClick={() => navigate("/admin/settings")} title="Settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                </button>

                <div className="welcome-content">
                    <div className="welcome-text">
                        <span className="date-badge">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        <h1 className="page-title">Welcome back, <span className="highlight-text">{adminData?.name || 'Admin'}</span> </h1>
                        <p className="page-subtitle">Here is your daily overview and workforce status.</p>
                    </div>

                    {adminData && (
                        <div className="profile-card">
                            <div className="profile-avatar">
                                {adminData.profile_img && (
                                    <img
                                        src={getImageUrl(adminData.profile_img)}
                                        alt="Profile"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                )}
                                <div className="avatar-fallback" style={{ display: adminData.profile_img ? 'none' : 'flex' }}>
                                    {getInitials(adminData.name)}
                                </div>
                            </div>
                            <div className="profile-info">
                                <h3 className="profile-name">{adminData.name || 'Unknown User'}</h3>
                                <div className="profile-role">{adminData.position || adminData.role || 'Staff Member'}</div>
                                <div className="profile-meta">
                                    <span className="meta-item"><i className="icon-id"></i> {adminData.empid || 'No ID assigned'}</span>
                                    {(adminData.start_time || adminData.end_time) && (
                                        <span className="meta-item">
                                            <i className="icon-time"></i>
                                            {adminData.start_time ? formatTime(adminData.start_time) : ''}
                                            {adminData.start_time && adminData.end_time ? ' - ' : ''}
                                            {adminData.end_time ? formatTime(adminData.end_time) : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="stats-container">
                <div className="stat-card glass-panel fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-content">
                        <h3>Total Workforce</h3>
                        <div className="stat-value">{total_employees}</div>
                        <div className="stat-trend positive"><span>+</span> Active Data</div>
                    </div>
                    <div className="stat-icon employee-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                </div>

                <div className="stat-card glass-panel fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-content" onClick={() => navigate("/admin/attendance")}
                        style={{ cursor: "pointer" }}>
                        <h3>Present Today</h3>
                        <div className="stat-value">{present_count}</div>
                        <div className="stat-trend positive"><span>{(total_employees > 0 ? (present_count / total_employees * 100).toFixed(0) : 0)}%</span> Attendance</div>
                    </div>
                    <div className="stat-icon present-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                </div>

                <div className="stat-card glass-panel fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="stat-content" onClick={() => navigate("/admin/leave-list")}
                        style={{ cursor: "pointer" }}>
                        <h3>Absent</h3>
                        <div className="stat-value">{absent_count}</div>
                        <div className="stat-trend negative">Attention Required</div>
                    </div>
                    <div className="stat-icon absent-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    </div>
                </div>

                <div className="stat-card glass-panel fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <div className="stat-content" onClick={() => navigate("/admin/attendance")}
                        style={{ cursor: "pointer" }}>
                        <h3>Late Arrivals</h3>
                        <div className="stat-value">{late_checkin_count}</div>
                        <div className="stat-trend warning">Delayed Entry</div>
                    </div>
                    <div className="stat-icon late-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                </div>
            </div>

            <div className="chart-wrapper glass-panel fade-in-up" style={{ animationDelay: '0.5s' }}>
                <div className="chart-header">
                    <h2>Workforce Distribution</h2>
                    <div className="chart-legend">
                        <span className="legend-item"><span className="legend-dot emp-dot"></span>Total</span>
                        <span className="legend-item"><span className="legend-dot pres-dot"></span>Present</span>
                        <span className="legend-item"><span className="legend-dot abs-dot"></span>Absent</span>
                        <span className="legend-item"><span className="legend-dot late-dot"></span>Late</span>
                    </div>
                </div>

                <div className="bar-chart-container">
                    <div className="bar-chart">
                        <div className="bar-group">
                            <div className="bar employee-bar" style={{ height: `${Math.max(getPercentage(total_employees), 5)}%` }}>
                                <div className="bar-tooltip">{total_employees} Total</div>
                            </div>
                            <span className="bar-label">Total</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar present-bar" style={{ height: `${Math.max(getPercentage(present_count), 5)}%` }}>
                                <div className="bar-tooltip">{present_count} Present</div>
                            </div>
                            <span className="bar-label">Present</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar absent-bar" style={{ height: `${Math.max(getPercentage(absent_count), 5)}%` }}>
                                <div className="bar-tooltip">{absent_count} Absent</div>
                            </div>
                            <span className="bar-label">Absent</span>
                        </div>
                        <div className="bar-group">
                            <div className="bar late-bar" style={{ height: `${Math.max(getPercentage(late_checkin_count), 5)}%` }}>
                                <div className="bar-tooltip">{late_checkin_count} Late</div>
                            </div>
                            <span className="bar-label">Late</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;