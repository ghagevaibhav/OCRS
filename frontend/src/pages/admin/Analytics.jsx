import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { adminService } from '../../services/api'
import Card from '../../components/Card'

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
                }]
        } : null

        const categoryBarData = analytics ? {
                labels: Object.keys(analytics.firsByCategory || {}),
                datasets: [{
                        label: 'FIRs',
                        data: Object.values(analytics.firsByCategory || {}),
                        backgroundColor: '#6366f1',
                        borderRadius: 6,
                }]
        } : null

        const officerBarData = analytics ? {
                labels: Object.keys(analytics.topAuthorities || {}),
                datasets: [{
                        label: 'Cases Handled',
                        data: Object.values(analytics.topAuthorities || {}),
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                }]
        } : null

        const missingPieData = analytics ? {
                labels: Object.keys(analytics.missingByStatus || {}),
                datasets: [{
                        data: Object.values(analytics.missingByStatus || {}),
                        backgroundColor: ['#ef4444', '#10b981', '#6b7280'],
                        borderWidth: 0,
                }]
        } : null

        const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: { size: 10 } } }
                }
        }

        const barOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                        legend: { display: false }
                },
                scales: {
                        y: { beginAtZero: true, grid: { display: false } },
                        x: { grid: { display: false } }
                }
        }

        if (loading) {
                return (
                        <div className="flex justify-center items-center h-screen">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                )
        }

        return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Insights</h1>
                        <p className="text-gray-500 mb-8">Comprehensive overview of system performance and case distribution</p>

                        {/* Top Level Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <Card className="border-l-4 border-indigo-500">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total FIRs</p>
                                        <div className="flex items-end gap-2">
                                                <p className="text-3xl font-bold text-slate-800">{analytics?.totalFirs || 0}</p>
                                                <span className={`${(analytics?.firGrowthRate || 0) >= 0 ? 'text-green-500' : 'text-red-500'} text-xs font-semibold mb-1`}>
                                                        {(analytics?.firGrowthRate || 0) >= 0 ? '↑' : '↓'} {Math.abs(analytics?.firGrowthRate || 0)}%
                                                </span>
                                        </div>
                                </Card>
                                <Card className="border-l-4 border-emerald-500">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resolution Rate</p>
                                        <div className="flex items-end gap-2">
                                                <p className="text-3xl font-bold text-slate-800">{resolutionRate}%</p>
                                                <div className="w-16 bg-slate-100 h-1 rounded-full mb-3 ml-2">
                                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${resolutionRate}%` }}></div>
                                                </div>
                                        </div>
                                </Card>
                                <Card className="border-l-4 border-orange-500">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Res Time</p>
                                        <div className="flex items-end gap-2">
                                                <p className="text-3xl font-bold text-slate-800">{analytics?.averageResolutionTime || 0}</p>
                                                <span className="text-slate-400 text-xs mb-1">days</span>
                                        </div>
                                </Card>
                                <Card className="border-l-4 border-blue-500">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Officers</p>
                                        <div className="flex items-end gap-2">
                                                <p className="text-3xl font-bold text-slate-800">{analytics?.totalAuthorities || 0}</p>
                                                <span className="text-blue-400 text-xs mb-1">units</span>
                                        </div>
                                </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <Card className="lg:col-span-1">
                                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-tight">FIR Status Dist.</h3>
                                        <div className="h-64">
                                                {statusPieData && Object.values(analytics.firsByStatus || {}).some(v => v > 0) ? (
                                                        <Pie data={statusPieData} options={chartOptions} />
                                                ) : (
                                                        <p className="text-slate-400 text-sm italic text-center py-20">Insufficient data</p>
                                                )}
                                        </div>
                                </Card>

                                <Card className="lg:col-span-2">
                                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-tight">Cases per Category</h3>
                                        <div className="h-64">
                                                {categoryBarData && Object.values(analytics.firsByCategory || {}).some(v => v > 0) ? (
                                                        <Bar data={categoryBarData} options={barOptions} />
                                                ) : (
                                                        <p className="text-slate-400 text-sm italic text-center py-20">Insufficient data</p>
                                                )}
                                        </div>
                                </Card>

                                <Card className="lg:col-span-2">
                                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-tight">Top Performing Officers</h3>
                                        <div className="h-64">
                                                {officerBarData && Object.values(analytics.topAuthorities || {}).some(v => v > 0) ? (
                                                        <Bar data={officerBarData} options={barOptions} />
                                                ) : (
                                                        <p className="text-slate-400 text-sm italic text-center py-20">Insufficient data</p>
                                                )}
                                        </div>
                                </Card>

                                <Card className="lg:col-span-1">
                                        <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-tight">Missing Reports Status</h3>
                                        <div className="h-64">
                                                {missingPieData && Object.values(analytics.missingByStatus || {}).some(v => v > 0) ? (
                                                        <Pie data={missingPieData} options={chartOptions} />
                                                ) : (
                                                        <p className="text-slate-400 text-sm italic text-center py-20">Insufficient data</p>
                                                )}
                                        </div>
                                </Card>
                        </div>
                </div>
        )
}

export default Analytics
