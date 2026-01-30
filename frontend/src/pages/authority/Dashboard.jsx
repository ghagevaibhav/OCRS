import { useEffect, useState, useCallback } from 'react'
import { authorityService } from '../../services/api'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
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

        const getStatusVariant = (status) => {
                const variants = {
                        PENDING: 'warning',
                        UNDER_INVESTIGATION: 'info',
                        RESOLVED: 'success',
                        CLOSED: 'default',
                        REJECTED: 'error',
                        FOUND: 'success',
                        SEARCHING: 'warning'
                }
                return variants[status] || 'default'
        }

        const getPriorityVariant = (priority) => {
                const variants = {
                        LOW: 'default',
                        MEDIUM: 'info',
                        HIGH: 'warning',
                        URGENT: 'error'
                }
                return variants[priority] || 'default'
        }

        // Table skeleton loading
        const TableSkeleton = ({ columns = 6, rows = 5 }) => (
                <>
                        {[...Array(rows)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-100 animate-pulse">
                                        {[...Array(columns)].map((_, j) => (
                                                <td key={j} className="py-4 px-2">
                                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                </td>
                                        ))}
                                </tr>
                        ))}
                </>
        )

        return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Header with gradient */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-6 mb-8 shadow-xl">
                                <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                </div>
                                                <h1 className="text-2xl md:text-3xl font-bold text-white">Authority Dashboard</h1>
                                        </div>
                                        <p className="text-white/80">Manage assigned cases and update investigation status</p>
                                </div>
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full" />
                                <div className="absolute bottom-0 left-1/2 -mb-16 w-32 h-32 bg-white/5 rounded-full" />
                        </div>

                        {/* Analytics Section */}
                        <AnalyticsCards analytics={analytics} loading={analyticsLoading} />

                        {/* Tab Navigation */}
                        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
                                <button
                                        className={`flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-medium transition-all ${activeTab === 'firs'
                                                ? 'bg-white text-primary-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                        onClick={() => setActiveTab('firs')}
                                >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        FIRs
                                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'firs' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-600'}`}>
                                                {firs.length}
                                        </span>
                                </button>
                                <button
                                        className={`flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-medium transition-all ${activeTab === 'missing'
                                                ? 'bg-white text-primary-600 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-800'
                                                }`}
                                        onClick={() => setActiveTab('missing')}
                                >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Missing Reports
                                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'missing' ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-600'}`}>
                                                {missingReports.length}
                                        </span>
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
                                        <Card variant="elevated">
                                                <div className="flex items-center justify-between mb-4">
                                                        <h2 className="text-lg font-semibold text-gray-900">Assigned FIRs</h2>
                                                        <Badge variant="info" size="sm">{filteredFirs.length} of {firs.length}</Badge>
                                                </div>
                                                {loading || filteredFirs.length === 0 ? (
                                                        loading ? (
                                                                <div className="overflow-x-auto">
                                                                        <table className="w-full">
                                                                                <thead>
                                                                                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                                                                <th className="pb-3 px-2">FIR Number</th>
                                                                                                <th className="pb-3 px-2">Title</th>
                                                                                                <th className="pb-3 px-2">Category</th>
                                                                                                <th className="pb-3 px-2">Priority</th>
                                                                                                <th className="pb-3 px-2">Status</th>
                                                                                                <th className="pb-3 px-2">Date</th>
                                                                                                <th className="pb-3 px-2">Actions</th>
                                                                                        </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                        <TableSkeleton columns={7} rows={5} />
                                                                                </tbody>
                                                                        </table>
                                                                </div>
                                                        ) : (
                                                                <div className="text-center py-12">
                                                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                        </div>
                                                                        <p className="text-gray-500 font-medium">
                                                                                {firs.length === 0 ? 'No FIRs assigned yet.' : 'No FIRs match your filters.'}
                                                                        </p>
                                                                </div>
                                                        )
                                                ) : (
                                                        <div className="overflow-x-auto">
                                                                <table className="w-full">
                                                                        <thead>
                                                                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                                                        <th className="pb-3 px-2">FIR Number</th>
                                                                                        <th className="pb-3 px-2">Title</th>
                                                                                        <th className="pb-3 px-2">Category</th>
                                                                                        <th className="pb-3 px-2">Priority</th>
                                                                                        <th className="pb-3 px-2">Status</th>
                                                                                        <th className="pb-3 px-2">Date</th>
                                                                                        <th className="pb-3 px-2">Actions</th>
                                                                                </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                                {filteredFirs.map((fir) => (
                                                                                        <tr
                                                                                                key={fir.id}
                                                                                                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer transition-colors group"
                                                                                                onClick={() => openDetailsModal(fir, 'fir')}
                                                                                        >
                                                                                                <td className="py-4 px-2">
                                                                                                        <span className="font-semibold text-primary-600 group-hover:text-primary-700">{fir.firNumber}</span>
                                                                                                </td>
                                                                                                <td className="py-4 px-2 max-w-[200px]">
                                                                                                        <p className="truncate font-medium text-gray-800">{fir.title}</p>
                                                                                                </td>
                                                                                                <td className="py-4 px-2">
                                                                                                        <span className="text-sm text-gray-600">{fir.category}</span>
                                                                                                </td>
                                                                                                <td className="py-4 px-2">
                                                                                                        <Badge variant={getPriorityVariant(fir.priority)} size="sm">
                                                                                                                {fir.priority}
                                                                                                        </Badge>
                                                                                                </td>
                                                                                                <td className="py-4 px-2">
                                                                                                        <Badge variant={getStatusVariant(fir.status)} size="sm">
                                                                                                                {fir.status?.replace(/_/g, ' ')}
                                                                                                        </Badge>
                                                                                                </td>
                                                                                                <td className="py-4 px-2 text-gray-500 text-sm">
                                                                                                        {new Date(fir.incidentDate).toLocaleDateString()}
                                                                                                </td>
                                                                                                <td className="py-4 px-2" onClick={(e) => e.stopPropagation()}>
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
                                        <Card variant="elevated">
                                                <div className="flex items-center justify-between mb-4">
                                                        <h2 className="text-lg font-semibold text-gray-900">Assigned Missing Person Reports</h2>
                                                        <Badge variant="info" size="sm">{filteredMissing.length} of {missingReports.length}</Badge>
                                                </div>
                                                {loading || filteredMissing.length === 0 ? (
                                                        loading ? (
                                                                <div className="overflow-x-auto">
                                                                        <table className="w-full">
                                                                                <thead>
                                                                                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                                                                <th className="pb-3 px-2">Case Number</th>
                                                                                                <th className="pb-3 px-2">Person Name</th>
                                                                                                <th className="pb-3 px-2">Age</th>
                                                                                                <th className="pb-3 px-2">Status</th>
                                                                                                <th className="pb-3 px-2">Last Seen</th>
                                                                                                <th className="pb-3 px-2">Actions</th>
                                                                                        </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                        <TableSkeleton columns={6} rows={5} />
                                                                                </tbody>
                                                                        </table>
                                                                </div>
                                                        ) : (
                                                                <div className="text-center py-12">
                                                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                </svg>
                                                                        </div>
                                                                        <p className="text-gray-500 font-medium">
                                                                                {missingReports.length === 0 ? 'No missing person reports assigned.' : 'No reports match your filters.'}
                                                                        </p>
                                                                </div>
                                                        )
                                                ) : (
                                                        <div className="overflow-x-auto">
                                                                <table className="w-full">
                                                                        <thead>
                                                                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                                                                        <th className="pb-3 px-2">Case Number</th>
                                                                                        <th className="pb-3 px-2">Person Name</th>
                                                                                        <th className="pb-3 px-2">Age</th>
                                                                                        <th className="pb-3 px-2">Status</th>
                                                                                        <th className="pb-3 px-2">Last Seen</th>
                                                                                        <th className="pb-3 px-2">Actions</th>
                                                                                </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                                {filteredMissing.map((report) => (
                                                                                        <tr
                                                                                                key={report.id}
                                                                                                className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 cursor-pointer transition-colors group"
                                                                                                onClick={() => openDetailsModal(report, 'missing')}
                                                                                        >
                                                                                                <td className="py-4 px-2">
                                                                                                        <span className="font-semibold text-primary-600 group-hover:text-primary-700">{report.caseNumber}</span>
                                                                                                </td>
                                                                                                <td className="py-4 px-2">
                                                                                                        <p className="font-medium text-gray-800">{report.missingPersonName}</p>
                                                                                                </td>
                                                                                                <td className="py-4 px-2 text-gray-600">
                                                                                                        {report.age || 'N/A'}
                                                                                                </td>
                                                                                                <td className="py-4 px-2">
                                                                                                        <Badge variant={getStatusVariant(report.status)} size="sm">
                                                                                                                {report.status?.replace(/_/g, ' ')}
                                                                                                        </Badge>
                                                                                                </td>
                                                                                                <td className="py-4 px-2 text-gray-500 text-sm">
                                                                                                        {new Date(report.lastSeenDate).toLocaleDateString()}
                                                                                                </td>
                                                                                                <td className="py-4 px-2" onClick={(e) => e.stopPropagation()}>
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
