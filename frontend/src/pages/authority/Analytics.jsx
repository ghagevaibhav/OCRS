import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { authorityService } from '../../services/api';
import Card from '../../components/Card';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AuthorityAnalytics = () => {
        const [analytics, setAnalytics] = useState(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
                const loadAnalytics = async () => {
                        try {
                                const response = await authorityService.getAnalytics();
                                setAnalytics(response.data);
                        } catch (error) {
                                console.error('Error loading authority analytics:', error);
                        } finally {
                                setLoading(false);
                        }
                };
                loadAnalytics();
        }, []);

        const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                        legend: {
                                position: 'bottom',
                                labels: {
                                        usePointStyle: true,
                                        boxWidth: 6,
                                        font: { size: 10 },
                                        padding: 20
                                }
                        }
                }
        };

        if (loading) {
                return (
                        <div className="flex justify-center items-center h-screen">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                );
        }

        const firStatusData = {
                labels: Object.keys(analytics?.firStatusCounts || {}),
                datasets: [{
                        data: Object.values(analytics?.firStatusCounts || {}),
                        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                        borderWidth: 0,
                }]
        };

        const missingStatusData = {
                labels: Object.keys(analytics?.missingStatusCounts || {}),
                datasets: [{
                        data: Object.values(analytics?.missingStatusCounts || {}),
                        backgroundColor: ['#ef4444', '#10b981', '#6b7280'],
                        borderWidth: 0,
                }]
        };

        return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                        <div className="mb-8">
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">My Performance Analytics</h1>
                                <p className="text-slate-500">Personalized metrics and case resolution statistics for your assigned duties</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <Card className="border-l-4 border-indigo-500 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned FIRs</p>
                                        <p className="text-3xl font-bold text-slate-800">{analytics?.assignedFirs}</p>
                                </Card>
                                <Card className="border-l-4 border-emerald-500 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resolved FIRs</p>
                                        <p className="text-3xl font-bold text-slate-800">{analytics?.resolvedFirs}</p>
                                </Card>
                                <Card className="border-l-4 border-orange-500 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Missing Reports</p>
                                        <p className="text-3xl font-bold text-slate-800">{analytics?.assignedMissingReports}</p>
                                </Card>
                                <Card className="border-l-4 border-teal-500 shadow-sm">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Found Persons</p>
                                        <p className="text-3xl font-bold text-slate-800">{analytics?.foundMissingReports}</p>
                                </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-tight">FIR Status Distribution</h3>
                                        <div className="h-72">
                                                {Object.keys(analytics?.firStatusCounts || {}).length > 0 ? (
                                                        <Pie data={firStatusData} options={chartOptions} />
                                                ) : (
                                                        <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">No FIR data available</div>
                                                )}
                                        </div>
                                </Card>
                                <Card>
                                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-tight">Missing Persons Distribution</h3>
                                        <div className="h-72">
                                                {Object.keys(analytics?.missingStatusCounts || {}).length > 0 ? (
                                                        <Pie data={missingStatusData} options={chartOptions} />
                                                ) : (
                                                        <div className="flex items-center justify-center h-full text-slate-400 italic text-sm">No missing person data available</div>
                                                )}
                                        </div>
                                </Card>
                        </div>
                </div>
        );
};

export default AuthorityAnalytics;
