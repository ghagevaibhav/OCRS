import { useEffect, useCallback } from 'react'
import Card from './Card'
import Button from './Button'

const DetailsModal = ({
        isOpen,
        onClose,
        data,
        type = 'fir', // 'fir' or 'missing'
        updates = [],
        loading = false,
        onUpdate
}) => {
        // Handle Escape key
        const handleEscape = useCallback((e) => {
                if (e.key === 'Escape') onClose()
        }, [onClose])

        useEffect(() => {
                if (isOpen) {
                        document.addEventListener('keydown', handleEscape)
                        document.body.style.overflow = 'hidden'
                }
                return () => {
                        document.removeEventListener('keydown', handleEscape)
                        document.body.style.overflow = 'unset'
                }
        }, [isOpen, handleEscape])

        if (!isOpen || !data) return null

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
                        LOW: 'bg-gray-100 text-gray-800',
                        MEDIUM: 'bg-blue-100 text-blue-800',
                        HIGH: 'bg-orange-100 text-orange-800',
                        URGENT: 'bg-red-100 text-red-800'
                }
                return colors[priority] || 'bg-gray-100 text-gray-800'
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

        return (
                <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={onClose}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
                >
                        <Card
                                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn"
                                onClick={(e) => e.stopPropagation()}
                        >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                        <div>
                                                <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                                                        {type === 'fir' ? `FIR: ${data.firNumber}` : `Case: ${data.caseNumber}`}
                                                </h2>
                                                <p className="text-sm text-gray-500 mt-1">
                                                        {type === 'fir' ? data.title : data.missingPersonName}
                                                </p>
                                        </div>
                                        <button
                                                onClick={onClose}
                                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
                                                aria-label="Close modal"
                                        >
                                                &times;
                                        </button>
                                </div>

                                {loading ? (
                                        <div className="py-12 text-center text-gray-500">Loading details...</div>
                                ) : (
                                        <>
                                                {/* Status & Priority Badges */}
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}>
                                                                {data.status?.replace(/_/g, ' ')}
                                                        </span>
                                                        {data.priority && (
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(data.priority)}`}>
                                                                        {data.priority} Priority
                                                                </span>
                                                        )}
                                                        {data.category && (
                                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                                        {data.category}
                                                                </span>
                                                        )}
                                                </div>

                                                {/* Details Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                        {type === 'fir' ? (
                                                                <>
                                                                        <div>
                                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Incident Date</label>
                                                                                <p className="text-sm text-gray-900">{formatDate(data.incidentDate)}</p>
                                                                        </div>
                                                                        <div>
                                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Incident Time</label>
                                                                                <p className="text-sm text-gray-900">{data.incidentTime || 'Not specified'}</p>
                                                                        </div>
                                                                        <div className="md:col-span-2">
                                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                                                                                <p className="text-sm text-gray-900">{data.incidentLocation}</p>
                                                                        </div>
                                                                </>
                                                        ) : (
                                                                <>
                                                                        <div>
                                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Age</label>
                                                                                <p className="text-sm text-gray-900">{data.age || 'N/A'}</p>
                                                                        </div>
                                                                        <div>
                                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Last Seen Date</label>
                                                                                <p className="text-sm text-gray-900">{formatDate(data.lastSeenDate)}</p>
                                                                        </div>
                                                                        <div className="md:col-span-2">
                                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Last Seen Location</label>
                                                                                <p className="text-sm text-gray-900">{data.lastSeenLocation || 'N/A'}</p>
                                                                        </div>
                                                                </>
                                                        )}
                                                        <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Filed On</label>
                                                                <p className="text-sm text-gray-900">{formatDateTime(data.createdAt)}</p>
                                                        </div>
                                                        <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Last Updated</label>
                                                                <p className="text-sm text-gray-900">{formatDateTime(data.updatedAt)}</p>
                                                        </div>
                                                </div>

                                                {/* Description */}
                                                <div className="mb-6">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                                                                {data.description || 'No description provided.'}
                                                        </p>
                                                </div>

                                                {/* Update History */}
                                                {updates && updates.length > 0 && (
                                                        <div className="mb-6">
                                                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Update History</h3>
                                                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                                                        {updates.map((update, idx) => (
                                                                                <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
                                                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                                                <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(update.newStatus)}`}>
                                                                                                        {update.newStatus?.replace(/_/g, ' ')}
                                                                                                </span>
                                                                                                <span>{formatDateTime(update.createdAt)}</span>
                                                                                        </div>
                                                                                        {update.comment && (
                                                                                                <p className="text-sm text-gray-700 mt-1">{update.comment}</p>
                                                                                        )}
                                                                                </div>
                                                                        ))}
                                                                </div>
                                                        </div>
                                                )}

                                                {/* Actions */}
                                                <div className="flex gap-3 pt-4 border-t">
                                                        <Button variant="secondary" onClick={onClose} className="flex-1">
                                                                Close
                                                        </Button>
                                                        {onUpdate && (
                                                                <Button onClick={onUpdate} className="flex-1">
                                                                        Update Status
                                                                </Button>
                                                        )}
                                                </div>
                                        </>
                                )}
                        </Card>
                </div>
        )
}

export default DetailsModal
