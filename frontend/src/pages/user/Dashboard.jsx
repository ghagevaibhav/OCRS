import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/api'
import Card from '../../components/Card'
import Badge from '../../components/Badge'
import DetailsModal from '../../components/DetailsModal'

const Dashboard = () => {
        const { user } = useAuth()
        const [stats, setStats] = useState({ firs: [], missing: [] })
        const [loading, setLoading] = useState(true)
        const [selectedCase, setSelectedCase] = useState(null)
        const [caseType, setCaseType] = useState('fir')
        const [showModal, setShowModal] = useState(false)

        useEffect(() => {
                loadData()
        }, [])

        const loadData = async () => {
                try {
                        const [firsRes, missingRes] = await Promise.all([
                                userService.getMyFIRs(),
                                userService.getMyMissingReports()
                        ])
                        setStats({
                                firs: firsRes.data || [],
                                missing: missingRes.data || []
                        })
                } catch (error) {
                        console.error('Error loading data:', error)
                } finally {
                        setLoading(false)
                }
        }

        const quickActions = [
                {
                        to: '/file-fir',
                        label: 'File FIR',
                        icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                        ),
                        gradient: 'from-primary-500 to-primary-600',
                        desc: 'Report a crime incident'
                },
                {
                        to: '/file-missing',
                        label: 'Missing Person',
                        icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                        ),
                        gradient: 'from-warning-500 to-warning-600',
                        desc: 'Report a missing person'
                },
                {
                        to: '/track-status',
                        label: 'Track Status',
                        icon: (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                        ),
                        gradient: 'from-success-500 to-success-600',
                        desc: 'Check your case progress'
                },
        ]

        const statCards = [
                {
                        label: 'Total FIRs',
                        value: stats.firs.length,
                        color: 'text-primary-600',
                        bgColor: 'bg-primary-50',
                        icon: (
                                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                        )
                },
                {
                        label: 'Pending',
                        value: stats.firs.filter(f => f.status === 'PENDING').length,
                        color: 'text-warning-600',
                        bgColor: 'bg-warning-50',
                        icon: (
                                <svg className="w-5 h-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        )
                },
                {
                        label: 'Missing Reports',
                        value: stats.missing.length,
                        color: 'text-accent-600',
                        bgColor: 'bg-accent-50',
                        icon: (
                                <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                        )
                },
                {
                        label: 'Resolved',
                        value: stats.firs.filter(f => f.status === 'RESOLVED').length,
                        color: 'text-success-600',
                        bgColor: 'bg-success-50',
                        icon: (
                                <svg className="w-5 h-5 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        )
                },
        ]

        const handleCaseClick = (caseData, type) => {
                setSelectedCase(caseData)
                setCaseType(type)
                setShowModal(true)
        }

        // Skeleton components
        const StatCardSkeleton = () => (
                <Card className="animate-pulse">
                        <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                                <div className="flex-1">
                                        <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
                                        <div className="h-4 w-24 bg-gray-200 rounded" />
                                </div>
                        </div>
                </Card>
        )

        const TableRowSkeleton = () => (
                <tr>
                        {[...Array(5)].map((_, i) => (
                                <td key={i} className="py-4 px-4">
                                        <div className="skeleton h-4 w-full max-w-[120px] rounded" />
                                </td>
                        ))}
                </tr>
        )

        return (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Hero Section with Gradient */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 p-8 mb-8 shadow-xl">
                                <div className="relative z-10">
                                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                                Welcome back, {user?.fullName?.split(' ')[0]} 👋
                                        </h1>
                                        <p className="text-primary-100 text-lg">Here's an overview of your cases</p>
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white/5 rounded-full" />
                                <div className="absolute bottom-0 left-1/2 -mb-32 w-96 h-96 bg-white/5 rounded-full" />
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {quickActions.map((action) => (
                                        <Link key={action.to} to={action.to}>
                                                <Card hover animate className="group relative overflow-hidden">
                                                        <div className="flex items-center gap-4">
                                                                <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                                        {action.icon}
                                                                </div>
                                                                <div>
                                                                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{action.label}</h3>
                                                                        <p className="text-sm text-gray-500">{action.desc}</p>
                                                                </div>
                                                        </div>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                        </div>
                                                </Card>
                                        </Link>
                                ))}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {loading ? (
                                        [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
                                ) : (
                                        statCards.map((stat) => (
                                                <Card key={stat.label} variant="outlined" className="hover:shadow-md transition-shadow">
                                                        <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                                                                        {stat.icon}
                                                                </div>
                                                                <div>
                                                                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                                                        <p className="text-sm text-gray-500">{stat.label}</p>
                                                                </div>
                                                        </div>
                                                </Card>
                                        ))
                                )}
                        </div>

                        {/* Recent FIRs */}
                        <Card className="mb-6" variant="elevated">
                                <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Your FIRs
                                        </h2>
                                        <Link to="/track-status" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                                View all
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                        </Link>
                                </div>

                                {loading ? (
                                        <div className="overflow-x-auto">
                                                <table className="w-full">
                                                        <thead>
                                                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                                                        <th className="pb-3 px-4">FIR Number</th>
                                                                        <th className="pb-3 px-4">Title</th>
                                                                        <th className="pb-3 px-4">Category</th>
                                                                        <th className="pb-3 px-4">Status</th>
                                                                        <th className="pb-3 px-4">Date</th>
                                                                </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                                {[...Array(3)].map((_, i) => <TableRowSkeleton key={i} />)}
                                                        </tbody>
                                                </table>
                                        </div>
                                ) : stats.firs.length === 0 ? (
                                        <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                </div>
                                                <p className="text-gray-500 mb-2">No FIRs filed yet</p>
                                                <Link to="/file-fir" className="text-primary-600 hover:text-primary-700 font-medium">
                                                        File your first FIR →
                                                </Link>
                                        </div>
                                ) : (
                                        <div className="overflow-x-auto">
                                                <table className="w-full">
                                                        <thead>
                                                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                                                        <th className="pb-3 px-4">FIR Number</th>
                                                                        <th className="pb-3 px-4">Title</th>
                                                                        <th className="pb-3 px-4">Category</th>
                                                                        <th className="pb-3 px-4">Status</th>
                                                                        <th className="pb-3 px-4">Date</th>
                                                                </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                                {stats.firs.map((fir) => (
                                                                        <tr
                                                                                key={fir.id}
                                                                                className="hover:bg-primary-50/50 cursor-pointer transition-colors"
                                                                                onClick={() => handleCaseClick(fir, 'fir')}
                                                                        >
                                                                                <td className="py-4 px-4 font-medium text-primary-600">{fir.firNumber}</td>
                                                                                <td className="py-4 px-4 text-gray-700">{fir.title}</td>
                                                                                <td className="py-4 px-4">
                                                                                        <Badge variant="default" size="sm">{fir.category}</Badge>
                                                                                </td>
                                                                                <td className="py-4 px-4">
                                                                                        <Badge.Status status={fir.status} />
                                                                                </td>
                                                                                <td className="py-4 px-4 text-gray-500 text-sm">
                                                                                        {new Date(fir.incidentDate).toLocaleDateString()}
                                                                                </td>
                                                                        </tr>
                                                                ))}
                                                        </tbody>
                                                </table>
                                        </div>
                                )}
                        </Card>

                        {/* Recent Missing Reports */}
                        <Card variant="elevated">
                                <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                <svg className="w-5 h-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Missing Person Reports
                                        </h2>
                                        <Link to="/file-missing" className="text-sm text-warning-600 hover:text-warning-700 font-medium flex items-center gap-1">
                                                File new
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                        </Link>
                                </div>

                                {loading ? (
                                        <div className="overflow-x-auto">
                                                <table className="w-full">
                                                        <thead>
                                                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                                                        <th className="pb-3 px-4">Case Number</th>
                                                                        <th className="pb-3 px-4">Person Name</th>
                                                                        <th className="pb-3 px-4">Age</th>
                                                                        <th className="pb-3 px-4">Status</th>
                                                                        <th className="pb-3 px-4">Last Seen</th>
                                                                </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                                {[...Array(3)].map((_, i) => <TableRowSkeleton key={i} />)}
                                                        </tbody>
                                                </table>
                                        </div>
                                ) : stats.missing.length === 0 ? (
                                        <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                </div>
                                                <p className="text-gray-500">No missing person reports filed yet</p>
                                        </div>
                                ) : (
                                        <div className="overflow-x-auto">
                                                <table className="w-full">
                                                        <thead>
                                                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                                                        <th className="pb-3 px-4">Case Number</th>
                                                                        <th className="pb-3 px-4">Person Name</th>
                                                                        <th className="pb-3 px-4">Age</th>
                                                                        <th className="pb-3 px-4">Status</th>
                                                                        <th className="pb-3 px-4">Last Seen</th>
                                                                </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                                {stats.missing.map((report) => (
                                                                        <tr
                                                                                key={report.id}
                                                                                className="hover:bg-warning-50/50 cursor-pointer transition-colors"
                                                                                onClick={() => handleCaseClick(report, 'missing')}
                                                                        >
                                                                                <td className="py-4 px-4 font-medium text-warning-600">{report.caseNumber}</td>
                                                                                <td className="py-4 px-4 text-gray-700">{report.missingPersonName}</td>
                                                                                <td className="py-4 px-4 text-gray-600">{report.age || 'N/A'}</td>
                                                                                <td className="py-4 px-4">
                                                                                        <Badge.Status status={report.status} />
                                                                                </td>
                                                                                <td className="py-4 px-4 text-gray-500 text-sm">
                                                                                        {new Date(report.lastSeenDate).toLocaleDateString()}
                                                                                </td>
                                                                        </tr>
                                                                ))}
                                                        </tbody>
                                                </table>
                                        </div>
                                )}
                        </Card>

                        {/* Details Modal */}
                        <DetailsModal
                                isOpen={showModal}
                                onClose={() => setShowModal(false)}
                                data={selectedCase}
                                type={caseType}
                        />
                </div>
        )
}

export default Dashboard

