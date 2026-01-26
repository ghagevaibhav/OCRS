import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/api'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Button from '../../components/Button'
import Select from '../../components/Select'
import Input from '../../components/Input'
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
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'firs', label: 'Manage FIRs', icon: '📋' },
                { id: 'missing', label: 'Missing Persons', icon: '🔍' },
                { id: 'authorities', label: 'Authorities', icon: '👮' },
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
                { label: 'Total FIRs', value: analytics.totalFirs, color: 'text-primary-600', bg: 'bg-primary-50', icon: '📋' },
                { label: 'Pending FIRs', value: analytics.pendingFirs, color: 'text-amber-600', bg: 'bg-amber-50', icon: '⏳' },
                { label: 'Resolved FIRs', value: analytics.resolvedFirs, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '✅' },
                { label: 'Missing Reports', value: analytics.totalMissingPersons, color: 'text-orange-600', bg: 'bg-orange-50', icon: '🔍' },
                { label: 'Found Persons', value: analytics.foundPersons, color: 'text-teal-600', bg: 'bg-teal-50', icon: '🎉' },
                { label: 'Active Officers', value: analytics.totalAuthorities, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '👮' },
        ] : []

        const getStatusBadge = (status) => {
                const styles = {
                        RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                        PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
                        UNDER_INVESTIGATION: 'bg-purple-100 text-purple-700 border-purple-200',
                        CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
                        MISSING: 'bg-red-100 text-red-700 border-red-200',
                        FOUND: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                }
                return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
        }

        const firColumns = [
                { header: 'FIR Number', render: (fir) => <span className="font-semibold text-primary-600">{fir.firNumber}</span> },
                { header: 'Title', key: 'title' },
                { header: 'Category', render: (fir) => <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{fir.category}</span> },
                {
                        header: 'Status', render: (fir) => (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(fir.status)}`}>
                                        {fir.status}
                                </span>
                        )
                },
                { header: 'Date', render: (fir) => new Date(fir.createdAt).toLocaleDateString() },
        ]

        const missingColumns = [
                { header: 'Case Number', render: (m) => <span className="font-semibold text-warning-600">{m.caseNumber}</span> },
                { header: 'Missing Person', key: 'missingPersonName' },
                { header: 'Age', key: 'age' },
                {
                        header: 'Status', render: (m) => (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(m.status)}`}>
                                        {m.status}
                                </span>
                        )
                },
                { header: 'Last Seen', render: (m) => new Date(m.lastSeenDate).toLocaleDateString() },
        ]

        const authColumns = [
                { header: 'Officer Name', render: (a) => <span className="font-semibold">{a.fullName}</span> },
                { header: 'Badge #', key: 'badgeNumber' },
                { header: 'Designation', key: 'designation' },
                { header: 'Station', key: 'stationName' },
        ]

        return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8">
                                <div>
                                        <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
                                        <p className="text-gray-500">Manage FIRs, Missing Persons, and Authorities</p>
                                </div>
                                <Link to="/admin/analytics">
                                        <Button variant="primary" className="shadow-lg shadow-primary-500/25">
                                                📈 Full Analytics
                                        </Button>
                                </Link>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex gap-2 mb-6 p-1.5 bg-slate-100 rounded-xl w-fit">
                                {navItems.map((item) => (
                                        <button
                                                key={item.id}
                                                onClick={() => setActiveView(item.id)}
                                                className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeView === item.id
                                                        ? 'bg-white text-primary-600 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                                        }`}
                                        >
                                                <span>{item.icon}</span>
                                                {item.label}
                                        </button>
                                ))}
                        </div>

                        {loading ? (
                                <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                                </div>
                        ) : (
                                <div className="space-y-6">
                                        {/* Overview View */}
                                        {activeView === 'overview' && (
                                                <>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                                                {stats.map((stat) => (
                                                                        <Card key={stat.label} className={`text-center ${stat.bg} border-0`}>
                                                                                <span className="text-2xl mb-2 block">{stat.icon}</span>
                                                                                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                                                                                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
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
                                                <div>
                                                        <div className="flex justify-between items-center mb-4">
                                                                <h2 className="text-xl font-bold">Manage FIRs</h2>
                                                                <p className="text-sm text-slate-500">{firs.length} total FIRs</p>
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
                                                                                🔄 Reassign
                                                                        </Button>
                                                                )}
                                                        />
                                                </div>
                                        )}

                                        {/* Missing Persons View */}
                                        {activeView === 'missing' && (
                                                <div>
                                                        <div className="flex justify-between items-center mb-4">
                                                                <h2 className="text-xl font-bold">Missing Person Reports</h2>
                                                                <p className="text-sm text-slate-500">{missingReports.length} total reports</p>
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
                                                                                🔄 Reassign
                                                                        </Button>
                                                                )}
                                                        />
                                                </div>
                                        )}

                                        {/* Authorities View */}
                                        {activeView === 'authorities' && (
                                                <div>
                                                        <div className="flex justify-between items-center mb-4">
                                                                <h2 className="text-xl font-bold">Manage Authorities</h2>
                                                                <Button onClick={() => setShowAddModal(true)} className="shadow-lg">
                                                                        ➕ Add New Officer
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
                                                                                        ✏️ Edit
                                                                                </Button>
                                                                                <Button
                                                                                        size="sm"
                                                                                        variant="danger"
                                                                                        className="bg-red-500 hover:bg-red-600 text-white"
                                                                                        onClick={() => { setSelectedAuthority(auth); setShowDeleteModal(true); }}
                                                                                >
                                                                                        🗑️ Delete
                                                                                </Button>
                                                                        </div>
                                                                )}
                                                        />
                                                </div>
                                        )}
                                </div>
                        )}

                        {/* Add Authority Modal */}
                        {showAddModal && (
                                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                        <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                                                <div className="flex justify-between items-center mb-6">
                                                        <h2 className="text-xl font-bold">➕ Register New Officer</h2>
                                                        <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
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
                                                        <h2 className="text-xl font-bold">✏️ Edit Officer</h2>
                                                        <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
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
                                                                <span className="text-3xl">⚠️</span>
                                                        </div>
                                                        <h2 className="text-xl font-bold mb-2">Delete Officer?</h2>
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
                                                        <h2 className="text-xl font-bold">🔄 Reassign Case</h2>
                                                        <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
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
