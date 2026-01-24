import { useEffect, useState, useCallback } from 'react'
import { authorityService } from '../../services/api'
import Card from '../../components/Card'
import Button from '../../components/Button'
import AnalyticsCards from '../../components/AnalyticsCards'
import DetailsModal from '../../components/DetailsModal'
import UpdateModal from '../../components/UpdateModal'
import FilterBar from '../../components/FilterBar'

const AuthorityDashboard = () => {
        // Data States
        const [firs, setFirs] = useState([])
        const [missingReports, setMissingReports] = useState([])
        const [analytics, setAnalytics] = useState(null)

        // Loading States
        const [loading, setLoading] = useState(true)
        const [analyticsLoading, setAnalyticsLoading] = useState(true)
        const [detailsLoading, setDetailsLoading] = useState(false)
        const [updateLoading, setUpdateLoading] = useState(false)

        // Modal States
        const [detailsModal, setDetailsModal] = useState({ isOpen: false, data: null, type: 'fir', updates: [] })
        const [updateModal, setUpdateModal] = useState({ isOpen: false, data: null, type: 'fir' })

        // Filter States
        const [firFilters, setFirFilters] = useState({ search: '', category: '', priority: '', status: '', sortBy: 'createdAt', sortDir: 'desc' })
        const [missingFilters, setMissingFilters] = useState({ search: '', status: '', sortBy: 'createdAt', sortDir: 'desc' })

        // Active Tab
        const [activeTab, setActiveTab] = useState('firs')

        useEffect(() => {
                loadData()
                loadAnalytics()
        }, [])

        const loadData = async () => {
                setLoading(true)
                try {
                        const [firsRes, missingRes] = await Promise.all([
                                authorityService.getFIRs(),
                                authorityService.getMissingReports()
                        ])
                        setFirs(firsRes.data || [])
                        setMissingReports(missingRes.data || [])
                } catch (error) {
                        console.error('Error loading data:', error)
                } finally {
                        setLoading(false)
                }
        }

        const loadAnalytics = async () => {
                setAnalyticsLoading(true)
                try {
                        const response = await authorityService.getAnalytics()
                        setAnalytics(response.data)
                } catch (error) {
                        console.error('Error loading analytics:', error)
                } finally {
                        setAnalyticsLoading(false)
                }
        }

        // Filter and sort data locally
        const filterData = useCallback((data, filters, type) => {
                return data
                        .filter(item => {
                                // Search filter
                                if (filters.search) {
                                        const searchLower = filters.search.toLowerCase()
                                        const searchFields = type === 'fir'
                                                ? [item.firNumber, item.title, item.incidentLocation]
                                                : [item.caseNumber, item.missingPersonName, item.lastSeenLocation]
                                        const matchesSearch = searchFields.some(field =>
                                                field && field.toLowerCase().includes(searchLower)
                                        )
                                        if (!matchesSearch) return false
                                }
                                // Category filter (FIR only)
                                if (filters.category && item.category !== filters.category) return false
                                // Priority filter (FIR only)
                                if (filters.priority && item.priority !== filters.priority) return false
                                // Status filter
                                if (filters.status && item.status !== filters.status) return false
                                return true
                        })
                        .sort((a, b) => {
                                const sortBy = filters.sortBy || 'createdAt'
                                const sortDir = filters.sortDir || 'desc'

                                let aVal = a[sortBy]
                                let bVal = b[sortBy]

                                // Handle dates
                                if (sortBy === 'createdAt' || sortBy === 'incidentDate' || sortBy === 'lastSeenDate') {
                                        aVal = new Date(aVal || 0).getTime()
                                        bVal = new Date(bVal || 0).getTime()
                                }
                                // Handle strings
                                if (typeof aVal === 'string') {
                                        aVal = aVal.toLowerCase()
                                        bVal = (bVal || '').toLowerCase()
                                }

                                if (sortDir === 'asc') {
                                        return aVal > bVal ? 1 : -1
                                }
                                return aVal < bVal ? 1 : -1
                        })
        }, [])

        const filteredFirs = filterData(firs, firFilters, 'fir')
        const filteredMissing = filterData(missingReports, missingFilters, 'missing')

        // Open Details Modal
        const openDetailsModal = async (item, type) => {
                setDetailsModal({ isOpen: true, data: item, type, updates: [] })
                setDetailsLoading(true)
                try {
                        const updatesRes = type === 'fir'
                                ? await authorityService.getFIRUpdates(item.id)
                                : await authorityService.getMissingUpdates(item.id)
                        setDetailsModal(prev => ({ ...prev, updates: updatesRes.data || [] }))
                } catch (error) {
                        console.error('Error loading updates:', error)
                } finally {
                        setDetailsLoading(false)
                }
        }

        // Open Update Modal from Details Modal
        const openUpdateFromDetails = () => {
                setDetailsModal(prev => ({ ...prev, isOpen: false }))
                setUpdateModal({ isOpen: true, data: detailsModal.data, type: detailsModal.type })
        }

        // Handle Update Submission
        const handleUpdate = async (formData) => {
                setUpdateLoading(true)
                try {
                        const { data, type } = updateModal
                        if (type === 'fir') {
                                await authorityService.updateFIR(data.id, formData)
                        } else {
                                await authorityService.updateMissingReport(data.id, formData)
                        }
                        setUpdateModal({ isOpen: false, data: null, type: 'fir' })
                        loadData()
                        loadAnalytics()
                } catch (error) {
                        console.error('Update failed:', error)
                        throw new Error(error.response?.data?.message || 'Update failed')
                } finally {
                        setUpdateLoading(false)
                }
        }

        const getStatusColor = (status) => {
                const colors = {
                        PENDING: 'bg-yellow-100 text-yellow-800',
                        ASSIGNED: 'bg-blue-100 text-blue-800',
                        UNDER_INVESTIGATION: 'bg-purple-100 text-purple-800',
                        RESOLVED: 'bg-green-100 text-green-800',
                        CLOSED: 'bg-gray-100 text-gray-800',
                        REJECTED: 'bg-red-100 text-red-800',
                        FOUND: 'bg-green-100 text-green-800',
                        SEARCHING: 'bg-orange-100 text-orange-800'
                }
                return colors[status] || 'bg-gray-100 text-gray-800'
        }

        const getPriorityColor = (priority) => {
                const colors = {
                        LOW: 'bg-gray-100 text-gray-600',
                        MEDIUM: 'bg-blue-100 text-blue-800',
                        HIGH: 'bg-orange-100 text-orange-800',
                        URGENT: 'bg-red-100 text-red-800'
                }
                return colors[priority] || 'bg-gray-100 text-gray-800'
        }

        return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Authority Dashboard</h1>
                        <p className="text-gray-500 mb-8">Manage your assigned cases</p>

                        {/* Analytics Section */}
                        <AnalyticsCards analytics={analytics} loading={analyticsLoading} />

                        {/* Tab Navigation */}
                        <div className="flex gap-4 mb-6 border-b border-gray-200">
                                <button
                                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'firs'
                                                        ? 'border-primary-600 text-primary-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        onClick={() => setActiveTab('firs')}
                                >
                                        FIRs ({firs.length})
                                </button>
                                <button
                                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'missing'
                                                        ? 'border-primary-600 text-primary-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        onClick={() => setActiveTab('missing')}
                                >
                                        Missing Reports ({missingReports.length})
                                </button>
                        </div>

                        {/* FIRs Tab */}
                        {activeTab === 'firs' && (
                                <>
                                        <FilterBar
                                                type="fir"
                                                onFilterChange={setFirFilters}
                                                initialFilters={firFilters}
                                        />
                                        <Card>
                                                <h2 className="text-lg font-semibold mb-4">Assigned FIRs</h2>
                                                {loading ? (
                                                        <p className="text-gray-500 py-8 text-center">Loading...</p>
                                                ) : filteredFirs.length === 0 ? (
                                                        <p className="text-gray-500 py-8 text-center">
                                                                {firs.length === 0 ? 'No FIRs assigned yet.' : 'No FIRs match your filters.'}
                                                        </p>
                                                ) : (
                                                        <div className="overflow-x-auto">
                                                                <table className="w-full">
                                                                        <thead>
                                                                                <tr className="text-left text-sm text-gray-500 border-b">
                                                                                        <th className="pb-3">FIR Number</th>
                                                                                        <th className="pb-3">Title</th>
                                                                                        <th className="pb-3">Category</th>
                                                                                        <th className="pb-3">Priority</th>
                                                                                        <th className="pb-3">Status</th>
                                                                                        <th className="pb-3">Date</th>
                                                                                        <th className="pb-3">Actions</th>
                                                                                </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                                {filteredFirs.map((fir) => (
                                                                                        <tr
                                                                                                key={fir.id}
                                                                                                className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                                                                                onClick={() => openDetailsModal(fir, 'fir')}
                                                                                        >
                                                                                                <td className="py-3 font-medium text-primary-600">{fir.firNumber}</td>
                                                                                                <td className="py-3 max-w-[200px] truncate">{fir.title}</td>
                                                                                                <td className="py-3 text-sm">{fir.category}</td>
                                                                                                <td className="py-3">
                                                                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(fir.priority)}`}>
                                                                                                                {fir.priority}
                                                                                                        </span>
                                                                                                </td>
                                                                                                <td className="py-3">
                                                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fir.status)}`}>
                                                                                                                {fir.status?.replace(/_/g, ' ')}
                                                                                                        </span>
                                                                                                </td>
                                                                                                <td className="py-3 text-gray-500 text-sm">
                                                                                                        {new Date(fir.incidentDate).toLocaleDateString()}
                                                                                                </td>
                                                                                                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                                                                                                        <Button
                                                                                                                variant="primary"
                                                                                                                size="sm"
                                                                                                                onClick={() => setUpdateModal({ isOpen: true, data: fir, type: 'fir' })}
                                                                                                        >
                                                                                                                Update
                                                                                                        </Button>
                                                                                                </td>
                                                                                        </tr>
                                                                                ))}
                                                                        </tbody>
                                                                </table>
                                                        </div>
                                                )}
                                        </Card>
                                </>
                        )}

                        {/* Missing Reports Tab */}
                        {activeTab === 'missing' && (
                                <>
                                        <FilterBar
                                                type="missing"
                                                onFilterChange={setMissingFilters}
                                                initialFilters={missingFilters}
                                        />
                                        <Card>
                                                <h2 className="text-lg font-semibold mb-4">Assigned Missing Person Reports</h2>
                                                {loading ? (
                                                        <p className="text-gray-500 py-8 text-center">Loading...</p>
                                                ) : filteredMissing.length === 0 ? (
                                                        <p className="text-gray-500 py-8 text-center">
                                                                {missingReports.length === 0 ? 'No missing person reports assigned.' : 'No reports match your filters.'}
                                                        </p>
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
                                                                                        <th className="pb-3">Actions</th>
                                                                                </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                                {filteredMissing.map((report) => (
                                                                                        <tr
                                                                                                key={report.id}
                                                                                                className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                                                                                onClick={() => openDetailsModal(report, 'missing')}
                                                                                        >
                                                                                                <td className="py-3 font-medium text-primary-600">{report.caseNumber}</td>
                                                                                                <td className="py-3">{report.missingPersonName}</td>
                                                                                                <td className="py-3">{report.age || 'N/A'}</td>
                                                                                                <td className="py-3">
                                                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                                                                                                {report.status?.replace(/_/g, ' ')}
                                                                                                        </span>
                                                                                                </td>
                                                                                                <td className="py-3 text-gray-500 text-sm">
                                                                                                        {new Date(report.lastSeenDate).toLocaleDateString()}
                                                                                                </td>
                                                                                                <td className="py-3" onClick={(e) => e.stopPropagation()}>
                                                                                                        <Button
                                                                                                                variant="primary"
                                                                                                                size="sm"
                                                                                                                onClick={() => setUpdateModal({ isOpen: true, data: report, type: 'missing' })}
                                                                                                        >
                                                                                                                Update
                                                                                                        </Button>
                                                                                                </td>
                                                                                        </tr>
                                                                                ))}
                                                                        </tbody>
                                                                </table>
                                                        </div>
                                                )}
                                        </Card>
                                </>
                        )}

                        {/* Details Modal */}
                        <DetailsModal
                                isOpen={detailsModal.isOpen}
                                onClose={() => setDetailsModal({ isOpen: false, data: null, type: 'fir', updates: [] })}
                                data={detailsModal.data}
                                type={detailsModal.type}
                                updates={detailsModal.updates}
                                loading={detailsLoading}
                                onUpdate={openUpdateFromDetails}
                        />

                        {/* Update Modal */}
                        <UpdateModal
                                isOpen={updateModal.isOpen}
                                onClose={() => setUpdateModal({ isOpen: false, data: null, type: 'fir' })}
                                caseData={updateModal.data}
                                type={updateModal.type}
                                onSubmit={handleUpdate}
                                loading={updateLoading}
                        />
                </div>
        )
}

export default AuthorityDashboard
