import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { userService } from '../../services/api'
import Card from '../../components/Card'

const Dashboard = () => {
        const { user } = useAuth()
        const [stats, setStats] = useState({ firs: [], missing: [] })
        const [loading, setLoading] = useState(true)
        const [selectedFir, setSelectedFir] = useState(null)
        const [showModal, setShowModal] = useState(false)
        const [selectedMissing, setSelectedMissing] = useState(null)
        const [showMissingModal, setShowMissingModal] = useState(false)

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
                { to: '/file-fir', label: 'File FIR', icon: '📝', color: 'bg-primary-500', desc: 'Report a crime' },
                { to: '/file-missing', label: 'Missing Person', icon: '🔍', color: 'bg-warning-500', desc: 'Report missing person' },
                { to: '/track-status', label: 'Track Status', icon: '📊', color: 'bg-success-500', desc: 'Check case status' },
        ]

        const getStatusColor = (status) => {
                const colors = {
                        PENDING: 'bg-yellow-100 text-yellow-800',
                        ASSIGNED: 'bg-blue-100 text-blue-800',
                        UNDER_INVESTIGATION: 'bg-purple-100 text-purple-800',
                        RESOLVED: 'bg-green-100 text-green-800',
                        CLOSED: 'bg-gray-100 text-gray-800',
                        MISSING: 'bg-red-100 text-red-800',
                        FOUND: 'bg-green-100 text-green-800',
                }
                return colors[status] || 'bg-gray-100 text-gray-800'
        }

        return (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Welcome Section */}
                        <div className="mb-8">
                                <h1 className="text-3xl font-bold text-gray-900">
                                        Welcome back, {user?.fullName?.split(' ')[0]} 👋
                                </h1>
                                <p className="text-gray-500 mt-1">Here's what's happening with your cases</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {quickActions.map((action) => (
                                        <Link key={action.to} to={action.to}>
                                                <Card hover className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                                                                {action.icon}
                                                        </div>
                                                        <div>
                                                                <h3 className="font-semibold text-gray-900">{action.label}</h3>
                                                                <p className="text-sm text-gray-500">{action.desc}</p>
                                                        </div>
                                                </Card>
                                        </Link>
                                ))}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <Card className="text-center">
                                        <p className="text-3xl font-bold text-primary-600">{stats.firs.length}</p>
                                        <p className="text-sm text-gray-500">Total FIRs</p>
                                </Card>
                                <Card className="text-center">
                                        <p className="text-3xl font-bold text-yellow-600">
                                                {stats.firs.filter(f => f.status === 'PENDING').length}
                                        </p>
                                        <p className="text-sm text-gray-500">Pending FIRs</p>
                                </Card>
                                <Card className="text-center">
                                        <p className="text-3xl font-bold text-warning-600">{stats.missing.length}</p>
                                        <p className="text-sm text-gray-500">Missing Reports</p>
                                </Card>
                                <Card className="text-center">
                                        <p className="text-3xl font-bold text-success-600">
                                                {stats.firs.filter(f => f.status === 'RESOLVED').length}
                                        </p>
                                        <p className="text-sm text-gray-500">Resolved Cases</p>
                                </Card>
                        </div>

                        {/* Recent FIRs */}
                        <Card className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your FIRs</h2>
                                {loading ? (
                                        <p className="text-gray-500">Loading...</p>
                                ) : stats.firs.length === 0 ? (
                                        <p className="text-gray-500">No FIRs filed yet. <Link to="/file-fir" className="text-primary-600 hover:underline">File your first FIR</Link></p>
                                ) : (
                                        <div className="overflow-x-auto">
                                                <table className="w-full">
                                                        <thead>
                                                                <tr className="text-left text-sm text-gray-500 border-b">
                                                                        <th className="pb-3">FIR Number</th>
                                                                        <th className="pb-3">Title</th>
                                                                        <th className="pb-3">Category</th>
                                                                        <th className="pb-3">Status</th>
                                                                        <th className="pb-3">Date</th>
                                                                </tr>
                                                        </thead>
                                                        <tbody>
                                                                {stats.firs.map((fir) => (
                                                                        <tr key={fir.id} className="border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setSelectedFir(fir); setShowModal(true); }}>
                                                                                <td className="py-3 font-medium text-primary-600">{fir.firNumber}</td>
                                                                                <td className="py-3">{fir.title}</td>
                                                                                <td className="py-3">{fir.category}</td>
                                                                                <td className="py-3">
                                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fir.status)}`}>
                                                                                                {fir.status}
                                                                                        </span>
                                                                                </td>
                                                                                <td className="py-3 text-gray-500">{new Date(fir.incidentDate).toLocaleDateString()}</td>
                                                                        </tr>
                                                                ))}
                                                        </tbody>
                                                </table>
                                        </div>
                                )}
                        </Card>

                        {/* Recent Missing Reports */}
                        <Card>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Missing Person Reports</h2>
                                {loading ? (
                                        <p className="text-gray-500">Loading...</p>
                                ) : stats.missing.length === 0 ? (
                                        <p className="text-gray-500">No missing person reports filed yet.</p>
                                ) : (
                                        <div className="overflow-x-auto">
                                                <table className="w-full">
                                                        <thead>
                                                                <tr className="text-left text-sm text-gray-500 border-b">
                                                                        <th className="pb-3">Case Number</th>
                                                                        <th className="pb-3">Person Name</th>
                                                                        <th className="pb-3">Age</th>
                                                                        <th className="pb-3">Status</th>
                                                                        <th className="pb-3">Last Seen</th>
                                                                </tr>
                                                        </thead>
                                                        <tbody>
                                                                {stats.missing.map((report) => (
                                                                        <tr key={report.id} className="border-b last:border-0 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setSelectedMissing(report); setShowMissingModal(true); }}>
                                                                                <td className="py-3 font-medium text-primary-600">{report.caseNumber}</td>
                                                                                <td className="py-3">{report.missingPersonName}</td>
                                                                                <td className="py-3">{report.age || 'N/A'}</td>
                                                                                <td className="py-3">
                                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                                                                {report.status}
                                                                                        </span>
                                                                                </td>
                                                                                <td className="py-3 text-gray-500">{new Date(report.lastSeenDate).toLocaleDateString()}</td>
                                                                        </tr>
                                                                ))}
                                                        </tbody>
                                                </table>
                                        </div>
                                )}
                        </Card>

                        {/* FIR Detail Modal */}
                        {showModal && selectedFir && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                                <div className="p-6 border-b border-gray-100">
                                                        <div className="flex justify-between items-start">
                                                                <div>
                                                                        <h2 className="text-xl font-bold text-gray-900">FIR Details</h2>
                                                                        <p className="text-primary-600 font-medium">{selectedFir.firNumber}</p>
                                                                </div>
                                                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                                                        </div>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Title</p>
                                                                        <p className="font-medium">{selectedFir.title}</p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Category</p>
                                                                        <p className="font-medium">{selectedFir.category}</p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Status</p>
                                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFir.status)}`}>
                                                                                {selectedFir.status}
                                                                        </span>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Priority</p>
                                                                        <p className="font-medium">{selectedFir.priority || 'MEDIUM'}</p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Incident Date</p>
                                                                        <p className="font-medium">{new Date(selectedFir.incidentDate).toLocaleDateString()}</p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Incident Time</p>
                                                                        <p className="font-medium">{selectedFir.incidentTime || 'Not specified'}</p>
                                                                </div>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-gray-500">Location</p>
                                                                <p className="font-medium">{selectedFir.incidentLocation || 'Not specified'}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-gray-500">Description</p>
                                                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedFir.description}</p>
                                                        </div>
                                                        <div className="pt-4 border-t border-gray-100">
                                                                <p className="text-xs text-gray-400">Filed on {new Date(selectedFir.createdAt || selectedFir.incidentDate).toLocaleString()}</p>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        )}

                        {/* Missing Person Detail Modal */}
                        {showMissingModal && selectedMissing && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowMissingModal(false)}>
                                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                                <div className="p-6 border-b border-gray-100">
                                                        <div className="flex justify-between items-start">
                                                                <div>
                                                                        <h2 className="text-xl font-bold text-gray-900">Missing Person Report</h2>
                                                                        <p className="text-warning-600 font-medium">{selectedMissing.caseNumber}</p>
                                                                </div>
                                                                <button onClick={() => setShowMissingModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                                                        </div>
                                                </div>
                                                <div className="p-6 space-y-4">
                                                        <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Missing Person Name</p>
                                                                        <p className="font-medium">{selectedMissing.missingPersonName}</p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Age</p>
                                                                        <p className="font-medium">{selectedMissing.age || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Gender</p>
                                                                        <p className="font-medium">{selectedMissing.gender || 'Not specified'}</p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Status</p>
                                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMissing.status)}`}>
                                                                                {selectedMissing.status}
                                                                        </span>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Last Seen Date</p>
                                                                        <p className="font-medium">{new Date(selectedMissing.lastSeenDate).toLocaleDateString()}</p>
                                                                </div>
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Last Seen Time</p>
                                                                        <p className="font-medium">{selectedMissing.lastSeenTime || 'Not specified'}</p>
                                                                </div>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-gray-500">Last Seen Location</p>
                                                                <p className="font-medium">{selectedMissing.lastSeenLocation || 'Not specified'}</p>
                                                        </div>
                                                        <div>
                                                                <p className="text-sm text-gray-500">Physical Description</p>
                                                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedMissing.physicalDescription || 'Not provided'}</p>
                                                        </div>
                                                        {selectedMissing.contactPhone && (
                                                                <div>
                                                                        <p className="text-sm text-gray-500">Contact Phone</p>
                                                                        <p className="font-medium">{selectedMissing.contactPhone}</p>
                                                                </div>
                                                        )}
                                                        <div className="pt-4 border-t border-gray-100">
                                                                <p className="text-xs text-gray-400">Reported on {new Date(selectedMissing.createdAt || selectedMissing.lastSeenDate).toLocaleString()}</p>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        )}
                </div>
        )
}

export default Dashboard
