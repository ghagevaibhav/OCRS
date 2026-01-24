import { useState } from 'react'
import { userService } from '../../services/api'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Card from '../../components/Card'

const TrackStatus = () => {
        const [searchType, setSearchType] = useState('fir')
        const [searchQuery, setSearchQuery] = useState('')
        const [result, setResult] = useState(null)
        const [updates, setUpdates] = useState([])
        const [loading, setLoading] = useState(false)
        const [error, setError] = useState('')

        const handleSearch = async (e) => {
                e.preventDefault()
                if (!searchQuery.trim()) return

                setLoading(true)
                setError('')
                setResult(null)
                setUpdates([])

                try {
                        if (searchType === 'fir') {
                                const response = await userService.getFIRByNumber(searchQuery.trim())
                                if (response.data.success) {
                                        setResult({ type: 'fir', data: response.data.data })
                                        const updatesRes = await userService.getFIRUpdates(response.data.data.id)
                                        setUpdates(updatesRes.data || [])
                                } else {
                                        setError('FIR not found. Please check the number and try again.')
                                }
                        } else if (searchType === 'missing') {
                                const response = await userService.getMissingReportByNumber(searchQuery.trim())
                                if (response.data.success) {
                                        setResult({ type: 'missing', data: response.data.data })
                                        const updatesRes = await userService.getMissingUpdates(response.data.data.id)
                                        setUpdates(updatesRes.data || [])
                                } else {
                                        setError('Missing person report not found. Please check the case number.')
                                }
                        }
                } catch (err) {
                        setError(err.response?.data?.message || 'Case not found')
                } finally {
                        setLoading(false)
                }
        }

        const getStatusStyles = (status) => {
                const styles = {
                        PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                        ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
                        UNDER_INVESTIGATION: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                        RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
                        MISSING: 'bg-red-50 text-red-700 border-red-200',
                        FOUND: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }
                return styles[status] || 'bg-slate-50 text-slate-600 border-slate-200'
        }

        const updateTypeConfig = {
                STATUS_CHANGE: { icon: '🔄', color: 'bg-indigo-500' },
                COMMENT: { icon: '💬', color: 'bg-emerald-500' },
                EVIDENCE_ADDED: { icon: '📎', color: 'bg-blue-500' },
                REASSIGNMENT: { icon: '🔀', color: 'bg-purple-500' }
        }

        return (
                <div className="max-w-4xl mx-auto px-4 py-12">
                        <div className="text-center mb-12">
                                <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Track Case Status</h1>
                                <p className="text-slate-500 text-lg">Real-time updates on your filed reports and ongoing investigations</p>
                        </div>

                        <Card className="mb-10 shadow-lg border-none bg-white/80 backdrop-blur-sm">
                                <form onSubmit={handleSearch} className="space-y-6">
                                        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit mx-auto md:mx-0">
                                                <button
                                                        type="button"
                                                        onClick={() => setSearchType('fir')}
                                                        className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${searchType === 'fir' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'
                                                                }`}
                                                >
                                                        FIR Investigation
                                                </button>
                                                <button
                                                        type="button"
                                                        onClick={() => setSearchType('missing')}
                                                        className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${searchType === 'missing' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-500 hover:text-slate-700'
                                                                }`}
                                                >
                                                        Missing Person
                                                </button>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-4">
                                                <div className="flex-1 relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                                                        <input
                                                                placeholder={searchType === 'fir' ? 'FIR-XXXXXXXX (e.g., FIR-20240101)' : 'MPL-XXXXXXXX'}
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700"
                                                        />
                                                </div>
                                                <Button size="lg" type="submit" loading={loading} className="px-10 h-[60px] rounded-2xl shadow-indigo-100 shadow-xl">
                                                        Track Now
                                                </Button>
                                        </div>
                                </form>
                        </Card>

                        {error && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4 text-red-700">
                                        <span className="text-2xl">⚠️</span>
                                        <p className="font-semibold">{error}</p>
                                </div>
                        )}

                        {result && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                        <Card className="relative overflow-hidden border-none shadow-xl bg-white">
                                                <div className="absolute top-0 right-0 p-6">
                                                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusStyles(result.data.status)} uppercase tracking-widest`}>
                                                                {result.data.status}
                                                        </div>
                                                </div>

                                                <div className="mb-8">
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Case Reference</p>
                                                        <p className="text-4xl font-black text-slate-900 tracking-tight">
                                                                {result.type === 'fir' ? result.data.firNumber : result.data.caseNumber}
                                                        </p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                                                <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Investigation Unit</p>
                                                                <p className="font-bold text-slate-700 text-lg">{result.data.stationName || 'Central HQ'}</p>
                                                        </div>
                                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                                                <p className="text-xs font-bold text-emerald-400 uppercase mb-1">Report Category</p>
                                                                <p className="font-bold text-slate-700 text-lg">{result.data.category || 'Missing Person'}</p>
                                                        </div>
                                                        <div className="p-4 bg-slate-50 rounded-2xl">
                                                                <p className="text-xs font-bold text-orange-400 uppercase mb-1">Filed Date</p>
                                                                <p className="font-bold text-slate-700 text-lg">{new Date(result.data.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                </div>
                                        </Card>

                                        <div className="pl-4 md:pl-8">
                                                <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                                                        <span className="p-2 bg-indigo-100 rounded-lg text-lg">📑</span>
                                                        Investigation Timeline
                                                </h3>

                                                <div className="relative border-l-4 border-slate-100 space-y-12 pb-10 ml-6">
                                                        {updates.length > 0 ? updates.map((update, index) => {
                                                                const config = updateTypeConfig[update.updateType] || { icon: '📌', color: 'bg-slate-400' }
                                                                return (
                                                                        <div key={update.id} className="relative pl-12 group">
                                                                                <div className={`absolute -left-[22px] top-0 w-10 h-10 ${config.color} text-white rounded-full flex items-center justify-center text-xl shadow-lg shadow-black/5 ring-8 ring-white z-10 transition-transform group-hover:scale-110`}>
                                                                                        {config.icon}
                                                                                </div>

                                                                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group-hover:-translate-y-1">
                                                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                                                                                <h4 className="font-extrabold text-slate-800 tracking-tight uppercase text-sm">
                                                                                                        {update.updateType.replace('_', ' ')}
                                                                                                </h4>
                                                                                                <span className="text-[10px] font-bold text-white bg-slate-400 px-3 py-1 rounded-full uppercase tracking-tighter">
                                                                                                        {new Date(update.createdAt).toLocaleString()}
                                                                                                </span>
                                                                                        </div>
                                                                                        <p className="text-slate-600 font-medium leading-relaxed">
                                                                                                {update.comment || 'System status update recorded.'}
                                                                                        </p>
                                                                                        {update.newStatus && (
                                                                                                <div className="mt-4 flex items-center gap-2">
                                                                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                                                                                                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase ${getStatusStyles(update.newStatus)}`}>
                                                                                                                {update.newStatus}
                                                                                                        </span>
                                                                                                </div>
                                                                                        )}
                                                                                </div>
                                                                        </div>
                                                                )
                                                        }) : (
                                                                <div className="relative pl-12">
                                                                        <div className="absolute -left-[22px] top-0 w-10 h-10 bg-slate-200 text-white rounded-full flex items-center justify-center text-xl ring-8 ring-white">
                                                                                🌱
                                                                        </div>
                                                                        <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                                                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Investigation Commenced</p>
                                                                                <p className="text-slate-400 text-xs">Waiting for tactical updates from the assigned unit.</p>
                                                                        </div>
                                                                </div>
                                                        )}
                                                </div>
                                        </div>
                                </div>
                        )}
                </div>
        )
}

export default TrackStatus
