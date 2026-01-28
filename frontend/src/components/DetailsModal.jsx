import { useEffect, useCallback, useState } from 'react'
import Card from './Card'
import Button from './Button'

const DetailsModal = ({
        isOpen,
        onClose,
        data,
        type = 'fir', // 'fir' or 'missing'
        updates = [],
        loading = false,
        onUpdate,
        size = 'md', // 'sm', 'md', 'lg', 'fullscreen'
        showPrint = false
}) => {
        const [isAnimating, setIsAnimating] = useState(false)

        // Handle Escape key
        const handleEscape = useCallback((e) => {
                if (e.key === 'Escape') onClose()
        }, [onClose])

        useEffect(() => {
                if (isOpen) {
                        setIsAnimating(true)
                        document.addEventListener('keydown', handleEscape)
                        document.body.style.overflow = 'hidden'
                }
                return () => {
                        document.removeEventListener('keydown', handleEscape)
                        document.body.style.overflow = 'unset'
                }
        }, [isOpen, handleEscape])

        if (!isOpen || !data) return null

        const sizes = {
                sm: 'max-w-md',
                md: 'max-w-2xl',
                lg: 'max-w-4xl',
                fullscreen: 'max-w-[95vw] max-h-[95vh]'
        }

        const getStatusColor = (status) => {
                const colors = {
                        PENDING: 'bg-warning-100 text-warning-700 border-warning-200',
                        UNDER_INVESTIGATION: 'bg-accent-100 text-accent-700 border-accent-200',
                        RESOLVED: 'bg-success-100 text-success-700 border-success-200',
                        CLOSED: 'bg-gray-100 text-gray-700 border-gray-200',
                        REJECTED: 'bg-danger-100 text-danger-700 border-danger-200',
                        FOUND: 'bg-success-100 text-success-700 border-success-200',
                        SEARCHING: 'bg-warning-100 text-warning-700 border-warning-200'
                }
                return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
        }

        const getStatusDotColor = (status) => {
                const colors = {
                        PENDING: 'bg-warning-500',
                        UNDER_INVESTIGATION: 'bg-accent-500',
                        RESOLVED: 'bg-success-500',
                        CLOSED: 'bg-gray-500',
                        REJECTED: 'bg-danger-500',
                        FOUND: 'bg-success-500',
                        SEARCHING: 'bg-warning-500'
                }
                return colors[status] || 'bg-gray-500'
        }

        const getPriorityColor = (priority) => {
                const colors = {
                        LOW: 'bg-gray-100 text-gray-700',
                        MEDIUM: 'bg-primary-100 text-primary-700',
                        HIGH: 'bg-warning-100 text-warning-700',
                        URGENT: 'bg-danger-100 text-danger-700'
                }
                return colors[priority] || 'bg-gray-100 text-gray-700'
        }

        const formatDate = (dateStr) => {
                if (!dateStr) return 'N/A'
                return new Date(dateStr).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                })
        }

        const formatDateTime = (dateStr) => {
                if (!dateStr) return 'N/A'
                return new Date(dateStr).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                })
        }

        const handlePrint = () => {
                window.print()
        }

        return (
                <div
                        className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'
                                }`}
                        onClick={onClose}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                >
                        <div
                                className={`w-full ${sizes[size]} max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                                        }`}
                                onClick={(e) => e.stopPropagation()}
                        >
                                {/* Sticky Header */}
                                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
                                        <div className="flex justify-between items-start">
                                                <div>
                                                        <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                                                                {type === 'fir' ? `FIR: ${data.firNumber}` : `Case: ${data.caseNumber}`}
                                                        </h2>
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                                {type === 'fir' ? data.title : data.missingPersonName}
                                                        </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                        {showPrint && (
                                                                <button
                                                                        onClick={handlePrint}
                                                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors no-print"
                                                                        aria-label="Print"
                                                                >
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                                        </svg>
                                                                </button>
                                                        )}
                                                        <button
                                                                onClick={onClose}
                                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors no-print"
                                                                aria-label="Close modal"
                                                        >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                        </button>
                                                </div>
                                        </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-5">
                                        {loading ? (
                                                <div className="py-12 text-center">
                                                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                                                        <p className="text-gray-500">Loading details...</p>
                                                </div>
                                        ) : (
                                                <>
                                                        {/* Status & Priority Badges */}
                                                        <div className="flex flex-wrap gap-2 mb-6">
                                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(data.status)}`}>
                                                                        {data.status?.replace(/_/g, ' ')}
                                                                </span>
                                                                {data.priority && (
                                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${getPriorityColor(data.priority)}`}>
                                                                                {data.priority} Priority
                                                                        </span>
                                                                )}
                                                                {data.category && (
                                                                        <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">
                                                                                {data.category}
                                                                        </span>
                                                                )}
                                                        </div>

                                                        {/* Details Grid */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                                {type === 'fir' ? (
                                                                        <>
                                                                                <div className="bg-gray-50 rounded-xl p-4">
                                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Incident Date</label>
                                                                                        <p className="text-sm font-medium text-gray-900">{formatDate(data.incidentDate)}</p>
                                                                                </div>
                                                                                <div className="bg-gray-50 rounded-xl p-4">
                                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Incident Time</label>
                                                                                        <p className="text-sm font-medium text-gray-900">{data.incidentTime || 'Not specified'}</p>
                                                                                </div>
                                                                                <div className="md:col-span-2 bg-gray-50 rounded-xl p-4">
                                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                                                                                        <p className="text-sm font-medium text-gray-900">{data.incidentLocation}</p>
                                                                                </div>
                                                                        </>
                                                                ) : (
                                                                        <>
                                                                                <div className="bg-gray-50 rounded-xl p-4">
                                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Age</label>
                                                                                        <p className="text-sm font-medium text-gray-900">{data.age || 'N/A'}</p>
                                                                                </div>
                                                                                <div className="bg-gray-50 rounded-xl p-4">
                                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Last Seen Date</label>
                                                                                        <p className="text-sm font-medium text-gray-900">{formatDate(data.lastSeenDate)}</p>
                                                                                </div>
                                                                                <div className="md:col-span-2 bg-gray-50 rounded-xl p-4">
                                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Last Seen Location</label>
                                                                                        <p className="text-sm font-medium text-gray-900">{data.lastSeenLocation || 'N/A'}</p>
                                                                                </div>
                                                                        </>
                                                                )}
                                                                <div className="bg-gray-50 rounded-xl p-4">
                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Filed On</label>
                                                                        <p className="text-sm font-medium text-gray-900">{formatDateTime(data.createdAt)}</p>
                                                                </div>
                                                                <div className="bg-gray-50 rounded-xl p-4">
                                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Last Updated</label>
                                                                        <p className="text-sm font-medium text-gray-900">{formatDateTime(data.updatedAt)}</p>
                                                                </div>
                                                        </div>

                                                        {/* Description */}
                                                        <div className="mb-6">
                                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                                                {data.description || 'No description provided.'}
                                                                        </p>
                                                                </div>
                                                        </div>

                                                        {/* Update History Timeline */}
                                                        {updates && updates.length > 0 && (
                                                                <div className="mb-2">
                                                                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                                                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                </svg>
                                                                                Update History
                                                                        </h3>
                                                                        <div className="relative space-y-0 max-h-60 overflow-y-auto pr-2">
                                                                                {updates.map((update, idx) => (
                                                                                        <div key={idx} className="relative pl-6 pb-4">
                                                                                                {/* Timeline line */}
                                                                                                {idx !== updates.length - 1 && (
                                                                                                        <div className="absolute left-[9px] top-3 bottom-0 w-0.5 bg-gray-200" />
                                                                                                )}
                                                                                                {/* Timeline dot */}
                                                                                                <div className={`absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 border-white shadow-sm ${getStatusDotColor(update.newStatus)}`} />

                                                                                                <div className="bg-gray-50 rounded-xl p-3 ml-2">
                                                                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                                                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(update.newStatus)}`}>
                                                                                                                        {update.newStatus?.replace(/_/g, ' ')}
                                                                                                                </span>
                                                                                                                <span className="text-xs text-gray-500">{formatDateTime(update.createdAt)}</span>
                                                                                                        </div>
                                                                                                        {update.comment && (
                                                                                                                <p className="text-sm text-gray-700 mt-2">{update.comment}</p>
                                                                                                        )}
                                                                                                </div>
                                                                                        </div>
                                                                                ))}
                                                                        </div>
                                                                </div>
                                                        )}
                                                </>
                                        )}
                                </div>

                                {/* Sticky Footer */}
                                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 no-print">
                                        <div className="flex gap-3">
                                                <Button variant="outline" onClick={onClose} fullWidth>
                                                        Close
                                                </Button>
                                                {onUpdate && (
                                                        <Button onClick={onUpdate} fullWidth>
                                                                Update Status
                                                        </Button>
                                                )}
                                        </div>
                                </div>
                        </div>
                </div>
        )
}

export default DetailsModal

