import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import { authorityService } from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';

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
                cutout: '65%',
                plugins: {
                        legend: {
                                position: 'bottom',
                                labels: {
                                        usePointStyle: true,
                                        pointStyle: 'circle',
                                        boxWidth: 8,
                                        font: { size: 11, weight: '500' },
                                        padding: 16,
                                        color: '#475569'
                                }
                        }
                }
        };

        // Skeleton Loading Component
        const StatCardSkeleton = () => (
                <div className="animate-pulse">
                        <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
                        <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                        <div className="h-4 w-24 bg-gray-200 rounded" />
                </div>
        );

        const ChartSkeleton = () => (
                <div className="flex items-center justify-center h-72 animate-pulse">
                        <div className="w-48 h-48 rounded-full bg-gray-200" />
                </div>
        );

        if (loading) {
                return (
                        <div className="max-w-7xl mx-auto px-4 py-8">
                                {/* Header Skeleton */}
                                <div className="mb-8 animate-pulse">
                                        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
                                        <div className="h-4 w-96 bg-gray-200 rounded" />
                                </div>

                                {/* Stats Skeleton */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        {[...Array(4)].map((_, i) => (
                                                <Card key={i}><StatCardSkeleton /></Card>
                                        ))}
                                </div>

                                {/* Charts Skeleton */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card><ChartSkeleton /></Card>
                                        <Card><ChartSkeleton /></Card>
                                </div>
                        </div>
                );
        }

        const firStatusData = {
                labels: Object.keys(analytics?.firStatusCounts || {}),
                datasets: [{
                        data: Object.values(analytics?.firStatusCounts || {}),
                        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
                        borderWidth: 0,
                        hoverOffset: 8
                }]
        };

        const missingStatusData = {
                labels: Object.keys(analytics?.missingStatusCounts || {}),
                datasets: [{
                        data: Object.values(analytics?.missingStatusCounts || {}),
                        backgroundColor: ['#ef4444', '#10b981', '#6b7280'],
                        borderWidth: 0,
                        hoverOffset: 8
                }]
        };

        // Calculate performance metrics
        const totalFirs = analytics?.assignedFirs || 0;
        const resolvedFirs = analytics?.resolvedFirs || 0;
        const resolutionRate = totalFirs > 0 ? ((resolvedFirs / totalFirs) * 100).toFixed(0) : 0;

        const totalMissing = analytics?.assignedMissingReports || 0;
        const foundMissing = analytics?.foundMissingReports || 0;
        const foundRate = totalMissing > 0 ? ((foundMissing / totalMissing) * 100).toFixed(0) : 0;

        const stats = [
                {
                        label: 'Assigned FIRs',
                        value: analytics?.assignedFirs || 0,
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                        ),
                        color: 'from-indigo-500 to-indigo-600',
                        bgColor: 'bg-indigo-50',
                        textColor: 'text-indigo-600'
                },
                {
                        label: 'Resolved FIRs',
                        value: analytics?.resolvedFirs || 0,
                        badge: resolutionRate > 0 && <Badge variant="success" size="sm">{resolutionRate}% rate</Badge>,
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        ),
                        color: 'from-emerald-500 to-emerald-600',
                        bgColor: 'bg-emerald-50',
                        textColor: 'text-emerald-600'
                },
                {
                        label: 'Missing Reports',
                        value: analytics?.assignedMissingReports || 0,
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                        ),
                        color: 'from-orange-500 to-orange-600',
                        bgColor: 'bg-orange-50',
                        textColor: 'text-orange-600'
                },
                {
                        label: 'Found Persons',
                        value: analytics?.foundMissingReports || 0,
                        badge: foundRate > 0 && <Badge variant="info" size="sm">{foundRate}% rate</Badge>,
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        ),
                        color: 'from-teal-500 to-teal-600',
                        bgColor: 'bg-teal-50',
                        textColor: 'text-teal-600'
                }
        ];

        return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Gradient Header */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-6 mb-8 shadow-xl">
                                <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl md:text-3xl font-bold text-white">My Performance Analytics</h1>
                                        </div>
                                        <p className="text-white/80">Personalized metrics and case resolution statistics for your assigned duties</p>
                                </div>
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full" />
                                <div className="absolute bottom-0 left-1/2 -mb-16 w-32 h-32 bg-white/5 rounded-full" />
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {stats.map((stat) => (
                                        <Card key={stat.label} variant="elevated" className="hover:shadow-lg transition-shadow">
                                                <div className="flex items-start justify-between">
                                                        <div>
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                                                                <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                                                                {stat.badge && <div className="mt-2">{stat.badge}</div>}
                                                        </div>
                                                        <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center ${stat.textColor}`}>
                                                                {stat.icon}
                                                        </div>
                                                </div>
                                        </Card>
                                ))}
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card variant="elevated">
                                        <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">FIR Status Distribution</h3>
                                                <Badge variant="default" size="sm">{totalFirs} total</Badge>
                                        </div>
                                        <div className="h-72">
                                                {Object.keys(analytics?.firStatusCounts || {}).length > 0 ? (
                                                        <Doughnut data={firStatusData} options={chartOptions} />
                                                ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                <p className="text-sm font-medium">No FIR data available</p>
                                                        </div>
                                                )}
                                        </div>
                                </Card>

                                <Card variant="elevated">
                                        <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Missing Persons Distribution</h3>
                                                <Badge variant="default" size="sm">{totalMissing} total</Badge>
                                        </div>
                                        <div className="h-72">
                                                {Object.keys(analytics?.missingStatusCounts || {}).length > 0 ? (
                                                        <Doughnut data={missingStatusData} options={chartOptions} />
                                                ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <p className="text-sm font-medium">No missing person data available</p>
                                                        </div>
                                                )}
                                        </div>
                                </Card>
                        </div>
                </div>
        );
};

export default AuthorityAnalytics;

