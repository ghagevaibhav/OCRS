import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import { adminService } from '../../services/api'
import Card from '../../components/Card'
import Badge from '../../components/Badge'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const Analytics = () => {
        const [analytics, setAnalytics] = useState(null)
        const [loading, setLoading] = useState(true)

        useEffect(() => {
                loadAnalytics()
        }, [])

        const loadAnalytics = async () => {
                try {
                        const response = await adminService.getAnalytics()
                        setAnalytics(response.data)
                } catch (error) {
                        console.error('Error loading analytics:', error)
                } finally {
                        setLoading(false)
                }
        }

        const pieColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

        const resolutionRate = analytics?.totalFirs > 0
                ? ((analytics.resolvedFirs / analytics.totalFirs) * 100).toFixed(1)
                : 0

        const statusPieData = analytics ? {
                labels: Object.keys(analytics.firsByStatus || {}),
                datasets: [{
                        data: Object.values(analytics.firsByStatus || {}),
                        backgroundColor: pieColors,
                        borderWidth: 0,
                        hoverOffset: 8
                }]
        } : null

        const categoryBarData = analytics ? {
                labels: Object.keys(analytics.firsByCategory || {}),
                datasets: [{
                        label: 'FIRs',
                        data: Object.values(analytics.firsByCategory || {}),
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        hoverBackgroundColor: '#6366f1',
                        borderRadius: 8,
                        borderSkipped: false,
                }]
        } : null

        const officerBarData = analytics ? {
                labels: Object.keys(analytics.topAuthorities || {}),
                datasets: [{
                        label: 'Cases Handled',
                        data: Object.values(analytics.topAuthorities || {}),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        hoverBackgroundColor: '#10b981',
                        borderRadius: 8,
                        borderSkipped: false,
                }]
        } : null

        const missingPieData = analytics ? {
                labels: Object.keys(analytics.missingByStatus || {}),
                datasets: [{
                        data: Object.values(analytics.missingByStatus || {}),
                        backgroundColor: ['#ef4444', '#10b981', '#6b7280'],
                        borderWidth: 0,
                        hoverOffset: 8
                }]
        } : null

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
        }

        const barOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                        legend: { display: false }
                },
                scales: {
                        y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(0,0,0,0.05)' },
                                ticks: { color: '#64748b', font: { size: 11 } }
                        },
                        x: {
                                grid: { display: false },
                                ticks: { color: '#64748b', font: { size: 11 } }
                        }
                }
        }

        // Skeleton Components
        const StatCardSkeleton = () => (
                <div className="animate-pulse">
                        <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
                        <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                </div>
        )

        const ChartSkeleton = ({ type = 'doughnut' }) => (
                <div className="flex items-center justify-center h-64 animate-pulse">
                        {type === 'doughnut' ? (
                                <div className="w-40 h-40 rounded-full bg-gray-200" />
                        ) : (
                                <div className="flex items-end gap-3 h-48">
                                        {[60, 80, 45, 90, 70].map((h, i) => (
                                                <div key={i} className="w-12 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
                                        ))}
                                </div>
                        )}
                </div>
        )

        if (loading) {
                return (
                        <div className="max-w-7xl mx-auto px-4 py-8">
                                {/* Header Skeleton */}
                                <div className="mb-8 animate-pulse">
                                        <div className="h-8 w-72 bg-gray-200 rounded mb-2" />
                                        <div className="h-4 w-96 bg-gray-200 rounded" />
                                </div>

                                {/* Stats Skeleton */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        {[...Array(4)].map((_, i) => (
                                                <Card key={i}><StatCardSkeleton /></Card>
                                        ))}
                                </div>

                                {/* Charts Skeleton */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                        <Card><ChartSkeleton type="doughnut" /></Card>
                                        <Card className="lg:col-span-2"><ChartSkeleton type="bar" /></Card>
                                        <Card className="lg:col-span-2"><ChartSkeleton type="bar" /></Card>
                                        <Card><ChartSkeleton type="doughnut" /></Card>
                                </div>
                        </div>
                )
        }

        // Stats configuration
        const stats = [
                {
                        label: 'Total FIRs',
                        value: analytics?.totalFirs || 0,
                        trend: analytics?.firGrowthRate || 0,
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                        ),
                        bgColor: 'bg-indigo-50',
                        textColor: 'text-indigo-600',
                        borderColor: 'border-indigo-500'
                },
                {
                        label: 'Resolution Rate',
                        value: `${resolutionRate}%`,
                        progress: resolutionRate,
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        ),
                        bgColor: 'bg-emerald-50',
                        textColor: 'text-emerald-600',
                        borderColor: 'border-emerald-500'
                },
                {
                        label: 'Avg Resolution Time',
                        value: analytics?.averageResolutionTime || 0,
                        unit: 'days',
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        ),
                        bgColor: 'bg-orange-50',
                        textColor: 'text-orange-600',
                        borderColor: 'border-orange-500'
                },
                {
                        label: 'Active Officers',
                        value: analytics?.totalAuthorities || 0,
                        unit: 'units',
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                        ),
                        bgColor: 'bg-blue-50',
                        textColor: 'text-blue-600',
                        borderColor: 'border-blue-500'
                }
        ]

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
                                                <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics Insights</h1>
                                        </div>
                                        <p className="text-white/80">Comprehensive overview of system performance and case distribution</p>
                                </div>
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full" />
                                <div className="absolute bottom-0 left-1/2 -mb-16 w-32 h-32 bg-white/5 rounded-full" />
                        </div>

                        {/* Top Level Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {stats.map((stat) => (
                                        <Card key={stat.label} variant="elevated" className={`border-l-4 ${stat.borderColor} hover:shadow-lg transition-shadow`}>
                                                <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                                                                <div className="flex items-end gap-2">
                                                                        <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                                                                        {stat.trend !== undefined && (
                                                                                <Badge
                                                                                        variant={stat.trend >= 0 ? 'success' : 'error'}
                                                                                        size="sm"
                                                                                >
                                                                                        {stat.trend >= 0 ? '↑' : '↓'} {Math.abs(stat.trend)}%
                                                                                </Badge>
                                                                        )}
                                                                        {stat.unit && (
                                                                                <span className="text-slate-400 text-xs mb-1">{stat.unit}</span>
                                                                        )}
                                                                </div>
                                                                {stat.progress !== undefined && (
                                                                        <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-2">
                                                                                <div
                                                                                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                                                                        style={{ width: `${Math.min(stat.progress, 100)}%` }}
                                                                                />
                                                                        </div>
                                                                )}
                                                        </div>
                                                        <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center ${stat.textColor}`}>
                                                                {stat.icon}
                                                        </div>
                                                </div>
                                        </Card>
                                ))}
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <Card variant="elevated">
                                        <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">FIR Status Distribution</h3>
                                                <Badge variant="default" size="sm">{analytics?.totalFirs || 0} total</Badge>
                                        </div>
                                        <div className="h-64">
                                                {statusPieData && Object.values(analytics.firsByStatus || {}).some(v => v > 0) ? (
                                                        <Doughnut data={statusPieData} options={chartOptions} />
                                                ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                <p className="text-sm font-medium">Insufficient data</p>
                                                        </div>
                                                )}
                                        </div>
                                </Card>

                                <Card variant="elevated" className="lg:col-span-2">
                                        <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Cases per Category</h3>
                                                <Badge variant="info" size="sm">By Type</Badge>
                                        </div>
                                        <div className="h-64">
                                                {categoryBarData && Object.values(analytics.firsByCategory || {}).some(v => v > 0) ? (
                                                        <Bar data={categoryBarData} options={barOptions} />
                                                ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                                                </svg>
                                                                <p className="text-sm font-medium">Insufficient data</p>
                                                        </div>
                                                )}
                                        </div>
                                </Card>

                                <Card variant="elevated" className="lg:col-span-2">
                                        <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Top Performing Officers</h3>
                                                <Badge variant="success" size="sm">Leaderboard</Badge>
                                        </div>
                                        <div className="h-64">
                                                {officerBarData && Object.values(analytics.topAuthorities || {}).some(v => v > 0) ? (
                                                        <Bar data={officerBarData} options={barOptions} />
                                                ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <p className="text-sm font-medium">Insufficient data</p>
                                                        </div>
                                                )}
                                        </div>
                                </Card>

                                <Card variant="elevated">
                                        <div className="flex items-center justify-between mb-6">
                                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Missing Reports Status</h3>
                                                <Badge variant="warning" size="sm">Active Cases</Badge>
                                        </div>
                                        <div className="h-64">
                                                {missingPieData && Object.values(analytics.missingByStatus || {}).some(v => v > 0) ? (
                                                        <Doughnut data={missingPieData} options={chartOptions} />
                                                ) : (
                                                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                                <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                <p className="text-sm font-medium">Insufficient data</p>
                                                        </div>
                                                )}
                                        </div>
                                </Card>
                        </div>
                </div>
        )
}

export default Analytics
