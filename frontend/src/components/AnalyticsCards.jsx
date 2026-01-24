import { Doughnut } from 'react-chartjs-2'
import {
        Chart as ChartJS,
        ArcElement,
        Tooltip,
        Legend
} from 'chart.js'
import Card from './Card'

ChartJS.register(ArcElement, Tooltip, Legend)

const statusColors = {
        PENDING: '#EAB308',
        ASSIGNED: '#3B82F6',
        UNDER_INVESTIGATION: '#8B5CF6',
        RESOLVED: '#22C55E',
        CLOSED: '#6B7280',
        REJECTED: '#EF4444',
        FOUND: '#22C55E',
        SEARCHING: '#F59E0B'
}

const AnalyticsCards = ({ analytics, loading = false }) => {
        if (loading) {
                return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-pulse">
                                {[...Array(4)].map((_, i) => (
                                        <Card key={i} className="text-center h-24">
                                                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2" />
                                                <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                                        </Card>
                                ))}
                        </div>
                )
        }

        if (!analytics) return null

        const firChartData = {
                labels: Object.keys(analytics.firsByStatus || {}),
                datasets: [{
                        data: Object.values(analytics.firsByStatus || {}),
                        backgroundColor: Object.keys(analytics.firsByStatus || {}).map(
                                status => statusColors[status] || '#6B7280'
                        ),
                        borderWidth: 0,
                        hoverOffset: 4
                }]
        }

        const missingChartData = {
                labels: Object.keys(analytics.missingByStatus || {}),
                datasets: [{
                        data: Object.values(analytics.missingByStatus || {}),
                        backgroundColor: Object.keys(analytics.missingByStatus || {}).map(
                                status => statusColors[status] || '#6B7280'
                        ),
                        borderWidth: 0,
                        hoverOffset: 4
                }]
        }

        const chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                        legend: {
                                position: 'bottom',
                                labels: {
                                        boxWidth: 12,
                                        padding: 8,
                                        font: { size: 10 }
                                }
                        }
                },
                cutout: '60%'
        }

        const stats = [
                { label: 'Assigned FIRs', value: analytics.assignedFIRs || 0, color: 'text-blue-600' },
                { label: 'Pending Action', value: analytics.pendingFIRs || 0, color: 'text-yellow-600' },
                { label: 'Missing Reports', value: analytics.assignedMissingReports || 0, color: 'text-orange-600' },
                { label: 'Resolved Cases', value: analytics.resolvedFIRs || 0, color: 'text-green-600' }
        ]

        return (
                <div className="space-y-6 mb-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {stats.map((stat, idx) => (
                                        <Card key={idx} className="text-center transform hover:scale-105 transition-transform duration-200">
                                                <p className={`text-3xl font-bold ${stat.color}`}>
                                                        {stat.value}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                                        </Card>
                                ))}
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-4">FIRs by Status</h3>
                                        <div className="h-48">
                                                {Object.keys(analytics.firsByStatus || {}).length > 0 ? (
                                                        <Doughnut data={firChartData} options={chartOptions} />
                                                ) : (
                                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                                No FIR data available
                                                        </div>
                                                )}
                                        </div>
                                </Card>
                                <Card>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Missing Reports by Status</h3>
                                        <div className="h-48">
                                                {Object.keys(analytics.missingByStatus || {}).length > 0 ? (
                                                        <Doughnut data={missingChartData} options={chartOptions} />
                                                ) : (
                                                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                                                No missing report data
                                                        </div>
                                                )}
                                        </div>
                                </Card>
                        </div>
                </div>
        )
}

export default AnalyticsCards
