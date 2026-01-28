import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/api'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Button from '../../components/Button'
import Select from '../../components/Select'
import Input from '../../components/Input'
import Badge from '../../components/Badge'
import SuccessModal from '../../components/SuccessModal'

const AdminDashboard = () => {
        const [activeView, setActiveView] = useState('overview')
        const [showSuccessModal, setShowSuccessModal] = useState(false)
        const [successModalConfig, setSuccessModalConfig] = useState({ title: '', message: '' })
        const [analytics, setAnalytics] = useState(null)
        const [firs, setFirs] = useState([])
        const [missingReports, setMissingReports] = useState([])
        const [authorities, setAuthorities] = useState([])
        const [loading, setLoading] = useState(true)

        // Modal states
        const [showAddModal, setShowAddModal] = useState(false)
        const [showEditModal, setShowEditModal] = useState(false)
        const [showDeleteModal, setShowDeleteModal] = useState(false)
        const [showReassignModal, setShowReassignModal] = useState(false)

        // Selected items
        const [selectedAuthority, setSelectedAuthority] = useState(null)
        const [reassignData, setReassignData] = useState({ caseId: null, type: 'fir', authorityId: '', currentCase: null })

        const [newAuth, setNewAuth] = useState({
                email: '', password: '', fullName: '', badgeNumber: '',
                designation: '', stationName: '', stationAddress: '', phone: ''
        })

        const navItems = [
                {
                        id: 'overview',
                        label: 'Overview',
                        icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                        )
                },
                {
                        id: 'firs',
                        label: 'Manage FIRs',
                        icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                        ),
                        count: firs.length
                },
                {
                        id: 'missing',
                        label: 'Missing Persons',
                        icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                        ),
                        count: missingReports.length
                },
                {
                        id: 'authorities',
                        label: 'Authorities',
                        icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                        ),
                        count: authorities.length
                },
        ]

        // Phone validation: numbers only, max 10 digits
        const handlePhoneChange = (value, setter, currentState) => {
                const numbersOnly = value.replace(/[^0-9]/g, '').slice(0, 10)
                setter({ ...currentState, phone: numbersOnly })
        }

        useEffect(() => {
                loadInitialData()
        }, [])

        const loadInitialData = async () => {
                setLoading(true)
                try {
                        const [analyticsRes, firsRes, missingRes, authRes] = await Promise.all([
                                adminService.getAnalytics(),
                                adminService.getAllFIRs(),
                                adminService.getAllMissingReports(),
                                adminService.getAuthorities()
                        ])
                        setAnalytics(analyticsRes.data)
                        setFirs(firsRes.data || [])
                        // Authorities API returns ApiResponse<List>, extract nested data
                        setAuthorities(authRes.data?.data || [])
                        setMissingReports(missingRes.data || [])
                } catch (error) {
                        console.error('Error loading dashboard data:', error)
                } finally {
                        setLoading(false)
                }
        }

        const handleAddAuthority = async (e) => {
                e.preventDefault()
                try {
                        await adminService.createAuthority(newAuth)
                        setShowAddModal(false)
                        setNewAuth({ email: '', password: '', fullName: '', badgeNumber: '', designation: '', stationName: '', stationAddress: '', phone: '' })
                        loadInitialData()

                        setSuccessModalConfig({
                                title: 'Officer Registered',
                                message: `Officer ${newAuth.fullName} has been successfully registered and can now access the system.`
                        })
                        setShowSuccessModal(true)
                } catch (error) {
                        console.error('Error adding authority:', error)
                        const errorMessage = error.response?.data?.message || error.message || 'Failed to add authority'
                        alert(`Registration Failed: ${errorMessage}`)
                }
        }

        const handleEditAuthority = async (e) => {
                e.preventDefault()
                try {
                        await adminService.updateAuthority(selectedAuthority.id, selectedAuthority)
                        setShowEditModal(false)
                        setSelectedAuthority(null)
                        loadInitialData()

                        setSuccessModalConfig({
                                title: 'Officer Updated',
                                message: 'Officer details have been successfully updated.'
                        })
                        setShowSuccessModal(true)
                } catch (error) {
                        console.error('Error updating authority:', error)
                        alert('Failed to update authority.')
                }
        }

        const handleDeleteAuthority = async () => {
                try {
                        await adminService.deleteAuthority(selectedAuthority.id)
                        setShowDeleteModal(false)
                        setSelectedAuthority(null)
                        loadInitialData()

                        setSuccessModalConfig({
                                title: 'Officer Deleted',
                                message: 'The officer has been successfully deleted from the system.'
                        })
                        setShowSuccessModal(true)
                } catch (error) {
                        console.error('Error deleting authority:', error)
                        alert('Failed to delete authority.')
                }
        }



        const handleReassign = async () => {
                try {
                        if (reassignData.type === 'fir') {
                                await adminService.reassignFIR(reassignData.caseId, reassignData.authorityId)
                        } else {
                                await adminService.reassignMissingReport(reassignData.caseId, reassignData.authorityId)
                        }
                        setShowReassignModal(false)
                        setReassignData({ caseId: null, type: 'fir', authorityId: '', currentCase: null })
                        loadInitialData()
                        // Show success modal instead of alert
                        setSuccessModalConfig({
                                title: 'Reassignment Complete',
                                message: 'The case has been successfully reassigned. The officer has been notified and the citizen will receive an email update.'
                        })
                        setShowSuccessModal(true)
                } catch (error) {
                        console.error('Reassignment failed:', error)
                        alert('Failed to reassign case')
                }
        }

        const openReassignModal = (item, type) => {
                setReassignData({ caseId: item.id, type, authorityId: '', currentCase: item })
                setShowReassignModal(true)
        }

        const stats = analytics ? [
                {
                        label: 'Total FIRs',
                        value: analytics.totalFirs,
                        color: 'text-primary-600',
                        bg: 'bg-primary-50',
                        borderColor: 'border-primary-500',
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                        )
                },
                {
                        label: 'Pending FIRs',
                        value: analytics.pendingFirs,
                        color: 'text-amber-600',
                        bg: 'bg-amber-50',
                        borderColor: 'border-amber-500',
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        )
                },
                {
                        label: 'Resolved FIRs',
                        value: analytics.resolvedFirs,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                        borderColor: 'border-emerald-500',
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        )
                },
                {
                        label: 'Missing Reports',
                        value: analytics.totalMissingPersons,
                        color: 'text-orange-600',
                        bg: 'bg-orange-50',
                        borderColor: 'border-orange-500',
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                        )
                },
                {
                        label: 'Found Persons',
                        value: analytics.foundPersons,
                        color: 'text-teal-600',
                        bg: 'bg-teal-50',
                        borderColor: 'border-teal-500',
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                        )
                },
                {
                        label: 'Active Officers',
                        value: analytics.totalAuthorities,
                        color: 'text-indigo-600',
                        bg: 'bg-indigo-50',
                        borderColor: 'border-indigo-500',
                        icon: (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                        )
                },
        ] : []

        const getStatusVariant = (status) => {
                const variants = {
                        RESOLVED: 'success',
                        PENDING: 'warning',
                        UNDER_INVESTIGATION: 'info',
                        CLOSED: 'default',
                        MISSING: 'error',
                        FOUND: 'success',
                        SEARCHING: 'warning'
                }
                return variants[status] || 'default'
        }

        const firColumns = [
                { header: 'FIR Number', render: (fir) => <span className="font-semibold text-primary-600">{fir.firNumber}</span> },
                { header: 'Title', key: 'title' },
                { header: 'Category', render: (fir) => <Badge variant="default" size="sm">{fir.category}</Badge> },
                {
                        header: 'Status', render: (fir) => (
                                <Badge variant={getStatusVariant(fir.status)} size="sm">{fir.status}</Badge>
                        )
                },
                { header: 'Date', render: (fir) => new Date(fir.createdAt).toLocaleDateString() },
        ]

        const missingColumns = [
                { header: 'Case Number', render: (m) => <span className="font-semibold text-orange-600">{m.caseNumber}</span> },
                { header: 'Missing Person', key: 'missingPersonName' },
                { header: 'Age', key: 'age' },
                {
                        header: 'Status', render: (m) => (
                                <Badge variant={getStatusVariant(m.status)} size="sm">{m.status}</Badge>
                        )
                },
                { header: 'Last Seen', render: (m) => new Date(m.lastSeenDate).toLocaleDateString() },
        ]

        const authColumns = [
                { header: 'Officer Name', render: (a) => <span className="font-semibold text-slate-800">{a.fullName}</span> },
                { header: 'Badge #', render: (a) => <Badge variant="info" size="sm">{a.badgeNumber}</Badge> },
                { header: 'Designation', key: 'designation' },
                { header: 'Station', key: 'stationName' },
        ]

        return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Gradient Header */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-6 mb-8 shadow-xl">
                                <div className="relative z-10 flex justify-between items-start">
                                        <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                        </div>
                                                        <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
                                                </div>
                                                <p className="text-white/80">Manage FIRs, Missing Persons, and Authorities</p>
                                        </div>
                                        <Link to="/admin/analytics">
                                                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                        Full Analytics
                                                </Button>
                                        </Link>
                                </div>
                                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full" />
                                <div className="absolute bottom-0 left-1/2 -mb-16 w-32 h-32 bg-white/5 rounded-full" />
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex gap-2 mb-6 p-1.5 bg-gray-100 rounded-xl w-fit">
                                {navItems.map((item) => (
                                        <button
                                                key={item.id}
                                                onClick={() => setActiveView(item.id)}
                                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeView === item.id
                                                        ? 'bg-white text-primary-600 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                                        }`}
                                        >
                                                {item.icon}
                                                <span>{item.label}</span>
                                                {item.count !== undefined && item.count > 0 && (
                                                        <Badge variant={activeView === item.id ? 'primary' : 'default'} size="sm">
                                                                {item.count}
                                                        </Badge>
                                                )}
                                        </button>
                                ))}
                        </div>

                        {loading ? (
                                <div className="space-y-6">
                                        {/* Stats Skeleton */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                                {[...Array(6)].map((_, i) => (
                                                        <Card key={i} className="animate-pulse">
                                                                <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                                                                        <div className="flex-1">
                                                                                <div className="h-6 w-12 bg-gray-200 rounded mb-1" />
                                                                                <div className="h-3 w-16 bg-gray-200 rounded" />
                                                                        </div>
                                                                </div>
                                                        </Card>
                                                ))}
                                        </div>
                                        {/* Charts Skeleton */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <Card className="animate-pulse">
                                                        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
                                                        <div className="space-y-3">
                                                                {[...Array(4)].map((_, i) => (
                                                                        <div key={i} className="flex items-center justify-between">
                                                                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                                                                <div className="flex items-center gap-3">
                                                                                        <div className="w-32 h-2 bg-gray-200 rounded-full" />
                                                                                        <div className="h-4 w-8 bg-gray-200 rounded" />
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                        </div>
                                                </Card>
                                                <Card className="animate-pulse">
                                                        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
                                                        <div className="space-y-3">
                                                                {[...Array(4)].map((_, i) => (
                                                                        <div key={i} className="flex items-center justify-between">
                                                                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                                                                <div className="flex items-center gap-3">
                                                                                        <div className="w-32 h-2 bg-gray-200 rounded-full" />
                                                                                        <div className="h-4 w-8 bg-gray-200 rounded" />
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                        </div>
                                                </Card>
                                        </div>
                                </div>
                        ) : (
                                <div className="space-y-6">
                                        {/* Overview View */}
                                        {activeView === 'overview' && (
                                                <>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                                                {stats.map((stat) => (
                                                                        <Card key={stat.label} className={`${stat.bg} border-l-4 ${stat.borderColor} hover:shadow-lg transition-all duration-200`}>
                                                                                <div className="flex items-center gap-3">
                                                                                        <div className={`w-10 h-10 bg-white/60 rounded-lg flex items-center justify-center ${stat.color}`}>
                                                                                                {stat.icon}
                                                                                        </div>
                                                                                        <div>
                                                                                                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                                                                                <p className="text-xs text-gray-600">{stat.label}</p>
                                                                                        </div>
                                                                                </div>
                                                                        </Card>
                                                                ))}
                                                        </div>

                                                        {analytics?.firsByCategory && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                        <Card>
                                                                                <h2 className="text-lg font-semibold mb-4 text-slate-800">FIRs by Category</h2>
                                                                                <div className="space-y-3">
                                                                                        {Object.entries(analytics.firsByCategory).map(([category, count]) => (
                                                                                                <div key={category} className="flex items-center justify-between">
                                                                                                        <span className="text-gray-600 text-sm">{category}</span>
                                                                                                        <div className="flex items-center gap-3">
                                                                                                                <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                                                                        <div className="bg-primary-500 h-full rounded-full" style={{ width: `${(count / analytics.totalFirs) * 100}%` }} />
                                                                                                                </div>
                                                                                                                <span className="font-semibold text-slate-700 text-sm w-8">{count}</span>
                                                                                                        </div>
                                                                                                </div>
                                                                                        ))}
                                                                                </div>
                                                                        </Card>

                                                                        <Card>
                                                                                <h2 className="text-lg font-semibold mb-4 text-slate-800">FIRs by Status</h2>
                                                                                <div className="space-y-3">
                                                                                        {Object.entries(analytics.firsByStatus || {}).map(([status, count]) => (
                                                                                                <div key={status} className="flex items-center justify-between">
                                                                                                        <span className="text-gray-600 text-sm">{status}</span>
                                                                                                        <div className="flex items-center gap-3">
                                                                                                                <div className="w-32 bg-slate-100 rounded-full h-2 overflow-hidden">
                                                                                                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(count / analytics.totalFirs) * 100}%` }} />
                                                                                                                </div>
                                                                                                                <span className="font-semibold text-slate-700 text-sm w-8">{count}</span>
                                                                                                        </div>
                                                                                                </div>
                                                                                        ))}
                                                                                </div>
                                                                        </Card>
                                                                </div>
                                                        )}
                                                </>
                                        )}

                                        {/* FIRs View */}
                                        {activeView === 'firs' && (
                                                <Card variant="elevated">
                                                        <div className="flex justify-between items-center mb-6">
                                                                <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                        </div>
                                                                        <div>
                                                                                <h2 className="text-xl font-bold text-gray-900">Manage FIRs</h2>
                                                                                <p className="text-sm text-slate-500">{firs.length} total FIRs in system</p>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                        <Table
                                                                columns={firColumns}
                                                                data={firs}
                                                                searchPlaceholder="Search by FIR number, title, category..."
                                                                actions={(fir) => (
                                                                        <Button
                                                                                size="sm"
                                                                                variant="primary"
                                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
                                                                                onClick={() => openReassignModal(fir, 'fir')}
                                                                        >
                                                                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                                </svg>
                                                                                Reassign
                                                                        </Button>
                                                                )}
                                                        />
                                                </Card>
                                        )}

                                        {/* Missing Persons View */}
                                        {activeView === 'missing' && (
                                                <Card variant="elevated">
                                                        <div className="flex justify-between items-center mb-6">
                                                                <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                                </svg>
                                                                        </div>
                                                                        <div>
                                                                                <h2 className="text-xl font-bold text-gray-900">Missing Person Reports</h2>
                                                                                <p className="text-sm text-slate-500">{missingReports.length} total reports in system</p>
                                                                        </div>
                                                                </div>
                                                        </div>
                                                        <Table
                                                                columns={missingColumns}
                                                                data={missingReports}
                                                                searchPlaceholder="Search by case number, name..."
                                                                actions={(report) => (
                                                                        <Button
                                                                                size="sm"
                                                                                variant="primary"
                                                                                className="bg-orange-600 hover:bg-orange-700 text-white px-4"
                                                                                onClick={() => openReassignModal(report, 'missing')}
                                                                        >
                                                                                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                                </svg>
                                                                                Reassign
                                                                        </Button>
                                                                )}
                                                        />
                                                </Card>
                                        )}

                                        {/* Authorities View */}
                                        {activeView === 'authorities' && (
                                                <Card variant="elevated">
                                                        <div className="flex justify-between items-center mb-6">
                                                                <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                </svg>
                                                                        </div>
                                                                        <div>
                                                                                <h2 className="text-xl font-bold text-gray-900">Manage Authorities</h2>
                                                                                <p className="text-sm text-slate-500">{authorities.length} registered officers</p>
                                                                        </div>
                                                                </div>
                                                                <Button onClick={() => setShowAddModal(true)} className="shadow-lg">
                                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                        </svg>
                                                                        Add New Officer
                                                                </Button>
                                                        </div>
                                                        <Table
                                                                columns={authColumns}
                                                                data={authorities}
                                                                searchPlaceholder="Search officers..."
                                                                actions={(auth) => (
                                                                        <div className="flex gap-2">
                                                                                <Button
                                                                                        size="sm"
                                                                                        variant="secondary"
                                                                                        onClick={() => { setSelectedAuthority(auth); setShowEditModal(true); }}
                                                                                >
                                                                                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                        </svg>
                                                                                        Edit
                                                                                </Button>
                                                                                <Button
                                                                                        size="sm"
                                                                                        variant="danger"
                                                                                        className="bg-red-500 hover:bg-red-600 text-white"
                                                                                        onClick={() => { setSelectedAuthority(auth); setShowDeleteModal(true); }}
                                                                                >
                                                                                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                                        </svg>
                                                                                        Delete
                                                                                </Button>
                                                                        </div>
                                                                )}
                                                        />
                                                </Card>
                                        )}
                                </div>
                        )}

                        {/* Add Authority Modal */}
                        {showAddModal && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                        <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                                                <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                                        </svg>
                                                                </div>
                                                                <h2 className="text-xl font-bold text-gray-900">Register New Officer</h2>
                                                        </div>
                                                        <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                        </button>
                                                </div>
                                                <form onSubmit={handleAddAuthority} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input label="Email" type="email" required value={newAuth.email} onChange={e => setNewAuth({ ...newAuth, email: e.target.value })} />
                                                        <Input label="Password" type="password" required value={newAuth.password} onChange={e => setNewAuth({ ...newAuth, password: e.target.value })} />
                                                        <Input label="Full Name" required value={newAuth.fullName} onChange={e => setNewAuth({ ...newAuth, fullName: e.target.value })} />
                                                        <Input label="Badge Number" required value={newAuth.badgeNumber} onChange={e => setNewAuth({ ...newAuth, badgeNumber: e.target.value })} />
                                                        <Input label="Designation" placeholder="e.g. Inspector" value={newAuth.designation} onChange={e => setNewAuth({ ...newAuth, designation: e.target.value })} />
                                                        <Input
                                                                label="Phone"
                                                                type="tel"
                                                                placeholder="10 digit number"
                                                                value={newAuth.phone}
                                                                onChange={e => handlePhoneChange(e.target.value, setNewAuth, newAuth)}
                                                                maxLength={10}
                                                                pattern="[0-9]{10}"
                                                        />
                                                        <div className="md:col-span-2">
                                                                <Input label="Station Name" value={newAuth.stationName} onChange={e => setNewAuth({ ...newAuth, stationName: e.target.value })} />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                                <Input label="Station Address" value={newAuth.stationAddress} onChange={e => setNewAuth({ ...newAuth, stationAddress: e.target.value })} />
                                                        </div>
                                                        <div className="md:col-span-2 flex gap-4 mt-4">
                                                                <Button type="submit" className="flex-1">Create Officer Account</Button>
                                                                <Button variant="secondary" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                                                        </div>
                                                </form>
                                        </Card>
                                </div>
                        )}

                        {/* Edit Authority Modal */}
                        {showEditModal && selectedAuthority && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                        <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                                                <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                </div>
                                                                <h2 className="text-xl font-bold text-gray-900">Edit Officer</h2>
                                                        </div>
                                                        <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                        </button>
                                                </div>
                                                <form onSubmit={handleEditAuthority} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <Input label="Full Name" required value={selectedAuthority.fullName} onChange={e => setSelectedAuthority({ ...selectedAuthority, fullName: e.target.value })} />
                                                        <Input label="Badge Number" required value={selectedAuthority.badgeNumber} onChange={e => setSelectedAuthority({ ...selectedAuthority, badgeNumber: e.target.value })} />
                                                        <Input label="Designation" value={selectedAuthority.designation || ''} onChange={e => setSelectedAuthority({ ...selectedAuthority, designation: e.target.value })} />
                                                        <Input
                                                                label="Phone"
                                                                type="tel"
                                                                placeholder="10 digit number"
                                                                value={selectedAuthority.phone || ''}
                                                                onChange={e => handlePhoneChange(e.target.value, setSelectedAuthority, selectedAuthority)}
                                                                maxLength={10}
                                                                pattern="[0-9]{10}"
                                                        />
                                                        <div className="md:col-span-2">
                                                                <Input label="Station Name" value={selectedAuthority.stationName || ''} onChange={e => setSelectedAuthority({ ...selectedAuthority, stationName: e.target.value })} />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                                <Input label="Station Address" value={selectedAuthority.stationAddress || ''} onChange={e => setSelectedAuthority({ ...selectedAuthority, stationAddress: e.target.value })} />
                                                        </div>
                                                        <div className="md:col-span-2 flex gap-4 mt-4">
                                                                <Button type="submit" className="flex-1">Save Changes</Button>
                                                                <Button variant="secondary" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
                                                        </div>
                                                </form>
                                        </Card>
                                </div>
                        )}

                        {/* Delete Confirmation Modal */}
                        {showDeleteModal && selectedAuthority && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                        <Card className="max-w-md w-full shadow-2xl">
                                                <div className="text-center">
                                                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                        </div>
                                                        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Officer?</h2>
                                                        <p className="text-gray-500 mb-6">
                                                                Are you sure you want to delete <strong>{selectedAuthority.fullName}</strong>? This action cannot be undone.
                                                        </p>
                                                        <div className="flex gap-4">
                                                                <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                                                                <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDeleteAuthority}>Delete</Button>
                                                        </div>
                                                </div>
                                        </Card>
                                </div>
                        )}

                        {/* Reassign Modal */}
                        {showReassignModal && reassignData.currentCase && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                        <Card className="max-w-md w-full shadow-2xl">
                                                <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                                        </svg>
                                                                </div>
                                                                <h2 className="text-xl font-bold text-gray-900">Reassign Case</h2>
                                                        </div>
                                                        <button onClick={() => setShowReassignModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                        </button>
                                                </div>

                                                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                                        <p className="text-sm text-slate-500 mb-1">
                                                                {reassignData.type === 'fir' ? 'FIR Number' : 'Case Number'}
                                                        </p>
                                                        <p className="font-semibold text-lg">
                                                                {reassignData.type === 'fir' ? reassignData.currentCase.firNumber : reassignData.currentCase.caseNumber}
                                                        </p>
                                                        <p className="text-sm text-slate-600 mt-1">
                                                                {reassignData.type === 'fir' ? reassignData.currentCase.title : reassignData.currentCase.missingPersonName}
                                                        </p>
                                                </div>

                                                <Select
                                                        label="Assign to Officer"
                                                        value={reassignData.authorityId}
                                                        onChange={(e) => setReassignData({ ...reassignData, authorityId: e.target.value })}
                                                        options={(Array.isArray(authorities) ? authorities : []).filter(a => a.isActive !== false).map(a => ({
                                                                value: a.id,
                                                                label: `${a.fullName} (${a.designation || 'Officer'})`
                                                        }))}
                                                />

                                                <div className="flex gap-4 mt-6">
                                                        <Button variant="secondary" className="flex-1" onClick={() => setShowReassignModal(false)}>Cancel</Button>
                                                        <Button
                                                                className="flex-1"
                                                                disabled={!reassignData.authorityId}
                                                                onClick={handleReassign}
                                                        >
                                                                Confirm Reassignment
                                                        </Button>
                                                </div>
                                        </Card>
                                </div>
                        )}

                        {/* Success Modal */}
                        <SuccessModal
                                isOpen={showSuccessModal}
                                onClose={() => setShowSuccessModal(false)}
                                title={successModalConfig.title}
                                message={successModalConfig.message}
                        />
                </div >
        )
}

export default AdminDashboard
