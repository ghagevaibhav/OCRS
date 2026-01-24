import { useState, useEffect, useCallback } from 'react'
import Card from './Card'
import Button from './Button'
import Select from './Select'

const UpdateModal = ({
        isOpen,
        onClose,
        caseData,
        type = 'fir', // 'fir' or 'missing'
        onSubmit,
        loading = false
}) => {
        const [formData, setFormData] = useState({
                updateType: 'STATUS_CHANGE',
                newStatus: '',
                comment: ''
        })
        const [error, setError] = useState('')

        // Pre-populate status when modal opens
        useEffect(() => {
                if (isOpen && caseData) {
                        setFormData(prev => ({
                                ...prev,
                                newStatus: caseData.status || ''
                        }))
                        setError('')
                }
        }, [isOpen, caseData])

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

        if (!isOpen || !caseData) return null

        const firStatuses = [
                { value: '', label: 'Select Status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'UNDER_INVESTIGATION', label: 'Under Investigation' },
                { value: 'RESOLVED', label: 'Resolved' },
                { value: 'CLOSED', label: 'Closed' },
                { value: 'REJECTED', label: 'Rejected' }
        ]

        const missingStatuses = [
                { value: '', label: 'Select Status' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'SEARCHING', label: 'Searching' },
                { value: 'FOUND', label: 'Found' },
                { value: 'CLOSED', label: 'Closed' }
        ]

        const statusOptions = type === 'fir' ? firStatuses : missingStatuses

        const handleSubmit = async (e) => {
                e.preventDefault()
                setError('')

                if (!formData.newStatus) {
                        setError('Please select a status')
                        return
                }

                if (!formData.comment.trim()) {
                        setError('Please add a comment')
                        return
                }

                try {
                        await onSubmit(formData)
                        setFormData({ updateType: 'STATUS_CHANGE', newStatus: '', comment: '' })
                } catch (err) {
                        setError(err.message || 'Failed to update. Please try again.')
                }
        }

        const caseNumber = type === 'fir' ? caseData.firNumber : caseData.caseNumber
        const caseName = type === 'fir' ? caseData.title : caseData.missingPersonName

        return (
                <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={onClose}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="update-modal-title"
                >
                        <Card
                                className="w-full max-w-md animate-fadeIn"
                                onClick={(e) => e.stopPropagation()}
                        >
                                <form onSubmit={handleSubmit}>
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                                <div>
                                                        <h3 id="update-modal-title" className="text-lg font-semibold text-gray-900">
                                                                Update Case Status
                                                        </h3>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                                {type === 'fir' ? 'FIR' : 'Case'}: {caseNumber}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate max-w-[250px]">
                                                                {caseName}
                                                        </p>
                                                </div>
                                                <button
                                                        type="button"
                                                        onClick={onClose}
                                                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
                                                        aria-label="Close modal"
                                                >
                                                        &times;
                                                </button>
                                        </div>

                                        {/* Current Status Banner */}
                                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <p className="text-xs text-gray-500">Current Status</p>
                                                <p className="text-sm font-medium text-gray-900">
                                                        {caseData.status?.replace(/_/g, ' ')}
                                                </p>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                                                        {error}
                                                </div>
                                        )}

                                        {/* Form Fields */}
                                        <div className="space-y-4">
                                                <Select
                                                        label="New Status"
                                                        value={formData.newStatus}
                                                        onChange={(e) => setFormData({ ...formData, newStatus: e.target.value })}
                                                        options={statusOptions}
                                                        required
                                                />

                                                <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Comment <span className="text-red-500">*</span>
                                                        </label>
                                                        <textarea
                                                                value={formData.comment}
                                                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                                                                rows={3}
                                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                                                placeholder="Describe the update or progress made..."
                                                                required
                                                        />
                                                </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-4 mt-6">
                                                <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={onClose}
                                                        className="flex-1"
                                                        disabled={loading}
                                                >
                                                        Cancel
                                                </Button>
                                                <Button
                                                        type="submit"
                                                        className="flex-1"
                                                        disabled={loading}
                                                >
                                                        {loading ? (
                                                                <span className="flex items-center justify-center gap-2">
                                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                        </svg>
                                                                        Updating...
                                                                </span>
                                                        ) : 'Update Status'}
                                                </Button>
                                        </div>
                                </form>
                        </Card>
                </div>
        )
}

export default UpdateModal
